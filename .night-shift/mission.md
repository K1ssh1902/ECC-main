# Night Shift Mission

**Goal:** Raise test coverage of scripts/lib in ECC-main — add tests for uncovered scripts/lib modules, keeping all existing suites green; do not change public contracts or any doctor's JSON surface.
**Started:** 2026-07-09  **Branch:** night-shift/2026-07-09
**Focus areas:** testing, maintainability
**Current phase:** improve

## Backlog (impact-ranked)
(empty — cleared through c005)

## In Progress
(none)

## Completed
- [x] cycle 001 — KEPT — suite green on Windows: 4 EPERM symlink-fixture tests capability-guarded (testing 62→68, reliability 66→70, DX 71→73) — journal/cycle-001.md, commit 8b5e93c
- [x] cycle 002 — KEPT — shell-substitution.js characterization suite: 55 tests incl. hostile inputs, mutation-proven (testing 68→73, security 70→73) — journal/cycle-002.md, commit 2d4591c
- [x] cycle 003 — KEPT — github-discussions.js unit suite: 38 tests, all 6 exported functions incl. ECC_GH_SHIM-driven fetch path, mutation-proven (testing 73→75) — journal/cycle-003.md, commit 61d2180
- [x] cycle 004 — KEPT — batched: harness-adapter-compliance 6 remaining exports (12 tests) + cursor-agent-names suite (16 tests), both mutation-proven; c000 coverage-gap backlog fully cleared (testing 75→77) — journal/cycle-004.md, commit 3baea0b
- [x] cycle 005 — KEPT — 5 bash-requiring tests across 4 files guarded behind a working-bash capability probe; suite green in both PowerShell (broken WSL bash) and Git Bash except operator-dir failures (reliability 70→72, DX 73→74) — journal/cycle-005.md, this cycle's commit

## Blocked
(none)

## Tech Debt Register
- tests/ci/no-personal-paths.test.js "passes against the real repository" runs the validator with a hard 10s execFileSync timeout — flaked once under full-suite disk contention (c005, did not reproduce on retry or standalone); consider raising the timeout or exempting the real-repo test from it. — found c005
- toCursorAgentFileName (scripts/lib/cursor-agent-names.js) does no sanitization and its `ecc-` prefix check is case-sensitive: 'ECC-Agent.md' → 'ecc-ECC-Agent.md' (double prefix); falsy input passes through unchanged. Characterized in c004 tests, not fixed — changing it is a public-contract change (2 install-path consumers), out of mission scope. — found c004
- scripts/lib/install-lifecycle.js is 1226L, breaching the repo's own 800L cap (install-executor.js 738L trending) — split mission candidate, out of this mission's scope (contract risk) — found c000 (assessor)
- Coverage (c8) runs only on ubuntu in CI (.github/workflows/ci.yml:212-219) — Windows-skipped tests silently drop from measured coverage — note only — found c000
- CORRECTED c000: cursor-agent-names.js is NOT dead code — 2 consumers (scripts/lib/install-executor.js:6, scripts/lib/install-targets/cursor-project.js:4); the cycle-000 zero-consumer claim used a grep pattern that missed relative requires. Deleting it would break installs.

## Needs Human
- Untracked `.agents/skills/source-command-*` dirs (pre-existing, operator-generated) fail 2 Codex-surface tests: SKILL.md `name:` values are quoted strings and `agents/openai.yaml` is missing — tests/ci/codex-skill-surface.test.js is correctly rejecting an invalid Codex surface. Unblocks: full-suite exit 0. Options: fix the generated frontmatter + add openai.yaml, regenerate, or delete the dirs. Out of mission scope (untracked operator territory per c000 decision log). — found c003
- Session-environment: PowerShell sessions on this machine resolve `bash` to C:\Windows\system32\bash.exe (WSL relay, no /bin/bash installed) → 5 bash-dependent tests hard-fail outside Git Bash. Machine-level fix (install a WSL distro or reorder PATH); repo-level mitigation queued as the P5 backlog item. — found c003

