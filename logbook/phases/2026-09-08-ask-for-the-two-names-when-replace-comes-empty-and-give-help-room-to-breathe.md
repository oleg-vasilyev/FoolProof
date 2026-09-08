# Ask for the two names when /replace comes empty, and give /help room to breathe

```
Asked:      «команда reopen вызыванная без аргумента должа реплаить с просьбой ввести 2
            имени, типа Рома, Романи … запиши в plan, что любая команда требующая
            аргументов должна реплаить» (the example named /replace, and that is what
            was fixed) · «можно улушить help — сплошной текст, добавить отступов» ·
            «третья картинка в readme огромная без причины — чтобы помещалась на 1
            экран, как первые 2»
Kind:       fault
Ran:        not measured to the minute — opened 2026-09-08T11:48Z (the transcript's first
            line), closed at this commit's own %cI · Fable 5.1 throughout · 338,467
            subagent tokens (copy-reader 38,183 · phase-reviewer 62,635 · retrospective
            fork 237,649)
Path:       Framing the task and the mockup → read it for the kind of work it is → check
            the tech debt → grep the code for the same shape elsewhere → the size of
            the phase in one line → the write-a-spec skill → now, knowing the rules,
            freeze the interfaces → Writing the code and the tests → write the failing
            test at the layer that can still see the fault → write the core of the
            feature → write the unit tests: everything around the file replaced with
            stubs → the copy-reader agent — the finished sentences → fix the tables now
            → Quality gates → the finish-phase skill → npm run check:phase → fix it,
            then re-run that gate alone → Review by an agent that did not write the
            diff → the phase-reviewer agent → fix the code and re-run only the affected
            gate → the write-an-e2e-scenario skill → write the scenario and play it →
            Retrospective — fixing the process and the documents → the retrospective,
            run in a fork of this very conversation → land each rule yourself → name
            the gate that should have caught it → land a new rule in the skills → save
            the takeaway to persistent memory → write the phase log to logbook/phases/
            → update README, PLAN and whatever else the phase owes → npm run docs:check
            → Release to production → the write-a-commit skill → npm version with the
            release message
Skipped:    reproduce it on the platform it happened on · one brief, one question · every
            question at once, before any work · the poster-designer agent · the
            add-a-feature skill · the add-repository-method skill · the plan-reviewer
            agent · write both copy tables first · briefs to every subagent in one go
            · Reading every sentence, then syncing every picture · redraw this very
            diagram · the skill-auditor agent · the write-a-doc skill
Off-map:    the check:phase gates were run one by one and by hand rather than as the
            one command; the copy tables were written after the handler that reads
            them, though the reader still read them before anything else was welded on
Delegated:  3 errands — copy-reader: 50 lines read, 3 findings, 3 taken (the Russian
            question had lost its subject); phase-reviewer: 10 promises held, 5
            findings, 4 taken (argument order, a dead stub branch, one skeleton for the
            two entry points, /help's shape into PLAN.md), 1 superseded by the report
            on disk; retrospective fork: six counted answers, five sentences to land
Rework:     the TECH-DEBT trigger check went red twice — the check's own message named
            the remedy on the first run and was read on the second; one e2e caption
            list typed from the command instead of derived from the rotation — settled
            by reading the sibling scenario; two shell payloads refused by the hook for
            a backslash, redone through Edit — settled by going to Edit first; the four
            review findings cost a second lint/types/suite, coverage, one-file Stryker
            and a two-file e2e replay — three of the four were visible in my own diff
            before launch
Loops:      npm run check ×2 · coverage ×2 · mutation:changed ×1 + --mutate one file ×1
            · e2e three files ×1, one file ×1, e2e:changed full ×1, two files ×1 ·
            docs:check standalone ×6 (2 red on the trigger, 3 red on skill budgets
            while landing the retro's sentences) — no run re-read a report already on
            disk; the survivors were read once from mutation.json
Broke:      none
Gates:      lint, types green · suite 4646 in 199 files · coverage 99.84/97.61/100/99.83
            · mutation 99.15% over the diff, 98.84% on the rewritten handler alone,
            three survivors left (two type-only null guards, one static mutant that
            throws at import) · e2e 202 in 17 files, the whole suite because shared/
            changed, one file red once on the caption order · docs:check green after
            the trigger vocabulary grew · copy: read at stage 2, nothing moved since ·
            gallery: not opened, no drawing changed · plan-reviewer: not owed, no new
            command or contract · npm version: minor, a question where a usage line was
Found by:   the owner 2 (the usage line on a bare /replace, the run-on /help) · me 1
            (the installer's text listener swallowing the second feature's, found by
            reading the installer before the first file) · the copy-reader 3 · the
            phase-reviewer 4 · the gates 2 (the caption order, the trigger phrase)
Landed:     memory a-regex-never-goes-through-a-heredoc widened to inline evaluators; new
            memory a-gate-that-names-its-remedy-gets-that-remedy; one sentence each in
            add-a-feature (next() is what lets a second feature hear text),
            write-an-e2e-scenario (captions are derived, never typed) and finish-phase
            (an owner's request under a running review is scope, landed after)
```

The fault the owner reported was a missing question; the fault worth the phase was the
one underneath it — the installer had never let a second feature hear a text message,
and nothing said so because no second feature had tried. The gate that should have
caught it is a scenario replying to the *other* feature's question, and that scenario
now exists; the reading that caught it instead was the installer, opened before
designing the shared module, which is the cheap version of the same check.
