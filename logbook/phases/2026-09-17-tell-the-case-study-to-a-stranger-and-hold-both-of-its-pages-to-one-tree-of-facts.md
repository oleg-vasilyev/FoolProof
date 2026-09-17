# Tell the case study to a stranger, and hold both of its pages to one tree of facts

```
Asked:      «теперь нужно по аналогии обработать кейс стади… сделать для него фактс мд…
            чтобы не было повторов а повествование шло ровно… юзай сайт ридер и райтер…
            минорно обновить визуалку… поревьювай как следует, я ожидаю самостоятельной
            работы» — then, on the preview: «Пять выводов… очень слабая, я бы дальше читать
            не стал», the reader named («ленивый инженер с опытом в AI… после прочтения
            остаётся благодарен»), a second reader («человек вне айти, который иногда
            вайбкодит»), and the five ideas the findings must carry
Kind:       documents
Ran:        16 September 2026 21:32 → 17 September 17:30, across two accounts and three
            usage-limit stops · Fable 5.1, Opus 5 for the writers while Fable was out ·
            subagent tokens 25,795,000 over 214 errands before the account switch,
            1,610,000 over 20 after it
Path:       Framing the task and the mockup → the size of the phase in one line → check
            the tech debt → Writing the code and the tests → the write-a-spec skill → the
            site-writer agent, once per language → the site-reader agent, once per
            language → the site-writer agent again with the findings → node
            scripts/gates/gate-runner.ts docs-check — the tree's words → Quality gates →
            Review by an agent that did not write the diff → the phase-reviewer agent →
            Writing the code and the tests →
            the site-writer agent, once per language → the site-reader agent, once per
            language → the site-writer agent again with the findings → Quality gates →
            npm run check:phase → Review by an agent that did not write the diff → the
            phase-reviewer agent → Retrospective — fixing the process and the documents →
            the retrospective skill → node scripts/gates/gate-runner.ts docs-check — links
            resolve → write the phase log to logbook/phases/ → Release to production → the write-a-commit skill → commit and push to main
Skipped:    Reading every sentence, then syncing every picture · the refresh-the-pictures
            skill · the poster-reader agent · npm version with the release message
Off-map:    the chat restored from another account's transcript after its limit, with two
            writers' unsaved rounds re-briefed from the recovered agent briefs; the owner
            reading the preview mid-loop and rejecting the findings section whole, then
            naming the reader and the five ideas; a cold fact-check of the page against
            git, twice, which found seven then five claims the history did not support
Delegated:  234 errands — before the switch: writers, readers and fact-checkers over four
            rounds per language, two review passes (14 promises, 12 findings, 3 blocking;
            then 2 blocking) · after it: 11 writer errands, every block placed; 6 reader
            passes returning 9, 9, 24, 24, 19, 24 findings, about half wording and the rest
            facts the tree had wrong or missing (who looked at the gallery, the four
            models, seventeen pictures from nine evenings, the named flow steps); one
            review pass, 11 promises, 4 findings, none blocking, all landed; one duplicate
            writer relaunched after a limit and killed, 114k tokens for nothing
Rework:     the findings section written three times — my own five facts, then the owner's
            five ideas, then two wording rounds — because the page's job in the tree did
            not name its reader until the owner did, mid-phase; hero.lead three times, the
            definitions of skill and agent moved in and back out to the tile caption; the
            findings layout from a three-column grid to one column once the bodies grew;
            before the switch, the tree carried seven claims a fact-check had once removed
            and reintroduced — what would have settled it: asking the reader and the bar at
            stage 1, and a cold fact-check of the tree before the first writer
Loops:      docs-check ×26 after the switch, each after an edit, none to re-read a report ·
            check:phase ×2, the second because the reviewer's check:quick overwrote the
            stamp · site-css ×3, one after a locked file · writer→reader rounds: 4 + 1
            before the switch, 3 after
Broke:      three usage limits — one killed five writers before the switch, one ended the
            predecessor chat with three writers in flight, one killed a writer here; each
            cost a re-brief and, once, a duplicate relaunch
Gates:      check:phase · docs-check · phase-reviewer ×3 · copy: the site-reader passes
            above, no copy table changed · gallery: shut, no poster changed · e2e: nothing
            in src
Found by:   the owner 4 (the section as a whole, «кому некогда, тому хватит», the
            unexplained benchmark, the five ideas themselves) · the readers 109 · the
            reviews 18 · the fact-checks 12 · the docs gate on every round (numbers,
            hashes, a pronoun in a heading, two paragraphs in a one-paragraph block)
Landed:     docs/text/case-study.facts.md — the page's job names its reader and the bar, a
            block may carry a For the writer note, a prose heading stands only before the
            first section · .claude/agents/site-writer.md — the brief carries the page's
            job · memory: the case study's reader persona; ListAgents before relaunching
            after a limit
```

The two rewrites the owner asked for were both cheaper than the loop that preceded them:
four reader rounds per language polished sentences whose facts were written from inside
the project, and one line from the owner about who reads the page did what those rounds
could not. The tree now says who the reader is before it says a single fact.
