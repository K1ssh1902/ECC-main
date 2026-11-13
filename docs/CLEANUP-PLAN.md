# Cleanup Plan: ECC-main

A step-by-step plan for an Opus session to finish the efficiency cleanup started on
2026-11-12. Findings and evidence are in [CLEANUP-REPORT.md](CLEANUP-REPORT.md); the
finding IDs (T1 to T8) used below come from that report.

The request named "Opus "5.5" as the executor. That is not a model name that could be
verified, so nothing here depends on the version: any Opus model can run it, and every
step is checklist-shaped enough for Sonnet too.

## Ground rules

1. Run the steps in order. Each step has one check. Do not start the next step until the
   check passes. If the "stop if" condition is met, run the rollback and report.
2. Steps marked **operator yes** change files outside this repository or are not
   recoverable from git. Ask for a yes in the current session before each one. A yes for
   one step does not carry to the next.
3. Do not commit, merge, or push without a yes. Do not edit `.night-shift/`. The rest of
   the forbidden list in [PROJECT-STATE.md](../PROJECT-STATE.md) still applies.
4. Do not delete a file that another file references. Search first; a zero-hit search is
   the only license to delete.
5. [MODEL-ASSIGNMENT.md](../MODEL-ASSIGNMENT.md) makes Sonnet the default builder for the
   HELIOS program. Steps marked **repo change** edit shipped files; if the operator wants
   that rule applied here, hand those steps to Sonnet and have Opus review.
6. Commands are written for Git Bash, the shell behind Claude Code's Bash tool.

## Step 0: Baseline

```bash
git status --short
node tests/run-all.js
node scripts/harness-audit.js
```

- **Check:** the suite ends with `Total Tests: 2737`, `Passed: 2737`, `Failed: 0`, and the
  audit prints `Harness Audit (repo, repo): 80/80`. (Before the 2026-11-12 cleanup the
  total was 2738; the removed test checked a file inside `.kiro/`.)
- **Stop if:** either number differs. Report the difference before changing anything.
- **Known and not yours to fix here:** `npm test` fails at its first step.
  `node scripts/ci/check-unicode-safety.js` exits 1 on emoji in the program docs, a
  byte-order mark in three fixtures, and files under `devcoucou/` and `graphify-out/`.
  That predates this cleanup. Use the two commands above as the baseline, and raise the
  unicode findings with the operator as a separate task. Step 9 removes the `devcoucou/`
  share of them.

## Step 1: Review and commit the first cleanup (operator yes)

The 2026-11-12 session left its work uncommitted: 90 staged deletions (`.kiro/` and one
leaked test folder), edits to `tests/ci/agent-instruction-safety.test.js`,
`docs/WORKSPACE-MAP.md` and `rules/common/legacy.md`, and the two new `docs/CLEANUP-*.md`
files.

```bash
git status --short
git diff --cached --stat | tail -1
```

- **Do:** stage only the files named above. These were already modified before that
  session and are not part of this commit: `.gitignore`, `CLAUDE.md`,
  `mcp-configs/mcp-servers.json`, `.claude/settings.json`, `devcoucou/`.
- **Suggested message:**

  ```text
  chore: remove unused Kiro adapter and leaked temp artifacts

  Removes .kiro/ (89 files, no installer target, tool not installed), a leaked
  tests/tmp-runner-plugin folder, and the matching guardrail entry and map row.
  Adds the per-model Minimum Bar to rules/common/legacy.md (v4) and the cleanup
  report and plan under docs/.

  <CO-AUTHOR-TRAILER>
  ```

- **Co-author placeholder:** `rules/common/git-workflow.md` says attribution is disabled
  in `~/.claude/settings.json`, but that file has no attribution setting, so Claude Code
  will still try to append its default trailer. Until the operator settles this, replace
  `<CO-AUTHOR-TRAILER>` with nothing. If the operator wants co-authors credited, the
  trailer goes on the last line of the commit message, after one blank line, in the form
  `Co-Authored-By: <name> <email>`. Do not add one on your own initiative.
- **Check:** `git status --short` shows only the five pre-existing entries listed above.

## Step 2: Install legacy v4 (operator yes)

Sessions load the installed copy, which still holds v3.

```bash
cp rules/common/legacy.md ~/.claude/rules/ecc/common/legacy.md
diff -q --strip-trailing-cr rules/common/legacy.md ~/.claude/rules/ecc/common/legacy.md
```

- **Check:** `diff` prints nothing. In a new session, the loaded rules include the heading
  "The Minimum Bar, per model".
- **Cost:** about 1,260 more tokens per session (the file grew from 6,356 to 11,405 bytes).
  Steps 4 and 5 recover several times that.
