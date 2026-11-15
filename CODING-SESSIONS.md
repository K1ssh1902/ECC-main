# CODING-SESSIONS — remaining work, one sitting each

> Companion to [NEXT-MILESTONES.md](NEXT-MILESTONES.md) (ground truth + dependencies)
> and [IMPLEMENTATION-BACKLOG.md](IMPLEMENTATION-BACKLOG.md) (the task cards these
> sessions bundle). Each session below is executable from its own brief: the **Read
> first** list is the *complete* required context — no full architecture re-read.
>
> Universal session rules:
>
> - One session, one lane (helios / ECC-main / brain). Never span lanes.
> - Start every session with the listed reads, then `git status` + the repo's test
>   suite — if reality disagrees with this file, **reality wins**; report, don't force.
> - End every session with: suite run pasted, evidence written, CHANGELOG updated
>   (helios), report leading with the outcome. Commits only with operator consent.
> - Model assignments per [MODEL-ASSIGNMENT.md](MODEL-ASSIGNMENT.md).
>
> Session key: 🟢 unblocked now · 🔒 blocked (named blocker) · ✋ human in the loop.

---

## Wave 1 — preserve what exists (run these first, any order)

### S1 🟢✋ — ECC closure packet *(C1-T1, C1-T2, C1-T4 prep)* — Lane B, ~60 min

- **Read first:** `PROJECT-STATE.md` (root), §"Pending human decisions"; `git log main..HEAD --oneline`.
- **Do:** prepare the operator packet (merge decision one-pager, promotion decision
  one-pager); on consent, execute C1-T1 (commit M3 artifacts) and the merge decision.
- **Exit:** M3 artifacts committed; written merge + promotion decisions; suite result pasted.

### S2 🟢 — source-command dirs resolution *(C1-T3)* — Lane B, ~60 min

- **Read first:** `tests/ci/codex-skill-surface.test.js` (what it demands); one valid
  skill dir under `.agents/skills/` as the shape to copy; the operator's chosen option from S1.
- **Do:** fix frontmatter + add `agents/openai.yaml` in the 3 dirs (or delete them, per choice).
- **Exit:** `node tests/run-all.js` exit 0, zero failures, pasted.

### S3 🟢✋ — helios consolidation *(C2-T1, C2-T2)* — Lane A, ~90 min

- **Read first:** `C:\dev\helios\CHANGELOG.md` (the narrative the commits must match);
  `git -C C:\dev\helios status`; helios `CLAUDE.md` PROTECTED-PATHS block.
- **Do:** build the milestone-shaped commit plan; secret sweep; `.gitignore` check
  (`coverage/`, `node_modules/` excluded; `package-lock.json` included); present plan;
  on approval, operator triggers the commit series; flag ADR-000/003/006 acceptance.
- **Exit:** helios `git status` clean; 191/191 from committed tree; log reads as the
  milestone narrative.

### S4 🔒(S3)✋ — live verifications *(C3-T1, C3-T2; starts C3-T3)* — Lane A, ~90 min + operator

- **Read first:** `docs/telegram-setup.md`; `docs/evidence/M6-telegram-2026-07-10.md`
  (what was already proven); `docs/evidence/M7-memory-2026-07-10.md`.
- **Do:** live phone round trip; second-account negative test; Obsidian observation;
  write both evidence files; hand the operator the 7-day soak protocol sheet (daily
  doctor checks + one-line log).
- **Exit:** two evidence files committed; soak day 1 logged. **The 7-day clock starts here.**

### S5 🟢 — cost telemetry build *(M13-T1, M13-T2)* — Lane B, ~90 min

- **Read first:** `skills/cost-tracking/` (the real SQLite schema — read internals,
  never recall); `skills/chief-orchestrator/SKILL.md` supervision-log line format
  (the contract you extend, never replace); `commands/cost-report.md`.
- **Do:** extraction script + fixtures (incl. absent-DB grace); the CO skill cost-line
  section; cross-check one real window against `/cost-report`.
