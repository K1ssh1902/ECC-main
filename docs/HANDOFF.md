# HANDOFF — continuing work on ECC-main

> Written 2026-07-11 for the next engineer or model. Read [PROJECT-STATE.md](../PROJECT-STATE.md)
> (repo root) first — it is the authoritative snapshot; this file tells you how to continue.
> No feature work is in flight; what remains is administrative closure plus a decided-but-not-started
> next milestone.

## Project purpose

`ecc-universal` (v2.0.0-rc.1) is a Claude Code **toolkit**: production agents, skills, slash commands, hooks, rules, MCP configs, and cross-platform Node.js scripts. It is installed into other projects; it is **not a workspace** — never create apps, sites, or experiments inside it (they go in `C:\dev\<name>`).

On top of the toolkit, this machine runs a two-layer autonomy stack that is the active workstream:

- **NightShift** — an autonomous improvement-mission protocol (cycles, journal, scorecard) driven by `/night-shift` and read via `scripts/night-shift-doctor.js`.
- **Chief Orchestrator (CO)** — a portfolio control plane above NightShift (`/chief`, `scripts/orchestrator-doctor.js`, state in `~/.claude/orchestrator/`). Design: `docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md`. Certified v1.0.0-rc.1: `docs/architecture/chief-orchestrator-integration-certification.md`.

