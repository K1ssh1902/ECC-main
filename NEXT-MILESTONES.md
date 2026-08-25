# NEXT-MILESTONES — remaining program milestones

> Program Architect snapshot, 2026-07-11. Companion to [PROJECT-STATE.md](PROJECT-STATE.md)
> (ECC-main state) and subordinate to `C:\dev\helios\HELIOS-IMPLEMENTATION-ROADMAP.md`
> (the milestone authority — §2 records, §6 handoffs). This document **redesigns nothing**:
> it enumerates what remains, decomposes it for implementation models, and records fresh
> ground truth. Where this file and the roadmap's §0 disagree, this file is fresher
> (verified 2026-07-11); the roadmap absorbs corrections at its next amendment.
>
> Documentation only. No implementation was performed to produce this file.

## Fresh ground truth (verified 2026-07-11, this session)

The HELIOS roadmap's §0 (2026-07-08) is now badly stale in one direction: **more is done
than it records.** Do not plan against the roadmap's §0; plan against this table.

| Fact | Status | Evidence |
|---|---|---|
| M0 corpus consolidation | Built, **partially committed** (7 docs staged, not committed) | `git -C C:\dev\helios status` — `A`/`AM` rows |
| M1 governance skeleton + ADR lint | ✅ Built | `CLAUDE.md`, `tests/run-all.js`, `tests/adr-lint.test.js`, ADR-000 (proposed), `docs/adr/TEMPLATE.md` + `INDEX.md` |
| M2 first supervised mission (ECC-main) | ✅ Complete | `.night-shift/` closed mission, 5/5 cycles KEPT; `~/.claude/orchestrator/reports/2026-07-10.md` |
| M3 Mode Doctor Contract test | ✅ Written, 19/19 passing, **untracked in ECC-main** | `tests/scripts/mode-doctor-contract.test.js` + `tests/fixtures/mode-doctor-captures/` |
| M4 engine adapter | ✅ Built; live smoke passed (R2 resolved) | `src/engine/`, `docs/evidence/M4-live-smoke-2026-07-10.md`, ADR-003 (proposed) |
| M5 core-minimal | ✅ Built; ADR-002 **accepted**, gate design human-signed (sign-off 2 of 3) | `src/core/`, `docs/evidence/M5-core-minimal-2026-07-10.md` |
| M6 Telegram channel | ✅ Built; **live phone round trip + second-account test + 7-day soak remain** | `src/channels/telegram/`, `docs/evidence/M6-telegram-2026-07-10.md`, ADR-006 (proposed) |
| M7 memory engine | ✅ Built; ADR-001 **accepted** (sign-off 1 of 3); F2 restore drill executed; **Obsidian observation + 7-day vault soak remain** | `src/memory/`, `scripts/memory-doctor.js`, `docs/evidence/M7-memory-2026-07-10.md` |
| M8 core-complete | ✅ Built; helios-doctor speaks Mode Doctor Contract; F4 tripwire live; **7-day slice stability remains** | `docs/evidence/M8-core-complete-2026-07-11.md` |
| helios full suite | **191/191 green** (run this session, 2026-07-11) | `node tests/run-all.js` in `C:\dev\helios` |
| helios git state | **CRITICAL: everything after the founding commit is uncommitted** | one commit (`254beb3`); all of `src/`, `tests/`, `scripts/`, `docs/adr/`, evidence, config untracked |
| ECC-main suite | 2736/2738 (2 known `codex-skill-surface` failures from untracked `source-command-*` dirs) | PROJECT-STATE.md, verified 2026-07-11 |
| ECC-main branch | `night-shift/2026-07-09`, 7 test-only commits ahead of `main`, unmerged | `git log main..HEAD` |
| Human sign-offs done | 2 of 3 (ADR-001, ADR-002/gate). **Remaining: threat model + unattended approval (M10)** | helios CHANGELOG, evidence files |

## Remaining milestones