- **Exit:** ECC suite green incl. new tests; M3 contract suite still 19/19; one
  captured matching window. (M13-T3's two live passes ride on later real activity.)

---

## Wave 2 — actuation (Lane A; after S4's soak completes = Phase-2 exit observed)

### S6 🔒(S4 day-7) — ADR-004 *(M9-T1, M9-T2)* — ~90 min

- **Read first:** the Extension Standard in the helios corpus (A1–A9, B1–B9);
  `docs/adr/ADR-002-message-envelope.md` (accepted — the envelope you plug into);
  `docs/adr/TEMPLATE.md` + one accepted ADR as shape.
- **Do:** draft ADR-004; adversarial pass; accept.
- **Exit:** ADR accepted, lint green, INDEX row. *(Drafting may start during the soak
  tail at operator discretion — doc-only.)*

### S7 🔒(S6) — capability #1 + registry *(M9-T3)* — ~90 min

- **Read first:** ADR-004 (now accepted); `src/core/router.js` (the single dispatch
  seam); `tests/core/gate.test.js` (the gate semantics you must not re-implement).
- **Do:** `open-app`, registry, dispatch seam, side-door test (red-proofed), live smoke.
- **Exit:** suite green; side-door proof + live smoke captured.

### S8 🔒(S7) — capabilities #2 and #3 *(M9-T4, M9-T5)* — ~90 min

- **Read first:** `src/actuation/open-app/` (the shape to copy); ADR-004's hostile-input
  requirements.
- **Do:** capability #2 (copy discipline: directory + one registry row, nothing else);
  `search-files` with hostile-path fixtures; security-review pass on #3.
- **Exit:** suite green; #2's diff clean; #3 security review zero CRITICAL/HIGH.

### S9 🔒(S8) — factory proof + M9 close *(M9-T6, M9-T7)* — ~60 min

- **Read first:** the verbatim cheap-model template in IMPLEMENTATION-BACKLOG M9-T6.
- **Do:** dispatch capability #4 to the cheap builder with the template, verbatim;
  review the diff (directory + row, nothing else); walk A9/B9 boxes; evidence file +
  CHANGELOG.
- **Exit:** "open Gmail" from the phone observed; #4 diff clean; M9 evidence committed.

---

## Wave 3 — the operations arc (Lane A, strictly ordered: M10 → M11 → M12)

### S10 🔒(S9) — threat model *(M10-T1)* — ~90 min

- **Read first:** the three attacker stories + never-autonomous list (helios corpus /
  Constitution VII); `tests/core/gate-bypass.test.js` and the hostile fixtures (the
  controls the model maps); `docs/evidence/M8-core-complete-2026-07-11.md`.
- **Do:** draft `docs/THREAT-MODEL.md` with every mitigation citing a real file/test;
  put F7 (subscription terms) on the sign-off agenda.
- **Exit:** draft with zero dead citations, queued for review.

### S11 🔒(S10)✋ — threat-model gate *(M10-T2)* — review + operator session

- **Do:** adversarial pass (Fable slot #3, optional but recommended); fold findings;
  **operator signs: threat model + F7 answer + unattended-operation decision**
  (sign-off point 3 of 3).
- **Exit:** signature block present. Nothing downstream of M12 moves without it.

### S12 🔒(S11) — secret store *(M10-T3, M10-T4)* — ~90 min

- **Read first:** M10-T3's bounded-research note (DPAPI options); ADR-006 (how helios
  records a dependency decision); `src/channels/telegram/transport.js` config seam.
- **Do:** `secrets.js` + round trip test; Telegram token cutover; live start with env
  var absent; secret scan.
- **Exit:** suite green; live start observed; scan zero hits. If a token ever sat in a
  dotfile: tell the operator to rotate it.

### S13 🔒(S12) — hostile suite + ADR-005 + scan *(M10-T5, M10-T6)* — ~90 min

- **Read first:** THREAT-MODEL.md's named tricks; existing hostile fixture files.
- **Do:** unicode/homoglyph/encoded fixture expansion; ADR-005; `/security-scan` run
  committed as evidence.
- **Exit:** M10 acceptance fully observed; CHANGELOG entry.

### S14 🔒(S13) — operations *(M11-T1, M11-T2, M11-T3)* — ~90 min + a reboot

- **Read first:** `scripts/helios-doctor.js` usage; M11's F7 empirical line in the backlog.
- **Do:** autostart install script; OPERATIONS.md (every command executed once);
  kill-recovery drill measured on a fresh boot; doctor liveness under a
  Task-Scheduler-started run.
- **Exit:** drill < 60 s recorded; F7 line observed; runbook committed.

### S15 🔒(S14)✋ — allowlists + O1 *(M12-T1, T2, T3)* — ~90 min + operator + overnight

- **Read first:** `/fewer-permission-prompts` output for both repos; M12's forbidden
  classes (no push/deploy/send/delete, ever); the M10 signature (verify it exists).
- **Do:** draft both allowlists with per-line justifications; **operator reviews line
  by line**; schedule ONE unattended `claude -p "/night-shift …"` run; CO pass;
  O1 closure note either way (certified or workaround documented).
- **Exit:** Phase-3 exit: unattended mission hit a cycle boundary, zero hangs, O1
  closed in writing.

---

## Wave 4 — autonomy rails (after Phase-3 exit)

### S16 🔒(S15)✋ — B1 decision *(M14-T1)* — ~60 min + operator

- **Read first:** `docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md` §5.3 + §10 (the two
  mechanisms' trade-offs, already written — present, don't reinvent).
- **Do:** the brief; operator decides; decision ADR committed.
- **Exit:** dated decision ADR.

### S17 🔒(S16) — the unfreeze *(M14-T2, M14-T3)* — ~90 min

- **Read first:** `tests/scripts/mode-doctor-contract.test.js` (the dormant
  `schemaVersion` assertion and its O3 comment); `commands/night-shift.md` JUDGE step;
  both doctor scripts' JSON emit sites; PROJECT-STATE.md "Forbidden changes" (this
  session is the sanctioned exception).
