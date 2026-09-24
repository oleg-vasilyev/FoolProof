# Keep a benchmark run alive while its last subagent is still reading

```
Asked:      нам надо как-то обновить бенчмарк, чтобы агент не заканчивал работу пока ждет сабагента; the failed Opus 5.5 run cleaned out
Kind:       tooling
Ran:        opened 2026-09-24 after the Opus 5.5 run of 2026-09-23T22:39Z ended half a phase early, closed at this commit's own %cI · claude-opus-5-5, the phase-reviewer on its own model, three claude-haiku-4-5 probes · 71,895 subagent tokens, from the reviewer's own report
Path:       study the project → the size of the phase in one line → write the unit tests → the finish-phase skill → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → break its subject on purpose → npm run check:phase → check the tech debt → save the takeaway to persistent memory → write the phase log to logbook/phases/ → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    the write-a-spec skill · Reading every sentence, then syncing every picture · the retrospective skill · npm version with the release message
Off-map:    the cause read off the run's transcripts and the CLI binary; the ceiling proved by live claude -p probes on Haiku; the failed run's row, record, report and clone removed
Delegated:  1 errand — the phase-reviewer, 9 promises and 2 findings, none blocking
Rework:     none
Loops:      the probe ran three times — a foreground sleep refused by the CLI, then the subagent lacking Bash permission; the tech-debt read came after the review instead of while framing
Broke:      none
Gates:      check:phase ×2 · the phase-reviewer · check-docs ×2 · mutation re-run on benchmark-run.ts alone · copy not opened (no copy table moved) · gallery not opened (no picture changed) · retrospective not run as a skill, the one lesson counted by hand
Found by:   the review 2 · the mutation gate 1 · the benchmark itself 1
Landed:     a third cap in benchmark.json handed to the agent as CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS; memory harness-benchmark — how to probe claude -p itself
```

The first Opus 5.5 run closed its turn on "waiting for the copy-reader"; `claude -p` waits
for a background subagent only ten minutes, then interrupts it and exits, so the row read
as a model abandoning its gates. The ceiling was found in the CLI's code, proved with a
twenty-second and a five-minute probe, and is now a sixty-minute cap the runner refuses
to pass as zero.
