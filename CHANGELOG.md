# Changelog

## Unreleased

### Fixed

- Test suite is green on Windows without symlink privilege: the 4 broken-symlink fixture tests (tests/ci/validators.test.js, tests/lib/session-manager.test.js ×2, tests/lib/utils.test.js) now probe symlink capability and skip cleanly where unsupported, matching the existing in-repo guard precedent. [night-shift cycle 001]

### Added

- Coverage for the 6 previously-untested exports of `scripts/lib/harness-adapter-compliance.js` (12 new tests: state table rendering, documentation validation incl. failure paths) and a full unit suite for `scripts/lib/cursor-agent-names.js` (16 tests, characterizing its case-sensitive prefix and separator-normalization behavior). [night-shift cycle 004]
- Unit test suite for `scripts/lib/github-discussions.js` (38 tests) — all 6 exported functions covered, including `fetchDiscussionSummary` end-to-end via the `ECC_GH_SHIM` idiom; characterizes case-sensitive maintainer-association matching and extra-path-segment repo parsing. [night-shift cycle 003]
- Characterization test suite for `scripts/lib/shell-substitution.js` (55 tests / 69 assertions incl. hostile shell strings) — the parser gating `pre-bash-dev-server-block` and `gateguard-fact-force` hooks was previously untested. [night-shift cycle 002]
- `/night-shift` — autonomous orchestration mode: the orchestrator acts as a technical lead running an eight-step cycle (orient → select → contract → delegate → verify → judge → record → checkpoint) toward a long-term goal, with persistent `.night-shift/` state, a 13-category 0–100 scorecard, an impact priority ladder, and credit discipline. First mode on the extensible autonomous-mode architecture defined in `skills/night-shift/SKILL.md`.
- `night-shift-assessor` agent — independent read-only repository auditor that scores the 13 night-shift categories with cited evidence and produces an impact-ranked backlog.
- `night-shift` skill — judgment layer shared by future autonomous modes (`/research`, `/refactor`, `/security`, `/release`, `/performance`, `/debug`): state schemas, scoring rubric, verification standard, human-input policy.
- Night-shift hardening audit (`docs/architecture/night-shift-audit.md`) — production-readiness pass: mid-session state reads eliminated from ORIENT, assessor cadence halved (phase change or every 10 cycles), fixed-column scorecard, failed-uncommitted-cycle recovery path, prompt-injection rail on the orchestrator, operative `--focus`, policy thresholds single-sourced in the skill.
- `night-shift-doctor` (`scripts/night-shift-doctor.js`, `npm run night-shift:doctor`) — deterministic validate/status/metrics CLI over `.night-shift/` mission state: integrity invariants (contiguous journal, verdicts, score ranges), interrupted-cycle detection, and KPI computation (cycle duration, completion rate, improvement rate, flat-streak busy-loop detector); 11 tests in `tests/scripts/night-shift-doctor.test.js`. Protocol upgraded with crash-resume procedure, subagent/tool failure taxonomy, and journal timestamps (`docs/architecture/night-shift-production-readiness.md`).
- Chief Orchestrator foundation — production architecture for the portfolio control plane above NightShift and future autonomous modes (`docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md`): layered stack (objectives → missions → tasks), state design at `~/.claude/orchestrator/`, read-only mission telemetry via doctor CLIs, chartering gate, supervision heuristics, scheduler runbook contract, decision record, and the five pre-implementation blockers (B1–B5). NightShift is untouched — integration is CLI-args (write) and doctor JSON (read) only.
- `/chief` command + `chief-orchestrator` skill — operating protocol (intake, `--status`, `--supervise`, `--report`, `--wrap`, `--resume`) and judgment layer (mode registry, chartering gate, supervision heuristics table, executive report format, anti-patterns) for the Chief Orchestrator.
- `orchestrator-doctor` (`scripts/orchestrator-doctor.js`, `npm run orchestrator:doctor`) — deterministic validate/status/metrics CLI over `~/.claude/orchestrator/` portfolio state: schema invariants, mission-registry consistency, one-running-mission-per-repo conflict detection, terminal-outcome and supervision-log checks; 13 tests in `tests/scripts/orchestrator-doctor.test.js`.
- Chief Orchestrator ↔ NightShift integration certification (`docs/architecture/chief-orchestrator-integration-certification.md`) — **PASS WITH OBSERVATIONS**: 22 dynamic checks (11 fixture missions through the real doctor CLIs, supervision heuristics executed literally against captured JSON, 7-state lifecycle walk, failure injection incl. garbage state, state-dir-as-file, CRLF, no-state-after-dispatch), 10-row interface compatibility matrix, zero cross-references proven between subsystems, both doctors proven read-only. Four documentation fixes applied to CO-owned artifacts: field-level **Mode Doctor Contract**, "Not started" supervision row, runbook field wording, per-mode human-queue/handoff read points in the mode registry. Control Plane versioned **v1.0.0-rc.1**; NightShift untouched.

