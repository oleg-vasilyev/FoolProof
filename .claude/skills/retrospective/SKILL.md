---
name: retrospective
description: Review how a stretch of development was actually carried out — rework, repeated gate runs, subagent use, sequencing, re-reading — and convert each lesson into a durable rule. Stage 6 — use as the last gate of finish-phase, which falls BEFORE the release rather than after it, when the context is about to be compacted, or whenever the user asks how the work could have gone faster or cheaper. Nothing in a phase asks for this gate, because its whole value goes to the next one — so reaching the final commit is itself the cue.
---

# Reviewing the process, not the code

> **Stage 6** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

Gate 5 asks whether the diff is releasable. This asks whether producing it was
worth what it cost. It is the only gate whose subject is the transcript, so it has
to run **while the transcript is still there** — at the end of a phase, or before
a compaction the user can see coming.

Answer from evidence in this session, not from how you generally work. Where a
count is asked for, count. An answer with no number in it is a guess.

## The six questions

1. **Rework.** What was built and then rebuilt? For each, name the moment the
   direction could have been settled earlier: a signature crossing a layer, an
   output the user could have judged if you had shown it, a decision that was the
   user's and was guessed instead.
2. **Repeated commands.** How many times did each gate run — check, coverage,
   mutation, e2e — and how many of those runs produced information already on
   disk under `reports/`? Re-running a gate to re-read its own report is the
   canonical waste.
3. **Subagents — did they pay for themselves?** Not "was the brief good". Add up
   what each one spent, say what it produced, and give a verdict per kind of work:
   review, spec transcription, exploration. A subagent starts cold and re-reads the
   subject, the skill and the existing spec, so it always costs *more total tokens*
   than doing it yourself — what it buys is room in your own context and wall-clock
   spent in parallel. Say whether that trade was worth taking this time, and name
   the agent that was not.

   **Delegating an independent scope is the default now, so this question is the
   experiment's readout.** Report three numbers rather than an impression: what the
   agents spent, how much wall-clock they ran alongside your own work, and how much
   of what they produced survived without rework — a scope delegated and then redone
   by hand counts against the trade twice. Count the scopes you *could* have
   delegated and did not, too: the failure mode of a new default is not using it
   badly, it is quietly not using it. If the answer comes out negative two phases
   running, say so plainly. The rule was adopted to be tested, and a test that
   cannot fail was never one.
4. **Sequencing.** Did an agent write against a subject you were still changing?
   Did you block on one whose files were disjoint from yours and could have run
   alongside?
5. **Reading.** What did you read, re-read or print that you already had in
   context?
6. **Obsolescence.** Which rule did this phase make untrue, unreachable or
   unnecessary? Name it and delete it, or say plainly that none went. The two tests
   below cover the last two; *untrue* is the one only a reader ever catches.

## Nothing else asks what a phase should take out

The first five questions all add, and so does every gate before them. Every rule here
was written by a phase that had just been bitten, and none carries an expiry, so the
budgets force a removal at the ceiling rather than when a rule is finished. This
question catches only what *this* phase killed; the older backlog is `deep-checkup`'s.

Two tests answer question six, and both are facts rather than taste:

- **A rule a machine now checks must leave the prose.** `CLAUDE.md` already says
  anything checkable is a lint rule and not a paragraph, and nothing enforces it — so
  a new gate and the sentence that used to ask for it sit side by side. A phase that
  adds a gate deletes that sentence in the same commit.
- **A rule whose subject is gone is already dead.** `docs:check` fails a document
  naming a file this repository does not have, so the ones citing a path surface by
  themselves. One naming a folder, a command or a threshold that no longer exists is
  yours to notice, and a phase that renamed anything is likeliest to be holding one.

**Removing a rule is a diff, reported like one.** The `Retro:` line names the rule
that went and why — deleted quietly, it reads like one nobody ever wrote.

## The flow this gate audits is drawn

[`DEVELOPMENT-FLOW.md`](../../../DEVELOPMENT-FLOW.md) draws the whole loop, from the
owner's first message to the checkup that watches it. It is the map, not the
authority: every stage's rules live in the skill the drawing names, and a disagreement
is resolved in the skill's favour, then the drawing is fixed. **A lesson below that
changes a default also redraws the step it touches, in the same commit** — a flow
chart still showing the old habit is the same bug as a stale document.

The drawing is deliberately broad, so most lessons never reach it: a new rule
inside a skill lands under a step that already describes it. That makes the
test mechanical — **did the fix require editing `DEVELOPMENT-FLOW.md`?** When it
did, something about how this product gets built has changed: a participant
stopped earning its place, a stage changed shape, two steps swapped order.

