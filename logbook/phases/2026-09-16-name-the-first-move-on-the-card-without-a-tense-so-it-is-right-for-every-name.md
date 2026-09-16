# Name the first move on the card without a tense, so it is right for every name

```
Asked:      «ну вообще по хорошему должно быть "ходил первым" — это же прошлое, надо бы
            поправить», on seeing the bot's «Ходит первым: Рома» beside the landing's mock
Kind:       feature
Ran:        opened right after commit 3adae74, closed at this commit's own %cI · Fable 5.1 ·
            subagent tokens 25,000 over 1 errand
Path:       Framing the task and the mockup → the size of the phase in one line → Writing
            the code and the tests → Quality gates → npm run check:phase → Reading every
            sentence, then syncing every picture → Retrospective — fixing the process and
            the documents → write the phase log to logbook/phases/ → Release to production
            → the write-a-commit skill → commit and push to main → npm version with the
            release message
Skipped:    check the tech debt · Review by an agent that did not write the diff — one copy
            line, no code beside it
Off-map:    none
Delegated:  1 errand — the copy-reader over the moved key: 1 finding, the gender a Russian
            past tense picks, and the noun phrase that has none
Rework:     the line written as «Ходил первым» on the owner's word and rewritten as
            «Первый ход» after the reader filled it with a woman's name — a copy line is
            read filled in before it is placed, not after
Loops:      check:phase ×2 — the first run killed mid-way when the line changed under it
Broke:      none
Gates:      check:phase · copy-reader · docs-check · gallery: shut, no drawing changed · e2e:
            in the battery, no keyboard changed
Found by:   the owner 1 (the tense) · the copy-reader 1 (the gender)
Landed:     none — a copy line, and the landing's mock card now quotes the bot's line
```
