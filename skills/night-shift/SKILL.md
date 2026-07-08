---
name: night-shift
description: "Judgment layer for autonomous orchestration modes — scoring rubric, priority ladder, persistent state schemas, verification standards, and credit discipline for /night-shift and future autonomous modes."
origin: ECC
---

# Night Shift Skill

The judgment layer behind `/night-shift` and the contract for every autonomous mode built after it. The command file (`commands/night-shift.md`) defines the operating loop; this skill defines how to think inside it: what to work on, how to score, when to stop, and what "verified" means.

## When to Use

- Running `/night-shift` — load this before the first cycle
- Building a new autonomous mode (`/research`, `/refactor`, `/security`, `/release`, `/performance`, `/debug`) on the same engine
- Resuming or auditing a night-shift mission from its `.night-shift/` state

## Philosophy

An autonomous orchestrator is an experienced staff engineer supervising a team, not an autocomplete loop. Every cycle begins with reasoning, not action:

1. What is currently blocking the project?
2. What would provide the highest impact right now?
3. What technical debt should be removed before it compounds?
4. Is the architecture improving? Is the user experience improving?
5. Is this change worth spending credits on?

If a candidate task cannot survive question 5, it does not get worked. The purpose of the orchestrator is not to generate code — it is to continuously decide **what should happen next**, and to prove after the fact that the decision was right.

Three consequences of that stance:

- **Never assume success.** A subagent reporting "done" is a claim, not a fact. The orchestrator verifies personally, every cycle.
- **Never polish an unfinished system.** UI polish on top of broken functionality is negative work — it makes the project look further along than it is.
- **Never forget.** Everything decided, tried, completed, or blocked lives in the state files. A fresh session resuming from disk must lose nothing.

## Mode Architecture (extensibility contract)

`night-shift` is the first autonomous mode, not the only one. A **mode** is four pluggable pieces on top of a shared engine:

| Piece | night-shift's version | A future mode swaps in… |
|-------|----------------------|--------------------------|
| Priority ladder | P0–P8 impact ladder (below) | e.g. `/security`: findings by CVSS-like severity |
| Assessment rubric | 13-category scorecard (below) | e.g. `/release`: ship-readiness checklist |
| Delegation map | full specialist roster | e.g. `/debug`: build-resolvers + silent-failure-hunter |
| Stop conditions | goal met / impact floor / budget | e.g. `/research`: questions answered with citations |

Shared and **not** redefined per mode: the eight-step cycle (ORIENT → SELECT → CONTRACT → DELEGATE → VERIFY → JUDGE → RECORD → CHECKPOINT), the `.night-shift/` state schema, the value gate, the human-input policy, and the safety rails. A new mode is a new command file plus a rubric section — it must not fork the engine.

Existing single-pass commands (`/security-scan`, `/refactor-clean`, `/build-fix`, `/test-coverage`, …) are **tools that modes invoke as cycle steps**. Do not modify them to build a mode.

## State Files

All state lives in `.night-shift/` in the target project root. Markdown, not a database — any session, model, or human can read and resume it.

### `mission.md`

```markdown
# Night Shift Mission

**Goal:** <the user's objective, verbatim>
**Started:** <date>  **Branch:** night-shift/<date>
**Focus areas:** <from --focus, or "none">
**Current phase:** <stabilize | harden | improve | polish>

## Backlog (impact-ranked)
- [ ] P1 fix checkout crash on empty cart — found cycle 000, est. impact: reliability +8
- [ ] P3 parameterize raw SQL in reports module — security +6

## In Progress
- cycle 007: extract payment client from god-object `api.js`

## Completed
- [x] cycle 006 — KEPT — fixed token refresh race (reliability 41→52) — commit a1b2c3d

## Blocked
- P2 split `server.js` — REVERTED twice, breaks websocket tests; needs smaller slices. Evidence: journal/cycle-004.md

## Tech Debt Register
- `utils/date.js` duplicated in 3 packages — found cycle 002, not yet scheduled

## Needs Human
- STRIPE_TEST_KEY missing — payment integration tests skipped since cycle 003

## Decision Log
- cycle 001: chose Express middleware error handler over per-route try/catch — smaller diff, matches existing pattern

## Handoff
<written at wrap-up>
```

