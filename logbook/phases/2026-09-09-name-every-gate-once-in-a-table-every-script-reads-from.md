# Name every gate once, in a table every script reads from

```
Asked:      «у нас было правило, что вместо строковых имен, нужно класть их в объект и
            импортировать во все места — пройдись по папке scripts и отрефактори»,
            found while reviewing the gate move; then «почему не закомитал?» and «плюс
            ретро»
Kind:       tooling
Ran:        opened 2026-09-09T15:46:33Z (the transcript's first line), closed at this
            commit's own %cI · Fable 5.1 throughout · subagent tokens 0, none spawned
Path:       Framing the task and the mockup → read it for the kind of work it is → grep
            the code for the same shape elsewhere → Writing the code and the tests →
            write the core of the feature → write the unit tests: everything around the
            file replaced with stubs → Quality gates → Retrospective — fixing the process
            and the documents → the retrospective skill → save the takeaway to persistent
            memory → write the phase log to logbook/phases/ → node
            scripts/gates/gate-runner.ts docs-check → Release to production → the
            write-a-commit skill
Skipped:    check the tech debt · the size of the phase in one line · the write-a-spec
            skill · the finish-phase skill · Review by an agent that did not write the
            diff · Reading every sentence, then syncing every picture · land each rule
            yourself · update README, PLAN and whatever else the phase owes · npm version
            with the release message
Off-map:    the first commit was refused by commit-msg for carrying a Gates paragraph
            with no log — the phase had not been recognised as one until the hook said so
Delegated:  0 errands
Rework:     the import lines were added by a shell loop whose perl patterns broke on
            interpolation and were then placed by hand — settled by writing ten one-line
            edits instead of scripting them · the hook spec expected a gate order guessed
            from the old prose, corrected to the table's own — settled by reading
            ALL_GATES before writing the expectation
Loops:      test over scripts ×2 (one red on the guessed order) · lint ×2 (after the
            hook change) · check:phase ×1 · typecheck, docs-check ×1
Broke:      none
Gates:      check:phase green · 4877 tests in 212 files · coverage 99.84/97.61/100/99.83
            · mutation nothing over the source, 91.1% over the changed tooling against a
            bar of 80, the 68 survivors all in lines this phase did not touch
            (gate-numbers.ts message parsing, gate-summary.ts phrasing) · e2e 205 in 17
            files · docs-check green · phase-reviewer: not run, a rename with no contract
            change · copy, gallery: nothing to read, no string a player sees changed ·
            npm version: none, the operator and the player get nothing new
Found by:   the owner 1 (the strings in the review)
Landed:     memory a-closed-set-of-names-gets-a-table-from-the-first-file — a closed set
            of names gets its table from the first file, since named-states never sees a
            literal in a switch or an argv
```

Two things the phase did not do and says so: the size was never stated in a line before
starting, and the first commit went out without the log because the change was read as a
review fix rather than a phase — the commit-msg hook, not the author, made the call.