- **Do:** lockfile (F9) + F3 JUDGE sentence + `schemaVersion` in both doctors +
  activate the contract assertion + contention test — **one tight commit series**;
  re-certification note. Verify no mission is active anywhere first.
- **Exit:** M3 suite green *with the version assertion live*; both doctor suites
  green; re-cert note committed; NightShift formally re-Frozen.

### S18 🔒(S17) — the adapter *(M14-T4, M14-T5)* — ~90 min + a week of nights

- **Read first:** the B1 decision ADR; `~/.claude/orchestrator/` layout;
  the CO skill's dispatch section.
- **Do:** ScheduleAdapter + missed-slot fixture; queue schema doc; CO skill update;
  arm the first nightly entry; then the 7-night zero-manual-loads soak.
- **Exit:** one live auto-fire observed; week-long evidence trail accumulating.

---

## Optional / parallel sessions (any time, own lanes)

### SP1 🟢 — Brain V1 *(B1-T1, B1-T2)* — Lane C, ~90 min

- **Read first:** `C:\dev\engineering-brain\ENGINEERING-BRAIN-BLUEPRINT.md` §8 V1 + §4.5.
- **Do:** registry (30–60 entries, `last_verified` dates, dead-path check), compiler
  templates, export-packs, first pack. B1-T3's 10-task trial then rides on Wave-2+
  handoffs.
- **Exit:** registry validates, one real pack exported.

### SP2 🔒(S1, S2)✋ — NS-2 mission charter — Lane B, one `/chief` session

- **Read first:** PROJECT-STATE.md "Oversized modules" risk; `commands/chief.md`.
- **Do:** `/chief` intake → charter the install-lifecycle split mission
  (characterization-first, B5 flag, F3 guard line) → dispatch attended.
- **Exit:** chartered mission running under NightShift protocol; also feeds M13-T3's
  live cost passes.

---

## Progress tracker

| Session | Tasks | Lane | Blocked by | Status |
|---|---|---|---|---|
| S1 | C1-T1/T2/T4 | B | — (✋ consent) | ☐ |
| S2 | C1-T3 | B | operator option choice | ☐ |
| S3 | C2-T1/T2 | A | — (✋ consent) | ☐ |
| S4 | C3-T1/T2/T3 | A | S3 | ☐ |
| S5 | M13-T1/T2 | B | — | ☐ |
| S6 | M9-T1/T2 | A | S4 day-7 | ☐ |
| S7 | M9-T3 | A | S6 | ☐ |
| S8 | M9-T4/T5 | A | S7 | ☐ |
| S9 | M9-T6/T7 | A | S8 | ☐ |
| S10 | M10-T1 | A | S9 | ☐ |
| S11 | M10-T2 ✋ | A | S10 | ☐ |
| S12 | M10-T3/T4 | A | S11 | ☐ |
| S13 | M10-T5/T6 | A | S12 | ☐ |
| S14 | M11-T1/T2/T3 | A | S13 | ☐ |
| S15 | M12-T1/T2/T3 ✋ | A+B | S14 | ☐ |
| S16 | M14-T1 ✋ | B | S15 | ☐ |
| S17 | M14-T2/T3 | B | S16 | ☐ |
| S18 | M14-T4/T5 | B | S17 | ☐ |
| SP1 | B1-T1/T2 | C | — | ☐ |
| SP2 | NS-2 charter ✋ | B | S1, S2 | ☐ |

M15/M16/M17 get sessions only after their Phase-4 charters exist (see NEXT-MILESTONES).
