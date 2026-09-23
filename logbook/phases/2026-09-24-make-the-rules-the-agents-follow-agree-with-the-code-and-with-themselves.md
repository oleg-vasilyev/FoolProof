# Make the rules the agents follow agree with the code and with themselves

```
Asked:      /claude-api prompt-audit, then "переноси в мэин" once the audit's four questions were answered
Kind:       process
Ran:        opened 2026-09-23T21:57:05Z with the audit, closed at this commit's own %cI · claude-opus-5-5, the five agents on their own models · 829,568 subagent tokens, summed from the agents' own reports
Path:       what should be different → study the project → one brief, one question → write the unit tests → every question at once, before any work → the size of the phase in one line → the finish-phase skill → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → the retrospective skill → save the takeaway to persistent memory → check the tech debt → write the phase log to logbook/phases/ → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    the plan-reviewer agent · break its subject on purpose · Reading every sentence, then syncing every picture · the write-a-doc skill · npm version with the release message
Off-map:    the whole change was drafted as a patch in a scratch worktree and proved there (check-docs, lint, the hook specs) before the owner asked for it on main
Delegated:  5 errands — four audit readers, about forty candidates with file and line, 29 of which survived verification into the patch; the phase-reviewer, 15 promises and 7 findings, none blocking
Rework:     the patch assembled three times — multi-line needles written with LF against CRLF files, then three skills over budget because check-docs counts wc -l + 1 — both settled by reading the files' bytes and line-budgets.ts before the first replacement
Loops:      review → six fixes, each a count or a claim the phase corrected in one place and left standing in another — a grep of the file for the claim being corrected
Broke:      one reply cut off mid-stream — a resume, nothing lost
Gates:      check:phase · check-docs ×3 in the worktree and ×1 on main · lint ×2 and ×1 · the two hook specs ×3 and ×1 · test:mutation-changed on the promise hook alone after the review, 84.44% · the phase-reviewer · copy not opened (no copy table moved) · gallery not opened (no picture changed)
Found by:   the audit 29 · the review 7 · the owner 0 · a gate 0
Landed:     finish-phase and phase-reviewer — check:phase is green before the review launches; memory a-line-budget-counts-one-more-than-wc
```

The audit measured the harness against the models now running it and found almost no
dated prompting — no shouting, no step-by-step scaffolds, no suppressed narration. What it
found was drift: a command, a contract and a stub rule the code had outgrown, and lists
whose announced count no longer matched their length. The owner settled the gate order,
handed two choices back, and dropped the proposed SubagentStop hook because an agent that
stops without its two-number verdict is already refused downstream.
