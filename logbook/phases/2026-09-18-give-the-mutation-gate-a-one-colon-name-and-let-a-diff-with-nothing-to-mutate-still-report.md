# Give the mutation gate a one-colon name, and let a diff with nothing to mutate still report

```
Asked:      test:mutation:changed нужно переименовать в test:mutation-changed
Kind:       tooling
Ran:        42m · claude-opus-5 · 183,721 subagent tokens
Path:       read it for the kind of work it is → the size of the phase in one line →
            Writing the code and the tests → npm run check:phase → the phase-reviewer agent →
            Writing the code and the tests → npm run check:phase → the phase-reviewer agent →
            the write-a-spec skill → Writing the code and the tests → npm run check:phase →
            the phase-reviewer agent → the retrospective skill → land each rule yourself →
            write the phase log
Skipped:    check the tech debt · now, knowing the rules, freeze the interfaces ·
            Reading every sentence, then syncing every picture · the write-a-doc skill ·
            Release to production
Off-map:    none
Delegated:  3 errands — phase-reviewer, three passes over a growing diff: 3 findings, then 2, then 4
Rework:     family-scores.spec.ts written whole and rewritten whole (113 lines, then 137) — the write-a-spec
            rule about values that cannot be confused was read minutes before the first write and not applied ·
            the landed rule redrafted five times against the skill's line budget — reading the budget's
            headroom before drafting would have settled the shape in one
Loops:      gates → review, three times — sent back by the crash, then by the owner taking the missing spec
            into scope, then by the review's own findings
Broke:      check:phase died with a TypeError instead of reporting — one battery run lost, and the first
            review pass invalidated by the fix that followed it
Gates:      lint · typecheck · test:coverage · test:mutation-changed · e2e:changed · check-docs ·
            phase-reviewer — skipped: the copy reading, no user-visible string moved; the gallery,
            nothing drawn; the real evening, no poster changed
Found by:   the crashing battery — the NaN score; the mutation gate — an unpinned bar on a line this phase
            wrote; the review — six, from three stale memory files to a fixture that contradicted itself
Landed:     .claude/skills/finish-phase/SKILL.md — a phase whose subject is the gate machinery runs the
            whole battery before the review, merged into the rule about what check:quick cannot see
```

The rename itself was a one-token edit in `gate-names.ts`; the file stem keeps its
spelling either way, because `fileStemOf` turns every colon into a dash, so nothing
under `reports/gates/` moved.

What the phase actually cost came from the diff having no mutable file in it.
`gate-names.ts` is a table of string literals and Stryker made no mutants from it, so
`totalValid` was zero, `mutationScore` was `NaN`, the verdict on disk carried `null`,
and the paragraph writer dereferenced it. The gate was green; the battery still died.
Any phase whose diff mutates nothing would have hit it.

Three review passes is the number to look at. The first went out on a green
`check:quick`, which does not contain the gate this phase was editing — the battery
then crashed, the fix trebled the diff, and the reading had to be taken again. That is
the rule that landed, and it displaced nothing: the `package.json` rule beside it had
the same cause and the two now share a paragraph.