Phases order the mission coarsely: **stabilize** (P0–P1) → **harden** (P2–P4) → **improve** (P5–P6) → **polish** (P7–P8). The phase advances only when the previous band has no actionable items.

### `scorecard.md`

```markdown
# Scorecard

| Category | Baseline | Last audit (cNNN) | Now | Evidence (latest) |
|----------|---------:|------------------:|----:|-------------------|
| Architecture | 45 | 52 | 58 | god-object split; layering doc added |
| Code quality | 50 | 55 | 61 | lint clean; 3 large fns remain (list) |
| Testing | 30 | 44 | 44 | coverage 31%→52%, suite green |
| ... | | | | |
| **Overall (mean)** | 42 | 47 | 55 | |
```

Fixed columns, updated in place — the table never widens, so per-cycle updates stay cheap and the file stays small. Per-cycle score history lives in the journal entries' score-delta lines; `Last audit` is refreshed only by @night-shift-assessor. **Overall** is the mean of scored categories — `n/a` rows are excluded, never counted as zero.

### `journal/cycle-NNN.md`

```markdown
# Cycle 007

**Started:** 2026-07-07T22:14:03Z
**Selected:** P2 extract payment client from `api.js`
**Why now:** highest actionable item; blocks 2 backlog features; architecture 52 is the lowest scoring category in phase
**Value gate:** est. architecture +5, unblocks P5 items — passes

## Contract
- Change: payment logic moves to `src/payments/client.js`; `api.js` under 300 lines
- Done means: all existing tests green, no import cycles, `api.js` < 300 lines
- Verify by: `npm test` + `npx madge --circular src/`
- Revert by: git revert of this cycle's commit

## Execution
- @planner produced 4-step extraction plan
- @tdd-guide implemented steps 1–4

## Verification (evidence, not claims)
- `npm test` → 214 passed, 0 failed (output captured)
- `npx madge --circular src/` → no cycles
- `wc -l src/api.js` → 287

## Verdict: KEPT
Score deltas: architecture 52→58 (extraction + no cycles), maintainability 49→53
Commit: f4e5d6a refactor: extract payment client from api monolith [night-shift cycle 007]
**Finished:** 2026-07-07T22:41:19Z
```

The `Started`/`Finished` stamps make cycle duration measurable; a closed entry without them is a warning, not a failure.

## The Priority Ladder

Work strictly top-down. Never work at a lower rung while an **actionable** (not blocked) item exists on a higher one.

| Rung | Band | What lives here |
|------|------|-----------------|
| P0 | Critical bugs | crashes, data loss, corruption, unusable core flows |
| P1 | Broken functionality | features that exist but do not work as intended |
| P2 | Architecture | structural problems that make future work harder; god objects, import cycles, missing boundaries |
| P3 | Security | injection, secrets in code, missing validation/authz |
| P4 | Performance | real measured bottlenecks (never speculative) |
| P5 | Developer experience | broken/slow builds, missing tests, tooling, dev docs |
| P6 | User experience | confusing flows, missing error states, accessibility gaps |
| P7 | UI polish | visual consistency, spacing, motion |
| P8 | Micro-optimizations | everything whose absence no one would notice |

**Polish gate:** P7–P8 are eligible only when every category on the scorecard is ≥ 70. Polish on an unfinished system is deferred by definition, not by judgment call.

**Tie-break within a rung:** (1) unblocks the most other backlog items, (2) largest expected score delta, (3) smallest diff.

## The Scoring Rubric

Thirteen categories, each 0–100, each anchored and evidence-backed:

