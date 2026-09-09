# Say in each verdict only what the agent needs

```
Asked:      «Каждый вердикт содержит только нужное агенту и ничего лишнего: lint и оба
            typecheck — машиночитаемый вывод, парсинг в список файл, строка,
            правило/код, причины под красной строкой; мутации — балл и порог по
            семье плюс выжившие и непокрытые мутанты (файл, строка, замена, с
            потолком); e2e — сообщение ошибки целиком (до трёх строк) и путь к логу
            бота упавшего сценария» · «2 — да, пиши лог» · «по окончанию работы сразу
            открывай следующую фазу»
Kind:       tooling
Ran:        opened right after v1.20.2 and 5d48dac were pushed, 18:45 local, closed at
            this commit's own %cI · Fable 5.1 throughout · subagent tokens:
            plan-reviewer 95k, phase-reviewer 84k
Path:       Framing the task and the mockup → read it for the kind of work it is → check
            the tech debt → the size of the phase in one line → now, knowing the rules,
            freeze the interfaces → the plan-reviewer agent → the finding, while nothing
            is written yet → Writing the code and the tests → write the core of the
            feature → break its subject on purpose and watch it go red before the next
            file → write the unit tests: everything around the file replaced with stubs
            → Quality gates → the finish-phase skill → npm run check:phase → fix it, then
            re-run that gate alone → Review by an agent that did not write the diff →
            the phase-reviewer agent → fix the code and re-run only the affected gate →
            npm run check:phase → Retrospective — fixing the process and the documents →
            the retrospective skill, run in this very conversation → write the phase log
            to logbook/phases/ → update README, PLAN and whatever else the phase owes →
            node scripts/gates/gate-runner.ts docs-check → Release to production → the
            write-a-commit skill → commit and push to main
Skipped:    grep the code for the same shape elsewhere · reproduce it on the platform it
            happened on · one brief, one question · every question at once, before any
            work · the poster-designer agent · the add-a-feature skill · the write-a-spec
            skill · the add-repository-method skill · write the failing test at the
            layer that can still see the fault · write both copy tables first · the
            copy-reader agent — the finished sentences · briefs to every subagent in one
            go · the write-an-e2e-scenario skill · Reading every sentence, then syncing
            every picture · redraw this very diagram · the skill-auditor agent · the
            write-a-doc skill · name the gate that should have caught it · land each
            rule yourself · save the takeaway to persistent memory · npm version with
            the release message
Off-map:    the three questions the plan-reviewer addressed to the owner were decided
            here and said aloud — stack frames cut before the three lines, one bot log
            per scenario rather than per world, survivors printed under a green line too
Delegated:  2 errands — plan-reviewer: 11 findings, 11 taken (stack frames in
            failureMessages, a folder is not the failed scenario's log, tidy-reports
            reads literals not imports, one findings kind, tsc continuation lines,
            ruleId null and absolute paths, zero findings, survivors on green, a probe
            chosen not constructed, play.ts's second world, e2e:changed plays everything
            for a harness diff); phase-reviewer: 11 promises held, 9 findings, 9 taken
            (finding.ts for the shared type, bot-log in e2e-changed's EVERYTHING,
            plural(), detailLines, a redundant guard, no log for a world never reset,
            an unused export, dead toContain, a non-array guard)
Rework:     the spec-edit regex missed two nested calls — settled by typecheck naming
            the lines · the runner spec's mock of gate-numbers lacked the export
            gate-list now imports, and the battery showed it as a red coverage gate with
            only a tail, because a file that fails to load has no failed assertion — the
            verdict now names such a file by its own message
Loops:      check:phase ×2 (red on the mock, green) · coverage alone ×1 · lint ×5 (one
            probe) · typecheck ×6 (one probe, live) · docs-check ×5 · scripts suite ×6 ·
            named mutation ×1 (the probe, 9 survivors listed) · e2e:changed ×1 (the
            probe) · tools typed by hand past the runner: 0 — the hook from the previous
            phase stood in the way
Broke:      none
Gates:      check:phase green — see the commit's paragraph · docs-check green · copy:
            nothing changed · gallery: not opened, no drawing changed · plan-reviewer:
            run, GateNumbers is a contract · npm version: none, nothing a player or the
            operator gets
Found by:   the plan-reviewer 11 · the phase-reviewer 9 · the gates 2 (the mock, the
            unloaded file) · the mutation listing 1 (nine survivors in the hook's
            regexes) · the owner 0
Landed:     lint and both typechecks parsed into findings under the red line; survivors
            with their replacement under every mutation line, capped and counted; vitest
            messages without stack frames, up to three lines; one bot log per scenario
            named on the red e2e line; a spec file that fails to load named as such;
            check-docs.ts out of the mutation family; the hook's nine survivors killed
```

The first thing the new survivor listing did was read the previous phase's hook and
name nine mutants its spec let live — the feature proved itself on its author's code
before the phase was closed. The battery's one red was the same shape as before: a
report that said less than the log, fixed by teaching the verdict the shape it had
not been shown.