Milestone IDs M9–M17, B1 are the roadmap's. C1–C3 are new **closure** milestones this
document adds (administrative, not engineering — they existed implicitly; naming them
makes them dispatchable). NS-2 is the recommended next NightShift mission on ECC-main.

### C1 — ECC-main administrative closure

- **What:** commit the M3 artifacts; operator merge-or-decline on `night-shift/2026-07-09`;
  resolve the 3 `.agents/skills/source-command-*` dirs; record the CO rc.1 → v1.0.0
  promotion decision (does untested O1 gate it, or does O1 close at M12?).
- **Depends on:** nothing. **Effort:** XS (engineering) + 4 operator decisions.
- **Risks:** untracked M3 work lost or rebuilt by a future agent (the top ECC risk);
  OneDrive file locks during suite runs (known flake).
- **Acceptance:** `git status --short` clean of `tests/fixtures/` and the contract test;
  a written merge decision; `node tests/run-all.js` exits 0 with zero failures;
  a dated promotion decision in the CO architecture decision log or a report.
- **Review gate:** none (administrative). **Human approvals:** all four items are
  operator decisions; the builder only prepares packets and executes consented commands.

### C2 — helios consolidation commit

- **What:** turn the uncommitted M0–M8 implementation (everything in
  `git -C C:\dev\helios status`) into milestone-shaped commits, operator-triggered.
  Includes deciding ADR-000/003/006 acceptance status (currently "proposed") and the
  MEM-19 private backup remote (operator-reserved decision — can be deferred, noted).
- **Depends on:** nothing. Blocks **everything** in Lane A. **Effort:** XS–S.
- **Risks:** THE program's largest single point of failure right now — five milestones
  of verified work exist only as untracked files on one machine. A disk event or an
  eager `git clean` erases Phase 1 and Phase 2.
- **Acceptance:** `git -C C:\dev\helios status` clean; suite still 191/191 from the
  committed tree; CHANGELOG matches the commit series.
- **Review gate:** in-session review of the commit plan before execution.
- **Human approvals:** the operator triggers every commit (helios convention, M0 handoff).

### C3 — Phase-1/Phase-2 exit verification (operator + calendar)

- **What:** the live checks the builders could not do: M6 live phone round trip +
  second-account negative test; M7 Obsidian live observation; then the 7-day soaks
  (Phase-1 daily-use soak with real ledger numbers; M7 vault soak; M8 slice stability).
  These are **exit criteria, not new engineering** — Phase 1 and Phase 2 formally end here.
- **Depends on:** C2 (evidence must land in committed history). **Effort:** S, spread
  over ≥7 calendar days; mostly operator time.
- **Risks:** soak surfaces a live-behavior defect (that is its purpose — surfaced
  attended); Telegram token still in env stub until M10 (accepted interim, `TODO(H7)`).
- **Acceptance:** roadmap M6/M7/M8 exit criteria observed and logged in
  `docs/evidence/`; ledger produced real daily numbers for 7 consecutive days.
- **Review gate:** the soak itself. **Human approvals:** none beyond operator's time.

### M9 — Actuation layer (roadmap H6)

- **What:** ADR-004 capability contract; registry data file; capabilities #1–#3
  (Sonnet-tier); **capability #4 built by a cheaper model alone** (the factory proof);
  MCP wiring per Extension Standard Part B.
- **Depends on:** C2, C3 (Phase-2 exit observed). ADR-004 *drafting* may begin during
  the soak tail (documentation, no code) at operator discretion.
- **Effort:** L (≈6 sessions). **Risks:** capability sprawl (post-#4, new capabilities
  are backlog items, not sessions); reversibility misclassification (constitutional —
  classify up); side-door effects bypassing the gate.
- **Acceptance:** roadmap H6's verbatim — side-door throws; irreversible demands live
  confirmation; "open Gmail" from Telegram observed on the phone; #4's diff is exactly
  its directory + one registry row; A7 test set per capability.
- **Review gates:** ADR-004 adversarial pass; code-reviewer per capability;
  security-reviewer on files/shell-touching capabilities.
- **Human approvals:** any irreversible-classed registry entry.

