# Cycle 005

**Started:** 2026-07-10T05:28:00Z
**Selected:** P5 guard the bash-dependent test files behind a working-bash capability probe (c001 symlink-guard precedent) — final budgeted cycle
**Why now:** only remaining actionable backlog item; removes the session-environment coupling found in c003 (PowerShell resolves `bash` to WSL's System32 stub with no /bin/bash → 4 suites hard-fail: codex-hooks ×2, continuous-learning-observe-runner, plugin-hook-bootstrap, orchestrate-codex-worker EBUSY)
**Value gate:** est. reliability +2, DX +1 — passes (≥2 floor)

## Contract
- Change: the tests in tests/scripts/codex-hooks.test.js, tests/hooks/continuous-learning-observe-runner.test.js, tests/hooks/plugin-hook-bootstrap.test.js, tests/scripts/orchestrate-codex-worker.test.js that require a WORKING bash probe capability first (`bash -c 'exit 0'` succeeds) and skip cleanly with a logged "(skipped — working bash unavailable)" line where it fails; fail-open tests that deliberately exercise the no-shell path stay unguarded; no product code, no public contract, no doctor JSON touched
- Done means: in this PowerShell session (broken WSL bash), targeted runs of all 4 files exit 0 with skips logged, and full `node tests/run-all.js` shows Failed: 2 (only the pre-existing codex-skill-surface operator-dir failures); under Git Bash (working bash), full suite unchanged at 2717/2719 with the guarded tests actually executing (no skips)
- Verify by: targeted PowerShell runs of the 4 files + full run-all in both environments, before/after outputs captured
- Revert by: git revert of this cycle's commit

## Execution
- @build-error-resolver (per delegation map, same agent class as c001) added a per-file working-bash probe (`spawnSync('bash', ['-c', 'exit 0'])`, working = no error AND status 0) and guarded exactly the 5 bash-requiring tests across the 4 files; diff +32/−0, test files only. Deliberately left unguarded: the fail-open tests that force `BASH:'' PATH:''` (they exercise the no-shell path by design) and the win32-skipped quoted-paths test. In orchestrate-codex-worker the guard sits before `mkdtempSync`, so the WSL-relay EBUSY-on-cleanup race can't occur on broken-bash machines

## Verification (evidence, not claims)
- Orchestrator re-ran everything personally in BOTH environments:
- PowerShell (broken WSL bash): all 4 targeted files exit 0 with "(skipped — working bash unavailable)" logged (codex-hooks 12/0, observe-runner 5/0, plugin-hook-bootstrap 10/0, orchestrate-codex-worker 1 passed/0 failed)
- Full suite, PowerShell: **2717/2719, Failed: 2** — only pre-existing codex-skill-surface (operator dirs). The 5 bash hard-fails from c003's baseline are gone
- Full suite, Git Bash: **2717/2719, Failed: 2**, and grep for the skip line over the full output → 0 hits — guards do NOT skip when bash works; the guarded tests actually executed
- Transient noted honestly: one intermediate PowerShell run-all flagged ci/no-personal-paths.test.js (its "real repository" test runs the validator with a hard 10s execFileSync timeout — under full-suite disk contention + OneDrive it can exceed it); did not reproduce on retry or standalone (7/7), unrelated to this cycle's diff — logged to Tech Debt
- `git diff --stat` → exactly the 4 test files, +32/−0; scripts/ untouched

## Verdict: KEPT
Score deltas: reliability 70→72 (suite no longer coupled to which bash the session PATH resolves; c001 pattern completed for the bash runtime), developer experience 73→74 (clone-to-green in plain PowerShell sessions)
Commit: test: guard bash-dependent tests behind a working-bash capability probe [night-shift cycle 005]
**Finished:** 2026-07-10T05:52:00Z
