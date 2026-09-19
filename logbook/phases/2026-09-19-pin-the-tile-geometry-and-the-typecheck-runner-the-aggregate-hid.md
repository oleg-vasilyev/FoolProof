# Pin the tile geometry and the typecheck runner the aggregate hid

```
Asked:      посмотри ответ Checkup — 19 September 2026, разбей на фазы и начинай править
Kind:       tooling
Ran:        opened 2026-09-19T15:52Z, closed at this commit's own %cI · claude-opus-5 · 70,924 subagent tokens
Path:       study the project → check the tech debt → the size of the phase in one line → write the unit tests → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → npm run check:phase → save the takeaway to persistent memory → write the phase log to logbook/phases/ → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    the add-a-feature skill · the write-a-spec skill · the plan-reviewer agent · every question at once, before any work · write the core of the feature · Reading every sentence, then syncing every picture · the write-a-doc skill · npm version with the release message
Off-map:    none
Delegated:  1 errand — the phase-reviewer checked 8 promises and returned 6 findings, four of them about the specs asserting the wrong subject or repeating a real value
Rework:     two of the fourteen new typecheck cases rewritten to assert the runner rather than the parser it calls, and one mocked metric changed off the real value — settled earlier by loading write-a-spec, which holds both rules and was not opened
Loops:      the mutation gate run per file four times, three of them the intended red→fix→re-run cycle and one to confirm the reviewer's equivalence claim
Broke:      none
Gates:      lint · typecheck · check-docs · test:coverage ×3 · test:mutation-changed ×6 (per file) · e2e:changed · the phase-reviewer · copy not opened (no table moved) · gallery not opened (nothing drawn changed)
Found by:   the checkup 2 · the review 6 · a gate 2 (the two mutants left after the first pass) · me 0 · the owner 0
Landed:     memory a-phase-made-of-specs-opens-write-a-spec-first — a diff made of specs loads that skill before the first case
```

`career-tiles.ts` went from 23 survivors to none, and the case that did most of it is one
table of four coordinate pairs: the two columns and the two rows together pin the modulo,
the floor, the column arithmetic and the row height in a single assertion. The 17
arithmetic mutants the checkup counted were not 17 problems.

The typecheck runner's remaining mutant, `run.status ?? FAILED` → `run.status && FAILED`,
is equivalent: `null && 1` is `null`, `0 && 1` is `0`, and the only reader asks `!== 0`.
