# Chief Orchestrator ↔ NightShift — Integration Certification Report

> Certification date: 2026-07-08 · Certifying method: static contract cross-check +
> dynamic fixture-driven validation (22 harness checks, 24 regression tests, 4 failure
> injections beyond the fixture set) · Systems under test unchanged except four
> documentation fixes listed in §5 (all in CO-owned artifacts; **NightShift untouched**).

## Verdict: **PASS WITH OBSERVATIONS**

The control plane is certified stable enough to serve as the permanent foundation of
HELIOS. Every documented interface between the Chief Orchestrator (CO) and NightShift
(NS) was verified in both directions — inputs, outputs, behavior, error behavior, and
docs-vs-implementation — and every simulated failure produced the documented CO
response. The observations (§4) do not affect attended operation; two of them restate
the already-recorded blockers B1/B3 that gate *unattended* operation.

---

## 1. Certification method and evidence base

**Static:** every flag, field name, path, section header, and exit code referenced
across the boundary was grep-verified against the owning implementation (evidence
inline in §2).

**Dynamic:** a certification harness (session scratchpad, `certify.js`; evidence
snapshot `evidence.json`) generated 11 NightShift mission fixtures conforming to the
schemas in `skills/night-shift/SKILL.md`, ran **the real doctor CLIs as subprocesses**
exactly as the CO documents them (`node scripts/night-shift-doctor.js <cmd> --dir <p>
--json`), then executed the CO supervision heuristics table *literally as written* in
`skills/chief-orchestrator/SKILL.md` against the captured JSON. All 22 checks passed
on the first run:

| Scenario | Doctor exits (v/s/m) | Simulated CO decision | Matches documented action |
|----------|---------------------|----------------------|---------------------------|
| healthy (3 closed cycles) | 0/0/0 | HEALTHY — snapshot, no action | ✓ |
| interrupted (open last cycle) | 0/0/0 | RESUME (stalled: `openCycle=true`, cycles unchanged) | ✓ |
| busy-loop | 0/0/0 | WRAP-UP (`flatTrailingCycles=3` — trips exactly at threshold) | ✓ |
| thrash | 0/0/0 | WRAP-UP + escalate (`closedCycles=5`, `completionRate=0.4`) | ✓ |
| corrupt (journal gap + score 150) | **2**/0/0 | BLOCKED (`E_SCORE_RANGE`, `E_JOURNAL_GAP`) | ✓ |
| human-bound (backlog 0, queue 2) | 0/0/0 | BLOCKED (human-bound: `backlog=0`, `needsHuman=2`) | ✓ |
| wrapped (handoff present) | 0/0/0 | HEALTHY + handoff detected by documented file read | ✓ |
| not-started (no `.night-shift/`) | **1**/1/1 | NOT-STARTED (gap found → heuristics row added, §5-F2) | ✓ |
| garbage bytes in all state files | 2/0/0 | BLOCKED — **no crash**; status JSON still well-formed | ✓ |
| `.night-shift` is a file, not a dir | 2/0/0 | BLOCKED (`E_NO_MISSION`, `E_NO_SCORECARD`) — no crash | ✓ |
| CRLF line endings throughout | 0/0/0 | HEALTHY — parse identical to LF (Windows reality) | ✓ |

Plus: handoff-read true/false cases, Needs-Human item extraction (2/2 items), the full
CO mission state machine walk (all 7 documented states validate exit 0; undocumented
state `running` rejected with `E_MISSION_STATE` exit 2), and regression runs of both
doctor suites (`night-shift-doctor.test.js` 11/11, `orchestrator-doctor.test.js`
13/13).

**Validated per the mission checklist:** creation (charter fixtures validate),
lifecycle (7-state walk), dispatch (argument surface §2 row 1), supervision (heuristics
simulator), completion (wrapped + handoff gate), interruption (open cycle), resume
(RESUME decision → NS `--resume` recovery contract), failure (corrupt/garbage),
cancellation (`aborted` + outcome check `W_NO_OUTCOME`), status reporting (doctor
`status`), doctor metrics (field-exact), progress reporting (report format sourced from
doctor reads only), recovery (failure taxonomy §2 row 4), logging (supervision-log line
format parses — `countListItems` counts it, covered by CO doctor tests), state
transitions (enum enforcement), public contracts (§2).

---

## 2. Interface Compatibility Matrix

Legend: **I**nputs / **O**utputs / **B**ehavior / **E**rror behavior / **D**ocs=implementation.

