# Let two agents run the same gate at once, each reading its own verdict

```
Asked:      make the runner refuse an overlapping run instead of relying on prose — then, from the owner: no, the same gate must run in parallel; give each tool's answers a folder and let each agent know which to read
Kind:       tooling
Ran:        opened 2026-09-25 from a task handed over with 213aee2's review finding, closed at this commit's own %cI · claude-opus-5-5, four code-writer agents on Opus, the phase-reviewer on Fable · 465,367 subagent tokens, from the five agents' own reports
Path:       read it for the kind of work → study the project → the size of the phase in one line → every question at once, before any work → the write-a-spec skill → now, knowing the rules, freeze the interfaces → cut the work into pieces → read the file this one will sit beside first → the code-writer agent, one brief per piece → the write-a-doc skill → break its subject on purpose → the finish-phase skill → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → the code-writer agent, one brief per piece → break its subject on purpose → node scripts/gates/gate-runner.ts check-docs — links resolve → the retrospective skill → save the takeaway to persistent memory → write the phase log to logbook/phases/ → the write-a-commit skill → commit and push to main
Skipped:    Reading every sentence, then syncing every picture · npm version with the release message
Off-map:    none
Delegated:  5 errands — three code-writers, 78, 103 and 83 cases green in folders of their own while each ran beside the others; a fourth split the runner's spec after the move, 83 cases; the phase-reviewer, 14 promises and 9 findings, none blocking, all 9 taken
Rework:     a lock around each gate, proposed from the brief and stopped by the owner before any code — asking what "overlap" should mean before reading would have settled it; the runner's disk half moved to runs-on-disk.ts after the review, with its spec split by a fourth writer — the skeleton rule was known before the spec was handed out; the stale-lock takeover rewritten after the review; the refusal's wording, whose grammar broke on its first real print
Loops:      typecheck red three times on specs mid-rewrite, each time on files another piece was still writing
Broke:      none — eight shell edits refused by the payload hook and one tool --help by the gate hook, each redone as a written file
Gates:      check:phase ×1 · check:quick ×1, refused while check:phase held the battery · typecheck ×6 · lint ×4 · the named test ×13 · test:coverage ×3 · mutation-changed ×4, two of them two seconds apart as the proof · e2e ×1 · e2e:changed ×2, one refused while e2e held the worlds · check-docs ×2, one a probe · copy not opened (no copy table moved) · gallery not opened (no picture changed)
Found by:   the owner 1 · the review 9 · a code-writer 1 · a gate 1 · me 1
Landed:     the "one writer out" workaround removed from code-writer.md, delegating-work.md and the flow; memory a-regex-never-goes-through-a-heredoc — a payload with a backslash goes to a written file first
```

Every gate used to write one fixed verdict and one fixed report, so two agents running
`test` on different specs read whichever finished last, and two Stryker runs shared one
sandbox. The brief asked for a lock; the owner wanted the opposite — parallel runs that
work. Each run now writes into a folder of its own under `reports/runs/`, the tool told
where on its command line, and the gate's line names that folder. Only the e2e worlds and
a battery's paragraph, which one run can hold, refuse a second run with the holder named.
