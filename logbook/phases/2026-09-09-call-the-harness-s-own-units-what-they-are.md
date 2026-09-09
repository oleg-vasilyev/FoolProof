# Call the harness's own units what they are

```
Asked:      «если это юнит тесты на e2e — команда должна называться test:e2e или что-то
            типа того»
Kind:       tooling
Ran:        not measured to the minute — opened at the owner's question while v1.20.1's
            check:release was still running, closed at this commit's own %cI · Fable
            5.1 · 0 subagent tokens
Path:       Framing the task and the mockup → the size of the phase in one line →
            Quality gates → npm run docs:check → Retrospective — fixing the process and
            the documents → write the phase log to logbook/phases/ → Release to
            production → the write-a-commit skill → commit and push to main
Skipped:    Writing the code and the tests · Review by an agent that did not write the
            diff · Reading every sentence, then syncing every picture · npm version with
            the release message
Off-map:    none
Delegated:  none
Rework:     none
Loops:      none
Broke:      an interrupted TaskOutput read as an interrupted push — the pre-push
            check:release kept running in the background for 29 minutes while this
            rename was edited under it; the diff never touched a mutated file, so it
            cost nothing but the hold-still rule
Gates:      test:e2e-harness green, 75 cases · docs:check green · nothing else applies:
            three callers renamed, no code
Found by:   the owner 1 (a script named as if it played the scenarios)
Landed:     the rename itself; the timing evidence for the owner's next question, that
            check:release took 29 minutes against the ten finish-phase quotes
```
