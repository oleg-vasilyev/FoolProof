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
3. **Subagents.** How many, and was each brief complete enough that the agent did
   not re-derive context you already had? Name work you kept that was mechanical
   transcription from a settled design, and work you delegated where being wrong
   was expensive.
4. **Sequencing.** Did an agent write against a subject you were still changing?
   Did you block on one whose files were disjoint from yours and could have run
   alongside?
5. **Reading.** What did you read, re-read or print that you already had in
   context?

## The output is a diff, not a paragraph

Every lesson that would apply to a future phase becomes a **durable change** — a
rule in `finish-phase`, `write-a-spec` or `add-a-feature`, a line in `CLAUDE.md`,
a memory file — and you name the file you changed. CLAUDE.md is under a line
budget checked by `npm run docs:check`, so adding to it means moving something out
of it.

A lesson left as prose in the conversation is gone at the next compaction, so it
does not count. Drop any lesson that does not generalise beyond this session
rather than recording it: two real changes are worth more than a list of nine.

**Say the honest number even when it is unflattering.** The rules in
`finish-phase` about re-running Stryker exist because a phase burned eight
invocations where two would have done, and that only became a rule because
somebody counted the eight.
