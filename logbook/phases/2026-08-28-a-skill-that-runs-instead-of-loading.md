# A skill that runs instead of loading

```
Asked:      Add forks to the skills that benefit, and show on the flow drawing which ones run in a fork
Kind:       process
Ran:        1h18m07s (10:44:00Z–12:02:07Z) · Opus 5 · 982932 subagent tokens
Path:       Framing the task and the mockup → check the tech debt → Writing the code and the tests → Quality gates → Review by an agent that did not write the diff → Writing the code and the tests → Quality gates → Retrospective — fixing the process and the documents → Release to production
Skipped:    Reading every sentence, then syncing every picture · The checkup — occasional, and it is allowed to fix nothing
Off-map:    none
Delegated:  4 errands — a fork probe returned one line for 391762 tokens and established that a fork inherits the conversation; a general-purpose probe settled whether a subagent still reaches the Skill and Agent tools; the retrospective ran as a fork and returned six counted answers; the phase-reviewer returned 12 checked promises and 6 findings, 5 of them real
Rework:     6 — the flow drawing rewired four times as the owner cut back what I had drawn; the phase-reviewer launched three times and killed twice; refresh-the-pictures given context fork and stripped of it within the hour on the review's first finding; a budget paragraph moved onto a page after being written into the skill; npx prettier reformatted 23 lines of a file no formatter owns, costing a full revert; the twelve-skill criterion re-derived once the owner asked whether the others benefit
Loops:      docs:check×23 in the first half, 18 of them budget arithmetic and 10 on one page — the count came from the forked retrospective, and the gate itself measures 760-840ms, so the cost was never the machine
Broke:      one shell heredoc lost its escapes against a file with mixed line endings, and the classifier refused the settings edit, which was the owner's to make
Gates:      lint · types · coverage 99.77/97.05/100/99.76 · mutation 100% over the diff · e2e nothing to play, no src/ file changed · review 6 findings · copy not opened, no table moved · gallery not opened, nothing drawn
Found by:   the review 5, the owner 4, a gate 8, me 2
Landed:     .claude/skills/finish-phase/SKILL.md — a review waits on the owner's edits, not only on yours; .claude/skills/finish-phase/where-the-budget-goes.md — a round trip is the unit, not a second of machine time; memory a-tool-absent-from-package-json-is-not-this-project-s
```

The phase was asked for forks on the skills that benefit and delivered one of two, which
is the interesting part. `update-the-design-page` runs as its own subagent now.
`refresh-the-pictures` was given the same field and lost it inside an hour, because the
review turned the phase's own new rule on the phase's own diff: a skill consulted as
reference may not fork, and three readers want that skill's text rather than its task —
gate 6 leaves the conclusion with the caller using triage rules kept inside it, and both
`settling.ts` and the `deep-checkup` brief send a reader there for one measuring command.
What would have to move first is in `TECH-DEBT.md` with the trigger.

Two mechanisms were confused at the start and are worth keeping apart: `context: fork`
in frontmatter is an *isolated* subagent driven by the skill body, while the fork
subagent inherits the whole conversation. The retrospective needs the second and would
be destroyed by the first, so its file names no field and its description says how it is
run instead.

**The owner caught three things I had already reasoned past.** That the `context: fork`
field exists at all — I had said it did not, from a subagent's summary, with the
documentation one fetch away. That a fork inherits the conversation, which I had denied
in the same breath. And that the retrospective should therefore itself be forked, which
I had written into two files and then not done. Each was a case of stating a conclusion
more firmly than the evidence behind it, and the fix that generalises is in memory:
an absence is claimed only from a primary source.
