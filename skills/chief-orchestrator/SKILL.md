---
name: chief-orchestrator
description: "Portfolio judgment layer for the Chief Orchestrator — objective intake, mission chartering, supervision heuristics, state schemas, mode registry, and executive reporting above NightShift and future autonomous modes."
origin: ECC
---

# Chief Orchestrator Skill

The judgment layer behind `/chief`. The command file (`commands/chief.md`) defines
the operating protocol; this skill defines how to think inside it: how to turn an
objective into missions, when a mission is unhealthy, and what the human must see.
Full architecture, decision record, and blockers:
`docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md`.

## When to Use

- Running `/chief` — load this before acting
- Chartering, supervising, or wrapping any autonomous mission from the portfolio level
- Registering a new autonomous mode with the portfolio layer

## Position and the one rule

The Chief Orchestrator (CO) is layer 3 of the stack: objectives → missions.
NightShift and future modes are layer 2: goal → verified cycles. The rule at every
layer: **decide and verify here; implement one layer down.** The CO never runs
improvement cycles, never edits code, and never writes a byte under any project's
`.night-shift/` directory. If you find yourself selecting a backlog item or writing
a cycle contract, you have fallen one layer down — stop and dispatch instead.

## State

All CO state lives in `~/.claude/orchestrator/` (markdown, resumable by any session
or human):

- `portfolio.md` — objectives, repository registry, missions table, aggregated
  Needs Human, risk register, decision log, budget ledger
- `missions/<id>.md` — one per mission: charter, dispatch record, supervision log, outcome
- `reports/<YYYY-MM-DD>.md` — executive reports archive

Mission ID: `<project-slug>--<mode>--<YYYY-MM-DD>`. Mission states:
`chartered → dispatched → active → wrapping → done | aborted | blocked`.
Transitions require evidence: `active` needs a doctor read with cycles > 0; `done`
needs the mission's own handoff to exist. `scripts/orchestrator-doctor.js
validate|status|metrics` checks the invariants deterministically — run `validate`
on session start and before every report.

Schemas (portfolio and mission file templates) are specified in
`docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md` §4.2 — copy them exactly; the doctor
enforces their section structure.

## Mode Registry

A mode is supervisable by the CO when it provides: a public command surface, a state
directory in the target project, a doctor CLI answering
`status|metrics|validate --json`, and documented read points for its human queue and
handoff. Registered modes:

| Mode | Command surface | State dir | Doctor | Human queue / handoff (read-only) |
|------|----------------|-----------|--------|-----------------------------------|
| night-shift | `/night-shift "<goal>" --project <p> --max-cycles N [--focus …]`; `--resume`; `--status`; `--wrap-up` | `.night-shift/` | `node scripts/night-shift-doctor.js <cmd> --dir <p> --json` | `mission.md → ## Needs Human` / `## Handoff` (public schema per the night-shift skill) |

**Mode Doctor Contract** — the exact telemetry the supervision heuristics consume;
a mode's doctor MUST emit these fields (names are part of the contract):

- `status --json` → `openCycle` (bool), `cycles` (int), `backlog` (int), `needsHuman` (int)
- `metrics --json` → `flatTrailingCycles` (int), `completionRate` (0–1 or null), `closedCycles` (int)
- `validate` exit codes → `0` ok/warnings-only, `1` state unreadable/absent, `2` integrity errors

Adding a mode = adding a row here plus health heuristics below. A mode without a
doctor cannot be supervised and must not be dispatched unattended.

## Chartering judgment

An objective becomes missions only when each mission passes this gate:

1. **One repository, one goal, one mode.** A mission that needs two repos is two missions.
2. **"Done" is observable** — the goal must be assessable by the mode's own rubric.
3. **Budget stated** — `--max-cycles` always set; never dispatch unbounded.
4. **The repo is missionable** — a git repository, committable tree, and (for
   scheduled runs) a vetted permission allowlist. Otherwise the first mission is
   *making it missionable*, or the objective is blocked.
5. **No mission overlap** — at most one active/dispatched mission per repository, ever.

Charter conservatively: a 10-cycle mission that wraps clean beats a 50-cycle mission
you have to kill. Re-charter is cheap; unwinding a runaway mission is not.

## Supervision heuristics

One supervision pass = for each active mission: run the mode's doctor (`status` +
`metrics`), read `## Needs Human` from its state, apply this table, append one line
to the mission's supervision log, update the portfolio table. Never skip the log line
— an unlogged pass didn't happen.

| Signal | Condition | Action |
|--------|-----------|--------|
| Not started | doctor exits 1 (no state) on a `dispatched` mission | re-dispatch once; still absent next pass → mark `blocked` |
| Busy loop | `flatTrailingCycles ≥ 3` | dispatch `--wrap-up`; re-charter narrower |
| Thrash | `completionRate < 0.6` over ≥ 5 closed cycles | dispatch `--wrap-up`; escalate with evidence |
| Stalled | open cycle and no new journal entries since the previous pass | dispatch `--resume` (the mode's own recovery handles the interrupted cycle) |
| Human-bound | all remaining work queued in `Needs Human` | mark mission `blocked`; surface the queue |
| State corrupt | mode doctor `validate` reports errors | mark `blocked` with the doctor output verbatim; **never hand-repair mission state** |
| Healthy | none of the above | record snapshot; no action |

Two dispatches of the same recovery action without effect = stop; mark `blocked`;
queue for the human. The two-failure rule applies at this layer too.

## Human interaction

Inherited verbatim from the night-shift skill's Human Interaction Policy: queue,
don't block; only the four categories (credentials, legal/licensing, outcome-changing
ambiguity, irreversible/outward-facing actions) belong in the queue; irreversible and
outward-facing actions are **never performed autonomously at any layer**. The CO adds:
aggregate every mission's queue into `portfolio.md → ## Needs Human` on each pass so
the human reads one list, not N.

Dispatch safety: runbook entries never contain permission-bypass flags; a headless
run that would hang on a permission prompt is a chartering failure (fix the
allowlist), not a reason to weaken the permission model.

## Executive report format

Written to `reports/<date>.md` and delivered in-session. Sections, in order:

```markdown
# Portfolio Report — <date>

**Current goals:** <objectives one line each, with status>
**Overall progress:** <one paragraph, outcome-first>

## Completed since last report
- <mission/cycle-level wins, with evidence pointers>

## Current blockers
- <aggregated Needs Human + blocked missions, each with what unblocks it>

## Next milestones
- <what happens next and when, incl. runbook entries to load>

## Risks
- <from the risk register, only ones that changed>

## Suggested priorities
- <max 3, ranked, one line of rationale each>
```

Numbers come from doctors, never from memory. A report claim without a doctor read
or file citation behind it is invalid — same evidence standard as NightShift scores.

## Anti-patterns

- **The micromanager** — reading a mission's journal every pass and second-guessing
  cycle selection. Supervise outcomes (metrics), not decisions.
- **The layer-jumper** — "quickly fixing" something in a target repo from the CO
  session. All work goes through a mission or an explicit user request.
- **The optimistic ledger** — marking a mission `done` off its last supervision
  snapshot instead of its handoff.
- **The fleet commander** — dispatching missions to every repo at once. Portfolio
  value comes from sequencing, not saturation.
- **The silent quarter** — supervising without reporting. If the human hasn't seen
  an executive report in two passes, the next pass produces one.
