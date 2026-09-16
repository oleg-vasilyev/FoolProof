# Write the landing from its tree, so a visitor wants the bot

```
Asked:      «делай» on the second phase — the Russian landing rewritten through the new
            process; then, on the built page, twelve line verdicts and one reframing: «этот
            лендинг не очень хорош в плане рекламы — человек должен захотеть поставить бота,
            нужно прямо показать пользу… лучше чистым агентом без лишнего контекста»; then
            «у тебя кончаются лимиты — давай сделаем коммит с ретро, я переключу аккаунт»
Kind:       documents
Ran:        opened right after commit 0f4804f, closed at this commit's own %cI · Fable 5.1
            throughout · subagent tokens 1,640,000 over 41 errands (two writers kept alive
            across passes, seven reader passes, one reviewer)
Path:       Framing the task and the mockup → the size of the phase in one line → Writing
            the code and the tests → the site-writer agent, once per language → the
            site-reader agent, once per language → the site-writer agent again with the
            findings → Quality gates → Review by an agent
            that did not write the diff → the phase-reviewer agent → npm run check:phase →
            Retrospective — fixing the process and the documents → node
            scripts/gates/gate-runner.ts docs-check → write the phase log to logbook/phases/
            → Release to production → the write-a-commit skill → commit and push to main
Skipped:    check the tech debt · the built page for approval, at both widths · Reading
            every sentence, then syncing every picture · npm version with the release
            message
Off-map:    the owner reviewing the built page line by line while the loop ran, twelve
            verdicts landing mid-pass; a reframing of the page's job halfway through, which
            restarted the writing with a fresh agent; the tree gaining facts the readers
            asked for (who the king is, what a cell prints, what is on the card, which
            command adds and which removes)
Delegated:  41 errands — Russian writer, first agent: 85 blocks, then 12 → 5 → 3 → 1
            findings over five passes · Russian writer, fresh agent after the reframing: 85
            blocks, then 14 → 7 → 5 → 1 · English writer: 85 blocks, then 14 → 7 → 4 ·
            readers: 11, 5, 4, 1, 1 findings on the first Russian; 11, 6, 5 on the second;
            10, 6, 5 on the English · the reviewer: see Review
Rework:     the whole Russian page written twice — the reframing («продавать пользу»)
            came after the first page was clean, and would have been in the tree from the
            start had the page's job been asked at stage 1 · eleven tree facts corrected by
            readers' questions — a fact-check of the tree before the first writer would
            have caught the king, the cell, the card, the two commands · placement dropped
            inline markup (➕ spans, the highlighted name) on every full pass until a
            restore script existed
Loops:      docs-check ×31, each after an edit · writer→reader passes: 5 + 4 + 3 · the
            reader finding something new in a block it had passed before, twice
Broke:      subagent transcript files were empty (0 bytes), so a writer's output had to be
            transcribed from the notification; the browser pane was hidden, so no screenshot
            of the page — the owner read the file in the pane instead, and stopped the phase
            before approving it, out of session budget
Gates:      check:phase green (nothing under src/) · docs-check green · phase-reviewer run ·
            copy: nothing to read, no table changed · gallery: shut, no drawing changed ·
            npm version: none, the site ships from main
Found by:   the owner 12 (a title that sold better before, «не X, а Y», a call not a fact,
            proper names, the game's phrase, a heading with a pronoun, «приходится», «ушёл
            домой», headings that describe, «в процессе игры», three repeated words, «на
            бумажке», «История») · the readers 66 across ten passes · the tree, by a
            reader's question 6 · me 1 (the dropped markup)
Landed:     .claude/agents/site-writer.md — no word twice in a sentence; headings short and
            catchy; proper names in Latin; the game's phrases over descriptions ·
            reading-the-sentences.md — fourteen more owner verdicts · docs/text/
            landing.facts.md — "The page's job" section, so the next writer starts from the
            benefit
```