| # | Interface (direction) | I | O | B | E | D | Evidence | Verdict |
|---|----------------------|---|---|---|---|---|----------|---------|
| 1 | Mission dispatch — `/night-shift "<goal>" --project <p> --max-cycles N [--focus …]`, `--resume`, `--status`, `--wrap-up` (CO→NS) | ✓ | ✓ | ✓ | ✓ | ✓ | Every flag the CO references ([chief.md:48,61,90](../../commands/chief.md), skill mode registry) exists verbatim in [night-shift.md:5-13](../../commands/night-shift.md); no CO reference to any undocumented flag | **PASS** |
| 2 | Telemetry — `night-shift-doctor status --dir <p> --json` (NS→CO) | ✓ | ✓ | ✓ | ✓ | ✓ | Fields consumed by CO heuristics (`openCycle`, `cycles`, `backlog`, `needsHuman`) all present in real output ([night-shift-doctor.js:239-251](../../scripts/night-shift-doctor.js)); 11-scenario dynamic run | **PASS** |
| 3 | Telemetry — `night-shift-doctor metrics --dir <p> --json` (NS→CO) | ✓ | ✓ | ✓ | ✓ | ✓ | `flatTrailingCycles`, `completionRate`, `closedCycles` present and threshold-exact (busy-loop trips at 3, thrash at 0.4/5) | **PASS** |
| 4 | Integrity — `night-shift-doctor validate` exit codes 0/1/2 (NS→CO) | ✓ | ✓ | ✓ | ✓ | ✓ | Exit 0 healthy AND warnings-only (open cycle → `W_OPEN_CYCLE`, exit 0); exit 1 no state; exit 2 corrupt — all observed | **PASS** |
| 5 | Human queue — read `mission.md → ## Needs Human` (NS→CO) | ✓ | ✓ | ✓ | ✓ | ✓ | Section declared public schema in NS skill State Files; extraction verified (2/2 items); CRLF-safe | **PASS** |
| 6 | Handoff gate — read `mission.md → ## Handoff` (NS→CO) | ✓ | ✓ | ✓ | ✓ | ✓ | NS `--wrap-up` documents writing `## Handoff` ([night-shift.md:37](../../commands/night-shift.md)); presence/absence detection verified both ways | **PASS** |
| 7 | Scheduler runbook — `AutomationTask` fields (CO→scheduler) | ✓ | ✓ | ✓ | n/a | ✓* | `scheduledTime`/`prompt`/`projectDirectory` match [types.ts](../../claude-code-automation/src/types.ts); `id`/`enabled`/`lastRunDate` scheduler-owned — wording fixed (§5-F3) | **PASS** (v1 human-applied) |
| 8 | CO self-interface — `orchestrator-doctor` `validate`/`status`/`metrics` | ✓ | ✓ | ✓ | ✓ | ✓ | 13/13 tests; 7-state lifecycle walk; undocumented state rejected; repo-conflict invariant enforced | **PASS** |
| 9 | Capability discovery — `catalog.js --json`, `COMMAND-REGISTRY.json` (CO→registry) | ✓ | ✓ | ✓ | ✓ | ✓ | `command-registry:check` and catalog count check both pass in CI and were re-run this session | **PASS** |
| 10 | Isolation — zero cross-references between subsystems | — | — | ✓ | — | ✓ | grep for "night" in the CO doctor → 0 hits; grep for chief/orchestrator/portfolio in the NS doctor → 0 hits; neither doctor writes anything (zero write syscalls in both — crash-safe by construction) | **PASS** |

**No private implementation details leak across the boundary.** The only file-format
coupling (matrix rows 5–6) is to sections that NightShift's own skill declares as its
public, human-readable state schema — and it is now recorded per-mode in the CO mode
registry so a replacement engine declares its own read points.

---

## 3. End-to-End Sequence (certified paths)

```text
 Human            Chief Orchestrator                NightShift (per project)         Scheduler
  │  objective        │                                      │                          │
  ├──────────────────▶│ INTAKE: OBJ-NNN → portfolio.md       │                          │
  │                   │ ASSESS: git status / ns-doctor status│ (read-only probes)       │
  │                   │ CHARTER: missions/<id>.md            │                          │
  │                   │                                      │                          │
  │                   │ DISPATCH (in-session)                │                          │
  │                   ├─ /night-shift "<goal>" --project p ─▶│ Phase 0: branch, state,  │
  │                   │            --max-cycles N            │ baseline → cycles 1..N   │
  │   runbook entries │ DISPATCH (scheduled)                 │                          │
  │◀──────────────────┤ {scheduledTime,prompt,projectDir}    │                          │
  ├─ load into UI ────┼──────────────────────────────────────┼─────────────────────────▶│
  │                   │                                      │◀── claude -p "/night-…" ─┤
  │                   │ SUPERVISE (per cadence, read-only)   │                          │
  │                   ├─ ns-doctor status/metrics --json ───▶│                          │
  │                   ├─ read ## Needs Human ───────────────▶│                          │
  │                   │  apply heuristics table:             │                          │
  │                   │   corrupt→BLOCKED  flat≥3→WRAP-UP    │                          │
  │                   │   thrash→WRAP-UP   openCycle→RESUME  │                          │
  │                   │   exit1→re-dispatch once             │                          │
  │                   ├─ (RESUME) /night-shift --resume ────▶│ close interrupted cycle, │
  │                   │                                      │ continue at SELECT       │
  │                   │ WRAP                                 │                          │
  │                   ├─ /night-shift --wrap-up ────────────▶│ final assessment,        │
  │                   ├─ verify ## Handoff exists ──────────▶│ writes ## Handoff        │
  │                   │ mission → done; outcome recorded     │                          │
  │  executive report │ REPORT: reports/<date>.md            │                          │
  │◀──────────────────┤ (numbers from doctor reads only)     │                          │
```

