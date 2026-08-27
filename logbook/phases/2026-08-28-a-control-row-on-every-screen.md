# A control row on every screen

```
Asked:      "кнопки «назад» и «играть» на всех скринах одного цвета — это неверно";
            make Cancel always in one place and red, Confirm/Play always in one place
            and green, and every keyboard consistent
Kind:       fault
Ran:        ~50 min · opus 5, three fable errands · 178,662 subagent tokens
Path:       framing → study the project → check the tech debt → freeze the interfaces →
            the plan-reviewer agent → writing the code and the tests → quality gates →
            the phase-reviewer agent → the copy-reader agent → retrospective →
            write the phase log → release
Skipped:    the poster-designer agent (nothing is drawn) · refresh-the-pictures and the
            poster-reader agent (no SVG, no geometry, no poster copy) · the deep-checkup
            agent (asked for, but it runs after this release as its own errand)
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
            copy reading · retrospective. Skipped: the gallery, no drawing changed; a
            real evening, no poster copy changed
Found by:   a green Play the domain would refuse — the plan review; two e2e scenarios
            the change breaks and I had not listed — the plan review; a stale button
            block in PLAN.md — me, reading; cancelAvailable naming the wrong fact and
            one index spelled four ways — the review; eight copy separators no test
            held — the mutation gate
Landed:     .claude/agents/plan-reviewer.md — level 5 now also asks, per button, whether
            it is drawn exactly when its tap would be honoured, with the two expressions
            set side by side
```