## Decision Log
- cycle 000: Mission dispatched under an operator exception scoped to protocol-produced commits on this branch only (no merge, no push, no history rewriting). `tests/fixtures/mode-doctor-captures/` (M2 doctor-JSON captures, pre-existing untracked evidence for M3) is deliberately excluded from cycle commits — cycle commits add their own paths explicitly; the operator commits the captures separately.
- cycle 000: Backlog seeded from a mechanical coverage-gap survey (comm -23 of scripts/lib basenames vs tests/lib test basenames): 5 of 25 modules have no dedicated test file.
- cycle 003: Mission resumed under granted dispatch consent (M2 continuation session, 2026-07-10). c003's full-suite gate recorded with a documented deviation: 7 failures all proven pre-existing/environmental (operator dirs + broken WSL bash), zero caused by mission work.
- cycle 004: cursor-agent-names batched with harness-adapter per the batch-trivia rule (P4 alone below the value floor).
- wrap-up: Operator declined the assessor-subagent spawn at wrap-up; final assessment performed inline by the orchestrator against the same rubric, from evidence already captured in-session plus fresh dual-environment suite runs. Self-score audit: c003–c005 deltas confirmed (testing 77, reliability 72, DX 74); no optimistic drift found, maintainability deliberately held at 68 (two new warts logged even as three stale facts were corrected).

## Handoff

## Night Shift Report — Raise test coverage of scripts/lib in ECC-main

**Cycles run:** 5  **Kept:** 5  Reverted: 0  Blocked: 0
**Score trend:** overall 68 → 71 (testing 62→77, reliability 66→72, DX 71→74, security 70→73; full table in scorecard.md)

### What changed
- cycle 001: 4 broken-symlink fixture tests capability-guarded on Windows (EPERM) — commit 8b5e93c
- cycle 002: shell-substitution.js characterization suite, 55 tests incl. hostile inputs — commit 2d4591c
- cycle 003: github-discussions.js unit suite, 38 tests, all 6 exported functions incl. ECC_GH_SHIM-driven fetch — commit 61d2180
- cycle 004: harness-adapter-compliance remaining 6 exports (+12 tests) + cursor-agent-names suite (16 tests) — commit 3baea0b
- cycle 005: 5 bash-requiring tests guarded behind a working-bash capability probe — commit f9c528c

### Verified how
- Every cycle: targeted file runs re-executed personally by the orchestrator (never on subagent claims), plus one deterministic module-mutation check per new suite (watched fail, restored byte-identical, watched pass).
- Wrap-up: full `node tests/run-all.js` in BOTH environments → 2717/2719 each; the only 2 failures are the out-of-scope operator-dir codex-skill-surface tests; skip-line grep under Git Bash → 0 (guards don't skip when bash works).
- Constraint check: `git diff eb78dbd..HEAD --stat -- scripts/` → empty — zero product-code, public-contract, or doctor-JSON changes across the whole mission.

### Needs Human
- Untracked `.agents/skills/source-command-*` dirs fail 2 Codex-surface tests (quoted `name:`, missing agents/openai.yaml) — fix the generated frontmatter, regenerate, or delete; this is the only thing between the suite and full green.
- Machine: PowerShell resolves `bash` to WSL's System32 stub without a distro — install a distro or reorder PATH (repo now tolerates it via c005 guards).
- Operator to commit `tests/fixtures/mode-doctor-captures/` (M3 evidence, deliberately excluded from cycle commits per c000 decision).

### Recommended next mission
1. Split scripts/lib/install-lifecycle.js (1226L, breaches the repo's own 800L cap; install-executor.js 738L trending) — contract-risky, needs its own mission with characterization-first cycles.
2. Coverage-on-Windows: c8 coverage runs only on ubuntu in CI (.github/workflows/ci.yml:212-219) — Windows-skipped tests silently drop from measured coverage.
3. Fix characterized warts: toCursorAgentFileName case-sensitive double-prefix (2 install consumers), no-personal-paths 10s validator timeout flake.