| Category | What it measures |
|----------|------------------|
| Architecture | boundaries, coupling, dependency direction, fitness for the goal |
| Code quality | readability, naming, function/file size, idiom consistency |
| Testing | coverage of behavior (not lines alone), suite health, test speed |
| Documentation | README accuracy, setup-from-scratch viability, architecture docs, changelog |
| Performance | measured latency/throughput/bundle against targets |
| Security | input validation, secret handling, authn/authz, dependency risk |
| Reliability | error handling, failure recovery, absence of silent failures |
| Maintainability | duplication, dead code, comment rot, ease of safe change |
| Scalability | what breaks at 10× data/traffic/team |
| Developer experience | clone-to-running time, build speed, tooling, feedback loops |
| User experience | task completion flows, error states, latency perception |
| UI consistency | design tokens, spacing rhythm, component reuse |
| Accessibility | keyboard nav, contrast, semantics, reduced motion |

**Anchors:** 0–20 broken · 21–40 poor · 41–60 functional with real gaps · 61–80 solid · 81–100 excellent. Most working-but-untended projects sit in the 40s; scoring a category above 80 requires strong cited evidence.

**Rules:**

- Every score carries evidence (`file:line`, command output, measurement). A score without evidence is invalid.
- A category that cannot be verified (e.g. tests won't run) is scored from what is observable and flagged `unverified` — never guessed.
- Per-cycle, only categories the cycle touched are re-scored, with a one-line justification. Full re-assessment by @night-shift-assessor on phase change or every 10 cycles, whichever comes first — self-scoring drifts optimistic, and the audit is where drift gets corrected.
- Scores may go **down**. Discovering hidden problems lowers a score; that is the system working, not failing.

## The Value Gate (credit discipline)

Credits are the mission's fuel; value-per-credit is a first-class metric. Before every cycle, the selected item must pass:

> Will this move at least one category by ≥ 2 points, or shrink the P0–P3 backlog?

Below that floor, do not work — check stop conditions. Additional discipline:

- **No re-analysis.** The journal and mission file are trusted memory. Re-reading the whole repo each cycle is the most expensive anti-pattern an orchestrator has.
- **No retry storms.** Two failures on one approach → change what you can observe or mark it blocked. A third identical attempt is forbidden.
- **Batch trivia.** Items too small to justify a cycle (typo fixes, one-line lints) accumulate in the backlog and ship as one combined cycle.
- **Route models by tier.** Assessment and judging deserve the strongest model; mechanical mid-cycle edits do not (see `/model-route`).
- **Prefer boring wins.** A verified 4-point reliability gain beats a speculative 10-point architecture rewrite that might revert.

## Verification Standard

The orchestrator verifies; subagents only report. Per artifact:

| The cycle produced | Verified means |
|--------------------|----------------|
| Code change | its tests ran AND the changed path was exercised in the running thing |
| New/changed test | watched failing before the fix, passing after |
| Refactor | full suite green before AND after; behavior diff is zero |
| Config/tooling change | the consuming tool loaded it and the effect was observed |
| Documentation | every link/path resolves; every command in it was run |
| Deletion | reference search returned zero hits; checks green after |
| Score change | evidence cited in the scorecard row |

"It should work," "the subagent said it passed," and "it compiles" never satisfy this table. If the project has no test infrastructure, the first cycles **create it** — an unverifiable project cannot be autonomously improved, so making it verifiable is automatically high-impact P5 work.

## State Invariants & Failure Recovery

These invariants are machine-checkable — `scripts/night-shift-doctor.js validate --dir <project>` in the ECC repo enforces them (`status` and `metrics` answer the observability questions); check them manually when the script is unavailable:

1. `mission.md` and `scorecard.md` exist with their template sections; the scorecard keeps 13 rows scored 0–100 or `n/a`.
2. Journal numbering is contiguous; every entry carries a contract; every entry except an in-flight last one ends in a verdict (KEPT or REVERTED).
3. The working tree is clean at every cycle boundary, on a `night-shift/*` branch, one commit per closed cycle.
4. A last entry without a verdict is an **interrupted cycle** — closed on resume (verify against its contract, else restore to the last commit), never silently abandoned.

Failure taxonomy — anything can die at any time; each failure has a defined response:

| Failure | Detected by | Response |
|---------|-------------|----------|
| Orchestrator crash / machine restart / process kill | open cycle or dirty tree on `--resume` | close the interrupted cycle, then continue at SELECT |
| Subagent crash, timeout, or malformed output | missing/garbled report | one failure of the approach; two-failure rule applies |
| Tool timeout or malformed tool output | no usable result | retry once; a second failure counts against the approach |
| Git operation fails mid-cycle | command error | stop the cycle, restore the cycle boundary, re-check invariants before continuing |
| Repository temporarily inconsistent (locks, mid-write) | verification cannot run | retry once after the tree settles; else close the cycle REVERTED with evidence |
| Network unavailable | fetch/install/clone fails | continue with offline-capable backlog items; queue the rest with a note |
| Context loss / compaction mid-session | state uncertain | reload all three state files from disk (ORIENT rule) |
| Credits or context exhausted | approaching limits | stop condition: state is already on disk; write the handoff |

Recovery is impossible only when the state directory itself is lost **and** the mission branch is gone — the journal and the per-cycle commits are deliberately redundant so that either one can reconstruct the mission.

## Metrics

Every KPI below is derivable from state files alone; `night-shift-doctor metrics` computes them deterministically:

- **Cycle duration** — journal `Started`/`Finished` stamps
- **Task completion rate** — KEPT / closed cycles
- **Improvement rate** — overall score delta per closed cycle
- **Revert rate** and **trailing flat-cycle count** — the busy-loop detector
- **Queued interventions** — `## Needs Human` entries (manual-intervention frequency)

Credit/token spend per improvement is **not** observable from state files; track it with the harness's cost tooling (e.g. `/cost-report`) until cost telemetry is wired into the journal.

## Human Interaction Policy

Autonomy means queueing questions, not asking them. `## Needs Human` in `mission.md` is the interface; work continues around it. Only four things belong there:

1. **Missing credential/secret** — record exactly which one and what it unblocks; skip dependent tasks; never invent, hardcode, or print one.
2. **Legal / licensing / security-disclosure decisions.**
3. **Requirement ambiguity** that materially changes the outcome — record the question and the default you would pick; work elsewhere until answered.
4. **Irreversible or outward-facing actions** — push, deploy, publish, send, spend, destructive deletion. Never performed autonomously under any mode, ever.

Stop early only when the entire remaining backlog is blocked behind this list.

## Anti-Patterns

- **The busy loop** — cycles that produce commits but no score movement. Detect via the journal's per-cycle score deltas; three flat cycles = stop condition.
- **The optimist** — marking KEPT on a subagent's word. Every KEPT verdict must cite captured command output.
- **The gold-plater** — P7 work while P1 items sit open. The polish gate exists for this.
- **The amnesiac** — re-discovering what an earlier cycle already recorded. The journal is consulted before any rediscovery: in context when present, from disk when not.
- **The gambler** — third attempts at a twice-failed approach. Blocked is an honest, recoverable state; a burned credit budget is not.
- **The silent operator** — an empty `## Needs Human` at wrap-up on a mission that clearly hit unknowns. Queued questions are deliverables.

## Example: one healthy cycle

A mission to production-harden an Express API, cycle 4. ORIENT: journal shows auth done, scorecard has reliability at 41 (lowest), backlog's top actionable item is "unhandled promise rejections crash the server (P1)". SELECT: passes the value gate (reliability +6 expected, P1). CONTRACT: done means a rejection in any route returns 500 and the process survives; verify by a new failing test plus `curl` against the running server. DELEGATE: @tdd-guide writes the failing test and the error middleware. VERIFY: test failed pre-fix (captured), passes post-fix; manual `curl` of a poisoned route → 500, process alive. JUDGE: KEPT. RECORD: reliability 41→49 with evidence, CHANGELOG entry, one commit `fix: catch async route rejections in error middleware [night-shift cycle 004]`. CHECKPOINT: cycle 5 selects the next P1.

The unhealthy version of the same cycle: notice the crash, have a subagent patch it, see green output from the subagent, commit, and also "quickly" restyle the error page while there. Two rungs violated, nothing verified, one unrevertable mixed commit.
