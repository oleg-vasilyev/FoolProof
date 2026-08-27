# A control row on every screen

```
Asked:      "кнопки «назад» и «играть» на всех скринах одного цвета — это неверно";
            make Cancel always in one place and red, Confirm/Play always in one place
            and green, and every keyboard consistent
Kind:       fault
Ran:        ~50 min · opus 5, three fable errands · 178,662 subagent tokens
Path:       read it for the kind of work it is → check the tech debt → now, knowing the
            rules, freeze the interfaces → the plan-reviewer agent → cut the work into
            pieces → the finish-phase skill → the phase-reviewer agent → the copy-reader
            agent — only what moved since → the retrospective skill → write the phase
            log → the write-a-commit skill
Skipped:    the poster-designer agent · the refresh-the-pictures skill · the
            poster-reader agent · the deep-checkup agent
Off-map:    none
Delegated:  3 errands — plan-reviewer returned 7 findings, three of which changed the
            diff before a file existed; phase-reviewer returned 4, two landing as edits
            and two as documents; copy-reader returned 0 findings on the one caption
            that moved, plus the fact that ✅ is one UTF-16 unit where ▶️ was two
Rework:     the callback helper in three keyboards, written three times — typed on
            ActionKind (3 tsc errors), retyped on each screen's own action union, then
            folded into buttonFor for line width — one `head -20` of a codec before
            writing would have settled it
Loops:      the changed-file mutation set ran twice, 2m11s each — the second was to
            re-check two copy tables, which `--mutate` on those two files would have
            done, and finish-phase already says so; two narrowed coverage runs re-read
            what the full run had already printed
Broke:      none
Gates:      lint · types · coverage · mutation over the diff · full e2e · diff review ·
            copy reading · retrospective. Skipped: the gallery and the poster reading,
            because nothing this phase touched is drawn — no SVG, no geometry, no copy
            that lands on a poster; a real evening, for the same reason; the mockup,
            because there was nothing new to draw; the checkup, which the owner asked
            for and which runs after this release as an errand of its own
Found by:   a green Play the domain would refuse — the plan review; two e2e scenarios
            the change breaks and I had not listed — the plan review; a stale button
            block in PLAN.md — me, reading; cancelAvailable naming the wrong fact and
            one index spelled four ways — the review; eight copy separators no test
            held — the mutation gate
Landed:     .claude/agents/plan-reviewer.md — level 5 now also asks, per button, whether
            it is drawn exactly when its tap would be honoured, with the two expressions
            set side by side
```
