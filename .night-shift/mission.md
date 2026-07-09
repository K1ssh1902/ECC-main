# Night Shift Mission

**Goal:** Raise test coverage of scripts/lib in ECC-main — add tests for uncovered scripts/lib modules, keeping all existing suites green; do not change public contracts or any doctor's JSON surface.
**Started:** 2026-07-09  **Branch:** night-shift/2026-07-09
**Focus areas:** testing, maintainability
**Current phase:** improve

## Backlog (impact-ranked)
- [ ] P2 test scripts/lib/shell-substitution.js (494 lines, pure parser, zero test imports repo-wide; guards two security hooks) — testing +5, security +3 — found c000 (assessor-confirmed genuinely untested)
- [ ] P3 unit-test github-discussions.js pure functions (consumers import only the 2 query constants) — testing +3 — found c000
- [ ] P3 extend harness-adapter-compliance coverage to its 6 unimported exports (renderStateTable, validateDocumentation …) — testing +2 — found c000
- [ ] P4 small test for cursor-agent-names.js (26L, 2 exports, 2 real consumers) — testing +1 — found c000

## In Progress
(none)

## Completed
- [x] cycle 001 — KEPT — suite green on Windows: 4 EPERM symlink-fixture tests capability-guarded (testing 62→68, reliability 66→70, DX 71→73) — journal/cycle-001.md, this cycle's commit on night-shift/2026-07-09

## Blocked
(none)

## Tech Debt Register
- scripts/lib/install-lifecycle.js is 1226L, breaching the repo's own 800L cap (install-executor.js 738L trending) — split mission candidate, out of this mission's scope (contract risk) — found c000 (assessor)
- Coverage (c8) runs only on ubuntu in CI (.github/workflows/ci.yml:212-219) — Windows-skipped tests silently drop from measured coverage — note only — found c000
- CORRECTED c000: cursor-agent-names.js is NOT dead code — 2 consumers (scripts/lib/install-executor.js:6, scripts/lib/install-targets/cursor-project.js:4); the cycle-000 zero-consumer claim used a grep pattern that missed relative requires. Deleting it would break installs.

## Needs Human
(none yet)

## Decision Log
- cycle 000: Mission dispatched under an operator exception scoped to protocol-produced commits on this branch only (no merge, no push, no history rewriting). `tests/fixtures/mode-doctor-captures/` (M2 doctor-JSON captures, pre-existing untracked evidence for M3) is deliberately excluded from cycle commits — cycle commits add their own paths explicitly; the operator commits the captures separately.
- cycle 000: Backlog seeded from a mechanical coverage-gap survey (comm -23 of scripts/lib basenames vs tests/lib test basenames): 5 of 25 modules have no dedicated test file.

## Handoff
(written at wrap-up)
