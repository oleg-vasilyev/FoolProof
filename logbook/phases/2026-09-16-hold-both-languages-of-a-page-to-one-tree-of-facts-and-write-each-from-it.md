# Hold both languages of a page to one tree of facts, and write each from it

```
Asked:      «почему русский текст на кейс-стади и лендинге получается машинным, когда в чате
            он связный» — diagnosed as translation from the English page, then «давай думать,
            как сделать процесс, который будет гарантировать адекватный русский», «солюшен
            должен работать и для лендинга», «надо сохранить структуру сайтов», «абзац как
            правило, секция точечно», «нужен docs-check, чтобы сайт и дерево не могли
            разойтись», «делай»
Kind:       process
Ran:        the diagnosis came first and is unmeasured; the first file was written at
            2026-09-16T10:44Z, closed at this commit's own %cI · Fable 5.1 throughout ·
            subagent tokens 412,491 over three errands
Path:       Framing the task and the mockup → the size of the phase in one line → Writing
            the code and the tests → Quality gates → Review by an agent that did not write
            the diff → the phase-reviewer agent → npm run check:phase → Retrospective —
            fixing the process and the documents → node scripts/gates/gate-runner.ts
            docs-check → write the phase log to logbook/phases/ → Release to production →
            the write-a-commit skill → commit and push to main
Skipped:    check the tech debt · Reading every sentence, then syncing every picture · npm
            version with the release message
Off-map:    four cold pages of process design argued with the owner before any file, three
            of them changing the design (landing included, structure kept, granularity
            settled) · the harness's own verdict archive mined from the transcripts into a
            calibration table
Delegated:  3 errands — case-study tree and markup: 386 blocks per page, 0 reorders, 26
            complaints left that were the rule's, all closed in the rule · verdict mining:
            24 owner verdicts on site lines recovered verbatim with dates, all placed ·
            the phase-reviewer: 9 promises, 5 findings, all landed, one blocking (a set
            comparison that let a stranger hide behind a repeated number)
Rework:     the number probe twice — replace() hit the JSON-LD copy in the head the rule
            never reads, so the first run read as a silent gate; counting the needle first
            would have settled it · CLAUDE.md trimmed three times and TECH-DEBT.md three
            times to land on the budget — the gate counts wc -l plus one, now written in
            write-a-doc · the English thousands comma and the Russian ordinals in words
            found by the case-study markup, not foreseen — a real page read before the
            rule was frozen would have shown both
Loops:      docs-check ×14, none re-reading a report already on disk (each followed an
            edit) · test ×4 · typecheck ×2 · lint ×1 · check:phase ×2 (red on mutation at
            75.4%, green at 89.1%) · test:mutation:changed ×1 alone
Broke:      the lint hook reported a parse error between two of eight edits to one file,
            gone by the last — cost one typecheck run to confirm
Gates:      check:phase green · docs-check green · phase-reviewer run · copy: nothing to
            read, no table changed · gallery: shut, no drawing changed — the pages gained
            attributes only, byte-checked · npm version: none, the site ships from main
Found by:   the review 1 (the multiset bug) · the case-study agent 2 (thousands comma,
            ordinals in words) · me 1 (the probe in the head) · the mutation gate 111
            survivors, 40 tests written, 46 left
Landed:     .claude/agents/site-writer.md and site-reader.md — a page is written from its
            tree, one language at a time, never from the other page · scripts/docs-check/
            source/site-text.ts — both pages held to the tree · .claude/skills/write-a-doc/
            SKILL.md — the budget count is wc -l plus one · memory/a-probe-must-hit-a-rule-
            that-applies.md — count the needle before a scripted replace
```
