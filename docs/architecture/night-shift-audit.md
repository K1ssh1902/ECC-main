# Night Shift Audit — 2026-07-07

Production-hardening audit of the Night Shift orchestration system (`commands/night-shift.md`, `skills/night-shift/SKILL.md`, `agents/night-shift-assessor.md`), treating it as a mission-critical autonomous system. Method: static benchmark → issue analysis across architecture, execution flow, state management, error recovery, token efficiency, security, and maintainability → implement → verify → re-benchmark.

## Benchmark

### Static footprint (measured)

| File | Before | After | Delta |
|------|--------|-------|-------|
| `commands/night-shift.md` | 9,291 B / 1,423 w / ~2,322 tok | 9,269 B / 1,418 w / ~2,317 tok | −22 B |
| `skills/night-shift/SKILL.md` | 14,122 B / 2,181 w / ~3,530 tok | 14,510 B / 2,232 w / ~3,627 tok | +388 B |
| `agents/night-shift-assessor.md` | 4,851 B / 719 w / ~1,212 tok | 4,929 B / 733 w / ~1,232 tok | +78 B |
| **Total** | **28,264 B** | **28,708 B** | **+444 B (+1.5%)** |

The static footprint grew slightly: the injection rail, the failed-cycle recovery path, and the scorecard schema note added text that de-duplication did not fully offset. This is the right trade — files load once per mission; cycle costs repeat.

### Protocol cost model (per 25-cycle mission)

| Runtime cost | Before | After | Basis |
|--------------|--------|-------|-------|
| State-file disk reads in ORIENT | 2 per cycle, every cycle (~50 reads) | Only at session start / resume / post-compaction (~2–6 reads) | protocol text |
| Full assessor audits | every 5 cycles + phase changes ≈ 5–7 runs | phase change or every 10 cycles ≈ 3–4 runs | protocol text |
| `scorecard.md` size | grows one column per audit, rewritten per update | fixed columns, constant size | template |
| Duplicated policy statements (drift surfaces) | 6 | 2 (both deliberate, see D8/D9) | grep-verified |

**Estimated (not measured) runtime savings:** eliminating ~44 mid-session state reads saves roughly 20–45k tokens/mission (mission.md grows to 500–1,500 tokens mid-mission); each avoided assessor run saves an entire repo-mapping + test-running Opus subagent session. These are model-based estimates from the protocol; a live-mission A/B measurement is the top follow-up (see Residual work).

## Issues found and resolved

Each: why it's a problem → impact → effort → decision.

**A1 — Repeated state reads in ORIENT (token efficiency).** ORIENT mandated reading `mission.md` + latest journal every cycle, but RECORD wrote both one step earlier — mid-session the content is already in context, so the protocol institutionalized the exact "repeated analysis" it bans. Impact: high (recurring, scales with mission length). Effort: trivial. Options: (a) read only on start/resume/compaction, (b) read every N cycles, (c) keep. **Fixed with (a)**; disk stays the source of truth across session boundaries only.

**A2 — Assessor over-auditing (token efficiency / scheduling).** Full Opus audit every 5 cycles ≈ 5–7 audits per mission; each is the single most expensive operation in the system, and per-cycle self-scoring plus journal deltas already track drift between audits. Impact: high. Effort: trivial. Options: (a) every 10 + phase change, (b) drift-triggered only, (c) keep. **Fixed with (a)** — (b) is unmeasurable by the drifting party itself.

**A3 — Unbounded scorecard growth (state management).** Appending a column per audit means the most-rewritten state file grows forever; every per-cycle update rewrites an ever-wider table. Impact: medium (compounds over long missions — the stated goal is "many hours"). Effort: low. **Fixed:** fixed columns (Baseline / Last audit / Now / Evidence), updated in place; history lives in journal score-delta lines. Assessor write instructions aligned.

**A4 — No recovery path for a broken uncommitted cycle (error recovery).** REVERT only specified `git revert`, which works for committed cycles; a subagent that wedges the working tree mid-cycle left the mission with no specified way back — the highest-severity gap found, since a wedged tree stalls the entire autonomous run. Impact: high. Effort: low. **Fixed:** restore to the last cycle's commit, discarding the failed cycle's changes, `.night-shift/` explicitly preserved.

**A5 — No prompt-injection rail on the orchestrator (security).** The assessor carries ECC's Prompt Defense Baseline, but the orchestrator — which reads arbitrary repository content for hours unattended — had no instruction that repo content is data, not instructions. Impact: high for an overnight autonomous mode. Effort: one line. **Fixed** in Safety Rails.

**A6 — Duplicated policy across command and skill (maintainability).** Human-input list, value-gate threshold, full priority-ladder chain, and the two-failure rule each lived in ≥2 files; both copies load every mission and drift independently. Impact: medium (token waste + drift risk — A8 below is this exact failure observed in the wild). Effort: low. **Fixed:** thresholds and policy detail single-sourced in the skill; the command keeps operational one-liners and pointers. Grep-verified: "≥ 2 points" ×1, ladder chain in command ×0, 4-item human list ×1.

**A7 — `--focus` parsed but never used (developer experience).** A documented flag with no effect on behavior is an interface lie. Impact: low-medium. Effort: one line. **Fixed:** focus areas now win tie-breaks within a priority rung.

**A8 — Stale cadence in assessor description (found during verification).** After A2, the agent frontmatter still said "every 5 cycles" — caught by the audit's own grep verification pass, proving the drift risk in A6 is real. **Fixed.**

## Deliberate non-changes

- **D8/D9 — rubric categories + anchors duplicated in the assessor.** The assessor runs in its own context; inlining ~100 tokens is cheaper every run than having it read the ~3.6k-token skill. Kept, documented here as intentional.
- **Two-failure rule appears twice** (command JUDGE + skill Value Gate): the decision point needs the trigger inline; the skill owns the rationale. Kept.
- **Philosophy section kept whole** — it is the system's decision function, loaded once per mission; cutting it to save ~200 tokens once would trade quality for noise.

## Verification

- `markdownlint` clean on all three files; `validate-agents` / `validate-commands` / `validate-skills` pass (64/80/252); `command-registry:check` up to date after regeneration.
- All cross-file consistency claims above grep-verified (occurrence counts cited in Benchmark table).

## Residual work (ranked)

1. **Live benchmark harness** — run two short missions (old vs. new protocol) on a fixture repo and measure actual token spend per cycle; replaces the estimates above with data.
2. **Observability** — `--status` is pull-only; a `.night-shift/status.json` snapshot per cycle would let `ecc loop-status`-style watchers monitor a running mission without dequeuing a command.
3. **Mission-scoped model routing defaults** — the skill points at `/model-route`; a concrete default map (assessor: strongest, mechanical edits: cheapest) would make the credit discipline self-executing.
