# Take back an unanswered question the moment any command arrives, whichever feature asked it

```
Asked:      «если я хочу отменить replace и ввожу следующую команду — сообщения реплая
            стоит удалять, чтобы оно не висело, так же как это работает с game …
            проверь, что все команды которые реплают — работают как game и поправь»
            (two screenshots of the real chat)
Kind:       fault
Ran:        opened 2026-09-09T09:57Z (the transcript's first line), closed at this
            commit's own %cI · Fable 5.1 throughout · subagent tokens not measured
            (the reviewer's return carried none)
Path:       Framing the task and the mockup → read it for the kind of work it is → check
            the tech debt → grep the code for the same shape elsewhere → the size of
            the phase in one line → Writing the code and the tests → write the failing
            test at the layer that can still see the fault → write the core of the
            feature → write the unit tests: everything around the file replaced with
            stubs → Quality gates → the finish-phase skill → Review by an agent that
            did not write the diff → the phase-reviewer agent → fix the code and re-run
            only the affected gate → npm run check:phase → Retrospective — fixing the
            process and the documents → land each rule yourself → save the takeaway to
            persistent memory → write the phase log to logbook/phases/ → update README,
            PLAN and whatever else the phase owes → npm run docs:check → Release to
            production → the write-a-commit skill → npm version with the release
            message
Skipped:    reproduce it on the platform it happened on · one brief, one question · every
            question at once, before any work · the poster-designer agent · the
            write-a-spec skill · the add-a-feature skill · the add-repository-method
            skill · the plan-reviewer agent · write both copy tables first · the
            copy-reader agent — the finished sentences · briefs to every subagent in one
            go · the write-an-e2e-scenario skill · Reading every sentence, then syncing
            every picture · redraw this very diagram · the skill-auditor agent · the
            write-a-doc skill · name the gate that should have caught it
Off-map:    the failing e2e scenario was written and watched go red before the unit
            specs, since the fault only shows across two features and the installer
Delegated:  1 errand — phase-reviewer: 8 promises held, 3 findings, 3 taken (the
            composition-root spec asserting one registry, the registrar as a
            module-level function, the command-as-reply tombstone named in PLAN.md)
Rework:     three spec cases deleted by line ranges read off an earlier listing took
            their neighbours' titles with them; the suite caught it on the next run —
            settled by deleting a block by its text
Loops:      e2e two files ×2 (red on purpose, then green) · unit suite ×2 · docs:check
            ×2 · check:phase ×1 — no gate re-run after the review beyond the two specs
            the findings touched
Broke:      none
Gates:      check:phase green · suite 4651 in 199 files · coverage 99.84/97.61/100/99.83
            · mutation 99.52% over the diff, one survivor left (a type-only null guard)
            and one pre-existing uncovered case · e2e 205 in 17 files, the whole suite
            because shared/ and main.ts changed · docs:check green · copy: nothing
            changed · gallery: not opened, no drawing changed · plan-reviewer: not owed,
            no new command or contract · npm version: patch, a fix to what /replace did
Found by:   the owner 1 (the standing /replace question) · the phase-reviewer 3
Landed:     memory delete-a-spec-block-by-its-text; TECH-DEBT.md entry closed by its own
            trigger; PLAN.md's rule widened from "every command that opens a card" to
            "every command"
```

The TECH-DEBT entry had named this exact report as its trigger and its remedy, so the
framing was reading, not deciding. The gate that should have caught it is the one that
now exists: a scenario where a command of another feature follows a bare /replace.
