---
name: retrospective
description: Review how a stretch of development was actually carried out — rework, repeated gate runs, subagent use, sequencing, re-reading — and convert each lesson into a durable rule. Use as the last gate of finish-phase, when the context is about to be compacted, or whenever the user asks how the work could have gone faster or cheaper.
---

# Reviewing the process, not the code

Gate 4 asks whether the diff is releasable. This asks whether producing it was
worth what it cost. It is the only gate whose subject is the transcript, so it has
to run **while the transcript is still there** — at the end of a phase, or before
a compaction the user can see coming.

Answer from evidence in this session, not from how you generally work. Where a
count is asked for, count. An answer with no number in it is a guess.

## The five questions

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

## The flow this gate audits is drawn

[`development-flow.mmd`](development-flow.mmd) beside this file draws the whole
loop — six stages from the owner's first message to the tag going live, in
Mermaid, viewable by pasting it into mermaid.live. It is the map, not the
authority: every stage's rules live in the skill the drawing names, and a
disagreement is resolved in the skill's favour, then the drawing is fixed.
**A lesson below that changes a default also redraws the step it touches** — a
flow chart still showing the old habit is the same bug as a stale document.

## The output is a diff, not a paragraph

Every lesson that would apply to a future phase becomes a **durable change** — a
rule in `finish-phase`, `write-a-spec` or `add-a-feature`, a line in `CLAUDE.md`,
a memory file — and you name the file you changed. CLAUDE.md is under a line
budget checked by `npm run docs:check`, so adding to it means moving something out
of it.

**A verdict that changes no default is not a conclusion.** "The subagents were
fine" is an observation; "stop delegating spec files while the context is still
roomy" is a change. If an answer above came out negative, the rule that follows
from it must say what you will do differently, in a form the next phase reads
before it repeats the mistake.

A lesson left as prose in the conversation is gone at the next compaction, so it
does not count. Drop any lesson that does not generalise beyond this session
rather than recording it: two real changes are worth more than a list of nine.

**Say the honest number even when it is unflattering.** The rules in
`finish-phase` about re-running Stryker exist because a phase burned eight
invocations where two would have done, and that only became a rule because
somebody counted the eight.