### M10 — Security hardening (roadmap H7)

- **What:** `docs/THREAT-MODEL.md` (three attacker stories); `src/core/secrets.js`
  (Windows Credential Manager/DPAPI); Telegram token cutover off env; hostile suite
  expansion (unicode/homoglyph/encoded); ADR-005; committed clean `/security-scan`.
- **Depends on:** M9 (real attack surface complete). **Effort:** M (≈4 sessions).
- **Risks:** existential if skipped; DPAPI-from-Node ergonomics (bounded research).
- **Acceptance:** roadmap H7's verbatim + secret scan of repo/logs/vault zero hits +
  gate-bypass suite all blocked-and-logged + stolen-laptop mitigation demonstrated.
- **Review gates:** security-reviewer drives; **optional Fable adversarial pass on the
  threat model (review slot #3)**.
- **Human approvals:** **sign-off point 3 of 3** — threat model signature + explicit
  unattended-operation approval + the F7 subscription-terms question answered on record.

### M11 — Operations (roadmap H8)

- **What:** Task Scheduler autostart + install script; `docs/OPERATIONS.md` with every
  command executed once; kill → auto-restore < 60 s measured on a fresh boot; doctor
  liveness green on a Task-Scheduler-started run (the F7 empirical line).
- **Depends on:** M8 (done) for the doctor; sequenced after M10 in the operations arc.
- **Effort:** S (≈2 sessions). **Risks:** R10 Windows service reality (sleep/restart) —
  the crash drill is the mitigation.
- **Acceptance:** roadmap H8's verbatim + the F7 line + the measured drill.
- **Review gate:** code-reviewer; the crash drill itself. **Human approvals:** none.

### M12 — Headless allowlists + O1 closure (roadmap E3)

- **What:** reviewed per-repo permission allowlists (helios, ECC-main) drafted from
  `/fewer-permission-prompts`; then **one real scheduled unattended
  `claude -p "/night-shift …"` run to a cycle boundary**, certifying O1.
- **Depends on:** M10 (unattended approval), M11 (autostart). **Effort:** S.
- **Risks:** over-broad allowlist weakens the permission model — "fix the allowlist,
  never weaken the model"; **no push/deploy/send/delete-class entries, ever**.
- **Acceptance:** unattended mission reaches a cycle boundary with zero permission
  hangs; journal + doctor evidence; O1 closed in writing.
- **Review gate / human approval:** **operator reviews every allowlist line** with a
  one-phrase justification each. This is Phase-3 exit.

### M13 — Cost telemetry (roadmap E4) — Lane B, parallelizable now

- **What:** wire the ECC cost-tracking SQLite (see `skills/cost-tracking/`,
  `commands/cost-report.md`) into CO supervision passes; live Budget section; graceful
  degradation when the DB is absent.
- **Depends on:** M2 ✅ only — **unblocked today**; touches only ECC-main/CO state, never
  contends with Lane A helios work.
- **Effort:** S (≈2 sessions). **Risks:** none structural (log format reserved the slot).
- **Acceptance:** cost line matches `/cost-report` for the same window, cross-checked
  once and captured; two consecutive real supervision passes with live cost lines.
- **Review gate:** code-reviewer. **Human approvals:** none.

### M14 — Scheduler adapter + the one NightShift unfreeze (roadmap E5)

- **What:** (1) human **B1 decision** (extension file-reader vs OS Task Scheduler
  adapter), recorded as an ECC ADR; (2) the **single bundled unfreeze** of frozen
  NightShift: `.night-shift/` concurrency lockfile (F9) + F3 revert-guard sentence in
  the JUDGE step + `schemaVersion` in both doctors' JSON (O3), activating the dormant
  version assertion in the M3 contract test; one re-certification; (3) the
  `ScheduleAdapter` (`list/upsert/remove` over `~/.claude/orchestrator/queue.json`),
  missed-slot detection, CO skill dispatch section; (4) one week of nightly
  auto-dispatch, zero manual loads.
- **Depends on:** M12 (never auto-dispatch before allowlists); the human B1 decision
  **before any code**. Must not overlap any active mission anywhere.
- **Effort:** L (≈4 sessions + a week of soak). **Risks:** missed-run semantics;
  thawing a certification-guarded system (mitigated: the M3 suite is the mechanical
  freeze and must re-run green; fresh mini-certification per Handbook §8).
- **Acceptance:** roadmap E5's verbatim + M3 suite green post-unfreeze (now asserting
  `schemaVersion`) + lockfile contention test + the week-long evidence trail.
