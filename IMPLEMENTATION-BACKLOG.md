# IMPLEMENTATION-BACKLOG — remaining work as 30–90 minute tasks

> Companion to [NEXT-MILESTONES.md](NEXT-MILESTONES.md) (read it first — it carries the
> fresh ground truth and dependency order). Task IDs are `<milestone>-T<n>`. Every task
> is sized for one focused 30–90 minute block by an implementation model.
>
> **Global forbidden list (applies to every task, on top of per-task lists):**
>
> - `.night-shift/` in ECC-main — closed mission, frozen subsystem, historical evidence.
> - `tests/fixtures/mode-doctor-captures/*.json` — verbatim captured reality; cannot be re-derived.
> - Doctor JSON surfaces (`night-shift-doctor`, `orchestrator-doctor`, `helios-doctor`,
>   `memory-doctor` `--json` fields/exit codes/failure text) — pinned by contract tests;
>   only M14-T2 changes them, deliberately.
> - `C:\dev\helios\src\core\gate.js` and all helios PROTECTED-PATHS (per helios
>   `CLAUDE.md`) — human-signed design; M8 hardened *around* it without touching it.
> - Accepted ADRs (ADR-001, ADR-002) — amend-by-new-ADR only, never edit.
> - `docs/evidence/*` in helios and `docs/architecture/*certification*.md` in ECC-main —
>   dated records.
> - No new projects inside ECC-main; no secrets in code, chat, or logs, ever.
>
> **Global conventions:** CommonJS, Node ≥18, no TypeScript, lowercase-hyphen filenames,
> tests mirror source layout and run standalone. ECC hooks exit 0 on non-critical errors.

---

## C1 — ECC-main administrative closure

### C1-T1 — Commit the M3 artifacts *(operator consent required first)*

- **Objective:** get the untracked, passing M3 contract suite into history.
- **Files expected:** `tests/fixtures/mode-doctor-captures/` (9 files),
  `tests/scripts/mode-doctor-contract.test.js` — `git add` + one commit, message
  `test: add mode-doctor-contract suite from banked M2 captures [M3]`.