- **Rollback:** `git show HEAD~1:rules/common/legacy.md > ~/.claude/rules/ecc/common/legacy.md`
  (adjust the revision to the commit before step 1).

## Step 3: Fix the hook that points at the old folder (operator yes, T1)

This read-only check lists every script a global hook calls and whether it exists:

```bash
node -e 'const fs=require("fs"),os=require("os"),path=require("path");const s=JSON.parse(fs.readFileSync(path.join(os.homedir(),".claude","settings.json"),"utf8"));for(const [ev,arr] of Object.entries(s.hooks||{}))for(const h of arr)for(const hh of h.hooks||[]){const parts=String(hh.command||"").split(String.fromCharCode(34)).filter(x=>x.endsWith(".js")||x.endsWith(".mjs")||x.endsWith(".exe"));for(const f of parts)console.log(fs.existsSync(f)?"ok     ":"MISSING",ev,path.basename(path.dirname(f))+"/"+path.basename(f))}'
```

On 2026-11-12 it printed two `MISSING` lines, both in the `PostToolUse` hook whose
matcher is Write or Edit: `hooks/run-with-flags.js` and `hooks/design-quality-check.js`.

- **Do:** in `~/.claude/settings.json`, in that one hook command, replace both
  occurrences of `OneDrive/Desktop/ECC-main/` with `OneDrive/Desktop/Proyectos/ECC-main/`.
  Change nothing else in the file.
- **Check:** rerun the command above; no line starts with `MISSING`.
- **Also:** `ponytail@ponytail` is registered at project scope under the old folder path
  (`~/.claude/plugins/installed_plugins.json`) while `.claude/settings.json` enables it.
  Run `/plugin` and confirm whether it is active. If not, reinstall it from the current
  folder or remove the `enabledPlugins` entry.
- **Rollback:** restore the two path strings.

## Step 4: Stop duplicate rule injection and per-call reminders (operator yes, T2, T6)

The oh-my-claudecode plugin re-injects rules Claude Code already loads and adds a
reminder line to every tool call. Its source honors one switch for both
(`scripts/pre-tool-enforcer.mjs` and `scripts/post-tool-rules-injector.mjs` in the plugin
folder): the environment variable `OMC_SKIP_HOOKS`.

- **Do:** add this to `.claude/settings.json` in this repository (project scope, so other
  projects are unaffected):

  ```json
  "env": { "OMC_SKIP_HOOKS": "pre-tool-use,post-tool-use" }
  ```

- **Trade-off:** `post-tool-use` also silences the plugin's "verify your change" reminders
  after edits. The delivery standard already requires that verification.
- **Check:** in a new session, read one file and run one Bash command. The tool results
  carry no `[Rule: .cursor\rules\...]` block and no "Use parallel execution" line.
- **Not yet proven:** the switch was read in the plugin source, not exercised. If the
  blocks still appear, the variable is not reaching the hook process; move the `env`
  entry to `~/.claude/settings.json` and test again.
- **Decide separately:** the graphify guard in the same file adds a "MANDATORY" line to
  every Bash, Grep, Read and Glob call. `CLAUDE.md` already carries the graphify rule.
  Recommended: remove the two `hook-guard` entries and keep the `CLAUDE.md` section. The
  operator added the guard on purpose, so ask first.
- **Rollback:** delete the `env` entry.

## Step 5: Load web rules only for web files (repo change, T5)

The seven files in `rules/web/` have no `paths:` frontmatter, so they load in every
session. `rules/typescript/coding-style.md` shows the shape to copy.

- **Do:** add this block as the first lines of each file in `rules/web/`, above the
  existing "This file extends" line:

  ```yaml
  ---
  paths:
    - "**/*.html"
    - "**/*.css"
    - "**/*.scss"
    - "**/*.tsx"
    - "**/*.jsx"
    - "**/*.vue"
    - "**/*.svelte"
    - "**/*.astro"
  ---
  ```

- **Check:**

  ```bash
  node scripts/ci/validate-rules.js
  node tests/run-all.js
  ```

  Expect `Validated 118 rule files` and the step 0 totals.
- **Then (operator yes):** `cp -r rules/web ~/.claude/rules/ecc/`. In a new session in
  this repository, the loaded rules no longer include the `web/` files until a matching
  file is touched.
- **Saving:** 14,957 bytes, about 3,700 tokens, in every non-web session.
- **Stop if:** any test pins the first line of a web rule file. Revert with
  `git checkout -- rules/web` and report which test.

## Step 6: Park agents for stacks that are not in use (operator yes, T4)

