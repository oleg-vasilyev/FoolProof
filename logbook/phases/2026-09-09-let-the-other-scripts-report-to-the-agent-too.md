# Let the other scripts report to the agent too

```
Asked:      «в следующей фазе примени эти подходы к остальным скриптам в package.json —
            чтобы ты читал отчеты, а не текст в консоле. лишние старые скрипты можешь
            удалить, оставь только то, чем будешь пользоваться» · «заводи следующую фазу
            по остальным скриптам» · «делай» · «сделай себе запись в клод мд, что этот
            проект пишется агентом … агент — его главный и единственный юзер»
Kind:       tooling
Ran:        opened at the owner's «заводи следующую фазу», right after e026d5e was
            pushed, closed at this commit's own %cI · Fable 5.1 throughout · subagent
            tokens not measured (two agent returns carried no count)
Path:       Framing the task and the mockup → read it for the kind of work it is → check
            the tech debt → the size of the phase in one line → now, knowing the rules,
            freeze the interfaces → the plan-reviewer agent → Writing the code and the
            tests → write the core of the feature → write the unit tests: everything
            around the file replaced with stubs → Quality gates → the finish-phase skill →
            npm run check:phase → Review by an agent that did not write the diff → the
            phase-reviewer agent → fix the code and re-run only the affected gate → npm
            run check:phase → Retrospective — fixing the process and the documents → land
            each rule yourself → write the phase log to logbook/phases/ → update README,
            PLAN and whatever else the phase owes → npm run docs:check → Release to
            production → the write-a-commit skill → commit and push to main
Skipped:    grep the code for the same shape elsewhere · reproduce it on the platform it
            happened on · one brief, one question · every question at once, before any
            work · the poster-designer agent · the write-a-spec skill · the add-a-feature
            skill · the add-repository-method skill · write the failing test at the layer
            that can still see the fault · write both copy tables first · the copy-reader
            agent — the finished sentences · briefs to every subagent in one go · the
            write-an-e2e-scenario skill · Reading every sentence, then syncing every
            picture · redraw this very diagram · the skill-auditor agent · the
            write-a-doc skill · name the gate that should have caught it · save the
            takeaway to persistent memory · npm version with the release message
Off-map:    the phase began by counting shell invocations across 36 transcripts, and the
            first count (mentions, 3384 for one script) was thrown away for a calibrated
            one over tool calls only; the calibrated count moved the whole phase off
            scripts/ and onto the raw vitest and Stryker runs — the instrument decided
            the plan
Delegated:  2 errands — plan-reviewer: 8 findings, 8 taken, 3 questions answered (a named
            mutation must not rewrite the paragraph, complaints.json refused as a third
            copy, absolute paths relativised at the edge, failures read for e2e and the
            harness too, outputsOf for test, tool-verdict into the tooling family, the
            literal reports/tools for tidy-reports); phase-reviewer: 11 promises held,
            4 findings, 4 taken (a named run over a file no family holds went green,
            the skill sentence over-promised, secondsOf duplicated, Say exported unused)
Rework:     the red line of a named run pointed at the bare gate's log — caught by
            running the prescribed loop, settled by the verdict carrying named ·
            e2e:changed with nothing to play read as "results not written", settled by a
            none verdict · one spec import forgotten, caught by Stryker's dry run in ten
            seconds
Loops:      check:phase ×3 (green, green, green after the review) · scripts suite ×7 ·
            gate-runner on one spec ×2, on docs:check ×2, on one file's mutants ×2 ·
            docs:check ×3 (red twice on two skills' budgets, one line each) · review ×1
Broke:      none
Gates:      check:phase green — 4815 tests in 208 files, coverage 99.84/97.61/100/99.83,
            mutation nothing to run over the source and 93.79% over the changed tooling;
            e2e:changed played nothing, no src changed · docs:check green · copy: nothing
            changed · gallery: not opened, no drawing changed (the gallery was drawn once
            as the tools' proof) · plan-reviewer: run, contracts changed · npm version:
            none, nothing a player or the operator gets
Found by:   the owner 1 (the CLAUDE.md rule) · the plan-reviewer 8 · the phase-reviewer 4
            · me 2 (the named log line, the nothing-to-play phrase) · the gates 1 (the
            forgotten import, by Stryker's dry run)
Landed:     the test gate with arguments and the reasons under a red line; named runs in
            their own files; tools.ts verbs leaving reports/tools/; the CLAUDE.md
            paragraph that the agent is the harness's only user; the debt entry closed;
            nothing deleted — every script left was run this month, and the log says so
```

The lesson from the previous phase held: the one real flaw was found by running the loop
the skill prescribes, not by reading. The measurement is the other lesson — the owner's
request named `scripts/`, the calibrated count named vitest, and the phase built for the
count.
