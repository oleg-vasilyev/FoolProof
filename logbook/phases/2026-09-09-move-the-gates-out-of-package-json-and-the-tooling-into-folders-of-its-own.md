# Move the gates out of package.json and the tooling into folders of its own

```
Asked:      «В package.json остаются только восемь скриптов … Все гейты живут в
            gate-list.ts с прямыми командами и ходят только через раннер» · «Папка
            scripts/ разбивается по доменам … конфиги гейтов уезжают под
            scripts/gates/config/» · «перенос обязан идти с пробой: сломать правило и
            увидеть красный хук» · «Ничего больше не удалять» · «после имплементации
            правила — сначала убеждайся, что оно кинет ошибку … нужны доказательства,
            что все скрипты работают» · «а как-то можно без этого? но не добавляя
            команду в scripts?» · «переименуем check в check:quick» · «docs:check
            переименовать в check-docs» · «check-docs надо переименовать в docs-check»
Kind:       tooling
Ran:        opened after af08fc5 landed at 16:51 local, closed at this commit's own
            %cI · Fable 5.1 throughout · subagent tokens: plan-reviewer not measured,
            phase-reviewer 151k
Path:       Framing the task and the mockup → read it for the kind of work it is → check
            the tech debt → the size of the phase in one line → now, knowing the rules,
            freeze the interfaces → the plan-reviewer agent → the finding, while nothing
            is written yet → Writing the code and the tests → write the core of the
            feature → write the unit tests: everything around the file replaced with
            stubs → Quality gates → the finish-phase skill → npm run check:phase → fix
            it, then re-run that gate alone → Review by an agent that did not write the
            diff → the phase-reviewer agent → fix the code and re-run only the affected
            gate → npm run check:phase → Retrospective — fixing the process and the
            documents → the retrospective skill, run in this very conversation → land
            each rule yourself → save the takeaway to persistent memory → write the
            phase log to logbook/phases/ → update README, PLAN and whatever else the
            phase owes → node scripts/gates/gate-runner.ts docs-check → Release to
            production → the write-a-commit skill → commit and push to main → npm
            version with the release message
Skipped:    grep the code for the same shape elsewhere · reproduce it on the platform it
            happened on · one brief, one question · every question at once, before any
            work · the poster-designer agent · the add-a-feature skill · the write-a-spec
            skill · the add-repository-method skill · write the failing test at the
            layer that can still see the fault · write both copy tables first · the
            copy-reader agent — the finished sentences · briefs to every subagent in one
            go · the write-an-e2e-scenario skill · Reading every sentence, then syncing
            every picture · redraw this very diagram · the skill-auditor agent · the
            write-a-doc skill · name the gate that should have caught it
Off-map:    the plan was written to a scratch file with two owner questions (the backup
            unit, the e2e bot log) answered before a line was moved; the owner's
            standing rule arrived mid-phase — every rule and every moved gate proven by
            a deliberate break before the next — and the phase ran under it from then
            on: 14 probes, 4 of which missed the rule and were redone
Delegated:  2 errands — plan-reviewer: 12 findings, 9 taken in this phase, 2 deferred to
            the verdict-contents phase, 1 (a family the full run never reached says
            "not run") taken after the review named it; phase-reviewer: 13 promises,
            10 held, 10 findings, 10 taken (the plan's "12 taken" corrected, one
            GATE_RUNNER constant, stale npm run in .env.example and three config
            comments, a spec stub never spawned, a gates↔tools import cycle, a
            TECH-DEBT sentence, a spec title)
Rework:     four probes hit nothing the rule watched — var in e2e/ (import bans only),
            two blank lines after imports (already the right shape), a hidden spec whose
            subject other specs still covered, hook JSON with broken escaping — each
            redone against the rule's own scope · three check fixtures missed by the
            first rename sed · (?![a-z]) let npx tsc-files through · the "not run"
            phrase first put in the green branch a red gate never prints — all three
            caught by the suite
Loops:      check:phase ×2 (green, green), then coverage and mutation alone after the
            hook landed · check:quick ×1 · check:push ×1 · docs-check ×9 (red on 63 stale
            names once, on a budget once) · lint through the runner ×8 · scripts suite
            ×9 · tsc and eslint typed by hand, past the runner, 12 — the count that
            became the hook
Broke:      none
Gates:      check:phase green — see the commit's paragraph · docs-check green · copy:
            nothing changed · gallery: not opened, no drawing changed (drawn once as the
            tools' proof) · plan-reviewer: run, contracts changed · npm version: a patch,
            the backup unit moved and the operator reinstalls it
Found by:   the owner 5 (the probe rule, the npx form of the Stop hook, three renames) ·
            the plan-reviewer 12 · the phase-reviewer 10 · the gates 4 (three stale
            fixtures, one import order) · me 2 (the e2e probe rule, the by-hand count)
Landed:     eight scripts in package.json; gates as a step table run without a shell;
            scripts/ in six domain folders with the configs under gates/config/; the
            hooks with --config; docs-check reading every document for npm run, runner
            gates and tools run by hand; held() honouring exclusions; a PreToolUse hook
            refusing a gate typed by hand; memory a-probe-must-hit-a-rule-that-applies;
            finish-phase's grep paragraph narrowed to what no gate sees
```

The owner's mid-phase rule — break it, see red, then move on — found nothing wrong
with the code and four things wrong with the probes, which is the finding: a probe that
misses reads exactly like a gate that does not fire. The other number is twelve tools typed
by hand while writing the rule that forbids it for documents; the hook that now refuses
that is the phase applying its own rule to its author.
