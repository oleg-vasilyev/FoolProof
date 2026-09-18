# Give the documents gate a folder per subject, and every check a name that says what disagrees

```
Asked:      check-docs имеет внутри себя дофига семейств проверок, названия мало чего
            говорят; провести рефакторинг, объединить что можно, дать однозначные имена,
            и почему там console.error, когда результат должен лежать в reports
Kind:       tooling
Ran:        2h10m · claude-opus-5 · 273,323 subagent tokens
Path:       read it for the kind of work it is → the size of the phase in one line →
            Writing the code and the tests → npm run check:phase → the phase-reviewer agent →
            Writing the code and the tests → npm run check:phase → the retrospective skill →
            land each rule yourself → the write-a-doc skill → write the phase log
Skipped:    check the tech debt · now, knowing the rules, freeze the interfaces ·
            the plan-reviewer agent · Reading every sentence, then syncing every picture ·
            Release to production
Off-map:    the owner was asked two closed questions before any file moved — the folder
            taxonomy and whether to fix the gate↔tools dependency — which the drawing
            has no step for outside a mockup
Delegated:  1 errand — phase-reviewer over the staged diff: 14 promises checked, 9 findings,
            1 blocking, all 9 acted on or declined with a reason
Rework:     four check names and one folder name, renamed after the review (committed posters,
            the flow roster, the site's images, the plan's contents list; repository/ → codebase/)
            — the rule was invented by this phase and never enumerated over its own 35 names ·
            two U+00A0 characters lost retyping a 180-line verbatim move — a script or git mv
            would have carried them
Loops:      gates → review → gates, once — sent back by the review's own findings
Broke:      none
Gates:      lint · typecheck · check-docs · test:coverage · test:mutation-changed ·
            e2e:changed · phase-reviewer — skipped: the copy reading, no user-visible string
            exists in scripts/; the gallery, nothing drawn; the real evening, no poster changed
Found by:   the gate — four TECH-DEBT rows and two stale citations after the move; the review —
            the blocking stale paths the gate cannot see, the name collision with
            src/shared/repository/, four violations of this phase's own naming rule; me —
            the lost U+00A0, by a byte audit after one red test
Landed:     memory/a-verbatim-move-is-never-retyped.md — a dossier move goes through git mv or a
            script, never Write · memory/a-list-of-changes-is-a-phase.md — the TECH-DEBT reading
            at framing, with this phase as its sharper proof
```

The gate held thirty-seven checks in `documents/` and `source/`, split by whether a
check reads only markdown. That is a fact about the parser rather than the subject, so
`line-endings.ts` — the working tree against `.gitattributes` — sat under `source/`
beside `site-text.ts`, which reads a document. Thirteen checks were called `…OutOfStep`
without naming what they were out of step with.

Four of the splits this phase made were already written in `TECH-DEBT.md`, as rows with
triggers that had fired, and I found them only when `check-docs` went red on their stale
paths. `check the tech debt` is drawn in stage 1 and I walked past it; the size of the
phase was quoted without them. It cost no extra work — the splits were the same either
way — but the list of what the phase closes was assembled backwards, out of a red gate.

The reviewer is the number worth keeping. It cost 273k tokens and seven minutes of wall
clock, and four of its nine findings were this phase failing the naming rule this phase
had just invented — names covering one of three cases, or inverting one. `finish-phase`
says to run a new rule over the phase's own diff *first*; I read that sentence and
launched the agent in the same turn. Enumerating thirty-five names against their own
rule is a two-minute read.

Against the standing rule that writing above ten files is delegated: sixty-nine files
were written here, all by hand. The mechanical half — six spec files split along
`describe(` boundaries — was the delegable part, and the one place a script did the work
instead of my fingers is the one place nothing was lost.
