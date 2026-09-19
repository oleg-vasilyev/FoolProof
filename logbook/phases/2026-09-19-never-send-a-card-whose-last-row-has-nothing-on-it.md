# Never send a card whose last row has nothing on it

```
Asked:      посмотри ответ Checkup — 19 September 2026, разбей на фазы и начинай править
Kind:       fault
Ran:        opened 2026-09-19T14:57:37Z, closed at this commit's own %cI · claude-opus-5 · 68,653 subagent tokens
Path:       what should be different, in the owner's own words → read it for the kind of work it is → study the project → check the tech debt → the size of the phase in one line → write the core of the feature → write the unit tests → break its subject on purpose and watch it go red → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → npm run check:phase → the retrospective skill, run in this very conversation → save the takeaway to persistent memory → write the phase log to logbook/phases/ → update README, PLAN and whatever else the phase owes → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    the add-a-feature skill · the write-a-spec skill · the plan-reviewer agent · every question at once, before any work · Reading every sentence, then syncing every picture · the write-a-doc skill · npm version with the release message
Off-map:    teaching the fake Telegram a refusal on a worst assumption — the drawing has no step for widening the harness's trust boundary, only for writing a scenario against it
Delegated:  1 errand — the phase-reviewer returned 9 promises checked and 4 findings, all four real and all four closed
Rework:     the new card-service case, rewritten after the review showed it passed against the old code too — settled earlier by the write-a-spec rule "give the mock values that differ from the real ones", in a skill this phase did not load
Loops:      the quality gates entered twice — once for the review's findings, once for a fourth copy of exits[length - 1] that only the mutation gate saw — the twin sweep covered five sibling files and not the inside of the one file being edited
Broke:      none
Gates:      lint · typecheck · check-docs · test:coverage ×5 · test:mutation-changed ×3 · e2e ×3 (one of them the deliberate probe) · e2e:changed ×2 · the phase-reviewer · copy not opened (no table moved) · gallery not opened (nothing drawn changed)
Found by:   the checkup 2 (the empty row, the three seat-zero defaults) · the review 4 · a gate 3 (two lying mocks and the fourth twin) · me 0 · the owner 0
Landed:     memory a-fallback-turned-refusal-red-lists-the-lying-mocks — run the whole suite before writing a case for a new refusal
```

The fake Telegram's new refusal is the part worth keeping. The checkup could report the
empty row only by reading three files and an e2e transcript, because the harness accepted
what a real chat's answer to is unknown. It refuses it now, on the worst assumption and
labelled as one, and the refusal was watched firing: with the old joining restored, three
cases of the reopening scenario go red on a card that will not redraw. What was a finding
readable by a person is a gate from today.

`Off-map:` is the second time a phase has widened the fake rather than written a scenario
against it. The drawing's stage 4 knows only "write the scenario and play it".
