# MODEL-ASSIGNMENT — who builds what, and why

> Companion to [IMPLEMENTATION-BACKLOG.md](IMPLEMENTATION-BACKLOG.md) and
> [CODING-SESSIONS.md](CODING-SESSIONS.md). Task IDs refer to the backlog.
>
> **The binding rule this document must honor** (HELIOS Program §4, upheld verbatim by
> the roadmap): *Sonnet is the default builder; Haiku takes fully-specified work; the
> human takes the sign-off points; **no frontier model builds anything.** Fable/Opus
> appear in exactly one role — optional adversarial reviewer at protected-class gates.*
> Codex is not in the Program's taxonomy; this document slots it in without changing
> the rule: Codex is a **Sonnet-tier substitute builder** for isolated, fully-specified,
> non-protected-path code — an operator convenience choice (e.g. quota), never a
> capability upgrade.

## Tier definitions

| Tier | Role | Hard limits |
|---|---|---|
| **Human (operator)** | All sign-offs, merges, commits-by-consent, soaks, live phone checks, allowlist lines, B1 mechanism decision | Cannot be substituted by any model at any gate |
| **Fable / Opus** | Adversarial **review only** at protected-class gates; program-architecture docs (like this set) | Never a builder; a Fable review sharpens the brief for the human signature, never replaces it |
| **Sonnet** | Default builder: design + build, contract-adjacent code, security-touching code (under review), ADR drafting | Protected paths only via the ADR/consent process like anyone else |
| **Codex** | Substitute builder for self-contained modules with a complete spec and a runnable test command | Never on: the gate, secrets, doctors' JSON, ADR drafting, NightShift/CO skill semantics, anything needing repo-wide or corpus context |
| **Haiku / cheaper** | Fully-specified, checklist-shaped work: copy-a-pattern builds, fixture suites, ops wiring, doc-sync | Stops on any ambiguity by instruction; never given design latitude |

## Why the split falls this way

- **Judgment concentrates at contracts, not code volume.** The expensive mistakes in
  this program are contract mistakes (doctor JSON, ADR-002 envelope, gate semantics,
  memory schema) — all guarded by human sign-off + review, so frontier capability is
  spent on *adversarial review at those gates*, where one found flaw pays for the
  whole review. Everything downstream of an accepted contract is deliberately
  buildable by mid-tier models — the corpus was written to make that true.
- **Codex's strength is isolated code generation against a spec; its weakness here is
  context.** It has no standing knowledge of the Mode Doctor Contract, the freeze
  discipline, PROTECTED-PATHS, or ECC's hook conventions, and it doesn't run the
  repo's Claude-specific review agents. So it gets tasks whose full contract fits in
  the task card and whose success is one command (`node tests/run-all.js`), and it
  never touches surfaces where "plausible but off-contract" is expensive.
- **Haiku on the factory proof is the point, not a cost hack.** M9-T6 exists to prove
  the extension model works for the cheapest tier; giving it to a stronger model would
  invalidate the milestone's claim.

## Assignments

### Build tasks

