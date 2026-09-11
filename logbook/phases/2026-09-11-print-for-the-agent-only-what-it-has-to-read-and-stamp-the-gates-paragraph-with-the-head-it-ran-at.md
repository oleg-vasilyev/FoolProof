# Print for the agent only what it has to read, and stamp the Gates paragraph with the HEAD it ran at

```
Asked:      «изучи отчет, разбей на фазы и начинай исправления» — the fourth of seven
            phases cut from logbook/checkups/2026-09-11.md, first half: its findings
            14, 27, 28 and 30 (the harness read as the agent's)
Kind:       tooling
Ran:        opened 2026-09-11T11:16:39Z when the third phase's commit closed, closed at
            this commit's own %cI · Fable 5.1 throughout · subagent tokens 43,719
            (the phase-reviewer)
Path:       Framing the task and the mockup → read it for the kind of work it is → the
            size of the phase in one line → Writing the code and the tests → write the
            core of the feature → write the unit tests: everything around the file
            replaced with stubs → break its subject on purpose and watch it go red →
            Quality gates → Review by an agent that did not write the diff → the
            phase-reviewer agent → Quality gates → npm run check:phase → Retrospective
            — fixing the process and the documents → update README, PLAN and whatever
            else the phase owes → write the phase log to logbook/phases/ → Release to
            production → the write-a-commit skill → commit and push to main
Skipped:    check the tech debt · the write-a-spec skill · the finish-phase skill ·
            Reading every sentence, then syncing every picture · the retrospective
            skill · the write-a-doc skill · npm version with the release message
Off-map:    none
Delegated:  1 errand — the phase-reviewer: 9 promises checked, 6 findings, five landed, one declined (accepting an amend)
Rework:     the experiment-warning flag put on the spawned tool's argv, then moved into
            NODE_OPTIONS when the coverage log still carried the warning — vitest forks
            workers the argv never reaches; one measured run before the second attempt
            would have settled it, and did
Loops:      the runner spec ×4 (a sed that reverted the flag took the import with it) ·
            test:coverage ×2 (the warning count read off the log each time)
Broke:      none
Gates:      see the commit's paragraph · docs-check green · phase-reviewer run · the
            commit-msg stamp check seen refusing twice, a stale HEAD and a wrong battery ·
            the lint hook seen printing one finding in the gate's shape · copy, gallery:
            nothing to read · npm version: none
Found by:   the checkup 4
Landed:     memory a-tool-absent-from-package-json-is-not-this-project-s corrected — the
            Stop hook it named is gone
```

The tools run by hand — `tidy-reports`, `tools.ts` — still print the SQLite warning:
they are started by the agent's own shell, not through the runner's environment, and
the checkup's fix named the runner. A flag in `package.json`'s scripts would reach only
the four batteries.
