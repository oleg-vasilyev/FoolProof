# Pin the rules that decide which nine awards reach the card

```
Asked:      посмотри ответ Checkup — 19 September 2026, разбей на фазы и начинай править
Kind:       tooling
Ran:        opened 2026-09-19T16:35Z, closed at this commit's own %cI · claude-opus-5 · 102,882 subagent tokens
Path:       study the project → check the tech debt → the size of the phase in one line → the write-a-spec skill → write the unit tests → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → npm run check:phase → write the phase log to logbook/phases/ → update README, PLAN and whatever else the phase owes → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    the add-a-feature skill · the plan-reviewer agent · every question at once, before any work · read the file this one will sit beside first · Reading every sentence, then syncing every picture · the write-a-doc skill · npm version with the release message
Off-map:    none
Delegated:  1 errand — the phase-reviewer built a simulation of the selection loop, calibrated it against an existing expectation, and disproved three of the six equivalence claims with the exact evenings that show them
Rework:     one case rewritten and two written that the phase had argued were impossible — settled earlier by simulating the loop instead of reasoning about it, which is what the reviewer did in one pass
Loops:      the mutation gate run per file six times, each after a round of cases
Broke:      none
Gates:      lint · typecheck · check-docs ×2 · test:coverage ×4 · test:mutation-changed ×7 (per file) · e2e:changed ×2 · the phase-reviewer · copy not opened (no table moved) · gallery not opened (nothing drawn changed)
Found by:   the checkup 1 · the review 6 · a gate 5 (each round of survivors named the next case) · me 0 · the owner 0
Landed:     PLAN.md — the guarantee pass is fewest-stories-first with seating breaking the tie, a player who sat out is not walked, and a shared row counts for the winner the card has said most about
```

The reviewer's method is the part worth keeping. Three survivors had been argued
equivalent from reading the code — a shared award's winners "always hold equal rows",
the king's row "counted a second way", the two double-spend guards "each other's
redundancy". It wrote a simulation of the loop, calibrated it against an expectation the
spec already held, and returned three evenings where the mutant prints a different card.
All three were rules `PLAN.md` states and nothing tested; two of them are now sentences
in `PLAN.md` that were never written down at all.

Three survivors remain, and the reviewer agreed each is equivalent: a junk array that
cannot pass the printing filter by identity, and one guard that is genuinely redundant
while its twin lives.