- **Review gates:** typescript-reviewer (if extension path) + code-reviewer;
  re-certification pass (Fable review optional).
- **Human approvals:** the B1 mechanism decision; the re-certification acceptance.

### M15 / M16 / M17 — Proactive automation · Voice · Second mode

**Deliberately not decomposed here.** The roadmap defers their records and handoffs to
Phase-4 entry ("writing them today would be the speculative design the corpus repeatedly
refuses") and this document will not re-litigate that. They are chartered after M14, each
with a fresh record revision, estimates, and threat-model amendments (H9's open mic,
H10's screen awareness). Sketch effort: XL, XL, M. Human approvals: per-automation
approval forever for irreversible classes (H10); open-mic threat-model amendment
signature (H9).

### B1 — Engineering Brain V1 (optional lane, any time)

- **What:** per the Brain blueprint §8 V1: `registry/registry.json` (30–60 curated
  entries across ECC-main + helios), compiler templates, `scripts/export-packs.js`,
  NotebookLM notebook; run assisted mode on 10 real tasks; honest kill/continue call.
- **Depends on:** nothing on the critical path. Lives in `C:\dev\engineering-brain`.
- **Effort:** S. **Risks:** none to the program (kill criterion built in).
- **Acceptance:** 10 compiled tasks with one-line outcome logs; kill/continue recorded.
- **Review gate:** none. **Human approvals:** the kill/continue call.

### NS-2 — ECC-main NightShift mission: split `install-lifecycle.js` (optional, decided-not-started)

- **What:** `scripts/lib/install-lifecycle.js` (1226 lines) breaches the repo's 800-line
  cap; `install-executor.js` (738) is trending. The standing recommendation is a
  **NightShift mission with characterization-first cycles** — never a drive-by refactor.
- **Depends on:** C1 (clean tree); dispatched via `/chief`, not decomposed here —
  NightShift missions self-decompose per protocol.
- **Effort:** one mission (≈5 cycles). **Risks:** contract-risky split; mitigated by
  characterization tests before movement.
- **Acceptance:** mission scorecard; suite green; no public-contract change without a
  called-out contract commit. **Human approval:** mission charter via `/chief`.

## Dependency order (remaining work only)

```text
LANE B (ECC-main/CO)                LANE A (helios)                    LANE C (optional)
C1 closure ──► NS-2 (optional)      C2 commit ──► C3 soaks/exits       B1 Brain V1
   │                                     │            │                 (any time)
   └────────► M13 cost telemetry         └────────────► M9 actuation
                     │                                      │
                     │                                   M10 security (✋ sign-off 3/3)
                     │                                      │
                     │                                   M11 operations
                     │                                      │
                     └──────────────────────────────► M12 allowlists + O1 (✋ line-by-line)
                                                            │
                                                       M14 scheduler + unfreeze (✋ B1 decision)
                                                            │
                                                       M15/M16/M17 (chartered at Phase-4 entry)
```

Critical path: **C2 → C3 → M9 → M10 → M11 → M12 → M14.**
Start today, in parallel: **C1** (operator packet), **C2** (commit plan), **M13** (Lane B).

## Never-overlap rules (inherited, binding)

- Two missions on one repo; two concurrent `/chief` sessions.
- M14's unfreeze with any active mission anywhere.
- Gate-touching work (M10) with capability work (M9) in the same session.
- Any Phase-4 work while a Phase-3 exit criterion is unfinished.
- No session spans lanes (helios / ECC-main / brain).