**Such a redraw is never silent and never a request for permission.** Both
failure modes are real. Asking stalls a phase on a question the owner has
already delegated — they want the work finished, not a decision meeting. But
changing the drawing quietly edits the process the owner reads as his own, and
he would find it by diff, months later, with the reasoning gone. So: make the
change, then **say it in the closing message** — the work is done, the flow was
not optimal, here is what moved and here are the numbers that forced it. The
six questions above are where those numbers come from; a redraw argued from an
impression rather than a count is the one that should not have been made.

**A correction is not a redraw.** The rules above are written for a step that
*moved*, and they demand the thing it now stands on. A drawing can also be simply
wrong — saying something that was never true of this project — and then nothing
behind it changed, because the drawing was the only thing out of step. Fixing that
owes the `Flow:` paragraph like any other edit — naming what was wrong and how long
it had been — and owes the closing message, but it owes no accompanying rule,
because no rule was ever what it described.

**Generalising a participant moves every arrow in its scenes, not the ones that
name it.** That is how the only such error so far was made, and it was made here:
one phase widened the reviewer's lane into an agent lane serving six agents, moved
the two arrows that said *the poster-designer agent* and *the plan-reviewer agent*,
and left the work and the reply behind in the subagent lane. The drawing then showed
a request going to one participant and the answer coming back from another, and it
shipped that way — caught by the owner the next day, reading his own map. A lane
changing mid-scene is invisible while reading a single line, which is exactly why
it survived the redraw that caused it, so the guard is mechanical now: `docs:check`
follows each errand from Claude Code to whoever hands work back, and fails when
that is not the participant the errand went to.

Both halves are enforced, because the phase that most needs them would forget them: a
`PostToolUse` hook says the obligation aloud as the file is edited, `.githooks/commit-msg`
refuses a message lacking the `Flow:` paragraph or a diff that moves a step while
carrying nothing it stands on, and `npm run docs:check` holds the drawing to what the
repository contains. Each explains itself when it fires, so none is explained here.

## Every lesson landed displaces one

The line budgets in `docs:check` supply the pressure; they cannot say what goes. Three
kinds are safe to drop, and only these: a rule that has since become a lint rule or a
`docs:check`, because the failure message carries it now and prose beside a check is a
second copy that will drift; a rule about a situation that can no longer arise, proved
by a grep rather than remembered; and two rules with one cause, merged into the general
one with the sharper incident kept as its proof. **Never drop a rule for being quiet.**
One that prevents a rare, expensive failure is indistinguishable from one that stopped
mattering, and the difference only shows after it is gone.

**A skill's budget may rise, and only by what a genuinely new section costs.** The
pressure is not a fixed length — it is that appending has to be argued for. New
subject matter the skill had no answer to before earns its lines; prose restating
something already in the file earns none, and is why the dial exists. Raising it in
the same commit that fills it is allowed, and the commit says which of the two it
was. `CLAUDE.md` is the exception with its own rule, in `write-a-doc`: it is read
before every session, so its budget moves only by displacement.

## What comes back

The output is a **diff**, never a paragraph. But six questions collapsing into one
prose answer is how five of them go missing without anybody noticing, so the answer
has a fixed shape — one line per question, every one present, and each carrying its
number:

```
Rework:     <what was rebuilt> — <the moment it could have been settled>
Gate runs:  <gate>×<n>, <how many re-read a report already on disk>
Subagents:  <n> for <what they produced> — paid / did not, per kind of work
Sequencing: <what was written against a moving subject, or blocked on nothing>
Reading:    <what was read again that was already in context>
Landed:     <file> — <the default it now changes>
```

`none` is a complete answer to any of the first five, and writing it is the point:
a question answered *none* and a question never asked look identical in prose and
different here. `Landed:` repeats per rule and is the only line that may not be
`none` while any other line carries a count — a phase that found something and
changed nothing has not finished the gate.

**A verdict that changes no default is not a conclusion.** "The subagents were
fine" is an observation; "stop delegating spec files while the context is still
roomy" is a change. A lesson left as prose in the conversation is gone at the next
compaction, so it does not count. Drop any lesson that does not generalise beyond
this session rather than recording it: two real changes beat a list of nine.

**Say the honest number even when it is unflattering.** The rules in
`finish-phase` about re-running Stryker exist because a phase burned eight
invocations where two would have done, and that only became a rule because
somebody counted the eight.

The commit's `Retro:` line is this block compressed to one sentence, and
`write-a-commit` says how — what it may not do is carry a verdict this block never
reached.

**Then write the phase log**, straight phases included — a pile fed only by the ones
that went badly divides into nonsense. Its fields, the walk it cites the drawing by
and its rule against unmeasured numbers are [in the logbook](../../../logbook/README.md).
