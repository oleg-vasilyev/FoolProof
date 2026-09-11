# Refuse a card tap from any chat but the card's own, and say when the version could not be read

```
Asked:      «изучи отчет, разбей на фазы и начинай исправления» — the second of seven
            phases cut from logbook/checkups/2026-09-11.md: its findings 4 and 25
Kind:       fault
Ran:        opened 2026-09-11T10:53:43Z when the first phase's commit closed, closed at
            this commit's own %cI · Fable 5.1 throughout · subagent tokens 49,512
            (the phase-reviewer)
Path:       Framing the task and the mockup → read it for the kind of work it is → grep
            the code for the same shape elsewhere → Writing the code and the tests → write the failing test at the layer that can still see
            the fault → write the core of the feature → write the unit tests: everything
            around the file replaced with stubs → Quality gates → Review by an agent that
            did not write the diff → the phase-reviewer agent → fix the code and re-run
            only the affected gate → Quality gates → npm run check:phase → Retrospective
            — fixing the process and the documents → update README, PLAN and whatever
            else the phase owes → write the phase log to logbook/phases/ → Release to
            production → the write-a-commit skill → commit and push to main
Skipped:    check the tech debt · reproduce it on the platform it happened on · the size
            of the phase in one line · the write-a-spec skill · the finish-phase skill ·
            Reading every sentence, then syncing every picture · the write-an-e2e-scenario
            skill · the retrospective skill · the write-a-doc skill · npm version with the
            release message
Off-map:    none
Delegated:  1 errand — the phase-reviewer: 7 promises held, 2 findings, one landed (the
            chat-before-version case), one deferred (a cross-chat e2e scenario: the
            harness holds one chat per world)
Rework:     none
Loops:      check:phase ×1 · the five named specs ×2 each (red before the fix, green after)
Broke:      none
Gates:      see the commit's paragraph · docs-check green · phase-reviewer run · copy,
            gallery: nothing to read · npm version: none
Found by:   the checkup 2
Landed:     none — the cross-chat scenario goes to TECH-DEBT.md with the next phase, which
            frees the lines that file has no room for today
```

The reproduction is the failing unit case, not a run on the platform: the fake Telegram
plays one chat per world, so a tap from a second chat cannot be played there yet, and the
checkup marked the finding as unverified by execution for the same reason.