Milestone names (M2, M3, B1–B3, O1) come from `C:\dev\helios\HELIOS-IMPLEMENTATION-ROADMAP.md`, **not** from `docs/ECC-2.0-GA-ROADMAP.md` (that file mirrors the upstream `affaan-m/ECC` Linear project and is not this fork's plan).

## Architecture overview

```
Chief Orchestrator (~/.claude/orchestrator/: portfolio.md, missions/, reports/)
        │  writes: /night-shift CLI args only
        │  reads:  night-shift-doctor --json / orchestrator-doctor --json  ← "Mode Doctor Contract"
        ▼
NightShift (FROZEN subsystem — .night-shift/: mission.md, scorecard.md, journal/)
        ▼
ECC toolkit repo (agents/ skills/ commands/ hooks/ rules/ scripts/ tests/)
```

Load-bearing invariants:

- **NightShift is frozen.** No layer edits `.night-shift/` except the NightShift protocol itself; the current mission is *closed*, so nothing should edit it at all.
- **The Mode Doctor Contract** is the CO's only telemetry read surface. It is pinned by `tests/scripts/mode-doctor-contract.test.js` against real captured outputs in `tests/fixtures/mode-doctor-captures/`. Any change to the doctors' JSON field sets, types, exit codes, or failure text is a contract change and fails that suite **by design**.
- Repo conventions: CommonJS only, Node ≥18, lowercase-hyphen filenames, hooks route through `scripts/hooks/run-with-flags.js` and exit 0 on non-critical errors (`.claude/rules/node.md`). Tests mirror `scripts/` structure and are standalone-runnable.
- Environment-coupled tests are **capability-guarded** (Windows symlink EPERM, working-bash probe) — they skip only when the capability is truly absent, and run for real under Git Bash.

## Current state (verified 2026-07-11)

- Branch: `night-shift/2026-07-09`, HEAD `ddd53dd`, **7 test-only commits ahead of `main`** (`main` has nothing the branch lacks). Not merged, not pushed — awaiting operator review.
- **M2 (first supervised NightShift mission): complete.** 5/5 cycles KEPT, scorecard overall 68→71 (testing 62→77). Full record in `.night-shift/`.
- **M3 (Mode Doctor Contract test): written and passing 19/19** — but **untracked**, along with its fixtures. This is the most fragile thing in the repo right now.
- Full suite: 2736/2738 (verified 2026-07-11; the M2 wrap-up capture was 2717/2719 in both PowerShell and Git Bash — the delta is the 19 auto-discovered M3 tests). The only 2 failures are `tests/ci/codex-skill-surface.test.js` rejecting the pre-existing untracked `.agents/skills/source-command-*` dirs (quoted `name:` frontmatter, missing `agents/openai.yaml`) — a known, out-of-scope operator item, not a regression.
- CO doctors both exit 0 on this machine. On a fresh machine `orchestrator-doctor` exits 1 with "No orchestrator state" — that is expected until first `/chief` run, not a bug.

## Next milestone instructions

The next milestone is administrative closure, in this order:

1. **Commit the M3 artifacts** (operator consent required — do not do this unprompted):
   `tests/fixtures/mode-doctor-captures/` and `tests/scripts/mode-doctor-contract.test.js`, message style `test: add mode-doctor-contract suite from banked M2 captures [M3]`.
2. **Operator reviews branch `night-shift/2026-07-09`** → merge into `main` or decline. All evidence for the review is in `.night-shift/journal/cycle-00[1-5].md` and the scorecard.
3. **Resolve `.agents/skills/source-command-*`** (operator decision): fix frontmatter + add `agents/openai.yaml`, regenerate, or delete. This is the sole blocker for a clean full-suite exit 0.
4. **Decide CO promotion** rc.1 → v1.0.0: the certification's promotion condition (first real supervised mission) is met; open question is whether untested O1 (headless `claude -p` slash-command expansion) gates promotion or moves to B3's scheduled-run work.

After closure, the decided-but-not-started engineering lanes (each gated by a human decision — see roadmap records E3/E4/E5):
- **B3** headless permission allowlists — before any scheduled run.
- **B1** scheduler adapter (mechanism choice is a human decision) — before autonomous dispatch.
- **B2** cost telemetry — before budget enforcement.
- Recommended next *NightShift mission* (do not start ad hoc): split `scripts/lib/install-lifecycle.js` (1226L > 800L cap) with characterization-first cycles.

## Testing commands

```bash
node tests/run-all.js                                     # full suite; expect 2736/2738 (2 known failures, see above)
node tests/scripts/mode-doctor-contract.test.js           # M3 contract; expect 19/19
node tests/lib/shell-substitution.test.js                 # any test file runs standalone
npm run lint                                              # eslint flat config
npx markdownlint-cli '**/*.md' --ignore node_modules      # before committing markdown
node scripts/night-shift-doctor.js status --dir . --json  # exit 0
node scripts/orchestrator-doctor.js status --json         # exit 0 here; exit 1 on fresh machine = expected
```

Run the suite in Git Bash at least once if you touched capability-guarded tests — under Git Bash the guards must **not** skip (grep for "skipped — working bash unavailable" should hit 0).

## Common mistakes to avoid

- **Rebuilding M3.** `~/.claude/orchestrator/reports/2026-07-10.md` and older notes list M3 as "next". It is DONE (untracked). Check `git status` / run the test before writing anything.
- **Recapturing fixtures.** `tests/fixtures/mode-doctor-captures/README.md` claims the healthy nightshift status/metrics captures are "still missing" — stale; the three `2026-07-10-*.json` files are exactly those captures.
- **"Fixing" the 2 codex-skill-surface failures in the test.** The test is correct; the untracked skill dirs are invalid. Fix/regenerate/delete the dirs (operator decision), never loosen the test.
- **Editing doctor JSON output** (adding a field counts) without treating it as a contract change — the M3 suite will fail; that is the point.
- **Editing `.night-shift/`** — closed mission, frozen subsystem, historical evidence.
- **Fixing `toCursorAgentFileName`** (`scripts/lib/cursor-agent-names.js`) as a drive-by: its double-prefix/case-sensitivity warts are characterized in tests and it has 2 real install-path consumers. Public-contract change; needs its own scoped task. (An older claim that it was dead code was wrong — see scorecard "coverage-gap ground truth".)
- **Treating `docs/ECC-2.0-GA-ROADMAP.md` as the plan.** It's upstream Linear-mirror content; the plan is the HELIOS roadmap in `C:\dev\helios`.
- **Bolding scorecard numbers** in night-shift scorecards — `night-shift-doctor`'s cell parser reads `**68**` as NaN. Mission-state vocabulary for orchestrator-doctor is `done`, not `complete`.
- **Merging/pushing/rewriting the mission branch without explicit current-session operator consent.**
- **Creating new projects in this repo** — `C:\dev\<name>` only.

## Files that must never be regenerated

- `.night-shift/mission.md`, `.night-shift/scorecard.md`, `.night-shift/journal/*` — closed-mission evidence.
- `tests/fixtures/mode-doctor-captures/*.json` — verbatim live doctor outputs captured during M2; they are the contract's ground truth and cannot be re-derived (the states that produced them no longer exist).
- `docs/architecture/chief-orchestrator-integration-certification.md` — a dated certification record.
- `~/.claude/orchestrator/reports/*` — dated portfolio reports (outside the repo, same rule).
- The 7 mission commits on `night-shift/2026-07-09` — review them; never recreate or squash-rewrite them.

## Acceptance criteria for the next milestone (closure)

- [ ] `git status --short` no longer lists `tests/fixtures/` or `tests/scripts/mode-doctor-contract.test.js` (committed, not deleted), and `node tests/scripts/mode-doctor-contract.test.js` still passes 19/19 from the committed state.
- [ ] Operator has recorded an explicit merge-or-decline decision on `night-shift/2026-07-09`; if merged, `node tests/run-all.js` on `main` reproduces the 2736/2738 result (or 2738/2738 once item below lands).
- [ ] The `.agents/skills/source-command-*` situation is resolved by operator choice and `node tests/run-all.js` exits 0 with **zero** failures.
- [ ] A written decision exists on O1 vs v1.0.0 promotion (in the CO architecture doc's decision log or a dated report).
- [ ] No changes under `scripts/` (doctors included) unless the mode-doctor-contract suite was updated as a deliberate, called-out contract change.
