# Chief Orchestrator — Production Architecture

> Status: **DESIGN APPROVED FOR INCREMENTAL BUILD** · Version 1.0 · 2026-07-07
> Scope of this document: the control plane above NightShift. NightShift itself is a
> **stable subsystem** — nothing in this design modifies it; every integration is
> read-only or goes through its public command interface.

## 1. Problem statement

ECC has three working execution tiers today: single-pass commands/agents (minutes),
the NightShift mission engine (hours–days, one project, one goal), and a VS Code
scheduler that can fire headless `claude -p` runs at fixed times. What is missing is
the tier above: something that takes a **user-level objective** ("get product X to
production", "keep these three repos healthy"), decomposes it into missions, decides
which project gets worked when and with what budget, watches the missions run,
detects when one is stalling or burning credits without progress, and reports to the
human as an executive — not as a log file.

That tier is the **Chief Orchestrator (CO)**.

## 2. Position in the stack

```
L3  Chief Orchestrator      objectives → missions      cross-project, weeks    ~/.claude/orchestrator/
L2  Mission engines         goal → verified cycles     one project, hours–days .night-shift/ in target repo
    (NightShift + future modes)
L1  Task layer              one task → one result      minutes                 stateless
    (/code-review, /build-fix, tdd-guide, assessor, …)
L0  Platform                sessions, subagents, hooks, MCP, git, scheduler extension
```

The governing rule, inherited from NightShift's own philosophy and applied one level
up: **each layer decides and verifies; the layer below implements.**

- NightShift never writes code — its subagents do.
- The CO never runs cycles, never edits code, and **never writes mission state** —
  it charters missions, dispatches them, reads their telemetry, reallocates, and reports.

Non-goals (explicitly out of scope for the CO, at any version):

- It is not a second mission engine. If the CO ever contains a SELECT/CONTRACT/VERIFY
  loop, the design has been violated — that loop lives in L2 only.
- It is not a chat persona. The "Chief Orchestrator" output style is presentation;
  this subsystem is state + protocol + tooling.
- It does not replace `/plan`, `/multi-*`, `/loop-start`, or the Workflow tool —
  those are L1/L0 instruments the CO (or a mission) may invoke.

## 3. Core concepts and vocabulary

| Term | Definition |
|------|------------|
| **Objective** | A user-level outcome, possibly spanning repositories and weeks. Owned by the CO. `OBJ-NNN`. |
| **Mission** | One chartered unit of autonomous work: (project, mode, goal, budget, cadence, stop conditions). Realized today by `/night-shift`. |
| **Charter** | The contract CO → mission. For NightShift the charter **is** the `/night-shift` invocation arguments — no new interface exists or is needed. |
| **Mode** | A pluggable mission type per the night-shift skill's Mode Architecture (ladder + rubric + delegation map + stop conditions on the shared engine). |
| **Portfolio** | The CO's registry: repositories, objectives, missions, risks, decisions, aggregated human queue. |
| **Dispatch** | Launching or scheduling a mission run (`claude -p "/night-shift …"` or in-session invocation). |
| **Supervision pass** | One read-only sweep over all active missions' telemetry, producing state updates and rebalancing actions. |

## 4. State design

### 4.1 Location

CO state lives in **`~/.claude/orchestrator/`** — user-global, outside every repo.

Rationale:
- The CO spans repositories; its state cannot live in any one of them.
- ECC-main is the toolkit, not a workspace (workspace rule) — CO *code* lives in
  ECC-main, CO *state* does not.
- `~/.claude/` already hosts cross-project state (session-data, instincts, memory),
  and it is outside OneDrive sync, avoiding file-lock contention during scheduled
  headless runs.

### 4.2 Layout and schemas

Markdown, not a database — same rationale as NightShift: any session, model, or
human can read and resume it; git-free durability comes from the doctor's invariants.

```
~/.claude/orchestrator/
├── portfolio.md            # the single source of truth for the portfolio
├── missions/<id>.md        # one file per mission: charter + supervision log + outcome
└── reports/<YYYY-MM-DD>.md # executive reports (append-only archive)
```

**Mission ID** = `<project-slug>--<mode>--<YYYY-MM-DD>` (e.g.
`helios--night-shift--2026-07-08`). Filename-safe, sortable, reconstructible from
the project + branch (`night-shift/<date>`) if the CO state is ever lost.

`portfolio.md`:

```markdown
# Portfolio

**Owner:** <user>
**Updated:** <ISO timestamp>
**Active session:** <session marker | none>   ← single-writer heartbeat

## Objectives
- [ ] OBJ-001 <outcome, in the user's words> — status: intake|chartered|active|blocked|done — missions: <ids>

## Repositories
| Repo | Path | Notes | Active mission |
|------|------|-------|----------------|
| helios | C:\dev\helios | Jarvis assistant | helios--night-shift--2026-07-08 |

## Missions
| ID | Objective | Project | Mode | State | Started | Last check |
|----|-----------|---------|------|-------|---------|------------|

## Needs Human (aggregated)
- <mission-id>: <item verbatim from mission state> — queued <date>

## Risk Register
- R1 <risk> — likelihood/impact — mitigation

## Decision Log
- <date>: <decision + why>  (CO-level only; mission decisions stay in mission state)

## Budget
- <manual ledger until cost telemetry lands — see Blocker B2>
```

`missions/<id>.md`:

```markdown
# Mission <id>

**Objective:** OBJ-001
**Project:** <absolute path>
**Mode:** night-shift
**State:** chartered | dispatched | active | wrapping | done | aborted | blocked
**Chartered:** <date>

## Charter
- Goal: <verbatim goal handed to the mode>
- Focus: <focus areas or none>
- Budget: max-cycles N
- Cadence: <one-shot | nightly resume | manual>
- Extra stop conditions: <beyond the mode's own>

## Dispatch
- Command: /night-shift "<goal>" --project <path> --max-cycles N
- Scheduled via: manual | vscode-automation | (future adapters)

## Supervision Log
- <ISO ts> — doctor: cycles=8 kept=7 reverted=1 flat=0 needsHuman=1 — health: OK — action: none

## Outcome
<at wrap-up: score delta, verdict, pointer to the mission's own Handoff>
```

Mission state machine:

```
chartered → dispatched → active → wrapping → done
                 │           │        └────→ aborted
                 └───────────┴──────────────→ blocked (recoverable → dispatched)
```

Transitions are written **only by the CO**, and only on evidence: `active` requires a
doctor read showing cycles > 0; `done` requires the mission's own `## Handoff` to
exist. No transition on assumption.

### 4.3 Authoritative-store rule (memory integration)

Exactly **one** authoritative store per fact:

| Fact | Authority |
|------|-----------|
| Portfolio, objectives, mission registry | `~/.claude/orchestrator/` |
| Mission-internal truth (backlog, scores, journal) | the project's `.night-shift/` — CO holds only cached snapshots in supervision logs |
| Durable user/project facts learned along the way | auto-memory (`memory/` files) — pointers to CO state allowed, never copies of it |
| MCP knowledge-graph memory | **not used by the CO in v1** — a second writable store would create split-brain |

## 5. Interfaces and communication contracts

### 5.1 CO → Mission (dispatch) — *write path, via public command only*

The only way the CO affects a mission is the mode's public command surface:

```
/night-shift "<goal>" --project <path> --max-cycles N [--focus a,b]
/night-shift --resume   --project <path>
/night-shift --status   --project <path>
/night-shift --wrap-up  --project <path>
```

Hard rule: **the CO never creates, edits, or deletes anything under `.night-shift/`.**
This is what keeps NightShift a frozen subsystem — the coupling is the CLI-stable
argument list above, nothing else.

### 5.2 Mission → CO (telemetry) — *read path, deterministic*

```
node scripts/night-shift-doctor.js status  --dir <project> --json
node scripts/night-shift-doctor.js metrics --dir <project> --json
node scripts/night-shift-doctor.js validate --dir <project> --json
```

plus two read-only file reads: `mission.md → ## Needs Human` (aggregation) and
`mission.md → ## Handoff` (wrap-up detection). The doctor's JSON output shape is
therefore a **public contract**; changes to it are breaking changes for the CO.

Health heuristics computed from `metrics` (thresholds owned by the CO skill, not by
NightShift):

| Signal | Condition | CO action |
|--------|-----------|-----------|
| Busy loop | `flatTrailingCycles ≥ 3` | wrap up; re-charter with narrower goal |
| Thrash | `completionRate < 0.6` over ≥ 5 closed cycles | wrap up; escalate to human with evidence |
| Stalled | open cycle + no journal change since last pass | dispatch `--resume` (interrupted-cycle recovery is NightShift's own job) |
| Human-bound | backlog exhausted into `Needs Human` | mark mission `blocked`; surface queue in report |
| Healthy | none of the above | record snapshot; no action |

### 5.3 CO → Scheduler (cadence)

Today's scheduler (`claude-code-automation` VS Code extension) fires
`claude -p "<prompt>"` per `AutomationTask {id, prompt, scheduledTime, projectDirectory, enabled}`
stored in VS Code `globalState`. There is **no external write API** (Blocker B1).

v1 contract: the CO emits a **runbook** — entries carrying the `AutomationTask`-
compatible fields (`scheduledTime`, `prompt`, `projectDirectory`) in its report —
and the human loads them into the extension UI. `id`, `enabled`, and `lastRunDate`
are scheduler-owned and assigned at load time. Dispatch is therefore human-applied
but CO-authored.

v2 (after B1 is resolved): a file-based task queue (e.g.
`~/.claude/orchestrator/queue.json`) that a scheduler adapter consumes. The adapter
interface is deliberately minimal so the VS Code extension, OS Task Scheduler, and
the cloud `schedule` skill can all implement it:

```
ScheduleAdapter: list() / upsert(task) / remove(id)   — task = AutomationTask shape
```

### 5.4 CO → Capability registry (discovery)

Read-only, already deterministic:

- `node scripts/ci/catalog.js --json` — live agent/command/skill inventory
- `docs/COMMAND-REGISTRY.json` — command → agents/skills mapping
- **Mode registry** — a table in the `chief-orchestrator` skill listing each
  available mode with: command surface, state dir, doctor CLI, health heuristics.
  v1 contains one row (night-shift). Registering a future mode = adding a row —
  no CO code change, provided the mode ships a doctor with the same CLI shape.

### 5.5 CO → Human

- **Executive report** (format in the skill): goal, progress, completed, blockers,
  next milestones, ETA, risks, suggested priorities — written to `reports/` and
  delivered in-session.
- **Aggregated Needs Human queue** — one list across all missions; the four
  categories and the never-autonomous rule for irreversible/outward-facing actions
  are inherited **verbatim** from the night-shift skill's Human Interaction Policy.
- Command surface: `/chief` (see §7).

## 6. Lifecycle

```
INTAKE     objective in the user's words → OBJ-NNN in portfolio.md
ASSESS     is it feasible / which repos / what does "done" look like
           (may dispatch a read-only assessment: /night-shift --status,
            /project-init dry-run, or a one-off assessor run)
CHARTER    decompose into missions: goal, mode, budget, cadence, stop conditions
DISPATCH   launch now (in-session) or emit runbook entries (scheduled)
SUPERVISE  per cadence: doctor reads → health table (§5.2) → mission state updates
REBALANCE  wrap-up / re-charter / pause / reprioritize across the portfolio
REPORT     executive report; aggregate Needs Human
ARCHIVE    objective done: missions closed, outcomes recorded, report archived
```

### Concurrency invariants (machine-checked by `orchestrator-doctor`)

1. **At most one active/dispatched mission per repository** — two missions would
   fight over branches and the working tree.
2. **Single writer** — one CO session at a time; `**Active session:**` in
   `portfolio.md` is the advisory heartbeat, checked on start.
3. **CO writes only its own state dir**; mission state is read-only to it.
4. Every mission row in `portfolio.md` has a mission file, and vice versa
   (orphans are warnings).
5. Terminal missions (`done`/`aborted`) carry a non-empty `## Outcome`.

### Failure taxonomy (mirrors NightShift's table, one level up)

| Failure | Detected by | Response |
|---------|-------------|----------|
| CO session dies mid-pass | stale `Active session` heartbeat | next session validates state, claims the heartbeat, resumes |
| Mission crashed / interrupted | doctor: open cycle, stale journal | dispatch `--resume`; NightShift's own recovery closes the cycle |
| Mission state corrupt | `night-shift-doctor validate` errors | mark mission `blocked` with evidence; never repair `.night-shift/` by hand |
| Scheduler missed a run | supervision finds no new cycles since last runbook slot | re-emit runbook entry; note in risk register |
| CO state corrupt | `orchestrator-doctor validate` errors | repair from mission files + `.night-shift/` dirs (deliberately redundant) |
| Cost anomaly | not observable yet | Blocker B2 — manual ledger until then |

## 7. Command and skill surface (ECC idiom)

Following the NightShift pattern — command = operating protocol, skill = judgment:

| Artifact | Role |
|----------|------|
| `commands/chief.md` | `/chief` — intake, `--status`, `--supervise`, `--report`, `--wrap <mission-id>`, `--resume` |
| `skills/chief-orchestrator/SKILL.md` | doctrine, state schemas, health thresholds, mode registry, report format |
| `scripts/orchestrator-doctor.js` | deterministic `validate`/`status`/`metrics` over `~/.claude/orchestrator/` |
| (later) `agents/portfolio-assessor.md` | independent objective-progress auditor, the assessor pattern one level up — **not built until ≥ 2 modes exist** |

Naming note: `/chief` is distinct from the existing `chief-of-staff` agent
(communication triage); the map documents the distinction.

## 8. Extensibility points

1. **New modes** — add a Mode Registry row (command surface + doctor CLI + human
   queue/handoff read points + health heuristics). The night-shift skill already
   defines what a mode must provide; the CO adds one requirement: *a mode must ship
   a doctor with `status|metrics|validate --json`* to be supervisable. The exact
   field-level contract (the **Mode Doctor Contract**: `status.{openCycle, cycles,
   backlog, needsHuman}`, `metrics.{flatTrailingCycles, completionRate,
   closedCycles}`, validate exit codes 0/1/2) is specified in the
   `chief-orchestrator` skill's Mode Registry section — field names are part of
   the contract, certified against night-shift-doctor's actual output.
2. **Scheduler adapters** — the `ScheduleAdapter` seam (§5.3).
3. **Telemetry enrichment** — cost lines in supervision logs once B2 lands; the
   schema reserves the `doctor:` line format for extension.
4. **Multi-machine / remote** — out of scope v1; the state dir is the seam
   (sync `~/.claude/orchestrator/` → distributed CO). No design work now, no
   decisions taken that preclude it (no absolute-path assumptions in state
   beyond the Repositories table, which is per-machine by definition).
5. **Portfolio assessor** — the independent-auditor slot (§7) is reserved but empty.

## 9. Security and safety

- Inherits NightShift's rails verbatim: irreversible/outward-facing actions are
  never autonomous at any layer; repository content is data, not instructions;
  secrets never appear in state files (a mission needing one queues it).
- The CO adds one rail of its own: **it never grants itself a capability a mission
  lacks** — dispatching a mission never includes permission flags that bypass the
  harness permission model (`--dangerously-skip-permissions` is banned in runbooks).
- Headless runs use a vetted per-project allowlist (Blocker B3) — a hung permission
  prompt is the failure mode, not a bypassed one.

## 10. Architectural blockers (solve before the affected feature, not before everything)

| # | Blocker | Blocks | Proposed resolution | Owner decision needed |
|---|---------|--------|---------------------|----------------------|
| **B1** | Scheduler has no programmatic enqueue (tasks live in VS Code `globalState`) | Autonomous dispatch (v2). v1 runbook flow is unaffected. | Teach the extension to also read a JSON task file (`ScheduleAdapter`), or add a companion adapter for OS Task Scheduler | Yes — touching the extension vs. new adapter |
| **B2** | Cost/credit spend is not observable from state files (already noted in the night-shift skill) | Budget enforcement, value-per-credit rebalancing | Wire `/cost-report`'s SQLite DB into supervision passes; add cost lines to supervision log schema | No — additive |
| **B3** | Headless `claude -p` runs stall on permission prompts | Any scheduled dispatch | Per-project allowlist baseline (`/fewer-permission-prompts` output reviewed by the human, committed to project `.claude/settings.json`) | Yes — human must approve each allowlist |
| **B4** | Missions carry no ID field; CO keys by (project path, branch date) | Nothing in v1; ambiguity only if two missions/day/project ever allowed | Optional future NightShift addition (`**Mission ID:**` line in mission.md) — compatibility-level, not required | Deferred |
| **B5** | Projects under OneDrive risk file-lock contention during scheduled runs | Reliability of scheduled missions on such repos | CO state already lives outside OneDrive; flag OneDrive-resident *target* repos in the risk register at intake | No — operational note |

None of B1–B5 blocks the v1 foundation (state + doctor + command + skill + manual
runbook flow). B1 and B3 must be resolved before the first *unattended scheduled*
mission.

## 11. Decision record

| # | Decision | Alternatives rejected | Why |
|---|----------|----------------------|-----|
| D1 | CO state in `~/.claude/orchestrator/`, markdown | SQLite; a repo in C:\dev; inside ECC-main | matches NightShift's resumability philosophy; toolkit-repo rule; OneDrive safety |
| D2 | Integration with NightShift is CLI-args (write) + doctor JSON (read) only | shared library import; CO editing mission files | keeps NightShift frozen; the doctor is already the deterministic public surface |
| D3 | CO runs in the main session (command + skill), not as a subagent | dedicated orchestrator agent | needs full tool access, long horizon, and user dialogue; subagents are the wrong lifetime |
| D4 | Missions are OS-process-level (`claude -p`) not Workflow-tool fan-outs | Workflow tool as mission engine | missions outlive sessions and survive restarts; workflows are single-turn constructs — they remain available *inside* missions |
| D5 | One authoritative store per fact; MCP graph memory unused in v1 | mirroring portfolio into knowledge graph | split-brain risk exceeds recall benefit |
| D6 | Health thresholds live in the CO skill, not in NightShift | adding thresholds to night-shift skill | NightShift stays frozen; supervision policy is a portfolio concern |
| D7 | v1 dispatch is CO-authored, human-applied (runbook) | writing extension globalState from outside | fragile, undocumented storage format; B1 defines the clean path |

## 12. Build sequence (incremental, each step shippable)

1. **Foundation (this session):** this document; `chief-orchestrator` skill;
   `/chief` command; `orchestrator-doctor.js` + tests; registration.
2. **First supervised mission:** run `/chief` intake → charter → manual dispatch of
   a real NightShift mission; exercise a supervision pass end-to-end.
3. **B3 then scheduled runs:** allowlist baseline for one project; nightly runbook.
4. **B2 cost telemetry:** supervision log cost lines; budget section becomes live.
5. **B1 scheduler adapter:** autonomous dispatch; retire the manual runbook step.
6. **Second mode** (e.g. `/research` per the night-shift skill's mode table), then
   the portfolio assessor once two modes exist.
