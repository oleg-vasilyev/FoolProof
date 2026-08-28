# A description says when

```
Asked:      Fix every finding of the 28 August checkup except the backup, and work out how to stop reading finish-phase at the first step
Kind:       tooling
Ran:        56m18s (09:46:11Z–10:42:30Z) · Opus 5 · 112062 subagent tokens
Path:       Framing the task and the mockup → check the tech debt → Writing the code and the tests → Quality gates → Review by an agent that did not write the diff → Quality gates → Retrospective — fixing the process and the documents → Release to production
Skipped:    Reading every sentence, then syncing every picture · The checkup — occasional, and it is allowed to fix nothing
Off-map:    none
Delegated:  2 errands — the claude-code-guide agent returned a field list that omitted the one field the question was about; the phase-reviewer agent returned 12 checked promises and 6 findings, 1 blocking, all 5 actionable ones real
Rework:     four — a TECH-DEBT entry written then deleted once settling.ts turned out to print the same remedy; estimateComplaints written into phase-log-paths.ts then moved out of it; a CLAUDE.md paragraph fitted by displacing two others then deleted by the owner; unreachableHelp repointed then deleted by the review — every one settled by reading the neighbour first
Loops:      docs:check×12, ten of them budget arithmetic on three files — sent back by adding prose before asking whether the file was the right home
Broke:      two shell heredocs mangled their own escapes, one silently; the auto-mode classifier refused a settings.json edit, which is the owner's to make
Gates:      lint · types · coverage 99.77/97.05/100/99.76 · mutation 81.10% over the diff · e2e nothing to play, no src/ file changed · review 6 findings · copy not opened, no table moved · gallery not opened, nothing drawn
Found by:   the review 5, the owner 3, a gate 6, me 3
Landed:     .claude/skills/finish-phase/SKILL.md — a refusal is evidence about the new thing; memory an-absence-claim-needs-the-primary-source — «this platform cannot» is said only from the platform's own page
```

The phase came for fourteen findings and spent most of itself on one of them. Finding 4
said `finish-phase`'s `description:` fired two stages early; the durable answer was not
to reword it but to notice that three places all claimed to say *when* a skill is due —
the description, a routing table in `CLAUDE.md`, and the drawing — and that only one of
them was ever checked. The gate that came out of it (`descriptionsOffTheirStage`) fired
on all twelve skills the moment it was wired in, which is the number that made the case:
not one description in the repository named its own stage.

Two findings did not survive being checked. Finding 7's "named bug-candidate" is an
equivalent mutant, argued from `apply()`'s own guard; finding 12's remedy was already
printed by `settling.ts` at the moment a scenario hits it. Both corrections are appended
to the checkup report rather than kept here, because the report is what the next checkup
compares against.

The costly habit this phase should be read for is the one the `Loops:` line counts.
Three files refused new prose on their budget, and each time the first move was to find
something older to displace. Twice out of three the prose should not have been written at
all — the budget was not short of room, it was pointing at a duplicate. The same mistake
took a different shape an hour later, when a gate was repointed at a document that a
check twelve lines above already guarded strictly in both directions; the review named it
and the gate was deleted. One rule now covers both, in `finish-phase`.
