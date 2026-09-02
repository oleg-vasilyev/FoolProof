# Show one poster at a time

```
Asked:      «лендинг плохо выглядит на широком экране: секция с тремя постерами свёрстана
            в две колонки, третий висит внизу один» — with the owner reserving the design
            decision and asking for the options to be judged by eye, not by prose. Five
            more asks arrived mid-phase, each after looking at the previous one
Kind:       feature
Ran:        wall clock not measured · Opus 5 · 586,840 subagent tokens over three agents
Path:       Framing the task and the mockup → Writing the code and the tests →
            Quality gates → Review by an agent that did not write the diff →
            Reading every sentence, then syncing every picture →
            Retrospective — fixing the process and the documents → Release to production
Skipped:    The checkup — occasional, and it is allowed to fix nothing
Off-map:    the poster-designer agent was considered and refused: it drives the real
            renderer and returns a contact sheet of what the bot draws, and this was HTML
            layout. Four built pages plus a screen-shaped preview took its place
Delegated:  3 errands — phase-reviewer: 9 promises checked, 4 findings, none blocking,
            60,019 tokens, 258s · copy-reader: 42 lines read across two languages,
            6 findings, 75,957 tokens, 270s · retrospective in a fork: 3 landings,
            450,864 tokens, 203s
Rework:     six rounds, five of them the owner looking and asking for the next thing —
            three variant sections rewritten when md: thresholds gave a 687px poster on a
            tablet and a 136px text column, found by a width sweep written after the
            markup rather than before · variant B's slide hiding rebuilt when a component
            class lost to .grid across Tailwind v4's cascade layers · the arrows placed
            inside each slide and then lifted out, which was predictable: a slide is
            display-toggled, so anything inside one is destroyed and re-animated on every
            switch · the caption centred and then pinned at both ends · one re-land caused
            by the CRLF splice below, and a second by the same splice reading its own
            output
Loops:      docs:check ×10 · lint ×7 · typecheck ×7 · test ×5 · coverage ×2 ·
            site-css ×8 · e2e:changed ×1 · mutation ×1, correctly never started while the
            tree was still moving. None re-read a report already on disk
Broke:      the splice script twice. git checkout rewrote the pages in CRLF and the LF
            marker missed, so the closing script tag was lost and the deck code landed
            after </html>; the symptoms were a phantom scrollWidth and roles that would not
            come off. Then, after staging, git checkout restored the file from the index
            and the splice read its own output as the original, landing the section twice —
            caught by the image weight budget, not by anything watching the splice
Gates:      lint · types · docs:check · coverage · mutation over the diff · e2e over the
            diff · review · copy · retrospective — all ran. Gallery not opened: no drawing
            moved, and docs:check holds the committed pictures against what the renderer
            draws. Real evening skipped: no poster's wording moved
Found by:   the copy reading — the awards count on both pages and in PLAN.md said
            thirty-six where the catalogue holds forty-five, plus a gendered listing in
            Russian and two claims stronger than the code guarantees · the review — a gate
            that narrows in silence on git patterns it cannot read, a duplicated constant,
            an aria-labelledby left pointing at a hidden tab, and a first slide that
            animated twice on load · me — the browser pane being hidden, but only after
            four black screenshots
Landed:     .gitattributes — the file declared what must be LF and nothing enforced it.
            docs:check now fails a working copy that has drifted, and the comment saying so
            sits beside the rules it enforces rather than in a document about them.
Landed:     .claude/skills/finish-phase/where-the-budget-goes.md — the rule about scripts
            that edit repository files was indexed on the genre, "a bulk rewrite", so a
            splice conceived as a builder matched neither word and repeated both failures.
            It is indexed on the operation now, and carries the base-from-the-commit half.
Landed:     memory/check-the-harness-can-show-it.md — four black screenshots were spent on
            the page before one call asked the tool about itself.
```