Twenty installed agents cover stacks with no project evidence on this machine. Their
descriptions are 32 percent of the agent listing loaded into every session.

- **Before moving anything:** several projects under `C:\dev` have no root marker file.
  Ask the operator to confirm none of them uses C++, C#, F#, Dart or Flutter, Django, Go,
  Java, Kotlin or HarmonyOS, and that the healthcare, homelab and network agents are not
  wanted.
- **Do:** move, never delete.

  ```bash
  mkdir -p ~/claude-disabled/agents
  for a in cpp-build-resolver cpp-reviewer csharp-reviewer dart-build-resolver \
    django-build-resolver django-reviewer flutter-reviewer fsharp-reviewer \
    go-build-resolver go-reviewer harmonyos-app-resolver healthcare-reviewer \
    homelab-architect java-build-resolver java-reviewer kotlin-build-resolver \
    kotlin-reviewer network-architect network-config-reviewer network-troubleshooter; do
    mv ~/.claude/agents/$a.md ~/claude-disabled/agents/
  done
  ls ~/.claude/agents | wc -l
  ```

- **Check:** the count drops from 63 to 43, and a new session's agent list no longer
  shows the parked names.
- **Leave alone unless the operator says otherwise:** `fastapi-reviewer`,
  `pytorch-build-resolver` and `mle-reviewer`. Python projects exist, and their
  dependencies were not inspected.
- **Follow-up:** `rules/common/agents.md` (always loaded) lists `harmonyos-app-resolver`
  in its table. If that agent is parked, remove its row in the repo and reinstall the file.
- **Rollback:** move the files back.

## Step 7: Reinstall ECC skills from a profile (operator yes, T3)

253 skill folders sit in `~/.claude/skills/ecc`, but the install-state file knows about
only 56, so `scripts/uninstall.js` cannot remove the rest. Replace the folder with a
profile install in a single invocation, so the state file matches reality.

1. Dry run. This command was executed on 2026-11-12 and resolved to 618 operations and
   87 skills:

   ```bash
   node scripts/install-apply.js --target claude --profile developer \
     --with lang:typescript --with lang:python --with lang:swift --with lang:rust \
     --with framework:react --with framework:nextjs \
     --with skill:night-shift --with skill:chief-orchestrator --dry-run
   ```

2. Show the operator the current 56 recorded skills
   (`node scripts/list-installed.js --target claude`) and the component list
   (`node scripts/install-plan.js --list-components`). Add one `--with skill:<id>` for
   each skill they still want. Use one invocation only. The state file lists just the
   56 skill modules from a selective run on 2026-08-22, which suggests a later run
   replaces the recorded state instead of adding to it (inferred, not tested).
3. Park the old folder, then install without `--dry-run`:

   ```bash
   mkdir -p ~/claude-disabled
   mv ~/.claude/skills/ecc ~/claude-disabled/skills-ecc-2026-11-12
   ```

4. **Check:**

   ```bash
   node scripts/list-installed.js --target claude
   node scripts/doctor.js --target claude
   ls ~/.claude/skills/ecc | wc -l
   ```

   The profile reads `developer`, doctor reports no drift, and the folder count matches
   the dry run.

- **Stop if:** the install reports an error or doctor reports missing managed files.
  Move the parked folder back and report.
- **Note:** the install also rewrites `~/.claude/rules/ecc`, agents and commands from the
  repo. Run it after steps 2, 5 and 6 are committed so it does not undo them, then repeat
  the step 6 move if the parked agents came back.
- **Expected effect:** about 165 fewer skill entries in each session's listing (253 down
  to 87), which leaves room for descriptions on the ones that remain.

## Step 8: Keep searches out of bulk content (repo change)

Ten translated doc trees (1,250 files, about 7.9 MB) and the adapter copies of skills
multiply every search hit and crowd knowledge-graph results.

- **Do:** create `.ignore` in the repo root:

  ```text
  # Keeps agent searches out of bulk content. Explicit paths still search these.
  docs/ja-JP/
  docs/zh-CN/
  docs/zh-TW/
  docs/ko-KR/
  docs/pt-BR/
  docs/tr/
  docs/de-DE/
  docs/ru/
  docs/th/
  docs/vi-VN/
  devcoucou/
  ```

  Create `.graphifyignore` with the same lines plus `.agents/`, `.cursor/` and
  `.opencode/`, then run `graphify update .`.
- **Check:** a Grep for `the-shortform-guide` with no path returns no hit under
  `docs/ja-JP`, and `graphify query "which scripts implement the installer"` lists nodes
  from `scripts/`, not from adapter folders. Then run `node tests/run-all.js`.
