# Cleanup Report: ECC-main, 2026-11-12

Four unnecessary items were removed (90 tracked files, one leaked temp file, one empty
folder) and the full suite passes 2737 of 2737 afterwards. The baseline was 2738; the one
test that is gone checked a file inside the removed `.kiro/` folder. The larger finding is that most of
the token cost is not in repository files at all. It comes from what is installed and
hooked into every session, and those fixes are laid out step by step in
[CLEANUP-PLAN.md](CLEANUP-PLAN.md).

Audited on branch `night-shift/2026-07-09`. Nothing was committed or pushed, and nothing
outside this repository was changed.

## Naming note

The request called the repository "ISIS main". The repository is `ECC-main` (package
`ecc-universal`), and every output uses that name. The folder has also moved from
`Desktop/ECC-main` to `Desktop/Proyectos/ECC-main`, and one global hook still points at
the old location (finding T1 below).

## Removed

| Item | Size | Why it was unnecessary and safe to remove |
|---|---|---|
| `.kiro/` | 89 tracked files, 423,563 bytes | Adapter for AWS Kiro, which is not installed on this machine (no `~/.kiro`). It is not in the `package.json` `files` list, has no install target and no manifest entry. All 18 skills and 36 agents inside it have a canonical source in `skills/` and `agents/`. Its docs were surfacing as top hits in knowledge-graph queries about scripts and agents. |
| `tests/tmp-runner-plugin-1783274815478/` | 1 tracked file | Temp folder leaked by `tests/hooks/config-protection.test.js:286` and committed by accident. The test builds a fresh timestamped folder on every run and never reads this one. |
| `.tmp-validator-1784152700273-mko4gpxjnpq.js` | 1 ignored file, 6,204 bytes | Temp copy of a CI validator left behind by a killed test run in July. Already matched by the `.gitignore` rule added in `b7d9c68`. |
| `.playwright/` | empty folder | Untracked, empty, zero references. |

No agent or skill was deleted from the repository. Every one of the 64 agents and 253
skills is referenced by the install manifests, the catalog, or the docs, so deleting any
of them here would break the "referenced elsewhere" constraint. The saving for agents and
skills is in what gets installed, not in what the source repo holds (findings T3 and T4).

## Edited to match the removals

| File | Change |
|---|---|
| `tests/ci/agent-instruction-safety.test.js` | Removed the guardrail entry for `.kiro/skills/search-first/SKILL.md`. It was the only functional reference to `.kiro`, and its subject no longer exists. The other four entries are untouched and pass. |
| `docs/WORKSPACE-MAP.md` | Removed the `.kiro/` row. |

Mentions of `.kiro` that remain are not dependencies on the deleted folder:
`scripts/ci/scan-supply-chain-iocs.js:418` and `ecc2/src/session/mod.rs:103` detect a
`.kiro` folder in other projects, and the two `everything-claude-code/SKILL.md` copies
quote old commit titles.

## Looked unnecessary, kept on evidence

| Item | Size | Why it stays |
|---|---|---|
| Translated docs (`docs/ja-JP`, `zh-CN`, `tr`, `ko-KR`, `zh-TW`, `pt-BR`, `de-DE`, `ru`, `th`, `vi-VN`) | 1,250 files, about 7.9 MB | Shipped in `package.json` `files`, linked from the README, installed by the `--locale` option. They cost nothing until a search hits them. Fix by excluding them from search (plan step 8). |
| `.cursor/` | 67 files | Install target (`scripts/lib/install-targets/cursor-project.js`), covered by tests, and Cursor is installed on this machine. Its rule copies are being injected into Claude sessions by a plugin (finding T2), which is fixed in config, not by deleting the folder. |
| `.opencode/`, `.qwen/`, `.zed/` | 78, 1 and 1 files | Those tools are not installed here, but all three are install targets listed in `package.json` `files` and exercised by tests. Removing them is a product decision. |
| `.agents/`, `.codex/`, `.codex-plugin/`, `.gemini/` | 75, 5, 2 and 1 files | Codex and Gemini are set up on this machine (`~/.codex` and `~/.gemini` exist), and commit `ade1b49` added Codex skill scaffolds under `.agents/`. |
| `legacy-command-shims/` | 13 files | Documented compatibility archive, referenced from 9 files. |
| `ecc2/`, `src/`, `ecc_dashboard.py`, `integrations/`, `research/` | 47 files | Referenced by README, `pyproject.toml`, tests and docs. |
| `claude-code-automation/` | 12 tracked files | A VS Code extension project living inside the toolkit, referenced by `commands/chief.md` and two Chief Orchestrator docs. Relocation is an owner decision (plan step 9). |
| `devcoucou/` | untracked folder with its own `.git` | A separate project cloned inside the toolkit, against the workspace rule. It is a clean clone (nothing uncommitted, nothing ahead of its remote) of the same remote as `C:\dev\coucou`, at a newer commit. Not deleted because it is untracked here and therefore not recoverable from this repository. Owner decision (plan step 9). |
| `.night-shift/` | 7 files | Frozen by `PROJECT-STATE.md`. |
| `RULES.md` | 1 file | No file names it, but `agent.yaml` declares a gitagent export surface, and `RULES.md` is assumed to be read by that convention alongside `SOUL.md`. Assumed, not verified. |

