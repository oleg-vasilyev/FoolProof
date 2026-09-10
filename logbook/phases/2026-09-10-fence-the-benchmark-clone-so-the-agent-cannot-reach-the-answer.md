# Fence the benchmark clone so the agent cannot reach the answer

```
Asked:      «а что-то мешает модели понять, что она проверяется — пойти детально
            прочитать исходники бенчмарка и так сжульничать?» → «я думаю калибровку
            нужно отменить» → «а что если в копию репы добавить хуки, которые не дадут
            модели выходить за пределы правил?» → «давай всё разом, калибровку запустим
            отдельно, когда я дам отмашку»
Kind:       tooling
Ran:        opened 2026-09-10T14:26:55Z (the owner's question, in the chat that also
            closed the benchmark phase), that chat stopped 14:51Z on account limits,
            closed at this commit's own %cI from a second chat · Fable 5.1 throughout ·
            subagent tokens 79 906 (one phase-reviewer)
Path:       Framing the task and the mockup → read it for the kind of work it is → the
            size of the phase in one line → Writing the code and the tests → write the
            core of the feature → write the unit tests: everything around the file
            replaced with stubs → Quality gates → Review by an agent that did not write
            the diff → the phase-reviewer agent → fix the code and re-run only the
            affected gate → Retrospective — fixing the process and the documents → the
            retrospective skill → save the takeaway to persistent memory → write the
            phase log to logbook/phases/ → update README, PLAN and whatever else the
            phase owes → node scripts/gates/gate-runner.ts docs-check → Release to
            production → the write-a-commit skill
Skipped:    check the tech debt · grep the code for the same shape elsewhere · the
            write-a-spec skill · the finish-phase skill · Reading every sentence, then
            syncing every picture · land each rule yourself · npm version with the
            release message
Off-map:    the phase was cut in two by an account limit; the second chat found the
            first by RESUMING-A-LOST-CHAT.md and the memory note the first one left ·
            a three-turn smoke of the runner was played before the review, against a
            clone cut from a HEAD that did not yet hold the hook, so it ran unfenced
Delegated:  1 errand — phase-reviewer: 8 promises, 10 findings, 4 must-fix (the fence
            spec platform-bound to Windows paths, the session scratchpad outside the
            fence, the runner not checking the hook exists in the clone, RUNS.md
            header one column short), all 10 taken
Rework:     the smoke run before the review measured a clone without the fence — settled
            by the review's third finding, which is now the runner's own check · the
            check:phase battery was first started through gate-runner.ts, which does not
            know batteries, and its old paragraph read as fresh — settled by npm run
            check:phase, the only door
Loops:      review ×1 · check:quick ×1 in the first chat · lint, typecheck, docs-check,
            test over scripts ×1 each in the second · check:phase ×1
Broke:      the first chat's account limit at 14:51Z — the tree was left consistent and a
            memory note written; cost: one re-read of the dialogue and a re-run of the
            four quick gates, the minutes not measured
Gates:      see the commit's paragraph · docs-check green · phase-reviewer 4 must-fix +
            6 notes, all landed · copy, gallery: nothing to read, no string a player sees
            changed · npm version: none, the operator and the player get nothing new
Found by:   the owner 1 (the agent can read the runner's source) · the phase-reviewer 10
Landed:     memory a-battery-runs-only-through-npm-run — a battery name handed to
            gate-runner.ts is refused, and a stale gates-paragraph.txt is what a silenced
            refusal reads as
```

The smoke before the review is the shape worth keeping in view: a hardening measured
before the hardening was in HEAD produced an honest zero that meant nothing. The
runner now refuses to start when the hook is absent from the clone, which turns that
mistake into a red line rather than a clean row.
