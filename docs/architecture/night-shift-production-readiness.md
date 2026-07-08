# Night Shift Production Readiness — 2026-07-07

Second-pass audit (follows [night-shift-audit.md](night-shift-audit.md)). Premise: the protocol is functionally correct; the question is whether it can run unattended for many hours while remaining predictable, recoverable, measurable, and trustworthy. The defining observation: Night Shift was three prose files whose guarantees depended entirely on the model choosing to follow them. This pass moved the mechanical guarantees into deterministic, tested code.

## Implemented this pass

1. **`scripts/night-shift-doctor.js`** — deterministic CLI over `.night-shift/` state: `validate` (integrity invariants, exit 0/1/2), `status` (goal, phase, cycle, open-cycle flag, queue counts), `metrics` (KPIs below). Read-only over the filesystem by design: no side effects, fully unit-testable, exit-code conventions match `ecc loop-status`.
2. **11-test suite** (`tests/scripts/night-shift-doctor.test.js`) covering normal, interrupted, failed, inconsistent, and empty state classes — including a template-conformance bug the first fixture exposed (section-header matching) that was fixed rather than papered over.
3. **Crash-resume procedure** in `--resume`: integrity check first; an interrupted cycle (open journal entry / dirty tree) is closed — verified against its contract or restored to the last commit — before any new work.
4. **Failure taxonomy** in the skill: eight failure classes (orchestrator crash, subagent crash, tool timeout, malformed output, git failure, repo inconsistency, network loss, context loss) each with detection and defined response.
5. **Journal timestamps** (`Started`/`Finished`) making cycle duration measurable.
6. **Subagent failure rule** in DELEGATE: crash/timeout/garbage = one failure of the approach; raw agent output never enters state files.
7. **Scorecard mean defined** over scored categories (`n/a` excluded).
8. Registered: `package.json` files + `npm run night-shift:doctor`; CHANGELOG.

## Scores (0–100, after this pass)

| Dimension | Score | Rationale |
|-----------|------:|-----------|
| **Production readiness (overall)** | **74** | mechanics are now code+tests; protocol correctness under a real multi-hour run is still unproven (top weakness) |
| Reliability | 78 | every simulated failure has a detection + response path; recovery deterministic where state survives; unproven under load |
| Scalability | 72 | scorecard bounded, journal linear (fine); `mission.md` Completed/Decision Log unbounded on very long missions |
| Maintainability | 82 | policy single-sourced, mechanics tested, all surfaces registered; three md files + one script + one test file |
| Security | 76 | injection rails on orchestrator and assessor, subagent output quarantined, no-autonomous-irreversibles; no sandboxing of delegated Bash beyond harness defaults |
| Observability | 75 | status/metrics/validate on demand; full history reconstructable two ways; no live push-based watcher, no token telemetry |

## Failure simulation — verdicts

All eight failure classes in the skill's taxonomy are detectable and recoverable, with one honest exception: **recovery is impossible only if the `.night-shift/` directory AND the mission branch are both lost** — journal and per-cycle commits are deliberately redundant so either reconstructs the mission. Partial context loss mid-session recovers via the ORIENT reload rule; machine restart recovers via `--resume` + open-cycle closure; malformed tool output is bounded by the two-failure rule.

## Observability — can an engineer answer…

| Question | Answer via |
|----------|-----------|
| What is it doing now? | `doctor status` (`openCycle`, cycle count) + `mission.md` In Progress |
| Why is it doing it? | journal `Why now` + value-gate line of the open entry |
| Which decision produced this task? | SELECT line + Decision Log entry |
| What changed last iteration? | last closed journal entry + its atomic commit |
| How much progress? | `doctor metrics` (`overallDelta`, `improvementPerCycle`) + scorecard |
| Which agent is active? | journal Execution section (planned agents); live agent identity is harness-level — gap, noted below |
| What failed? | REVERTED entries with captured evidence + Blocked section |
| Reconstruct full history? | yes — journal ∪ per-cycle commits (redundant by design) |

## KPIs

Computed deterministically by `doctor metrics` today: cycle duration (avg minutes), task completion rate (KEPT/closed), improvement rate (score delta/cycle), revert rate, trailing flat-cycle count (busy-loop detector), queued interventions. **Not yet measurable:** credits/tokens per improvement, decision latency, crash frequency — they require harness-side telemetry (see roadmap items 2 and 7); autonomous-runtime is derivable from first/last journal timestamps once missions run.

## Remaining weaknesses (ranked)

1. **HIGH — no live-mission evidence.** The protocol has never executed a real multi-hour mission; behavior under drift is assumed. Effort: medium.
2. **HIGH — no cost telemetry.** "Credits per completed task" is unmeasurable from state. Effort: medium (RECORD writes spend when the harness exposes it; doctor extends).
3. **MEDIUM — doctor not in the packaged CLI.** Target projects must know the ECC repo path. Effort: small (`scripts/ecc.js` subcommand + npx docs).
4. **MEDIUM — no concurrency guard.** Two sessions resuming one mission would interleave writes; no lockfile. Effort: small (`.night-shift/lock` + doctor check).
5. **MEDIUM — `mission.md` growth unbounded** on 100+ cycle missions. Effort: small (archive rule: roll Completed >50 cycles into `journal/archive.md`).
6. **LOW — git invariants not machine-checked.** Doctor v1 is deliberately fs-only (testable, side-effect-free); branch/clean-tree checks remain manual. Effort: small (`--git` flag).
7. **LOW — no push-based watcher.** `ecc loop-status`-style monitoring requires a status snapshot per cycle. Effort: small once 3 lands.

## Technical debt register

- Rubric categories/anchors intentionally duplicated in the assessor (cheaper than a 3.6k-token skill read per run) — documented, revisit if the rubric changes.
- FIX-FORWARD is a JUDGE verdict but resolves to KEPT/REVERTED in closed entries; doctor warns on anything else — acceptable, but the command could state the resolution explicitly.
- Doctor parses the templates by convention (regex over markdown); a template change without a doctor change breaks validation — the test suite is the guard, and both live in one repo.

## Roadmap (implementation order)

1. **Eval fixture mission** — a scripted micro-repo with seeded bugs; run `/night-shift` for 3–5 cycles under `skills/eval-harness`; assert doctor-validated end state. Converts "assumed correct" to "observed correct".
2. **Cost telemetry** — spend line per journal entry when harness cost data is available; extend `doctor metrics`.
3. **`ecc` CLI integration** — `npx --package ecc-universal ecc night-shift-doctor …`.
4. **Concurrency lockfile** + doctor check.
5. **Archival policy** for long missions.
6. **`--git` invariant checks** in doctor.
7. **Watcher integration** (`--write-dir` snapshots, mirroring `loop-status`).

Items 1–2 need human approval on scope/spend; 3–7 are mechanical and safe whenever picked up.
