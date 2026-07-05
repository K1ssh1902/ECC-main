# Workspace Map — What Every Folder Is For

> Plain-language guide to this repository, written for Viren. Last audited: 2026-07-05.
> **Golden rule: ECC-main is the toolkit, not a workspace. New websites, apps, bots, and
> experiments live in their own folders under `C:\dev\` — never in here.** See `C:\dev\README.md`
> for the exact steps to start a new project.

## The core (this is the product)

| Folder | What it is |
|--------|-----------|
| `agents/` | Subagent definitions (planner, code-reviewer, security-reviewer…). Markdown + YAML frontmatter. |
| `skills/` | Skill definitions — the "how-to" playbooks slash commands and agents draw on. |
| `commands/` | Slash commands (`/tdd`, `/plan`, `/code-review`…). One markdown file each. |
| `hooks/` | Hook configurations — automations that fire before/after tools or at session events. |
| `rules/` | Source of the always-on rules. `rules/common/` + language dirs. Installed copies live at `~\.claude\rules\ecc\` — **edit here, reinstall to apply globally**. |
| `scripts/` | Node.js utilities: the installer (`install-apply.js`), hook runtimes, helpers (`scripts/lib/`). |
| `tests/` | Test suite. Run `node tests/run-all.js` before committing changes to scripts or hooks. |
| `mcp-configs/` | Template configs for MCP servers (external tool integrations). |

## Supporting material

| Folder | What it is |
|--------|-----------|
| `docs/` | Guides and architecture docs. Language subfolders (`ja-JP/`, `zh-CN/`…) are translations — ignorable. |
| `examples/` | Sample CLAUDE.md files per stack, statusline config, GAN-harness demo. Copy-paste material. |
| `assets/` | Images for the README (hero, icons). Nothing functional. |
| `manifests/` | JSON lists defining what the installer can install (components, modules, profiles). |
| `schemas/` | JSON Schemas that validate the manifests, hooks, and plugin configs. |
| `config/` | `project-stack-mappings.json` — how `/project-init` detects a project's stack. |
| `contexts/` | Context presets (`dev`, `research`, `review`) that tune session behavior. |
| `integrations/` | Adapters to other systems (currently `aura`, Python). |
| `legacy-command-shims/` | Retired command entry points kept for backwards compatibility. Archive — don't extend. |
| `research/` | Internal analysis notes (currently one doc about `ecc2`). |

## Experimental / next-gen

| Folder | What it is |
|--------|-----------|
| `ecc2/` | Rust rewrite prototype of ECC (Cargo project). Experimental. |
| `src/` | Python multi-model LLM router (`src/llm/`) — providers for Claude, OpenAI, Ollama, Astraflow. Powers the `multi-plan` / `multi-execute` / `multi-workflow` skills. |
| `ecc_dashboard.py` | Standalone Python dashboard for ECC metrics. |

## Adapters for other AI tools (dot-folders)

These let the same agents/skills work in tools other than Claude Code. Harmless to keep; only
delete one if you're certain you'll never use that tool.

| Folder | Tool |
|--------|------|
| `.claude/` | Claude Code project-local config (settings, project rules, skills). |
| `.claude-plugin/` | Claude Code plugin/marketplace manifest. |
| `.agents/` | Generic cross-tool agent catalog (includes `openai.yaml` per skill). |
| `.codex/` | OpenAI Codex CLI adapter. |
| `.cursor/` | Cursor IDE adapter. |
| `.kiro/` | AWS Kiro adapter (agents, steering, hooks). |
| `.opencode/` | OpenCode engine adapter (has its own `node_modules` — gitignored). |
| `.vscode/` | VS Code editor settings (one `settings.json`). |
| `.github/` | GitHub Actions CI workflows for this repo. |

## Root files worth knowing

- `CLAUDE.md` — instructions Claude Code loads for THIS repo.
- `AGENTS.md` / `agent.yaml` / `SOUL.md` — cross-tool identity + export surface of the plugin.
- `README.md` — the full public documentation (large; `COMMANDS-QUICK-REF.md` is the short version).
- `.env` — local secrets (gitignored). **Never paste its contents into chat.** `.env.example` is the safe template.
- `install.ps1` / `install.sh` + `manifests/` — how ECC gets installed into `~/.claude/`.
- `VERSION`, `CHANGELOG.md` — release bookkeeping.

## Git

This repo became a real git repository on 2026-07-05 (baseline commit `80c1997`; before that a
stray zero-commit repo sat in the user home directory, since disabled by renaming its `.git` to
`.git-disabled-2026-07-05`). Commit working states; the baseline makes every change reversible.
