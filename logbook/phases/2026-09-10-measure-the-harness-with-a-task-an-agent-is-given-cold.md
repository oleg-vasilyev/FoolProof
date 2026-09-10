# Measure the harness with a task an agent is given cold, scored the same way every time

```
Asked:      «надо из этого сделать фреймворк — чтобы в репо лежал промт, который можно
            запустить на fable, а можно на sonnet … на текущей версии харнеса, или через
            неделю … и во всех этих случаях получить адекватный однозначный результат»,
            then «чтобы это было часть дип чекапа, но только в рамках тестирования
            харнеса — с фикс моделью», then the name (bench, then benchmark) and the
            pinned model (opus high)
Kind:       tooling
Ran:        opened 2026-09-10T13:30Z (the first message after the reference run), closed
            at this commit's own %cI · Fable 5.1 throughout · subagent tokens 168,698
            (claude-code-guide 67,283 · phase-reviewer 101,415)
Path:       Framing the task and the mockup → read it for the kind of work it is → check
            the tech debt → the size of the phase in one line → Writing the code and the
            tests → write the core of the feature → write the unit tests: everything
            around the file replaced with stubs → Quality gates → the finish-phase skill
            → Review by an agent that did not write the diff → the phase-reviewer agent
            → fix the code and re-run only the affected gate → npm run check:phase →
            Retrospective — fixing the process and the documents → land each rule
            yourself → save the takeaway to persistent memory → write the phase log to
            logbook/phases/ → update README, PLAN and whatever else the phase owes →
            Release to production → the write-a-commit skill
Skipped:    reproduce it on the platform it happened on · one brief, one question · every
            question at once, before any work · the poster-designer agent · the
            write-a-spec skill · the add-a-feature skill · the add-repository-method
            skill · the plan-reviewer agent · write both copy tables first · the
            copy-reader agent — the finished sentences · briefs to every subagent in one
            go · the write-an-e2e-scenario skill · Reading every sentence, then syncing
            every picture · redraw this very diagram · the skill-auditor agent · the
            write-a-doc skill · name the gate that should have caught it · npm version
            with the release message
Off-map:    the tool was proved on its own loop before the battery — a three-turn smoke
            run of the real benchmark, which found the acceptance case that passes on an
            empty tree; and the task itself was written and reference-run earlier in the
            same session, with its own log beside the task
Delegated:  2 errands — claude-code-guide: the headless flags, with --bare ruled out
            because it drops the harness; phase-reviewer: 11 promises, 12 findings, 11
            taken (the named verdict path the acceptance was misreading, the unfinished
            agent recorded as a measurement, the README no gate held, the config split
            out of the task module, the mutate list, the cut list, quoting the spec
            path, checked() on the last commit, the obligation renamed, the commits
            column, the order-dependent case deleted), 1 read as not applying (stub
            classes for a scripts module whose neighbours mock inline)
Rework:     bench → benchmark across eleven files, twice, on the owner's word — settled
            by asking the name before the first file; the acceptance verdict read from
            test.json where the named run writes test.named.json — settled by the
            reviewer, would have been settled earlier by the smoke run
Loops:      lint ×5 · typecheck ×4 · the four benchmark specs ×5 · docs-check ×3 ·
            test:mutation:changed ×1 alone and ×1 inside the battery · check:phase ×1 ·
            the smoke run ×2 (the first blocked by the sandbox classifier on a command
            that edited the config and ran the tool in one line)
Broke:      node_modules vanished from the root mid-phase, cause not established from
            the transcript — one npm ci; the lint hook reported "no stderr" on every
            write until then
Gates:      check:phase green · suite 4950 in 216 files · coverage 99.84/97.61/100/99.83
            · mutation 90.51% over the changed tooling, nothing over the source; the
            first run left 54 survivors in the new files and the specs were strengthened
            before the battery · e2e nothing a scenario covers changed · docs-check green
            · copy: nothing a player reads changed · gallery: not opened, no drawing
            changed · plan-reviewer: not owed, no command or contract · npm version: no,
            tooling rides the next tag
Found by:   the phase-reviewer 11 · the smoke run 1 (the vacuous acceptance case) · me 1
            (the stamp keeping its dashes)
Landed:     benchmark/README.md rule that the hidden spec scores zero on the snapshot,
            checked when the task is written; TECH-DEBT.md entry for overlaying one
            commit's harness on another's tree; deep-checkup phase 3⅞ on the pinned
            model; memory harness-benchmark updated to the in-repository layout
```

Two things the count says. The reviewer earned its 101k tokens: the misread verdict was
the headline number of the whole tool, and every gate was green over it. And the smoke
run earned its dollar: the one case that passes before any work is done is exactly the
shape a review reading the spec cannot see, because the spec reads as sound.
