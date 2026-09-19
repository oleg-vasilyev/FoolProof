# Answer the tech-debt step with a tool, and make the steps tooling goes round conditional

```
Asked:      посмотри ответ Checkup — 19 September 2026, разбей на фазы и начинай править
Kind:       process
Ran:        opened 2026-09-19T16:10Z, closed at this commit's own %cI · claude-opus-5 · 91,905 subagent tokens
Path:       study the project → check the tech debt → the size of the phase in one line → every question at once, before any work → read the file this one will sit beside first → write the unit tests → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → npm run check:phase → the write-a-spec skill → save the takeaway to persistent memory → write the phase log to logbook/phases/ → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    the add-a-feature skill · the plan-reviewer agent · Reading every sentence, then syncing every picture · the write-a-doc skill · npm version with the release message
Off-map:    none
Delegated:  1 errand — the phase-reviewer checked 12 promises and returned 11 findings, three of them blocking: the tool matched a bare file name against seven files, printed the "Not debt, deliberately" list as debt, and cut every wrapped trigger mid-sentence
Rework:     the whole matching and trigger half of the new tool, rewritten after the review ran it against the real TECH-DEBT.md — settled earlier by calibrating on more than the one entry it was built from, which is the rule the instrument's own first output was supposed to teach
Loops:      the tool's mutation run four times, each after a round of findings; the calibration run three times
Broke:      none
Gates:      lint · typecheck · check-docs ×3 · test:coverage ×4 · test:mutation-changed ×5 (per file) · e2e:changed ×2 · the phase-reviewer · copy not opened (no table moved) · gallery not opened (nothing drawn changed)
Found by:   the checkup 6 · the review 11 · a gate 6 (the survivors that named the uncalibrated shapes) · me 0 · the owner 1 (the Kind: tooling branch, chosen from two options put to him)
Landed:     DEVELOPMENT-FLOW.md — the tech-debt step names a command, three skill steps became conditional, the site loop has a cap, a phase that moves files freezes the tree, and writing a file opens with reading its neighbour
```

The reviewer's three blockers were all the same fault: the tool was calibrated on the
one entry it was built from. `TECH-DEBT.md` has 36, and the other 35 break it — `copy.en.ts`
named in passing matched seven files, the "Not debt, deliberately" list came back as debt
with a bullet for its trigger, and 30 of 36 triggers are wrapped over two lines, so the
answer was cut mid-sentence. The instrument's first output was read as a claim about the
instrument once and should have been read that way three times.

The step it answers also moved to where an answer exists: `tools.ts debt` now takes the
files a phase is *about* to touch, because at stage 1 there is no diff to read and a step
that always says "0 entries" is worse than one that is skipped.
