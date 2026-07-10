# Cycle 004

**Started:** 2026-07-10T05:14:00Z
**Selected:** P3 extend harness-adapter-compliance coverage to its 6 unimported exports, batched with P4 cursor-agent-names.js small test (batch-trivia rule — P4 alone is below the value floor)
**Why now:** highest actionable backlog rung after c003; batching clears the entire remaining c000 coverage-gap backlog in one cycle
**Value gate:** combined est. testing +2..3 — passes (≥2 floor)

## Contract
- Change: extend tests/docs/harness-adapter-compliance.test.js to cover the 6 currently-unimported exports (COMPLIANCE_STATES, MATRIX_BLOCK_START, MATRIX_BLOCK_END, REQUIRED_FIELDS, renderStateTable, validateDocumentation); new tests/lib/cursor-agent-names.test.js for both exports (toCursorAgentFileName, toCursorAgentRelativePath). Zero product-code changes; no public contract or doctor JSON touched
- Done means: both test files green standalone; full `node tests/run-all.js` under Git Bash shows no new failures vs the c003 baseline (2689/2691, only pre-existing codex-skill-surface ×2); each new guard watched failing once via a temporary deterministic module mutation (then restored)
- Verify by: targeted node runs of both files + full run-all under Git Bash + mutation checks, outputs captured
- Revert by: git revert of this cycle's commit

## Execution
- @tdd-guide (per delegation map) extended tests/docs/harness-adapter-compliance.test.js (+157 lines, 12 new tests appended — existing 10 untouched) covering COMPLIANCE_STATES, both matrix markers, REQUIRED_FIELDS, renderStateTable, and validateDocumentation (green path against the real doc + synthetic failure paths incl. ENOENT and marker-order edge cases), and created tests/lib/cursor-agent-names.test.js (16 tests) in the utils.test.js idiom
- Characterized (not fixed): toCursorAgentFileName does NO sanitization and its `ecc-` prefix check is case-sensitive ('ECC-Agent.md' → 'ecc-ECC-Agent.md'); falsy input passes through unchanged; toCursorAgentRelativePath collapses duplicate separators and drops empty trailing segments; renderStateTable takes no parameters

## Verification (evidence, not claims)
- Orchestrator re-ran personally: harness-adapter-compliance.test.js → Passed: 22, exit 0; cursor-agent-names.test.js → Passed: 16, Failed: 0, exit 0
- Mutation checks, deterministic, one per module: `renderStateTable = () => ''` → Failed: 1, exit 1; `toCursorAgentFileName = (n) => n` → Failed: 4, exit 1; both restored via `git checkout --`, `git diff --stat scripts/` → empty
- Full suite under Git Bash: **2717/2719, Failed: 2** — only tests/ci/codex-skill-surface.test.js (the pre-existing operator-dir failures from c003's Needs Human entry); arithmetic consistent (2691 + 12 + 16 = 2719); contract's "no new failures vs c003 baseline" met

## Verdict: KEPT
Score deltas: testing 75→77 (all 5 c000 coverage-gap modules now have dedicated tests; remaining backlog is hardening, not gaps)
Commit: test: cover harness-adapter-compliance remaining exports and cursor-agent-names [night-shift cycle 004]
**Finished:** 2026-07-10T05:24:00Z
