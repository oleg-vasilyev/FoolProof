# Put Fable on call as the advisor, and give every agent the effort it was chosen at

```
Asked:      зацени пост про Opus 5.5 + Fable на /advisor — применить все фиксы: адвайзер, убрать порог в десять файлов, Fable-агентам свой effort, прогнать бенчмарк
Kind:       process
Ran:        opened 2026-09-25 from a post on X, closed at this commit's own %cI · claude-opus-5-5 high, the advisor on claude-fable-5-1, the phase-reviewer on Fable · 108,345 subagent tokens, from the reviewer's own report
Path:       read it for the kind of work → study the project → the size of the phase in one line → cut the work into pieces → read the file this one will sit beside first → the finish-phase skill → npm run check:phase → the phase-reviewer agent → fix the code and re-run only the affected gate → break its subject on purpose → the retrospective skill → save the takeaway to persistent memory → write the phase log to logbook/phases/ → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    Reading every sentence, then syncing every picture · npm version with the release message
Off-map:    three headless claude -p probes settling what a post and a screenshot could not — the advisor fires under -p and from project settings, and an agent's effort: overrides the session's; the CLI binary read for the advisor's flag and switch
Delegated:  1 errand — the phase-reviewer, 12 promises and 8 findings, 2 blocking, all 8 taken
Rework:     the nine agents set to effort low, then medium — the owner's call mid-phase, the question put to him named only the reviewers; the subagent reader restructured twice — first for an unreachable branch, then to copy what it reads beside the report
Loops:      mutation over the changed tooling five times — twice inside check:phase, once after the review, twice while the lane check's specs were strengthened
Broke:      a 240 MB binary grepped with a 250-character window ran past two minutes and was killed
Gates:      check:phase ×2 · lint ×5 · typecheck ×5 · the named test ×4 · mutation-changed ×5 · check-docs ×6, one the lane check's probe, one red on this log's citation · copy not opened (no copy table moved) · gallery not opened (no picture changed)
Found by:   the advisor 3 · the review 8 · me 1
Landed:     check-docs — an errand to a named agent must travel on the lane labelled .claude/agents; memory a-link-given-is-the-source-open-it-or-ask
```

The benchmark's Opus 5.5 row had its four Fable subagents at high effort, inherited from
the session, costing more than the whole orchestrating session. The phase pinned each
agent's effort, switched the advisor on in the project's settings so a benchmark clone
carries it, lifted the ten-file floor on delegated writing and gave writing to an Opus
agent so its reviewers are on another model. The review's sharpest finding was general:
every gate writes one fixed report path, so two agents running a gate at once read each
other's verdicts.
