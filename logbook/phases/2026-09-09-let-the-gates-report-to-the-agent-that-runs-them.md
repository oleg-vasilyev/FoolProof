# Let the gates report to the agent that runs them

```
Asked:      «есть ощущение, что наши процессы все еще сделаны по станике для людей …
            у них есть только один пользователь — это ты … может стоит где-то
            откланиться от старых подходов, чтобы тебе как ии агенту было удобнее?» ·
            «заводи полноценную фазу, составь план … обязательно попроси план ревьюера»
            · «тут же учти вынос мутеншена в дип чек» · «а check и check:push тебя
            устраивают?» · «команды test и прочие … нет смысла держать» · «в следующей
            фазе примени эти подходы к остальным скриптам»
Kind:       tooling
Ran:        opened about 14:50 local, after v1.20.1 reached origin at 14:47, closed at
            this commit's own %cI · Fable 5.1 throughout · subagent tokens not measured
            (three agent returns carried no count)
Path:       Framing the task and the mockup → read it for the kind of work it is → check
            the tech debt → the size of the phase in one line → the write-a-spec skill →
            now, knowing the rules, freeze the interfaces → the plan-reviewer agent →
            Writing the code and the tests → write the core of the feature → write the
            unit tests: everything around the file replaced with stubs → Quality gates →
            the finish-phase skill → npm run check:phase → fix it, then re-run that gate
            alone → Review by an agent that did not write the diff → the phase-reviewer
            agent → fix the code and re-run only the affected gate → the phase-reviewer
            agent → fix the code and re-run only the affected gate → npm run check:phase
            → Retrospective — fixing the process and the documents → land each rule
            yourself → save the takeaway to persistent memory → write the phase log to
            logbook/phases/ → update README, PLAN and whatever else the phase owes → npm
            run docs:check → Release to production → the write-a-commit skill → commit
            and push to main
Skipped:    grep the code for the same shape elsewhere · reproduce it on the platform it
            happened on · one brief, one question · every question at once, before any
            work · the poster-designer agent · the add-a-feature skill · the
            add-repository-method skill · write the failing test at the layer that can
            still see the fault · write both copy tables first · the copy-reader agent —
            the finished sentences · briefs to every subagent in one go · the
            write-an-e2e-scenario skill · Reading every sentence, then syncing every
            picture · redraw this very diagram · the skill-auditor agent · the write-a-doc
            skill · name the gate that should have caught it · npm version with the
            release message
Off-map:    the plan was written to a scratch file and handed to the owner to read before
            any code, on the owner's request; the tool was proved on itself — its own
            check:phase paragraph is this commit's Gates line
Delegated:  3 errands — plan-reviewer: 10 findings, 10 taken, 3 questions answered (CI
            shallow clone, stale JSON read as fresh, tidy-reports sweeping the new
            folders, two families never summed, mutate-changed out of scope until the
            owner put it in, e2e never behind the suite, HEAD^ assumption checked, clear-
            text skipFull, types in the pure file, no time promised); phase-reviewer
            first pass: 11 promises, 14 findings, 13 taken (the paragraph stale after a
            single re-run, an unreachable refusal branch, Family declared twice, chunk
            encoding, colour codes, no error handler, a sentinel instead of a union, an
            if-chain, names, a lying spec title, a leaking once-mock, package.json
            order, one results file shared by two gates), 1 kept as a measurement
            (Stryker inherits the JSON reporter); phase-reviewer second pass: 12
            promises, 11 findings, 11 taken (the Stop hook calling a deleted script, the
            paragraph rebuilt from every JSON in the folder, kind "tests" overloaded, a
            battery invented without battery.txt, settle twice, JSON.parse unguarded,
            duplicated names, stale fixtures, gate-paths naming a command, E2E_VERBOSE
            undocumented, the hook's "full battery")
Rework:     the first tooling mutation run came back 76% — three edges behind
            import.meta.main uncovered, settled by exporting each as run/main taking its
            arguments; would have been settled by writing the edges in check-phase.ts's
            shape from the first line · a perl one-liner ate a ${} in a template
            literal, settled by Edit (the heredoc memory, again) · seven spec appends
            refused by the shell hook for a backslash, settled by scratch files and cat ·
            the paragraph proved on a green single-gate run only; the second review
            reproduced the stale case, settled by verdicts scoped to the battery, skipped
            verdicts on disk, and the walker forgetting its gates' files first
Loops:      check:phase ×3 (red on mutation, green, green after review two) · scripts
            suite ×8 · docs:check ×5 (red once on the finish-phase budget, twice on the
            debt trigger vocabulary) · single gate re-runs ×4 · review ×2 by design
Broke:      none — the 29-minute check:release of v1.20.1 that motivated the phase ran
            in the previous one
Gates:      check:phase green — 4778 tests in 207 files, coverage 99.84/97.61/100/99.83,
            mutation nothing to run over the source and 95.26% over the changed tooling,
            e2e 205 cases in 17 files, the whole suite because the e2e config changed ·
            check green and check:push green through the same walker · check:release
            refused without a tag, as designed · docs:check green · copy: nothing changed
            · gallery: not opened, no drawing changed · plan-reviewer: run, a contract
            changed · npm version: none, nothing a player or the operator gets
Found by:   the owner 3 (check and check:push left outside the walker, four scripts
            nobody ran, the next phase) · the plan-reviewer 10 · the phase-reviewer 24 ·
            the gates 1 (the 76% tooling family) · me 1 (mutate-changed reading a Stryker
            killed by a signal as green, fixed inside the diff)
Landed:     reports/gates/ with a log, a JSON verdict and the Gates paragraph per battery;
            four batteries through one walker; release mutation since the previous tag;
            the full mutation moved to deep-checkup; four scripts deleted; memory
            the-gates-report-to-the-agent and a-tool-is-proved-on-its-prescribed-loop;
            TECH-DEBT: mutate-changed's corner closed, Stryker incremental and the
            remaining scripts' console output entered with triggers
```

The phase's own battery wrote the paragraph in its commit, which is the whole claim.
What the second review caught — a paragraph assembled from whatever JSON lay in the
folder — is the shape a tool proved only on its happy path always has: the skill
prescribes red, fix, single re-run, and the proof ran green, green, green.