- **Forbidden:** editing any of those files while committing; everything in the global list.
- **Notes:** commit on the mission branch pre-merge unless the operator directs
  otherwise (open decision #2 in PROJECT-STATE.md). The stale line in
  `tests/fixtures/mode-doctor-captures/README.md` (claims captures "still missing") may
  be corrected in this commit if the operator agrees — one-line change, called out.
- **Testing:** `node tests/scripts/mode-doctor-contract.test.js` (19/19) from the
  committed state; `git status --short` no longer lists either path.
- **Done when:** both checks above observed and pasted.

### C1-T2 — Branch disposition packet + merge execution

- **Objective:** give the operator a one-page merge-or-decline packet for
  `night-shift/2026-07-09`, then execute the decision.
- **Files expected:** a short packet (chat or `docs/drafts/` note): the 7 commits,
  diffstat (`git diff main...HEAD --stat`), the fact that `scripts/` is untouched,
  pointers to `.night-shift/journal/cycle-00[1-5].md`. If merged: the merge commit.
- **Forbidden:** rewrite/squash/force-push of the mission commits; pushing anywhere
  without explicit consent.
- **Notes:** `main` has zero commits the branch lacks — a fast-forward or plain merge
  is clean. All 7 commits are test-only.
- **Testing:** post-merge `node tests/run-all.js` on `main` reproduces 2736/2738
  (or 2738/2738 once C1-T3 lands).
- **Done when:** a written decision exists and, if merge, the suite result on `main` is captured.

### C1-T3 — Resolve the `.agents/skills/source-command-*` dirs

- **Objective:** clear the sole blocker to full-suite exit 0, per the operator's chosen
  option (fix, regenerate, or delete — present the three options, then execute one).
- **Files expected (fix path):** in each of the 3 dirs: unquote `name:` frontmatter in
  `SKILL.md`, add missing `agents/openai.yaml`. (Delete path: remove the 3 dirs.)
- **Forbidden:** loosening `tests/ci/codex-skill-surface.test.js` — the test is correct.
- **Notes:** these are operator-generated scaffolds (`source-command-add-language-rules`,
  `-database-migration`, `-feature-development`). Mirror an existing valid skill dir for
  the exact frontmatter/openai.yaml shape before editing.
- **Testing:** `node tests/run-all.js` exits 0, zero failures.
- **Done when:** suite exit 0 observed and pasted.

### C1-T4 — CO promotion decision record

- **Objective:** put the rc.1 → v1.0.0 question to the operator with both options
  argued (promote now — the certification's condition, one real supervised mission, is
  met; or hold until O1 closes at M12), and record the answer.
- **Files expected:** one dated decision entry — in
  `docs/CHIEF-ORCHESTRATOR-ARCHITECTURE.md`'s decision log **or** a dated note in
  `~/.claude/orchestrator/reports/`. No code.
- **Forbidden:** re-litigating decisions D1–D7; editing the certification document.
- **Notes:** this is a decision *record*, not a version bump — any version-string
  change follows the decision as its own commit if the operator wants it.
- **Testing:** none (docs). **Done when:** the dated record exists and names the decision.

---

## C2 — helios consolidation commit

### C2-T1 — Commit plan for the uncommitted M0–M8 tree

- **Objective:** a reviewable plan that groups helios's staged + untracked files into
  milestone-shaped commits (M0 docs → M1 governance → M4 engine → M5 core-minimal →
  M6 telegram → M7 memory → M8 core-complete → config/lockfile), each with a
  conventional message, plus a secret sweep and a `.gitignore` sanity check
  (`coverage/`, `node_modules/` must not be committed).
- **Files expected:** the plan as a note (chat or `docs/` draft in helios). No commits yet.
- **Forbidden:** committing anything (operator triggers); editing any source file;
  touching `C:\dev\helios-memory` (the vault is its own repo).
- **Notes:** cross-check each commit group against the CHANGELOG's milestone entries —
  the CHANGELOG is the narrative the history should match. Check `git check-ignore`
  on `coverage/` and confirm `package-lock.json` *should* be committed (it should —
  pinned grammY per ADR-006). Flag ADR-000/003/006 "proposed" status for the operator:
  accepting them is a one-line status edit each, operator's call, done before or after
  the commit series but recorded.
- **Testing:** `node tests/run-all.js` in helios (191/191) before proposing;
  `git status` dry-read only.
- **Done when:** the operator has a plan they can approve line by line.

### C2-T2 — Execute the consolidation commits *(operator triggers)*

- **Objective:** run the approved plan; leave `git -C C:\dev\helios status` clean.
- **Files expected:** git index/history only; possibly one-line ADR status edits if the
  operator accepted them in C2-T1.
- **Forbidden:** deviating from the approved plan; pushing to any remote (the MEM-19
  backup remote is a separate operator-reserved decision — note it, don't take it).
- **Testing:** suite 191/191 from the committed tree; `git status` clean; `git log
  --oneline` reads as the milestone narrative.
- **Done when:** all three observed and pasted.

---

## C3 — Phase-1/Phase-2 exit verification *(operator-led; builder prepares)*

### C3-T1 — M6 live verification: phone round trip + second-account negative test

- **Objective:** the two live Telegram checks: a whitelisted phone sends a message and
  gets a reply through the full slice (phone → daemon → `claude -p` → phone); a
  non-whitelisted second account is silently dropped with exactly one log line.
- **Files expected:** `docs/evidence/M6-live-roundtrip-<date>.md` in helios capturing
  both transcripts (redact IDs/token; secret scan before commit).
- **Forbidden:** editing channel source to make it pass — a failure here is a finding,
  reported per the Stuck Ladder, not patched silently.
- **Notes:** launcher is `scripts/start-telegram.js`; setup steps in
  `docs/telegram-setup.md`. Token comes from env (interim, `TODO(H7)`).
- **Testing:** the live checks themselves + `node tests/run-all.js` still green.
- **Done when:** evidence file exists with both transcripts, committed (operator consent).

### C3-T2 — M7 live verification: Obsidian observation

- **Objective:** observe (not assume) that an entry admitted via the memory API is
  visible and well-formed in Obsidian over the vault at `C:\dev\helios-memory`, with
  provenance fields intact, and that hidden state does not appear in the vault view.
- **Files expected:** `docs/evidence/M7-obsidian-observation-<date>.md`.
- **Forbidden:** any Obsidian plugin (F11 — direct filesystem access only); editing
  vault records by hand.
- **Testing:** `node scripts/memory-doctor.js validate --json` exit 0 before and after.
- **Done when:** the evidence file records what was seen, committed.

### C3-T3 — 7-day soak protocol + day-7 exit review

- **Objective:** run the Phase-1 soak (daily real use of the Telegram slice, ledger
  producing real numbers) concurrently with the M7 vault soak and M8 slice-stability
  window; close with a day-7 review against the roadmap's exit criteria.
- **Files expected:** a one-line-per-day log + day-7 summary in `docs/evidence/`
  (e.g. `phase1-soak-<start>-<end>.md`); no code.
- **Forbidden:** "fixing" things mid-soak without logging (a soak with silent patches
  certifies nothing — log every intervention; a substantive fix restarts the clock,
  operator's call).
- **Testing:** daily `node scripts/helios-doctor.js status --json` and
  `node scripts/memory-doctor.js status --json` exit 0; ledger file shows the day's numbers.
- **Done when:** 7 consecutive days logged; day-7 summary states Phase-1 and Phase-2
  exit criteria each as observed or failed.

---

## M9 — Actuation layer

### M9-T1 — Draft ADR-004 (capability contract)

- **Objective:** `docs/adr/ADR-004-capability-contract.md` instantiating the Extension
  Standard: capability name, param schema, reversibility class, dry-run, typed errors
  (incl. `backend-unavailable`), registry row shape, MCP backend row.
- **Files expected:** the ADR only (ADS-13 frontmatter, status `proposed`), + one
  `docs/adr/INDEX.md` row.
- **Forbidden:** any `src/` change; inventing contract surface beyond the Extension
  Standard (this ADR *instantiates*, it does not design).
- **Notes:** read the Extension Standard (helios corpus) A1–A9/B1–B9 and ADR-002's
  envelope first; the reversibility classes come verbatim from Constitution VII.
- **Testing:** `node tests/run-all.js` — the ADR lint must pass on the new file.
- **Done when:** ADR proposed, lint green, INDEX row present.

### M9-T2 — ADR-004 adversarial review + acceptance

- **Objective:** one independent adversarial pass (checklist: side-door risk, class
  ambiguity, registry-row completeness, dry-run semantics), findings addressed, owner
  accepts (human signature only needed if an irreversible capability ships now — none
  of #1–#4 are).
- **Files expected:** review note appended to the ADR or in `docs/evidence/`; status
  flip to `accepted`.
- **Forbidden:** starting capability code before acceptance.
- **Testing:** ADR lint green. **Done when:** status `accepted` with the review note.

### M9-T3 — Capability #1 (`open-app`) + the registry

- **Objective:** first capability end-to-end: `src/actuation/open-app/` (launch
  Music/Gmail/Drive via URL / shell association), the registry data file, router
  wiring so capabilities resolve **only** through the registry, and the side-door test
  (direct invocation bypassing the gate throws).
- **Files expected:** `src/actuation/open-app/*`, `src/actuation/registry.json` (name
  per ADR-004), router edit **only** at the capability-dispatch seam,
  `tests/actuation/open-app.test.js`, side-door + gate-integration tests, doc stub.
- **Forbidden:** `gate.js`; any envelope/ADR-002 change; capability code outside its
  directory (other than the registry row + the single dispatch seam).
- **Notes:** A7 test set per capability: unit, gate-integration, dry-run,
  hostile-if-parsing, live smoke. Reversibility class: read/open-class → `allow`.
- **Testing:** `node tests/run-all.js`; live smoke: invoke via a routed envelope and
  watch the app open (capture in evidence).
- **Done when:** suite green, side-door test red-proofed (shown failing when the guard
  is stubbed out, then green), live smoke captured.

### M9-T4 — Capability #2

- **Objective:** second `open-app`-class capability per the registry plan (per ADR-004
  scope — e.g. a second app family or URL-scheme target), copying #1's shape exactly.
- **Files expected:** `src/actuation/<name>/*`, one registry row,
  `tests/actuation/<name>.test.js`.
- **Forbidden:** edits outside the capability directory + one registry row (the #4
  discipline starts now); `gate.js`; router.
- **Testing:** suite + A7 set + live smoke. **Done when:** same bar as M9-T3, and the
  diff shows zero files outside the directory + registry.

### M9-T5 — Capability #3 (`search-files`)

- **Objective:** first parsing capability: `search-files` over an allowlisted root set
  — the hostile-input test case of the batch.
- **Files expected:** `src/actuation/search-files/*`, registry row, tests incl.
  hostile-path fixtures (traversal `..\`, absolute escapes, unicode tricks).
- **Forbidden:** shell-string interpolation of user input (spawn with arg arrays);
  roots outside the allowlist; `gate.js`/router edits.
- **Notes:** this one gets security-reviewer attention (file-system-touching).
  Read-class → `allow`, but the hostile fixtures must show containment.
- **Testing:** suite; hostile fixtures green; live smoke from the phone.
- **Done when:** security review shows zero CRITICAL/HIGH; evidence captured.

### M9-T6 — Capability #4 by a cheaper model, verbatim template (the factory proof)

- **Objective:** prove the extension factory: a fully-specified fourth capability built
  by the cheapest tier from the roadmap's verbatim template: *"Add capability `<name>`
  copying `src/actuation/<existing>/` exactly; one registry row; zero files outside
  your directory; run `node tests/run-all.js`; paste output; stop on any ambiguity."*
- **Files expected:** `src/actuation/<name>/*` + one registry row + its test file. Nothing else.
- **Forbidden:** everything else — that is the point. The reviewer checks the diff is
  exactly directory + row.
- **Testing:** pasted `node tests/run-all.js` output from the builder; reviewer re-runs.
- **Done when:** diff clean, suite green, and the milestone can claim "capability #4
  shipped with zero core edits".

### M9-T7 — M9 acceptance walk + evidence

- **Objective:** walk the A9/B9 checklists box-by-box per capability; capture the
  "open Gmail from Telegram, observed on the phone" evidence; write
  `docs/evidence/M9-actuation-<date>.md`; CHANGELOG entry.
- **Files expected:** evidence file + CHANGELOG edit only.
- **Forbidden:** code changes (a failed box reopens the owning task instead).
- **Testing:** full suite; the live phone invocation.
- **Done when:** every H6 acceptance criterion has an observed line in the evidence file.

---

## M10 — Security hardening

### M10-T1 — Threat model draft

- **Objective:** `docs/THREAT-MODEL.md`: assets, trust boundaries, the three attacker
  stories (hostile Telegram sender; malicious fetched content; stolen laptop),
  mitigations mapped to existing controls, residual risks, **and the F7
  subscription-terms question placed on the sign-off agenda**.
- **Files expected:** the document only.
- **Forbidden:** code; weakening any existing control on paper.
- **Notes:** ground every "mitigated by X" claim in a real file/test (cite paths); the
  gate-bypass suite and hostile fixtures already exist — the model maps them.
- **Testing:** none (docs) — every cited path must resolve.
- **Done when:** complete draft queued for review with zero unresolved citations.

### M10-T2 — Threat-model adversarial pass + human signature *(gate — sign-off 3 of 3)*

- **Objective:** independent adversarial review (optional Fable slot #3), findings
  folded in; then the operator signs the threat model, answers F7 on the record, and
  explicitly approves or defers unattended operation.
- **Files expected:** review findings + a dated signature/approval block in the
  threat model.
- **Forbidden:** proceeding to M12 without this signature.
- **Done when:** signature block present with the F7 answer and the unattended decision.

### M10-T3 — `src/core/secrets.js` (OS-backed secret store)

- **Objective:** Windows Credential Manager/DPAPI-backed secret store behind a small
  API (`get/set/delete`), with the env stub retained as an explicit fallback until
  cutover is verified.
- **Files expected:** `src/core/secrets.js`, `tests/core/secrets.test.js`,
  possibly a mini-ADR if a native dependency is adopted (ADS-03 — one candidate
  evaluation, pinned).
- **Forbidden:** `gate.js`; logging secret values in any code path incl. errors;
  storing secrets in the vault (memory layer already rejects credential patterns —
  do not route around it).
- **Notes:** bounded research first: DPAPI from Node (native module vs `cmdkey`/
  PowerShell bridge); pick the simplest auditable path. Round-trip test uses a
  fake/test credential name, cleaned up after.
- **Testing:** `node tests/run-all.js`; store→read→delete round trip; grep the repo
  and test output for the test value → zero hits after cleanup.
- **Done when:** round trip green and the fallback path is test-covered.

### M10-T4 — Telegram token cutover

- **Objective:** move the bot token from env stub to the secret store; remove the
  `TODO(H7)` markers; keep a controlled env fallback only if the threat model blessed one.
- **Files expected:** `src/channels/telegram/transport.js` (or its config seam),
  `scripts/start-telegram.js`, matching tests.
- **Forbidden:** printing the token anywhere; committing any real token (if one was
  ever in a dotfile or shell profile, tell the operator to **rotate it**).
- **Testing:** suite green; live start via `scripts/start-telegram.js` with the token
  only in the credential store; secret scan zero hits.
- **Done when:** live start observed with env var absent.

### M10-T5 — Hostile-suite expansion

- **Objective:** extend the existing hostile fixtures with unicode/homoglyph/zero-width/
  encoded-injection cases across the channel translate path and any parsing capability.
- **Files expected:** fixture files + assertions in the existing hostile test files
  (`tests/channels/telegram/`, `tests/actuation/`).
- **Forbidden:** source changes to make fixtures pass without review — a fixture that
  fails found a real bug; report it, fix it as its own commit.
- **Testing:** suite green; each new fixture demonstrably exercised (mutate one → red).
- **Done when:** the fixture list covers the threat model's named tricks.

### M10-T6 — ADR-005 + clean `/security-scan`

- **Objective:** ADR-005 (security posture: secret store choice, fallback policy,
  hostile-input stance) proposed→accepted; run `/security-scan` (ECC AgentShield)
  against helios surfaces and commit the clean output as evidence.
- **Files expected:** `docs/adr/ADR-005-*.md`, INDEX row,
  `docs/evidence/M10-security-scan-<date>.md`, CHANGELOG entry.
- **Forbidden:** editing scan output; suppressing findings without a written waiver.
- **Testing:** ADR lint; the scan itself, zero CRITICAL/HIGH.
- **Done when:** committed scan evidence + accepted ADR.

---

## M11 — Operations

### M11-T1 — Autostart config + install script

- **Objective:** Task Scheduler autostart for the daemon: an XML/`schtasks` definition
  plus an idempotent install/uninstall script.
- **Files expected:** `scripts/install-autostart.js` (or `.ps1` — match what the
  runbook can execute verbatim), task definition file, uninstall path.
- **Forbidden:** `src/` changes; running with elevated privileges beyond what the
  task needs; auto-enabling on the operator's machine without their trigger.
- **Notes:** the Task Scheduler credential context is the F7 empirical question —
  the task must run as the operator's user so subscription auth resolves.
- **Testing:** install → task exists (`schtasks /query`) → manual run starts the
  daemon → uninstall removes it. Each step pasted.
- **Done when:** the cycle above observed once end-to-end.

### M11-T2 — OPERATIONS.md runbook + kill-recovery drill

- **Objective:** `docs/OPERATIONS.md` — start/stop/status/logs/where-state-lives/
  recovery — with **every documented command executed once and its output pasted**;
  plus the measured drill: forced kill → service auto-restored < 60 s on a fresh boot.
- **Files expected:** the runbook + a drill log in `docs/evidence/`.
- **Forbidden:** documenting commands that were not run (the Verification Table rule).
- **Testing:** the drill, timed; `helios-doctor status --json` exit 0 after recovery.
- **Done when:** runbook complete, drill time recorded < 60 s.

### M11-T3 — Doctor liveness under Task Scheduler (the F7 line)

- **Objective:** prove `helios-doctor` reports alive/current on a daemon that Task
  Scheduler started (not a shell) — the service-context auth question answered empirically.
- **Files expected:** evidence note only (append to the drill log).
- **Forbidden:** shell-starting the daemon and calling it scheduled.
- **Testing:** reboot or task-trigger → `node scripts/helios-doctor.js status --json`
  exit 0 while a live message round-trips.
- **Done when:** the F7 acceptance line is an observed fact in evidence.

---

## M12 — Allowlists + O1 closure

### M12-T1 — Draft both allowlists

- **Objective:** per-repo `.claude/settings.json` permission allowlists for helios and
  ECC-main, seeded from `/fewer-permission-prompts` transcript analysis, each line with
  a one-phrase justification.
- **Files expected:** the two settings files (draft branch or presented diff) + the
  justification sheet.
- **Forbidden:** **any push/deploy/send/delete-class entry**; wildcards that swallow a
  class; weakening the permission model to avoid a hang ("fix the allowlist, never
  weaken the model").
- **Testing:** JSON validity; a dry attended `/night-shift` run showing reduced prompts.
- **Done when:** the justification sheet covers every line, queued for review.

### M12-T2 — Human line-by-line review *(gate)*

- **Objective:** the operator approves/strikes each line. No builder discretion.
- **Files expected:** the final committed settings files.
- **Done when:** every surviving line carries the operator's explicit approval.

### M12-T3 — The unattended run + O1 closure note

- **Objective:** schedule ONE real `claude -p "/night-shift …"` mission (one-off
  scheduled task — M14's adapter does not exist yet, and must not); supervise with a
  CO pass; capture journal + doctor evidence; write the O1 certification/closure note
  (or document the workaround if headless slash expansion fails — a failure here is a
  first-class finding, not a defeat).
- **Files expected:** the O1 note (CO architecture decision log or dated report),
  evidence captures; **no ECC `scripts/` changes**.
- **Forbidden:** permission-bypass flags; retrying with a weakened model; M14 adapter work.
- **Testing:** mission reaches a cycle boundary, zero permission hangs;
  `node scripts/night-shift-doctor.js status --dir <repo> --json` exit 0 at wrap.
- **Done when:** O1 is closed in writing either way (certified or workaround documented).

---

## M13 — Cost telemetry (Lane B — can start now)

### M13-T1 — Cost extraction script + fixtures

- **Objective:** a read-only extraction over the cost-tracking SQLite (read the real
  schema in `skills/cost-tracking/` / its scripts first — never recall it) that answers
  "spend for window X", with fixture tests incl. the absent-DB case.
- **Files expected:** one script under ECC `scripts/` (lowercase-hyphen; follows
  hook conventions), `tests/scripts/<name>.test.js`, fixtures under `tests/fixtures/`
  (a new subdir — never touch `mode-doctor-captures/`).
- **Forbidden:** writing to the DB; changing `cost-report` itself; any doctor change.
- **Testing:** `node tests/run-all.js`; absent-DB case returns the graceful note, not a throw.
- **Done when:** suite green including the new tests; script output matches
  `/cost-report` for one real window (captured).

### M13-T2 — CO supervision-pass cost line

- **Objective:** extend the CO skill's supervision-log line format with the Budget/cost
  section per the reserved extension point — **extend, never replace, the line format**.
- **Files expected:** `skills/chief-orchestrator/SKILL.md` (the log-format section),
  schema doc line; no doctor changes.
- **Forbidden:** touching `night-shift-doctor`/`orchestrator-doctor` JSON; renaming
  existing log fields.
- **Testing:** the M3 contract suite still 19/19 (proves no doctor drift);
  `node tests/run-all.js` green.
- **Done when:** the skill documents the cost line and a sample pass produces it.

### M13-T3 — Two live cross-checked passes

- **Objective:** run two consecutive real CO supervision passes whose cost lines
  match `/cost-report` for the same window (first one cross-checked and captured).
- **Files expected:** the two passes' report entries in `~/.claude/orchestrator/reports/`.
- **Forbidden:** synthesizing numbers; running a mission just to burn spend (piggyback
  on real activity, e.g. NS-2 if chartered).
- **Done when:** both passes exist with live, matching cost lines.

---

## M14 — Scheduler adapter + the one NightShift unfreeze

### M14-T1 — B1 decision brief *(human decision before any code)*

- **Objective:** present the two dispatch mechanisms (extension file-reader vs OS Task
  Scheduler adapter) with the CO architecture §5.3/§10 trade-offs; the operator
  decides; record it as an ECC ADR.
- **Files expected:** the brief + the decision ADR (follow ECC's ADR placement —
  `docs/architecture/`). No code.
- **Forbidden:** starting M14-T2..T4 before the decision is recorded.
- **Done when:** dated, signed decision ADR exists.

### M14-T2 — The unfreeze bundle (one change, re-certified)

- **Objective:** the single sanctioned NightShift thaw: (a) `.night-shift/`
  concurrency lockfile (F9); (b) the F3 revert-guard sentence in the night-shift
  command's JUDGE step; (c) `schemaVersion` in **both** doctors' JSON (O3); (d) flip
  the dormant `schemaVersion` assertion in
  `tests/scripts/mode-doctor-contract.test.js` from skipped to active.
- **Files expected:** `commands/night-shift.md` (JUDGE sentence),
  `scripts/night-shift-doctor.js` + `scripts/orchestrator-doctor.js` (the one field),
  the lockfile logic wherever the night-shift skill/command holds cycle state, the
  contract test (assertion activation only), matching doctor-suite updates.
- **Forbidden:** any other doctor field/exit-code/text change; `.night-shift/` mission
  *data* (the closed mission stays untouched — the lockfile is protocol, not history);
  doing this while ANY mission is active anywhere.
- **Notes:** this is a **deliberate contract change** — the M3 suite failing first is
  correct; update fixtures/assertions as part of the same commit, called out. A
  lockfile contention test is mandatory (second mission attempt refuses).
- **Testing:** M3 contract suite green **post-change with the version assertion
  active**; both doctor suites green; `node tests/run-all.js` green.
- **Done when:** one commit (or tight series) + all suites green.

### M14-T3 — Re-certification note

- **Objective:** the Handbook §8 mini-certification: what was thawed, what re-froze,
  the suite evidence, the new `schemaVersion` value — a dated note in
  `docs/architecture/`.
- **Files expected:** the note only. **Forbidden:** editing the original certification.
- **Done when:** note committed; NightShift is formally Frozen again.

### M14-T4 — ScheduleAdapter + missed-slot detection

- **Objective:** the adapter (`list/upsert/remove` over
  `~/.claude/orchestrator/queue.json`) per the B1-chosen mechanism, with missed-slot
  detection (fixture-tested: a slot in the past is detected and re-emitted once).
- **Files expected:** the adapter module (ECC `scripts/` or the extension, per B1),
  `queue.json` schema doc, fixture tests.
- **Forbidden:** auto-dispatch of anything beyond the sanctioned nightly mission
  shape; bypassing M12's allowlists; touching doctor JSON (schemaVersion landed in T2).
- **Testing:** unit fixtures; one live queue entry → mission fires untouched, observed.
- **Done when:** live fire observed once + missed-slot fixture green.

### M14-T5 — CO dispatch section + week-long soak

- **Objective:** update the CO skill's dispatch section (queue semantics, adapter
  ops); then one week of nightly auto-dispatch with zero manual loads.
- **Files expected:** `skills/chief-orchestrator/SKILL.md` dispatch section; the
  week's reports.
- **Forbidden:** manual queue loads during the soak (that's the metric).
- **Done when:** 7 nights, zero manual interventions, reports traceable to doctor reads.

---

## B1 — Engineering Brain V1 (optional lane)

### B1-T1 — Registry + repo layout

- **Objective:** `C:\dev\engineering-brain\registry\registry.json` with 30–60 curated
  entries across ECC-main + helios (including the roadmap and Integration Playbook,
  each with `last_verified` dates).
- **Files expected:** registry + repo skeleton per blueprint §8. Brain repo only.
- **Forbidden:** copying knowledge *into* the brain (it stores pointers, never content);
  touching ECC-main/helios.
- **Testing:** every cited path in the registry resolves (scripted check).
- **Done when:** registry validates; zero dead paths.

### B1-T2 — Compiler templates + pack export

- **Objective:** `compiler/prompt-template.md`, `compiler/models.json`,
  `scripts/export-packs.js`; first pack exported; packs gitignored.
- **Files expected:** those four; `.gitignore` entry for packs.
- **Forbidden:** two-way sync; committing packs.
- **Testing:** run the export on a real task's entry set; open the pack.
- **Done when:** one real pack generated from the registry.

### B1-T3 — 10-task trial + kill/continue call

- **Objective:** compile 10 real tasks through the brain (M9+ handoffs are candidates);
  one-line outcome log each; honest kill/continue decision at 10.
- **Files expected:** outcome log + the decision note, in the brain repo.
- **Done when:** the decision is recorded — either answer is a success.

---

## NS-2 — install-lifecycle split (optional; dispatched as a NightShift mission, not tasks)

Not decomposed here by design: NightShift missions self-decompose into cycles under
their own protocol. The charter (via `/chief`) must carry: characterization-first
cycles; `scripts/lib/install-lifecycle.js` (1226L) target with `install-executor.js`
(738L) watched; the B5 OneDrive flag; the F3 revert-guard line; no public-contract
change without a called-out contract commit. Prerequisite: C1 complete (clean tree).