Failure branches certified: NS crash mid-cycle → open cycle detected → RESUME; NS
state corrupt → validate exit 2 → mission BLOCKED, never hand-repaired; dispatch that
never started → doctor exit 1 → re-dispatch once, then BLOCKED; doctor killed mid-read
→ harmless (doctors are provably read-only); tool timeout/permission denial at the CO
layer → two-failure rule → BLOCKED + human queue (protocol-level, inherited from the
NS failure taxonomy one level up).

---

## 4. Remaining Integration Risks (observations)

| # | Risk | Severity | Mitigation / owner |
|---|------|----------|--------------------|
| O1 | `claude -p "/night-shift …"` slash-command expansion in headless runs is **assumed, not certified** — no unattended run has executed yet | Medium | Certify during blocker **B3** work (first scheduled mission); until then dispatch is in-session or human-applied |
| O2 | Doctor invocation uses a repo-relative path — correct only with ECC repo as cwd or an absolute script path (the harness used absolute paths; both command docs carry the "from the ECC repo" caveat) | Low | Use absolute path or `npm run night-shift:doctor` in supervision passes |
| O3 | Doctor JSON carries no `schemaVersion` field; breaking-change discipline is documentation-only (architecture doc §5.2 declares changes breaking) | Low | Add a version stamp whenever a doctor next changes for its own reasons; NS frozen, so deferred |
| O4 | Engine replaceability is certified structurally (field-level Mode Doctor Contract, mode-registry read points) but has not been exercised — no second mode exists | Low | First real proof when mode #2 ships (build sequence step 6) |
| O5 | `needsHuman` count (doctor) and item text (file read) are two snapshots of one fact; a mid-write read could transiently disagree | Very low | NS commits state atomically per cycle; CO treats supervision data as snapshots by design |
| O6 | Blockers **B1** (no programmatic scheduler enqueue) and **B3** (headless permission allowlist) remain open — unattended operation is still gated | Recorded | Unchanged from the architecture doc §10; not an integration defect |

## 5. Required Fixes — all applied this session (documentation only, CO-owned files)

| # | Finding | Fix applied |
|---|---------|-------------|
| F1 | The telemetry field names the CO consumes were defined only implicitly by night-shift-doctor's implementation — a replacement engine had no field-level spec | **Mode Doctor Contract** codified in the CO skill's Mode Registry (exact `status`/`metrics` fields + exit codes) and referenced from architecture doc §8.1 |
| F2 | Supervision heuristics table had no row for doctor exit 1 (no state) on a `dispatched` mission — failure testing exposed the gap | "Not started" row added: re-dispatch once, then `blocked` |
| F3 | Architecture doc §5.3 overstated the runbook as "exact `AutomationTask`-shaped" although `id`/`enabled`/`lastRunDate` are scheduler-owned | Wording corrected to the three CO-authored fields |
| F4 | Mode registry rows did not record where a mode's human queue and handoff are read — the one coupling a replacement engine must re-declare | "Human queue / handoff (read-only)" column added to the registry |

**Recommended, not applied** (would be new software; out of certification scope): a
permanent contract-regression test asserting `night-shift-doctor` emits every Mode
Doctor Contract field, so a future doctor change cannot silently break supervision.

## 6. Recommended Version

**Control Plane v1.0.0-rc.1** — covering the CO public interface (command surface,
state schemas, Mode Doctor Contract v1) certified against NightShift's frozen doctor
telemetry v1. Promote to **v1.0.0** after the first real supervised mission completes
end-to-end (architecture build sequence step 2), which also closes observation O1.

## 7. Certification statement

A future engineer can, using only documented public interfaces: **replace NightShift**
(implement the mode-registry row: command surface, state dir, Mode Doctor Contract,
human-queue/handoff read points), **upgrade the Chief Orchestrator** (its state is
validated by its own doctor; NS has zero references to it), or **add a new execution
engine** (registry row + heuristics; no existing code changes — verified: the CO
doctor contains no mode-specific logic and rejects nothing but its own documented
invariants). The boundary held under every failure injected at it.

**PASS WITH OBSERVATIONS** — observations O1–O6 above; none block attended operation.
