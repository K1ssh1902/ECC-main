# Night Shift Mission

**Goal:** Raise test coverage of scripts/lib in ECC-main — add tests for uncovered scripts/lib modules, keeping all existing suites green; do not change public contracts or any doctor's JSON surface.
**Started:** 2026-07-09  **Branch:** night-shift/2026-07-09
**Focus areas:** testing, maintainability
**Current phase:** improve

## Backlog (impact-ranked)
- [ ] P5 guard the 5 bash-dependent test files behind a bash-capability probe (c001 precedent) — reliability +2, DX +1 — found c003 (PowerShell sessions resolve `bash` to WSL's broken System32 stub → 5 hard fails; green under Git Bash)

## In Progress
(none)

## Completed
- [x] cycle 001 — KEPT — suite green on Windows: 4 EPERM symlink-fixture tests capability-guarded (testing 62→68, reliability 66→70, DX 71→73) — journal/cycle-001.md, commit 8b5e93c
- [x] cycle 002 — KEPT — shell-substitution.js characterization suite: 55 tests incl. hostile inputs, mutation-proven (testing 68→73, security 70→73) — journal/cycle-002.md, commit 2d4591c
- [x] cycle 003 — KEPT — github-discussions.js unit suite: 38 tests, all 6 exported functions incl. ECC_GH_SHIM-driven fetch path, mutation-proven (testing 73→75) — journal/cycle-003.md, commit 61d2180
- [x] cycle 004 — KEPT — batched: harness-adapter-compliance 6 remaining exports (12 tests) + cursor-agent-names suite (16 tests), both mutation-proven; c000 coverage-gap backlog fully cleared (testing 75→77) — journal/cycle-004.md, this cycle's commit

## Blocked
(none)

## Tech Debt Register
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

## Handoff
(written at wrap-up)
