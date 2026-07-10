# Night Shift Scorecard — night-shift/2026-07-09

Mission: raise test coverage of scripts/lib; suites stay green; no public-contract or doctor-JSON changes.
Assessed: baseline c000 (2026-07-09); wrap-up audit c005 (2026-07-10, performed inline by the orchestrator after the operator declined the assessor-subagent spawn — see Decision Log). Wrap-up suite runs: `node tests/run-all.js` → 2717/2719 in BOTH PowerShell (broken WSL bash, guards skip) and Git Bash (working bash, zero skips); both failures are the out-of-scope operator-dir codex-skill-surface tests.

| Category | Baseline | Last audit (c005) | Now | Evidence (latest) |
|---|---|---|---|---|
| Architecture | 76 | 76 | 76 | 25 focused top-level lib modules + domain subdirs (install-targets/, control-pane/, state-store/); all hooks gate through one wrapper (scripts/hooks/run-with-flags.js:14 → lib/hook-flags); unchanged by mission (test-only commits, `git diff eb78dbd..HEAD --stat -- scripts/` → empty) |
| Code quality | 72 | 72 | 72 | eslint.config.js present; only 7 TODO/FIXME/HACK across 3 files in scripts/; secrets-pattern grep over scripts/ → 0 hits; but install-lifecycle.js is 1226L vs repo's own 800L cap (wc -l) |
| Testing | 62 | 77 | 77 | All 5 c000 coverage-gap modules now have dedicated, mutation-proven tests (c002 shell-substitution 55, c003 github-discussions 38, c004 harness-adapter +12 / cursor-agent-names 16); suite 2717/2719 with only operator-dir failures; every guard watched failing via deterministic module mutation |
| Documentation | 74 | 74 | 74 | README.md, CHANGELOG.md (updated every cycle), CONTRIBUTING.md, CLAUDE.md at root; docs/ spans architecture docs + 10 locales; docs/architecture/harness-adapter-compliance.md is itself test-enforced (tests/docs/harness-adapter-compliance.test.js — now 22 tests) |
| Performance | 55 | 55 | 55 | No perf/bench test files exist; mitigations are design-only: hook gating short-circuits via ECC_HOOK_PROFILE/ECC_DISABLED_HOOKS (scripts/lib/hook-flags.js:67-74), <200ms blocking-hook budget documented in .claude/rules/node.md |
| Security | 70 | 73 | 73 | c002: the security-gating parser (shell-substitution.js, consumers pre-bash-dev-server-block.js:10 / gateguard-fact-force.js:32) has direct hostile-input tests; supply-chain-watch.yml IOC tests; 0 hardcoded-secret grep hits in scripts/ |
| Reliability | 66 | 72 | 72 | c005: the 5 bash-requiring tests are capability-guarded (suite green in both PowerShell-with-broken-WSL-bash and Git Bash, skip-line grep 0 under working bash); completes the c001 pattern (EPERM symlink guards); 99 try/catch blocks across 30 scripts/lib files |
| Maintainability | 68 | 68 | 68 | Consistent lowercase-hyphen naming across scripts/; TODO debt near zero; the 3 stale c000 backlog facts corrected in-mission; but install-lifecycle.js 1226L / install-executor.js 738L still trend over the 800L cap, and 2 new characterized warts logged to Tech Debt (cursor prefix case-sensitivity, no-personal-paths 10s timeout flake) |
| Scalability | 74 | 74 | 74 | Registry-driven growth: manifest-based install (scripts/lib/install-manifests.js, 654L, tested), ADAPTER_RECORDS compliance matrix for 6+ harnesses (scripts/lib/harness-adapter-compliance.js:443), command-registry:generate/check scripts (package.json:331-333) |
| Developer experience | 71 | 74 | 74 | c005: clone-to-green in plain PowerShell sessions too (bash-runtime coupling removed; c001 removed the symlink wart); rich npm scripts: test/lint/coverage/3 doctors/audits (package.json:327-357); every test file standalone-runnable; 3 bin entries (package.json:322-326) |
| User experience | 62 | 62 | 62 | Operator CLI surface: npx ecc + postinstall guidance (package.json:328), install.sh/install.ps1, doctor/status dashboards; uninstall supports dry-run (tests/scripts/uninstall.test.js — passed in wrap-up runs) |
| UI consistency | n/a | n/a | n/a | CLI/toolkit repo — no GUI product surface in mission scope (terminal output only; ecc_dashboard.py is ancillary and out of goal) |
| Accessibility | n/a | n/a | n/a | No UI surface to assess (same evidence as UI consistency) |
| **Overall (mean)** | 68 | 71 | 71 | Mean of 11 scored categories (777/11 = 70.6 after c005); n/a rows excluded — values unbolded per skill template so night-shift-doctor's Number() cell parse reads them |

## Suite run capture (wrap-up, c005)

- Git Bash: `node tests/run-all.js` → Total 2719, Passed 2717, Failed 2; grep "skipped — working bash unavailable" over full output → 0 hits (guarded tests actually executed)
- PowerShell (broken WSL bash): same totals — 2717/2719, Failed 2 — with capability-guard skip lines logged in the 4 guarded files
- Both failures: tests/ci/codex-skill-surface.test.js ×2, caused by pre-existing untracked operator-generated `.agents/skills/source-command-*` dirs (quoted `name:` frontmatter, missing agents/openai.yaml) — out of mission scope, queued in mission.md ## Needs Human
- One transient observed and recorded: ci/no-personal-paths.test.js flaked once mid-run (hard 10s validator timeout under disk contention), did not reproduce on retry or standalone — Tech Debt Register

## Coverage-gap ground truth (final — corrects the c000 mechanical survey)

| Module | c000 claim | Final state |
|---|---|---|
| hook-flags.js (74L) | untested | Had dedicated test all along — tests/hooks/hook-flags.test.js:10-17 imports all 6 exports |
| harness-adapter-compliance.js (453L) | untested | **Fully covered c004** — tests/docs/harness-adapter-compliance.test.js now imports/exercises all 10 exports (22 tests) |
| github-discussions.js (159L) | untested | **Fully covered c003** — 38 tests, all 6 exported functions incl. ECC_GH_SHIM-driven fetchDiscussionSummary |
| shell-substitution.js (494L) | untested | **Fully covered c002** — 55 characterization tests incl. hostile inputs |
| cursor-agent-names.js (26L) | untested, 0 consumers | **Covered c004** (16 tests); consumer claim was wrong — 2 real consumers (install-executor.js:6, cursor-project.js:4) |
