# PROJECT-STATE — ECC-main

> Snapshot taken 2026-07-11 on branch `night-shift/2026-07-09` (HEAD `ddd53dd`).
> Audit-only document: it records what exists; it changes nothing.
> The existing implementation is authoritative — if this file and the code disagree, the code wins.

## What this repository is

`ecc-universal` v2.0.0-rc.1 — a Claude Code plugin/toolkit: agents, skills, commands, hooks, rules, MCP configs, and cross-platform Node.js (CommonJS, Node ≥18) scripts. **It is the toolkit, not a workspace** — new apps/projects go in `C:\dev\<name>`, never in here (see `CLAUDE.md`, `docs/WORKSPACE-MAP.md`).

Two orchestration layers live on top of the toolkit and are the active workstream:

- **NightShift** — autonomous improvement-mission mode (`commands`/skill + `scripts/night-shift-doctor.js`). **Frozen subsystem**: interacted with only via its CLI (write) and `night-shift-doctor --json` (read).
- **Chief Orchestrator (CO)** — portfolio control plane above NightShift (`docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md`, `scripts/orchestrator-doctor.js`, `/chief`). State lives at `~/.claude/orchestrator/` (absent until first run — doctor exit 1 "No orchestrator state" on a fresh machine is expected, not a bug). Certified 2026-07-08: PASS WITH OBSERVATIONS, v1.0.0-rc.1 (`docs/architecture/chief-orchestrator-integration-certification.md`).

Milestone labels (M2, M3, B1–B3, O1, D1–D7) come from the HELIOS Implementation Roadmap at `C:\dev\helios\HELIOS-IMPLEMENTATION-ROADMAP.md` (§3 milestone table) — not from this repo's `docs/ECC-2.0-GA-ROADMAP.md`, which is upstream-inherited Linear-mirror content (see Risks).

## Completed milestones

| Milestone | Evidence |
|---|---|
| CO architecture + foundation shipped (2026-07-07) | `docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md`, `scripts/orchestrator-doctor.js`, commits `ce78c8f`, `bc58c46`, `eb78dbd` |
| CO integration certification — PASS WITH OBSERVATIONS, v1.0.0-rc.1 (2026-07-08) | `docs/architecture/chief-orchestrator-integration-certification.md` |
| **M2 — first supervised mission** (2026-07-09 → 07-10, COMPLETE) | Mission `ecc-main--night-shift--2026-07-09`: 5 cycles run, 5 KEPT, 0 reverts; scorecard overall 68→71, testing 62→77. Full record: `.night-shift/mission.md`, `.night-shift/scorecard.md`, `.night-shift/journal/cycle-00[1-5].md`; commits `8b5e93c`…`ddd53dd` (7 total, branch-only). Portfolio report: `~/.claude/orchestrator/reports/2026-07-10.md` |
| **M3 — Mode Doctor Contract regression test** (WRITTEN, passing, **uncommitted**) | `tests/scripts/mode-doctor-contract.test.js` — 19/19 passing (verified 2026-07-11); fixtures in `tests/fixtures/mode-doctor-captures/` (9 files). Both paths are untracked. |

M2 detail worth knowing: all mission commits are test-only. `git diff eb78dbd..HEAD --stat -- scripts/` is empty — zero product-code, public-contract, or doctor-JSON changes across the mission.

## Current milestone

**M3 closure + M2 branch disposition.** The M3 test exists and passes; what remains is administrative, not engineering:

1. Commit the untracked M3 artifacts (`tests/fixtures/mode-doctor-captures/`, `tests/scripts/mode-doctor-contract.test.js`) — per the c000 decision log, the operator commits captures separately from cycle commits.
2. Operator review of branch `night-shift/2026-07-09` (7 commits ahead of `main`; `main` has 0 commits the branch lacks) → merge or decline.
3. Resolve the `.agents/skills/source-command-*` dirs (see Pending human decisions) — the only thing between the suite and a clean exit 0.

## Exact next action

```
git add tests/fixtures/mode-doctor-captures/ tests/scripts/mode-doctor-contract.test.js
git commit -m "test: add mode-doctor-contract suite from banked M2 captures [M3]"
```

(Requires operator consent to commit — this snapshot does not perform it.) Then review/merge `night-shift/2026-07-09` into `main`.

## Forbidden changes

- **Do not edit `.night-shift/`** from the CO layer or any future session — NightShift is frozen; the mission is closed. Its files are historical evidence now.
- **Do not change the doctor JSON surfaces** (`night-shift-doctor`, `orchestrator-doctor` `--json` output): field sets, types, exit codes, and failure text are pinned by `tests/scripts/mode-doctor-contract.test.js`. Schema growth is a contract change and fails that suite by design.
- **Do not regenerate or re-run the M2 mission** — it is complete; cycles 001–005 are authoritative.
- **Do not rewrite history, merge, or push** `night-shift/2026-07-09` without explicit operator consent (mission dispatch exception was scoped to protocol commits only).
- **Do not fix `toCursorAgentFileName`** (`scripts/lib/cursor-agent-names.js`) casually — its warts are characterized in tests, and changing it is a public-contract change with 2 install-path consumers (`scripts/lib/install-executor.js:6`, `scripts/lib/install-targets/cursor-project.js:4`).
- **Do not create apps/websites/experiments in this repo** — `C:\dev\<name>` only.
- **Do not re-litigate decisions D1–D7** recorded in `docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md`.

## Architecture decisions (standing)

