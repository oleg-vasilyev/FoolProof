# Stop the documents gate saying out loud what its report already holds

```
Asked:      console.log(...) — зачем нам тут лог?
Kind:       tooling
Ran:        25m · claude-opus-5 · 69,374 subagent tokens
Path:       read it for the kind of work it is → Writing the code and the tests →
            npm run check:phase → the phase-reviewer agent → Writing the code and the tests →
            npm run check:phase → the retrospective skill → land each rule yourself →
            write the phase log
Skipped:    the size of the phase in one line · check the tech debt ·
            now, knowing the rules, freeze the interfaces · the plan-reviewer agent ·
            Reading every sentence, then syncing every picture · the write-a-doc skill ·
            Release to production
Off-map:    none
Delegated:  1 errand — phase-reviewer over a seven-line deletion: 7 promises checked,
            1 finding, none blocking
Rework:     none
Loops:      none
Broke:      none
Gates:      lint · typecheck · check-docs · test:coverage · test:mutation-changed ·
            e2e:changed · phase-reviewer — skipped: the copy reading, no user-visible
            string exists in scripts/; the gallery, nothing drawn; the real evening,
            no poster changed
Found by:   the owner — the surviving console.log the phase before had left beside the
            console.error it removed; the review — NOTHING standing for both "no
            complaints" and "exit code 0" on one line
Landed:     memory/a-decision-is-applied-to-every-twin-in-the-file.md — a reason given for
            removing one thing is grepped against the same file in the same edit
```

The commit before this one removed `console.error(complaint)` from `check-docs.ts` on
the grounds that `reports/check-docs/complaints.json` already holds every complaint and
the runner reads it back. Five lines below, in the same file, `console.log` announced
either `documents agree: 7 files, links and anchors resolve` or the complaint count, and
the same argument killed it. The phase shipped with half the decision applied.

Two things about the sentence that went. On green it was the only gate output of its
kind — `lint` and `typecheck` leave nothing but the command line in their logs — and
its number was wrong in spirit: `DOCUMENTS.length` is seven root documents, while the
same run reads thirteen skills with their pages, eleven agents, the flow drawing, the
phase logs, four site pages, two fact trees, the posters folder, all of `src/`,
`.env.example` and every file in the repository for its line endings. On red it printed
a count the runner already prints from the JSON.

The gap the owner then named is the one worth carrying forward: `typecheck` and
`e2e:typecheck` declare no output file at all and are fed from stdout
(`gate-numbers.ts:142` is the only use of that parameter), and `e2e:changed` writes
vitest's report but keeps its own selection — play everything, play these N, play
nothing — nowhere but a log line. That is the next phase.
