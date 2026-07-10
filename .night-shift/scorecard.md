# Night Shift Scorecard — night-shift/2026-07-09

Mission: raise test coverage of scripts/lib; suites stay green; no public-contract or doctor-JSON changes.
Assessed: 2026-07-09, cycle c000 (baseline — all three score columns are this audit). Full suite executed once: `node tests/run-all.js` → 2594/2598 passed, 4 failed, exit 1 (Windows).

| Category | Baseline | Last audit (c000) | Now | Evidence (latest) |
|---|---|---|---|---|
| Architecture | 76 | 76 | 76 | 25 focused top-level lib modules + domain subdirs (install-targets/, control-pane/, state-store/); all hooks gate through one wrapper (scripts/hooks/run-with-flags.js:14 → lib/hook-flags) |
| Code quality | 72 | 72 | 72 | eslint.config.js present; only 7 TODO/FIXME/HACK across 3 files in scripts/; secrets-pattern grep over scripts/ → 0 hits; but install-lifecycle.js is 1226L vs repo's own 800L cap (wc -l) |
| Testing | 62 | 62 | 75 | c003: github-discussions.js covered (38 tests, all 6 exported fns incl. shim-driven fetch, mutation-proven — 6 fail on export override); 4 of 5 c000 gap modules now have dedicated tests; suite 2689/2691 under working bash — only failures are operator's untracked skill dirs (Needs Human) |
| Documentation | 74 | 74 | 74 | README.md, CHANGELOG.md, CONTRIBUTING.md, CLAUDE.md at root; docs/ spans architecture docs + 10 locales (de/ja/ko/pt/ru/th/tr/vi/zh-CN/zh-TW); docs/architecture/harness-adapter-compliance.md is itself test-enforced (tests/docs/harness-adapter-compliance.test.js:39) |
| Performance | 55 | 55 | 55 | No perf/bench test files exist (`ls tests | grep -ci "perf\|bench"` → 0); mitigations are design-only: hook gating short-circuits via ECC_HOOK_PROFILE/ECC_DISABLED_HOOKS (scripts/lib/hook-flags.js:67-74), <200ms blocking-hook budget documented in .claude/rules/node.md |
| Security | 70 | 70 | 73 | c002: the security-gating parser (shell-substitution.js, consumers pre-bash-dev-server-block.js:10 / gateguard-fact-force.js:32) now has direct hostile-input tests; supply-chain-watch.yml IOC tests; 0 hardcoded-secret grep hits in scripts/ |
| Reliability | 66 | 66 | 70 | c001: suite no longer environment-coupled — the 4 Windows EPERM hard-fails are capability-guarded skips; 99 try/catch blocks across 30 scripts/lib files (grep count); hooks exit-0-on-error policy in .claude/rules/node.md |
| Maintainability | 68 | 68 | 68 | Consistent lowercase-hyphen naming across scripts/ (glob evidence); TODO debt near zero; but install-lifecycle.js 1226L / install-executor.js 738L trend over the 800L cap, and mission backlog carries 3 stale facts (see findings) that misdirect maintenance effort |
| Scalability | 74 | 74 | 74 | Registry-driven growth: manifest-based install (scripts/lib/install-manifests.js, 654L, tested), ADAPTER_RECORDS compliance matrix for 6+ harnesses (scripts/lib/harness-adapter-compliance.js:443), command-registry:generate/check scripts (package.json:331-333) |
| Developer experience | 71 | 71 | 73 | c001: Windows clone-to-green out of the box (EPERM wart removed); rich npm scripts: test/lint/coverage/3 doctors/audits (package.json:327-357); every test file standalone-runnable; 3 bin entries (package.json:322-326) |
| User experience | 62 | 62 | 62 | Operator CLI surface: npx ecc + postinstall guidance (package.json:328), install.sh/install.ps1, doctor/status dashboards; uninstall supports dry-run (tests/scripts/uninstall.test.js "supports dry-run without mutating managed files" — passed in this run) |
| UI consistency | n/a | n/a | n/a | CLI/toolkit repo — no GUI product surface in mission scope (terminal output only; ecc_dashboard.py is ancillary and out of goal) |
| Accessibility | n/a | n/a | n/a | No UI surface to assess (same evidence as UI consistency) |
| **Overall (mean)** | **68** | **68** | **70** | Mean of 11 scored categories (770/11 = 70.0 after c002); n/a rows excluded |

## Suite run capture (c000)

- Command: `node tests/run-all.js` (Windows 11, node ≥18) → **exit 1**; Total 2598, Passed 2594, Failed 4.
- All 4 failures are one root cause — test fixtures create broken symlinks and Windows denies it without Developer Mode/elevation:
  - ci/validators.test.js — "skips unreadable skill directory entries without error (broken symlink)" — `EPERM: operation not permitted, symlink 'C:\nonexistent\target\path' -> ...`
  - lib/session-manager.test.js — "getAllSessions skips broken symlink .tmp files gracefully" and "getSessionById returns null when matching session is a broken symlink" — EPERM
  - lib/utils.test.js — "findFiles skips broken symlinks that match the pattern" — EPERM
- These are fixture-portability defects, not product bugs; repo precedent for platform skips exists (scripts/trae-install.test.js: "skipped on Windows; Trae shell scripts are Unix-only").

## Coverage-gap ground truth (corrects the c000 mechanical survey)

| Module | Mission claim | Verified state |
|---|---|---|
| hook-flags.js (74L) | untested | **Has dedicated test** — tests/hooks/hook-flags.test.js:10-17 imports all 6 exports |
| harness-adapter-compliance.js (453L) | untested | **Partially tested** — tests/docs/harness-adapter-compliance.test.js:7-12 imports 4 of 10 exports; renderStateTable, validateDocumentation uncovered |
| github-discussions.js (159L) | untested | **Constants only** — tests/scripts/discussion-audit.test.js:12-15 and platform-audit.test.js:12-15 import just DISCUSSION_QUERY/DISCUSSION_ENABLED_QUERY; 6 exported functions have no direct unit tests |
| shell-substitution.js (494L) | untested | **Confirmed untested** — zero test imports repo-wide; pure parser (no exec/spawn/require), 3 exports |
| cursor-agent-names.js (26L) | untested, 0 consumers | Untested, but **2 consumers**: scripts/lib/install-executor.js:6, scripts/lib/install-targets/cursor-project.js:4 — NOT dead code |