## Where the tokens actually go

Token figures are estimates at about 4 bytes per token. Byte counts are measured.

| ID | Finding | Evidence | Cost |
|---|---|---|---|
| T1 | A global hook points at a path that no longer exists. | `~/.claude/settings.json`, `PostToolUse` hook for Write and Edit, runs `Desktop/ECC-main/scripts/hooks/run-with-flags.js`. That folder is gone; the repo is at `Desktop/Proyectos/ECC-main`. | The design-quality check never runs. The `ponytail` plugin is also registered against the old project path. |
| T2 | The same rules are loaded two or three times. | The oh-my-claudecode plugin's rules injector (`scripts/post-tool-rules-injector.mjs`) re-injects rules that Claude Code already loads natively. First file read of this session: 14,665 bytes from `.github/copilot-instructions.md` plus nine `.cursor/rules/common-*.md` files. On the first `.js` write and edit, the TypeScript rule set arrived three times (native, plugin from `~/.claude/rules`, plugin from `.cursor/rules`). | About 3,700 tokens on first read, more on first edit of each file type. |
| T3 | 253 ECC skills are installed, more than the `full` profile's 198. | `~/.claude/skills/ecc` holds 253 skill folders. The install-state file records only 56 of them (`node scripts/list-installed.js --target claude`), so `uninstall.js` cannot clean up the rest. | With about 590 skill and command entries in the session listing, most are shown by name only, without the description a model needs to pick the right one. |
| T4 | 63 agents are installed; 20 are for stacks with no project on this machine. | Agent descriptions total 12,682 characters. The 20 candidates (C++, C#, F#, Dart and Flutter, Django, Go, Java, Kotlin, HarmonyOS, healthcare, homelab and network) account for 3,999 of them. A marker-file scan of the projects under `C:\dev` found Node, Next.js and Python, and the coucou project adds Swift and Rust. Several projects there have no root marker file, so their stack is unknown. | About 3,200 tokens every session, of which about 1,000 are removable. |
| T5 | Web rules load in every session, including this non-web repo. | The seven files in `rules/web/` have no `paths:` frontmatter, unlike `rules/typescript/` and the other language folders. | 14,957 bytes, about 3,700 tokens per session. |
| T6 | Reminder lines are attached to every tool call. | The graphify guard in `.claude/settings.json` fires on every Bash, Grep, Read and Glob call. The oh-my-claudecode pre-tool enforcer (`scripts/pre-tool-enforcer.mjs`) adds a second line. | About 100 tokens per tool call. This audit made dozens of such calls. |
| T7 | The "Prompt Defense Baseline" block is loaded three times. | Identical six-bullet block in `CLAUDE.md`, `.claude/rules/everything-claude-code-guardrails.md` and `.claude/rules/node.md`. | About 500 tokens per session. |
| T8 | Always-loaded model guidance is out of date. | `rules/common/performance.md` names Haiku 4.5, Sonnet 4.6 and Opus 4.5 as the tiers to choose from. Current models are Haiku 5.5, Sonnet 5.5, Opus 5.5 and Fable 5.2. | Wrong model picks, not tokens. |

Three smaller observations:

- `agents/night-shift-assessor.md` exists in the repo but is not installed.
- `rules/common/git-workflow.md` says commit attribution is disabled in
  `~/.claude/settings.json`, but that file has no attribution setting.
- `npm test` fails at its first step, and did so before this session.
  `node scripts/ci/check-unicode-safety.js` exits 1 with 95 findings, none in a file this
  session touched: emoji in the program docs (`CODING-SESSIONS.md` 36,
  `NEXT-MILESTONES.md` 12, the CO certification doc 12, `MODEL-ASSIGNMENT.md` 4,
  `CHANGELOG.md` 1), a byte-order mark in three test fixtures, and 27 findings inside
  `devcoucou/` and `graphify-out/`, two folders that are not part of the repository but
  are still scanned.

## Legacy documentation

The legacy file is `rules/common/legacy.md` (no placeholder name was needed). It is now
v4, with a new section, "The Minimum Bar, per model":

- A shared floor for all models covering thinking, code, UI, mathematics, reports and safety.
- One section each for Haiku, Sonnet, Opus and Fable, with the same five headings in each:
  thinking, code, UI, mathematics, hand off.
- The three existing hyperlinks are unchanged. One link was added, to `../web/design-quality.md`.
- Existing em-dashes were replaced with other punctuation so the whole file is free of them.

Cost to know about: the file grew from 6,356 to 11,405 bytes, about 1,260 more tokens per
session once installed. It is not installed yet. The copy that sessions load lives at
`~/.claude/rules/ecc/common/legacy.md` and still holds v3 (plan step 2).

## Model names

Model names in the legacy file were checked against the Claude model reference bundled
with Claude Code (cached 2026-11-03). Two names from the request could not be verified
and were not used:

- "Haiku 4.0": the Haiku models are Haiku 5.5 and Haiku 4.5.
- "Opus 4.5.5": the Opus models are Opus 5.5, Opus 5, Opus 4.8, Opus 4.7, Opus 4.6 and Opus 4.5.

A model whose exact version is not listed follows its family's section.

## Verification

| Check | Result |
|---|---|
| Full suite before any change, `node tests/run-all.js` | 2738 passed, 0 failed |
| `node tests/ci/agent-instruction-safety.test.js` after the edit | 4 passed, 0 failed |
| `node tests/hooks/config-protection.test.js` after removing the leaked folder | 8 passed, 0 failed, no new temp folder left behind |
| `node scripts/ci/validate-rules.js` after the legacy edit | Validated 118 rule files |
| Full suite and validators after all changes | 2737 passed, 0 failed. Details in "Final run" below |

## Rollback

Everything removed from git can be restored until the change is committed (command not
executed in this session):

```bash
git restore --source=HEAD --staged --worktree .kiro tests/tmp-runner-plugin-1783274815478 \
  tests/ci/agent-instruction-safety.test.js docs/WORKSPACE-MAP.md rules/common/legacy.md
```

The ignored temp file and the empty `.playwright/` folder are not recoverable and do not
need to be.

## Final run

Run after every change in this report was in place.

| Check | Result |
|---|---|
| `node tests/run-all.js` | 2737 passed, 0 failed, exit 0. One fewer than the baseline: the removed `.kiro` guardrail check. |
| `validate-agents`, `validate-commands`, `validate-rules`, `validate-skills`, `validate-hooks`, `validate-install-manifests`, `validate-no-personal-paths` (all under `scripts/ci/`) | All exit 0: 64 agents, 81 commands, 118 rules, 253 skills, 28 hook matchers, 32 install modules |
| `node scripts/ci/catalog.js --text` | Documentation counts match the repository catalog |
| `node scripts/ci/generate-command-registry.js --check` | Command registry is up to date |
| `node scripts/harness-audit.js` | 80/80 |
| `markdownlint` on the four changed or new Markdown files | exit 0 |
| `graphify update .` | Rebuilt: 34,709 nodes (35,692 before the cleanup) |
| Leaked temp files after the run | None |

Not run: `npm run lint` across the whole repo, and `npm test` as a single command, which
stops at the unicode-safety step for the pre-existing reasons described above.