## 2.0.0-rc.1 - 2026-04-28

### Highlights

- Adds the public ECC 2.0 release-candidate surface for the Hermes operator story.
- Documents ECC as the reusable cross-harness substrate across Claude Code, Codex, Cursor, OpenCode, and Gemini.
- Adds a sanitized Hermes import skill surface instead of publishing private operator state.

### Release Surface

- Updated package, plugin, marketplace, OpenCode, agent, and README metadata to `2.0.0-rc.1`.
- Added `docs/releases/2.0.0-rc.1/` with release notes, social drafts, launch checklist, handoff notes, and demo prompts.
- Added `docs/architecture/cross-harness.md` and regression coverage for the ECC/Hermes boundary.
- Kept `ecc2/` versioning independent for now; it remains an alpha control-plane scaffold unless release engineering decides otherwise.

### Notes

- This is a release candidate, not a GA claim for the full ECC 2.0 control-plane roadmap.
- Prerelease npm publishing should use the `next` dist-tag unless release engineering explicitly chooses otherwise.

## 1.10.0 - 2026-04-05

### Highlights

- Public release surface synced to the live repo after multiple weeks of OSS growth and backlog merges.
- Operator workflow lane expanded with voice, graph-ranking, billing, workspace, and outbound skills.
- Media generation lane expanded with Manim and Remotion-first launch tooling.
- ECC 2.0 alpha control-plane binary now builds locally from `ecc2/` and exposes the first usable CLI/TUI surface.

### Release Surface

- Updated plugin, marketplace, Codex, OpenCode, and agent metadata to `1.10.0`.
- Synced published counts to the live OSS surface: 38 agents, 156 skills, 72 commands.
- Refreshed top-level install-facing docs and marketplace descriptions to match current repo state.

### New Workflow Lanes

- `brand-voice` — canonical source-derived writing-style system.
- `social-graph-ranker` — weighted warm-intro graph ranking primitive.
- `connections-optimizer` — network pruning/addition workflow on top of graph ranking.
- `customer-billing-ops`, `google-workspace-ops`, `project-flow-ops`, `workspace-surface-audit`.
- `manim-video`, `remotion-video-creation`, `nestjs-patterns`.

### ECC 2.0 Alpha

- `cargo build --manifest-path ecc2/Cargo.toml` passes on the repository baseline.
- `ecc-tui` currently exposes `dashboard`, `start`, `sessions`, `status`, `stop`, `resume`, and `daemon`.
- The alpha is real and usable for local experimentation, but the broader control-plane roadmap remains incomplete and should not be treated as GA.

### Notes

- The Claude plugin remains limited by platform-level rules distribution constraints; the selective install / OSS path is still the most reliable full install.
- This release is a repo-surface correction and ecosystem sync, not a claim that the full ECC 2.0 roadmap is complete.

## 1.9.0 - 2026-03-20

### Highlights

- Selective install architecture with manifest-driven pipeline and SQLite state store.
- Language coverage expanded to 10+ ecosystems with 6 new agents and language-specific rules.
- Observer reliability hardened with memory throttling, sandbox fixes, and 5-layer loop guard.
- Self-improving skills foundation with skill evolution and session adapters.

### New Agents

