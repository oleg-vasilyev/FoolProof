const RETROSPECTIVE = `Before this context is compacted, run a retrospective on the development work in it.
This is a required step, and the summary that follows must carry its conclusions.

Answer from evidence in this transcript, not from how you generally work. Where a
count is asked for, count.

1. **Rework.** What was built and then rebuilt? For each, name the moment the
   direction could have been settled earlier: a signature crossing a layer, an
   output the user could have judged if you had shown it, a decision that was the
   user's and was guessed instead.
2. **Repeated commands.** How many times did each gate run — check, coverage,
   mutation, e2e — and how many of those runs produced information you already had
   on disk? Re-running a gate to re-read its own report is the canonical waste.
3. **Subagents.** How many, and was each brief complete enough that the agent did
   not re-derive context you already had? Name work you kept that was mechanical
   transcription from a settled design, and work you delegated where being wrong
   was expensive.
4. **Sequencing.** Did an agent write against a subject you were still changing?
   Did you block on one whose files were disjoint from yours and could have run
   alongside?
5. **Reading.** What did you read, re-read or print that you already had in context?

Then convert each lesson that would apply to a future phase into a **durable
change** — a rule in the \`finish-phase\` skill, a line in CLAUDE.md, a memory file —
and name what you changed. CLAUDE.md is under a line budget, so adding to it means
moving something out of it. A lesson left as prose here is lost at the next
compaction, so it does not count.

Drop any lesson that does not generalise beyond this session rather than recording
it. Two or three real changes are worth more than a list.`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreCompact",
      additionalContext: RETROSPECTIVE,
    },
  })
);