- **NightShift is frozen**: CO integrates only via `/night-shift` CLI args (write) and `night-shift-doctor --json` (read). Never cross-edit state.
- **The Mode Doctor Contract is the CO's only read surface** for mission telemetry; the M2 captures in `tests/fixtures/mode-doctor-captures/` are its ground truth (F5 lesson: evidence is committed with the work, never scratchpad-resident).
- **CommonJS only** in `scripts/`; no TypeScript; lowercase-hyphen filenames; hooks route through `scripts/hooks/run-with-flags.js` and always exit 0 on non-critical errors (`.claude/rules/node.md`).
- **Capability-guarded tests** for environment coupling: symlink EPERM guards (cycle 001), working-bash probe guards (cycle 005). Guards skip only when the capability is genuinely absent — under Git Bash the skip-line grep is 0.
- **orchestrator-doctor mission-state vocabulary is `done`, not `complete`**; night-shift-doctor's scorecard parser requires **unbolded** numeric cells (`**68**` → NaN — fixed in `ddd53dd`).

## Important files

| Path | Why it matters |
|---|---|
| `.night-shift/mission.md` | Closed M2 mission: backlog, tech-debt register, decision log, handoff report |
| `.night-shift/scorecard.md` | Final category scores + evidence, suite-run capture, coverage-gap ground truth |
| `tests/scripts/mode-doctor-contract.test.js` | M3 contract suite (untracked — commit it) |
| `tests/fixtures/mode-doctor-captures/` | M2 doctor-output captures, contract ground truth (untracked — commit it) |
| `docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md` | CO design + decisions D1–D7 |
| `docs/architecture/chief-orchestrator-integration-certification.md` | v1.0.0-rc.1 certification, promotion condition |
| `scripts/night-shift-doctor.js`, `scripts/orchestrator-doctor.js` | The two contract-pinned doctor CLIs |
| `~/.claude/orchestrator/` (outside repo) | CO state: portfolio.md, missions/, reports/2026-07-09.md + 2026-07-10.md |
| `C:\dev\helios\HELIOS-IMPLEMENTATION-ROADMAP.md` (outside repo) | Source of the M/B/O milestone taxonomy |
| `docs/HANDOFF.md` | Continuation guide for the next engineer/model (written with this snapshot) |

## Commands to verify

```bash
node tests/run-all.js                              # full suite — expect 2736 pass / 2 fail (verified 2026-07-11; the 2 known operator-dir codex-skill-surface failures; total 2738 = wrap-up's 2719 + the 19 auto-discovered M3 tests)
node tests/scripts/mode-doctor-contract.test.js    # M3 contract — expect 19/19
node scripts/night-shift-doctor.js status --dir . --json   # exit 0, mission closed
node scripts/orchestrator-doctor.js status --json  # exit 0 on this machine (state exists); exit 1 "No orchestrator state" on a fresh machine is EXPECTED
npm run lint
git log main..HEAD --oneline                       # the 7 unmerged mission commits
git status --short                                 # the untracked M3 artifacts + source-command-* dirs
```

## Pending human decisions

1. **Merge or decline `night-shift/2026-07-09`** — 7 test-only commits, all evidence in `.night-shift/journal/`.
2. **Commit the M3 artifacts** (fixtures + contract test) — and on which branch (mission branch pre-merge vs `main` post-merge).
3. **`.agents/skills/source-command-*` dirs** (3, untracked, operator-generated): quoted `name:` frontmatter + missing `agents/openai.yaml` fail 2 tests in `tests/ci/codex-skill-surface.test.js`. Options: fix frontmatter + add openai.yaml, regenerate, or delete. Sole blocker for full-suite exit 0.
4. **CO promotion v1.0.0-rc.1 → v1.0.0**: the certification's promotion condition (first real supervised mission) is met, but O1 (headless `claude -p` slash expansion) is untested because M2 ran attended. Decide: does O1 gate promotion, or move to B3's scheduled-run work (roadmap E3/M12)?
5. **Machine-level**: PowerShell resolves `bash` to the WSL System32 stub with no distro → install a distro or reorder PATH (repo now tolerates it via c005 guards).
6. **Later, before autonomy**: B3 (headless allowlists) before any scheduled run; B1 (scheduler mechanism choice — human decision) before autonomous dispatch; B2 (cost telemetry) before budget enforcement.

## Risks

- **Uncommitted M3 work can be lost or redone.** The test + fixtures exist only as untracked files on an OneDrive-synced path; `~/.claude/orchestrator/reports/2026-07-10.md` still lists M3 as *next*, so a future agent reading it would rebuild what already exists. Mitigation: commit (next action), and read this file first.
- **Stale fixture README**: `tests/fixtures/mode-doctor-captures/README.md` says the healthy nightshift status/metrics captures are "still missing" — they exist (the three `2026-07-10-*.json` files) and the M3 test uses them. Don't recapture.
- **OneDrive file locks (roadmap risk R-B5)**: observed once as a transient 10s validator-timeout flake in `tests/ci/no-personal-paths.test.js` under full-suite disk contention; did not reproduce. Logged in the mission Tech Debt Register.
- **`docs/ECC-2.0-GA-ROADMAP.md` is not this fork's roadmap** — it mirrors the upstream `affaan-m/ECC` Linear project. Treating it as the active plan would misdirect work; the active plan is the HELIOS roadmap.
- **Coverage is measured only on ubuntu in CI** (`.github/workflows/ci.yml:212-219`) — Windows-guarded tests silently drop from measured coverage.
- **Oversized modules**: `scripts/lib/install-lifecycle.js` 1226L breaches the repo's own 800L cap; `install-executor.js` 738L trending. A split is contract-risky and is the recommended next NightShift mission — needs its own mission with characterization-first cycles, not drive-by refactoring.