- `typescript-reviewer` — TypeScript/JavaScript code review specialist (#647)
- `pytorch-build-resolver` — PyTorch runtime, CUDA, and training error resolution (#549)
- `java-build-resolver` — Maven/Gradle build error resolution (#538)
- `java-reviewer` — Java and Spring Boot code review (#528)
- `kotlin-reviewer` — Kotlin/Android/KMP code review (#309)
- `kotlin-build-resolver` — Kotlin/Gradle build errors (#309)
- `rust-reviewer` — Rust code review (#523)
- `rust-build-resolver` — Rust build error resolution (#523)
- `docs-lookup` — Documentation and API reference research (#529)

### New Skills

- `pytorch-patterns` — PyTorch deep learning workflows (#550)
- `documentation-lookup` — API reference and library doc research (#529)
- `bun-runtime` — Bun runtime patterns (#529)
- `nextjs-turbopack` — Next.js Turbopack workflows (#529)
- `mcp-server-patterns` — MCP server design patterns (#531)
- `data-scraper-agent` — AI-powered public data collection (#503)
- `team-builder` — Team composition skill (#501)
- `ai-regression-testing` — AI regression test workflows (#433)
- `claude-devfleet` — Multi-agent orchestration (#505)
- `blueprint` — Multi-session construction planning
- `everything-claude-code` — Self-referential ECC skill (#335)
- `prompt-optimizer` — Prompt optimization skill (#418)
- 8 Evos operational domain skills (#290)
- 3 Laravel skills (#420)
- VideoDB skills (#301)

### New Commands

- `/docs` — Documentation lookup (#530)
- `/aside` — Side conversation (#407)
- `/prompt-optimize` — Prompt optimization (#418)
- `/resume-session`, `/save-session` — Session management
- `learn-eval` improvements with checklist-based holistic verdict

### New Rules

- Java language rules (#645)
- PHP rule pack (#389)
- Perl language rules and skills (patterns, security, testing)
- Kotlin/Android/KMP rules (#309)
- C++ language support (#539)
- Rust language support (#523)

### Infrastructure

- Selective install architecture with manifest resolution (`install-plan.js`, `install-apply.js`) (#509, #512)
- SQLite state store with query CLI for tracking installed components (#510)
- Session adapters for structured session recording (#511)
- Skill evolution foundation for self-improving skills (#514)
- Orchestration harness with deterministic scoring (#524)
- Catalog count enforcement in CI (#525)
- Install manifest validation for all 109 skills (#537)
- PowerShell installer wrapper (#532)
- Antigravity IDE support via `--target antigravity` flag (#332)
- Codex CLI customization scripts (#336)

### Bug Fixes

- Resolved 19 CI test failures across 6 files (#519)
- Fixed 8 test failures in install pipeline, orchestrator, and repair (#564)
- Observer memory explosion with throttling, re-entrancy guard, and tail sampling (#536)
- Observer sandbox access fix for Haiku invocation (#661)
- Worktree project ID mismatch fix (#665)
- Observer lazy-start logic (#508)
- Observer 5-layer loop prevention guard (#399)
- Hook portability and Windows .cmd support
- Biome hook optimization — eliminated npx overhead (#359)
- InsAIts security hook made opt-in (#370)
- Windows spawnSync export fix (#431)
- UTF-8 encoding fix for instinct CLI (#353)
- Secret scrubbing in hooks (#348)

### Translations

- Korean (ko-KR) translation — README, agents, commands, skills, rules (#392)
- Chinese (zh-CN) documentation sync (#428)

### Credits

- @ymdvsymd — observer sandbox and worktree fixes
- @pythonstrup — biome hook optimization
- @Nomadu27 — InsAIts security hook
- @hahmee — Korean translation
- @zdocapp — Chinese translation sync
- @cookiee339 — Kotlin ecosystem
- @pangerlkr — CI workflow fixes
- @0xrohitgarg — VideoDB skills
- @nocodemf — Evos operational skills
- @swarnika-cmd — community contributions

## 1.8.0 - 2026-03-04

### Highlights

- Harness-first release focused on reliability, eval discipline, and autonomous loop operations.
- Hook runtime now supports profile-based control and targeted hook disabling.
- NanoClaw v2 adds model routing, skill hot-load, branching, search, compaction, export, and metrics.

### Core

- Added new commands: `/harness-audit`, `/loop-start`, `/loop-status`, `/quality-gate`, `/model-route`.
- Added new skills:
  - `agent-harness-construction`
  - `agentic-engineering`
  - `ralphinho-rfc-pipeline`
  - `ai-first-engineering`
  - `enterprise-agent-ops`
  - `nanoclaw-repl`
  - `continuous-agent-loop`
- Added new agents:
  - `harness-optimizer`
  - `loop-operator`

### Hook Reliability

- Fixed SessionStart root resolution with robust fallback search.
- Moved session summary persistence to `Stop` where transcript payload is available.
- Added quality-gate and cost-tracker hooks.
- Replaced fragile inline hook one-liners with dedicated script files.
- Added `ECC_HOOK_PROFILE` and `ECC_DISABLED_HOOKS` controls.

### Cross-Platform

- Improved Windows-safe path handling in doc warning logic.
- Hardened observer loop behavior to avoid non-interactive hangs.

### Notes

- `autonomous-loops` is kept as a compatibility alias for one release; `continuous-agent-loop` is the canonical name.

### Credits

- inspired by [zarazhangrui](https://github.com/zarazhangrui)
- homunculus-inspired by [humanplane](https://github.com/humanplane)
