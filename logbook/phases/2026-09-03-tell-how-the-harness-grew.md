# Tell how the harness grew, from the commits alone

```
Asked:      «пройдись по всему гит дереву, чекнул коммиты и изменения в коде чтобы отследить
            как менялся проект в первую очередь с точки зрения харнеса … на выходе я бы хотел
            иметь кейс стади … интерактивную html страничку … хостилась на github pages … на
            лендинге и в readme ссылка» — seven questions asked before any work and answered in
            one message: commits only, both languages, the posters' and the landing's palette,
            a copywriter on the text, push allowed
Kind:       documents
Ran:        2026-09-02 23:32 +04 → 2026-09-03 05:20 +04, the log's own write time, the
            commit being the next act · Fable 5.1 · 2,997,202 subagent tokens over 11
            errands · a usage-limit pause between 00:16 and 04:42 by file times sits
            inside the wall clock
Path:       every question at once, before any work → Writing the code and the tests →
            Quality gates → Review by an agent that did not write the diff →
            Retrospective — fixing the process and the documents → write the phase log
            to logbook/phases/ → Release to production
Skipped:    the size of the phase in one line · check the tech debt · the plan-reviewer
            agent · Reading every sentence, then syncing every picture · The checkup —
            occasional, and it is allowed to fix nothing
Off-map:    six era-reader agents, one per slice of the history, each chronicling commit
            messages and harness diffs into a file the text was then written from · a
            fact-checker re-deriving every quote and number of the English draft from git
            before the copy was final · a prose editor per language in place of the
            copy-reader, because the page's sentences live in no copy table
Delegated:  11 errands — six era readers: a chronicle each of 4.8k–9.8k words, 1,753,157
            tokens in parallel, the longest 8m48s · copy editor EN: a revised draft and 13
            questions, 97,582 tokens, 6m10s · fact-checker: 261 claims against git, 217
            verified, 41 corrected, 30 corrections applied, 258,162 tokens, 16m14s · copy
            editor RU: 69 edits, 9 of them mistranslations, 220,062 tokens, 17m35s ·
            phase-reviewer: 12 promises checked, 10 findings, none blocking, all taken,
            125,044 tokens, 5m05s · retrospective in a fork: 3 landings, 543,195 tokens,
            2m48s
Rework:     seven — the per-commit metrics script rewritten from bash to node after a 600 s
            timeout · the dataset built three times (a Git Bash tag syntax, a hash parsed as
            a number, rows interleaved by the background script still running) · the draft
            corrected in 30 places after the fact-check, five of them "later" claims read
            off dates without times · the chart code moved from inline to a shared file
            when the Russian page needed it · four of the reviewer's ten findings avoidable
            at writing time · colliding x-axis labels · SVG text unreadable at 375 px
Loops:      docs:check ×4 · site-css ×4 · lint ×2 · typecheck ×2 · palette validator ×3 ·
            dataset build ×3 · screenshot ×9 returning black, cropped or stale · one full
            vitest run only to re-read a count that a tail had cut from check:phase
Broke:      the bash metrics script: past its timeout, moved to the background, then kept
            appending to the file its node replacement had overwritten — found only when the
            dataset build failed on a row from the wrong commit · a usage limit ended the
            session mid-verification
Gates:      lint · types · docs:check · e2e:typecheck · e2e:test · check:phase — coverage
            99.86/97.53/100/99.85 over 4367 tests in 183 files, mutation and e2e reported
            nothing to do because no src/ file changed · review · retrospective — all ran.
            Copy reading skipped: no copy table changed; the page's own sentences were read
            by one editor per language and a fact-checker instead. Gallery not opened: no
            poster changed; docs:check holds the committed pictures. Real evening skipped:
            no poster wording moved. Plan review skipped: a site page, no contract changed
Found by:   the fact-checker — five elapsed-time claims, two miscounts against the commits'
            own numbers, a quote attributed to the commit that kept the exclusion rather than
            the one that removed it, "one person and one model" where two model names sign
            the history · the copy editor — three headings the body contradicted · the
            review — English strings reaching the Russian page from the shared script, era
            colours stated in three places, tab roles without the pattern, dead hover CSS,
            the README telling the case study twice · the RU editor — nine mistranslations ·
            me — the interleaved dataset rows, the label collision, the mobile font size ·
            the owner — none, away for the whole phase
Landed:     memory/a-replaced-background-task-is-killed-first.md — a command moved to the
            background is stopped before its replacement writes the same file
Landed:     memory/check-the-harness-can-show-it.md — the recipe that gets a picture out of
            the hidden pane, beside the symptom that memory already named
Landed:     memory/history-prose-gets-a-cold-fact-check.md — a narrative built from commits
            is checked by an agent re-deriving every quote and number from git, with
            timestamps rather than dates in the chronicler's brief
```

The one detour worth a sentence: the retrospective's own hand-off had to be read twice,
because the first reading of its `Delegated:` line counted the fork's tokens as "as
reported at the commit" and the notification carried them a minute later.