| Task | Builder | Why |
|---|---|---|
| C1-T1 M3 commit | Any tier (mechanical) + ✋ consent | Two git commands; consent is the substance |
| C1-T2 merge packet | Sonnet | Summarizing 7 commits + evidence pointers needs repo context, no code |
| C1-T3 source-command fix | **Haiku or Codex** | Copy-a-valid-shape work; success = suite exit 0; fully specified by the failing test |
| C1-T4 promotion record | Sonnet (drafts both options) + ✋ | Decision framing needs CO-certification context |
| C2-T1 helios commit plan | **Sonnet** | Must map files → CHANGELOG narrative; secret sweep judgment; wrong grouping pollutes history permanently |
| C2-T2 execute commits | Operator-triggered, Sonnet assists | Consent-gated by helios convention |
| C3-T1..T3 live checks + soak | **Human** (builder writes the protocol sheet) | Live phone, Obsidian eyes, calendar time — not model work |
| M9-T1 ADR-004 draft | **Sonnet** | ADR drafting instantiates the Extension Standard — corpus context required |
| M9-T3 capability #1 + registry | **Sonnet** | Establishes the pattern everything copies; touches the router's one dispatch seam |
| M9-T4 capability #2 | **Codex or Haiku** | Pure copy-the-pattern with a clean diff rule; spec complete once #1 exists |
| M9-T5 capability #3 (search-files) | **Sonnet** | Hostile-input parsing + security review — the riskiest capability of the batch |
| M9-T6 capability #4 | **Haiku, mandatorily** | The factory proof; the milestone's claim is "the cheapest tier can extend the system" |
| M10-T1 threat model draft | **Sonnet** | Must map mitigations to real files/tests across the whole repo |
| M10-T3 secrets.js | **Sonnet** | Security-critical, bounded research (DPAPI), fallback policy judgment |
| M10-T4 token cutover | Sonnet | Small but touches the secret path end-to-end |
| M10-T5 hostile fixtures | **Haiku** (from Sonnet's case list) | Enumerable fixture writing; the case list is the design, done at T1 |
| M10-T6 ADR-005 + scan | Sonnet | ADR + interpreting scan findings |
| M11-T1 autostart script | **Haiku or Codex** | Fully specified: schtasks install/uninstall cycle with pasted proof |
| M11-T2 runbook + drill | **Haiku** (drill timed by operator) | "Execute every command once, paste output" is checklist-shaped by design |
| M11-T3 F7 liveness line | Operator + Haiku | A reboot and two commands |
| M12-T1 allowlist drafts | **Sonnet** | Each line needs a justification the operator can judge; over-broad lines are the risk |
| M12-T3 unattended run + O1 note | Sonnet + ✋ | Interpreting a possible O1 failure is a finding-writing task, not mechanical |
| M13-T1 cost extraction script | **Codex or Sonnet** | Self-contained read-only module; real schema readable from the repo; success = suite + one cross-check |
| M13-T2 CO cost line | **Sonnet** | Extends the supervision-log contract — CO skill context required, contract-adjacent |
| M14-T1 B1 brief | Sonnet + ✋ decision | Presents §5.3/§10 trade-offs already written; no invention allowed |
| M14-T2 unfreeze bundle | **Sonnet, exclusively** | The single sanctioned contract change to a frozen certified system; doctors + contract test + command semantics in one deliberate change |
| M14-T3 re-cert note | Sonnet | Certification writing against suite evidence |
| M14-T4 ScheduleAdapter | **Sonnet** (Codex acceptable for the queue-file CRUD once the B1 ADR fixes the mechanism) | Missed-slot semantics need care; the CRUD core is spec-complete after the ADR |
| M14-T5 dispatch doc + soak | Sonnet + operator week | Skill-doc contract writing |
| B1-T1..T3 Brain V1 | **Sonnet** | "Curation is the work" (blueprint); registry judgment, low risk |
| NS-2 mission | NightShift protocol (Sonnet-tier cycles) | Missions self-decompose; charter via `/chief` |

### Review and gate duties

| Gate | Reviewer | Acceptor |
|---|---|---|
| ADR-004 adversarial pass (M9-T2) | code-reviewer agent; Fable pass optional | Owner (human only if an irreversible capability ships) |
| Capability #3 security | security-reviewer agent | — |
| Threat model (M10-T2) | security-reviewer + **Fable review slot #3 (recommended)** | **Human — sign-off 3 of 3** + F7 answer + unattended approval |
| Allowlists (M12-T2) | — | **Human, line by line** |
| B1 mechanism (M14-T1) | — | **Human**, recorded as ADR |
| Unfreeze re-certification (M14-T3) | code-reviewer; **Fable pass optional** | Human reads the re-cert note |
| Every code session | code-reviewer agent in-session (ECC convention) | — |

### Standing prohibitions (any model, any tier)

- No model merges, pushes, or commits without current-session operator consent.
- No model edits `.night-shift/` mission data, accepted ADRs, dated evidence, or
  certification records — ever.
- No frontier model (Fable/Opus) takes a build task, even if idle and capable — the
  Program's builder rule is about auditability and cost discipline, not capability.
- Codex output lands only through the same review gates as everything else
  (code-reviewer pass + suite green); "it's a small module" waives nothing.
- Any task that discovers ambiguity stops and reports (Stuck Ladder rung 5) rather
  than resolving it by invention — at every tier, but non-negotiable for Haiku/Codex.

## Cost shape (indicative)

Frontier spend concentrates in ~3 review slots (threat model, optional ADR-004 and
re-cert passes) plus program-architecture upkeep. Sonnet-tier carries ~70% of build
sessions (S3, S5–S8, S10, S12, S13, S15–S18, SP1). Haiku/Codex carry the rest
(S2, S9's build half, S14, parts of S8/M13) — roughly a quarter of sessions at a
fraction of the cost, each with a one-command success check that makes weak output
cheap to detect and redo.
