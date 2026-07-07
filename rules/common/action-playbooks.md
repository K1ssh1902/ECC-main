# The Playbook — Action Parity Standard

> Companion to [legacy.md](legacy.md). The Legacy teaches judgment; this file writes
> down the MOVES — the exact action sequences a stronger model runs, so any model can
> run them. You cannot borrow a bigger model's reasoning, but you can copy its actions
> exactly, and the actions carry most of the quality. Find the play that matches your
> task and run its moves in order, literally. Every move has a check; a move without
> its check is a move you did not make.

## Play 1 — Fix a bug

1. **Reproduce before reading code.** Run the failing thing; capture the exact error
   text. Can't reproduce → that is the finding; instrument or ask, never fix blind.
2. **Trace to origin.** From the error line, walk backward to where the bad state was
   *created* (search the symbol, read the caller). Fix the source, not the crash site.
3. **Pin it with a test** that fails for this exact reason. Watch it fail.
4. **Apply the smallest fix** that makes the test pass. No drive-by edits.
5. **Re-run the reproduction from move 1** and watch it pass. Run the surrounding
   test file too.
6. **Sweep for siblings.** Search for the same pattern elsewhere; report what you
   find — don't silently fix unrelated code.

## Play 2 — Build a feature

1. **Find prior art in-repo.** Search for the nearest similar feature and read it.
   Copy its shape: file placement, naming, error handling, test layout.
2. **State the contract** in three lines: inputs, outputs, failure behavior. This is
   your "done" definition.
3. **Write the test first** — or at minimum the assertion list.
4. **Implement the smallest vertical slice** that can be exercised end-to-end, then
   grow it. Never build all layers blind and integrate at the end.
5. **Run the feature itself**, not just its tests.
6. **Register it** wherever the repo registers such things (index, manifest, docs,
   README table). Find how the *last* similar feature registered itself and match it.

## Play 3 — Refactor / cleanup

1. **Green baseline first.** Run the tests before touching anything; record the result.
   No baseline → you cannot claim "behavior preserved" afterward.
2. **No functional edits mixed in.** Behavior changes get their own task.
3. **Move in mechanical steps** (rename, extract, relocate, delete), re-running the
   checks after each step — not once at the end.
4. **Search before deleting.** Every removal is preceded by a reference search; a
   zero-hit search is the license to delete, nothing else is.
5. **Read your own diff** end to end before declaring done.

## Play 4 — Investigate / answer a question

1. **Locate ground truth first** — the file, the log, the command output — before
   forming the answer. The answer is assembled from evidence, not recalled.
2. **Cite as you claim.** Every load-bearing statement carries its `file:line` or the
   command output that proves it.
3. **If the evidence contradicts the question's framing, that IS the answer.**
   Say so plainly instead of answering the question as posed.
4. **Stop at the answer.** Investigation is not an invitation to fix things uninvited;
   propose, don't patch.

## Play 5 — Change configuration / environment

1. **Read the current value and find its consumer** before changing anything.
2. **One setting at a time.** Change it, reload the consumer, observe the changed
   behavior — then the next setting.
3. **Hold the rollback.** Know the previous value; include it in your report.
4. **Prove the load.** A config edit is verified when the consuming tool has actually
   parsed it (doctor run, session start, lint pass) — not when the file is saved.

## The Verification Table — what "verified" means, per artifact

| You produced | "Verified" means you… |
|---|---|
| Code change | ran its test AND exercised the changed path in the running thing |
| New script | executed it on a real input and read the actual output |
| Config / hook / manifest | made the consuming tool load it and observed the effect |
| Documentation | resolved every link/path in it; ran any command it tells the reader to run |
| Test | watched it fail before the change and pass after |
| Deletion | searched for references first; checks still green after |
| Answer / analysis | backed every load-bearing claim with `file:line` or command output |

"It should work", "it compiles", "lint passes" — none of these appear in the table.
They are inputs to verification, never the verification.

## Tool discipline — how a stronger model spends its calls

- **Batch independent reads and searches** into one round; never fetch one-by-one
  what you could fetch at once.
- **Dedicated tools over shell:** Read not `cat`, Grep not `grep`, Glob not `find`,
  Edit not `sed`. Shell is for running things, not for touring files.
- **Look, then touch:** Read before Edit; Glob before create (it may already exist);
  Grep before rename or delete.
- **Search narrow-to-wide:** start with the exact symbol, widen the pattern only on
  zero hits. Wide-first drowns you in noise you then pay tokens to wade through.
- **Trust confirmations.** The tool said the edit applied → it applied. Re-reading
  your own writes is paying twice for the same fact.

## The Stuck Ladder — two failures, then climb

The same approach failing twice means the third identical try will fail too. Climb
one rung instead — each rung changes what you can SEE:

1. **Shrink the case** to the smallest input that still fails.
2. **Raise visibility:** print, log, or inspect the actual runtime values — not the
   values you believe are there.
3. **Read the source** of the failing thing (library, hook, config) instead of citing
   its documentation from memory.
4. **Search for precedent:** has this repo, its issues, or its git history solved
   this before?
5. **Report stuck honestly:** the exact attempts, the exact errors, ONE precise
   question. Ten minutes on the ladder beats an hour of confident retries — and
   rung 5 delivered well is a professional outcome, not a failure.

## The report — how every play ends

First sentence: the outcome. Then, only: what changed (files), what you verified
(the checks you ran and what you observed), what failed (the real error, verbatim),
what remains. Nothing else. If a reader must ask "but did you run it?", the report
has already failed.

*— Claude Fable 5, 2026-07-07*
