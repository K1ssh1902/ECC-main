# Cycle 003

**Started:** 2026-07-10T04:44:11Z
**Selected:** P3 unit-test scripts/lib/github-discussions.js exported functions (159L; consumers import only the 2 query constants — 6 exported functions have no direct unit tests)
**Why now:** highest remaining backlog item after dispatch-consent resume; largest expected testing delta of the three open items
**Value gate:** est. testing +3 — passes (≥2 floor)

## Contract
- Change: new tests/lib/github-discussions.test.js unit-testing the module's exported surface — pure functions (splitRepo, discussionNeedsMaintainerTouch, discussionNeedsAcceptedAnswer, summarizeDiscussion, emptyDiscussionSummary) directly, and fetchDiscussionSummary via the repo's existing ECC_GH_SHIM idiom (tests/scripts/discussion-audit.test.js precedent); zero product-code changes
- Done means: new test file green standalone in the repo's sibling idiom (own Passed:/Failed: output); full `node tests/run-all.js` exit 0; guard watched failing once via a temporary deterministic module mutation (then restored, `git diff --stat scripts/` empty)
- Verify by: `node tests/lib/github-discussions.test.js` + full run-all + one mutation check, outputs captured
- Revert by: git revert of this cycle's commit

## Execution
- Mission resumed this session under granted dispatch consent (M2 continuation); `night-shift-doctor validate` → "Night Shift state is consistent", exit 0, before any work
- @tdd-guide (per delegation map) read the module + sibling idioms and wrote tests/lib/github-discussions.test.js: 38 tests — constants, splitRepo edge/hostile inputs, both discussion predicates incl. case-sensitivity characterization, summarize/empty shapes, and fetchDiscussionSummary end-to-end via the repo's existing ECC_GH_SHIM idiom (disabled path proves single shell-out; enabled path proves filtering; GITHUB_TOKEN stripping asserted). One file created; no existing file modified (git status verified)

## Verification (evidence, not claims)
- Orchestrator re-ran personally: `node tests/lib/github-discussions.test.js` → Passed: 38, Failed: 0, exit 0
- Mutation check, deterministic: appended `module.exports.discussionNeedsMaintainerTouch = () => false;` → **Failed: 6 of 38**, exit 1; `git checkout --` restore → 38/38; `git diff --stat scripts/` → empty (module byte-identical)
- Full suite under PowerShell → exit 1: 2685/2692, 7 failed — **all 7 proven independent of this change** (no failing suite references github-discussions; grep evidence):
  - 2× tests/ci/codex-skill-surface.test.js — caused by pre-existing untracked `.agents/skills/source-command-*` dirs (quoted `name:` frontmatter, missing agents/openai.yaml); present at session start, pre-date this cycle, operator territory per c000 decision log
  - 5× bash-dependent suites (codex-hooks ×2, observe-runner, plugin-hook-bootstrap, orchestrate-codex-worker EBUSY) — this session's PowerShell resolves `bash` to C:\Windows\system32\bash.exe (WSL) with no /bin/bash (`execvpe(/bin/bash) failed` captured); session PATH drift, not repo state
- Full suite re-run under Git Bash (working bash runtime): **2689/2691, Failed: 2** — the only failing suite is codex-skill-surface (operator dirs). Every test green at c002 remains green; 2653 + 38 = 2691 consistent
- Contract's "run-all exit 0" gate: not achievable in any environment this session solely because of the operator's untracked dirs — recorded as deviation with evidence, queued to Needs Human

## Verdict: KEPT
Score deltas: testing 73→75 (4th of the 5 coverage-gap modules now covered; all 6 exported functions of github-discussions unit-tested incl. shim-driven fetch path)
Commit: test: add unit suite for github-discussions module (38 tests) [night-shift cycle 003]
**Finished:** 2026-07-10T05:10:00Z
