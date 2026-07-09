# Cycle 002

**Started:** 2026-07-09T04:35:00Z
**Selected:** P2 add dedicated unit tests for scripts/lib/shell-substitution.js (494L, pure parser, zero test imports repo-wide; guards scripts/hooks/pre-bash-dev-server-block.js:10 and scripts/hooks/gateguard-fact-force.js:32)
**Why now:** highest actionable rung after c001; the one confirmed fully-untested scripts/lib module; security-adjacent
**Value gate:** est. testing +5, security +3 — passes

## Contract
- Change: new tests/lib/shell-substitution.test.js unit-testing the module's exported surface, including hostile/boundary shell strings (it feeds two security hooks); zero product-code changes
- Done means: new test file green standalone in the repo's sibling idiom (own Passed:/Failed: output); full `node tests/run-all.js` exit 0; the new guard watched failing once via a temporary module mutation (then restored)
- Verify by: `node tests/lib/shell-substitution.test.js` + full run-all + one mutation check, outputs captured
- Revert by: git revert of this cycle's commit

## Execution
- @tdd-guide (sonnet) read the module + both consumer hooks, explored actual behavior with scratch scripts (characterization — no guessed expectations), and wrote tests/lib/shell-substitution.test.js: 55 tests / 69 assertions in the utils.test.js harness idiom — common cases, recursion, quoting semantics per extractor, escapes/unterminated forms, hostile inputs (hidden rm -rf / dev-server commands in every substitution form, embedded-} truncation attack, ${...} out-of-scope, 5000-char body), and both consumers' exact call patterns. One file created; nothing else touched (git status verified)

## Verification (evidence, not claims)
- Orchestrator re-ran personally: `node tests/lib/shell-substitution.test.js` → Passed: 55, Failed: 0
- Mutation check, first attempt INEFFECTIVE (recorded honestly): a sed-based function rename never applied — tests stayed green because the module was unchanged, not because the guard is weak
- Mutation check, deterministic: appended `module.exports.extractCommandSubstitutions = () => [];` → **Failed: 15 of 55**; `git checkout --` restore → Passed: 55, Failed: 0; `git diff --stat scripts/` → empty (module byte-identical)
- Full suite: `node tests/run-all.js` → exit 0, Total 2653, Passed 2653, Failed 0 (2598 + 55 — consistent)

## Verdict: KEPT
Score deltas: testing 68→73 (last fully-untested lib module now covered, guard proven able to fail), security 70→73 (the parser gating two security hooks has hostile-input tests)
Commit: test: add characterization suite for shell-substitution parser (55 tests) [night-shift cycle 002]
**Finished:** 2026-07-09T05:05:00Z
