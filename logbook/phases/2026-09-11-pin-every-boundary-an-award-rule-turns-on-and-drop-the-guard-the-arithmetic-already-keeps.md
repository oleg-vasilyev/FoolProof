# Pin every boundary an award rule turns on, and drop the guard the arithmetic already keeps

```
Asked:      «изучи отчет, разбей на фазы и начинай исправления» — the fifth of seven
            phases cut from logbook/checkups/2026-09-11.md: its finding 3, the
            exact-boundary survivors in the award rules
Kind:       tooling
Ran:        opened 2026-09-11T11:44:48Z when the fourth phase's second half closed, closed
            at this commit's own %cI · Fable 5.1 throughout · subagent tokens 69,001
            (the phase-reviewer)
Path:       Framing the task and the mockup → read it for the kind of work it is → the
            size of the phase in one line → the write-a-spec skill → Writing the code and
            the tests → write the unit tests: everything around the file replaced with
            stubs → Quality gates → fix it, then re-run that gate alone → Review by an
            agent that did not write the diff → the phase-reviewer agent → Quality gates
            → npm run check:phase → Retrospective — fixing the process and the documents
            → save the takeaway to persistent memory → write the phase log to
            logbook/phases/ → Release to production → the write-a-commit skill → commit
            and push to main
Skipped:    check the tech debt · write the core of the feature · the finish-phase skill ·
            Reading every sentence, then syncing every picture · the retrospective skill ·
            the write-a-doc skill · update README, PLAN and whatever else the phase owes ·
            npm version with the release message
Off-map:    none
Delegated:  1 errand — the phase-reviewer: 9 promises checked, 3 findings, all landed — a threshold constant of its own, two double cases split, one stale case name
Rework:     the first eleven cases killed the named boundaries and left nineteen mutants
            alive in past-awards.ts, all of one shape — a positive case that mocks bestBy
            and asserts the award it returns, never the merit that would have earned it —
            so five positive cases gained a merit assertion; reading the survivors before
            the first case, as the survivor page says, would have found the shape first
Loops:      test:mutation:changed over the two rule files ×2 (16 and 36 survivors, then
            19 in one file, then 0) · the two specs ×3 · check:phase ×2 — the first red on a coverage temp
            file the reviewer's own check:quick was writing at the same moment
Broke:      none
Gates:      see the commit's paragraph · phase-reviewer run · gate 3a not opened: no
            sentence a poster prints changed, the removed guard was dead · copy, gallery:
            nothing to read · npm version: none
Found by:   the checkup 1 (the boundary family) · me 1 (the dead guard, off the survivor)
Landed:     memory mutation-survivors-have-causes-worth-naming gains the mocked-picker
            shape; memory a-battery-and-the-reviewer-collide-on-coverage
```

The room-and-rows selection loop in awards.ts, forty-three survivors by the checkup's
count, is not in this phase: it is a loop, not a boundary, and the checkup asked for the
dozen boundary cases first.