- **Verified on 2026-11-12:** in a scratch folder, the Grep tool skipped a folder listed
  in `.ignore` on a broad search and still searched it when given its path explicitly.
- **Stop if:** Grep still returns translated hits, or any test fails. Delete the two
  files and report.
- **Rollback:** delete the two files and rerun `graphify update .`.

## Step 9: Move the nested projects out (operator yes)

- **`devcoucou/`:** an untracked clone with its own `.git`, at commit `341b86a`, with
  nothing uncommitted and nothing ahead of its remote. `C:\dev\coucou` is the same remote
  at an older commit (`835421c`) and has one uncommitted entry. Recommended: resolve that
  entry, `git -C /c/dev/coucou pull`, confirm the two HEADs match, then delete
  `devcoucou/` from this repository. It is not recoverable from this repository's git,
  so delete only on an explicit yes.
- **`claude-code-automation/`:** a VS Code extension project with 12 tracked files,
  referenced by `commands/chief.md`, `docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md` and
  `docs/architecture/chief-orchestrator-integration-certification.md`. Keep it unless the
  operator wants it under `C:\dev\`. Moving it means updating those three references in
  the same change.
- **Check:** `git status --short` no longer lists `devcoucou/`.

## Step 10: Load the Prompt Defense Baseline once (repo change, T7)

The same six-bullet block is in `CLAUDE.md`, `.claude/rules/everything-claude-code-guardrails.md`
and `.claude/rules/node.md`, so each session reads it three times.

- **Do:** delete the block from the two `.claude/rules/` files. Leave `CLAUDE.md` alone;
  it has uncommitted operator edits.
- **Check:** `node scripts/harness-audit.js` still prints `80/80`, and
  `node tests/run-all.js` matches step 0.
- **Stop if:** the audit score drops. Something scores the block per file; restore with
  `git checkout -- .claude/rules`.
- **Note:** the guardrails file says it is generated by ECC Tools. A regeneration may put
  the block back.

## Step 11: Fix the cause of the leaked temp files (repo change)

Two tests create temp files inside the repository and rely on a `finally` block to remove
them. A killed run skips the cleanup, which is how the two artifacts removed on
2026-11-12 came to exist.

- `tests/hooks/config-protection.test.js:286` builds `tests/tmp-runner-plugin-<timestamp>`.
- `tests/ci/validators.test.js` writes `.tmp-validator-*.js` in the repo root.

- **Do:** move the first one under the system temp folder (`fs.mkdtempSync` with
  `os.tmpdir()`). For the second, read why the validator copy has to sit in the repo
  (it resolves paths from its own location) before moving it; if it must stay, leave it
  and keep the existing `.gitignore` rule.
- **Check:** both test files pass, and `git status --short` is unchanged after a run.

## Step 12: Refresh the model guidance (repo change, operator wording, T8)

`rules/common/performance.md` is loaded in every session and names Haiku 4.5, Sonnet 4.6
and Opus 4.5 as the tiers to choose between. The current models are Haiku 5.5,
Sonnet 5.5, Opus 5.5 and Fable 5.2.

- **Do:** ask the operator how they want the tiers described, then update the "Model
  Selection Strategy" section. Use only model names from the Claude model reference; do
  not carry over the capability and cost percentages unless they can be sourced.
- **Check:** `node scripts/ci/validate-rules.js`, then reinstall the file as in step 2.

## Step 13: Final verification and report

```bash
node tests/run-all.js
node scripts/harness-audit.js
node scripts/doctor.js --target claude
git status --short
```

Report in this order: the outcome in one sentence; which steps ran and which were skipped
and why; each check with its actual output; any failure with the exact error; what
remains for the operator.

## Recommended additions

| Addition | Where | Why | Step |
|---|---|---|---|
| `paths:` frontmatter on web rules | `rules/web/*.md` | Stops about 3,700 tokens loading in non-web sessions | 5 |
| `OMC_SKIP_HOOKS` env entry | `.claude/settings.json` | Ends duplicate rule injection and per-call reminders | 4 |
| `.ignore` and `.graphifyignore` | repo root | Keeps translations and adapter copies out of searches | 8 |
| `night-shift-assessor` agent | `~/.claude/agents/` | Exists in `agents/` but is not installed; install it only if NightShift assessments are wanted | 7 |

## Not recommended now

Removing the adapters for tools that are not installed here (`.opencode/`, `.qwen/`,
`.zed/`). They are install targets shipped in `package.json` `files` and covered by
tests, so removing one means changing the installer, the manifests, the tests and the
README together. That is a product decision about which tools this toolkit supports, and
none of those folders costs tokens once step 8 is done.
