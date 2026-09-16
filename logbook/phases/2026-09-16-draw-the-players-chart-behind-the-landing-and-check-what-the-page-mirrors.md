# Draw the players' chart behind the landing, and check what the page mirrors

```
Asked:      «хочу еще немного визуально улучшить наш лендинг… сделать его немного более живым,
            при этом не перегружая ни по стилю, ни по производительности… не хватает
            вертикальности… идея небольших параллаксов… что-то на фон тематическое» — then,
            iteration by iteration on the preview: chart lines in the players' colours,
            nothing over text, no narrow places, depth by parallax, C of three concepts
Kind:       feature
Ran:        one sitting on 16 September 2026, opened after the v1.20.4 tag · Fable 5.1 ·
            subagent tokens ≈ 300k (two site-writers 54k, phase-reviewer 74k, poster-reader
            three reads 98k, the rest the writers' earlier FAQ pass)
Path:       Framing the task and the mockup → the size of the phase in one line → check the
            tech debt → the site-writer agent, once per language → Writing the code and the
            tests → the write-a-spec skill → Quality gates → node
            scripts/gates/gate-runner.ts docs-check — links resolve → Review by an agent
            that did not write the diff → the phase-reviewer agent → Writing the code and
            the tests → Quality gates → npm run check:phase → Reading every sentence, then
            syncing every picture → the poster-reader agent → Retrospective — fixing the
            process and the documents → the retrospective skill → the write-a-doc skill →
            write the phase log to logbook/phases/ → Release to production → commit and
            push to main
Skipped:    the site-reader agent, once per language · the refresh-the-pictures skill · npm
            version with the release message
Off-map:    two hours of design iteration on the preview before the phase was framed —
            six shapes of the decoration shown and judged live; an overlap check written in
            the browser's console and run after every route change, at four widths and with
            the parallax's extreme shifts simulated; two OG covers rendered from an HTML
            mock-up through the machine's own Chrome, outside the repository
Delegated:  7 errands — site-writer EN: the two FAQ blocks, used as written; site-writer RU:
            the two blocks, used after one repeated word was fixed by hand; phase-reviewer:
            6 findings, all landed, one blocking; poster-reader ×3 on the covers: a cut
            title fixed, a headline clipped by a card fixed, a card without a title accepted
Rework:     the FAQ mirror rule as its own module, folded into site-pages.ts on the owner's
            remark — the folder's one-rule-per-file habit was mine, not the owner's, and
            asking would have cost one line; LANDING_PAGES in the trace tool, moved beside
            SITE_PAGES by the review — read the neighbour before placing a list; the trace
            gate as seam plus identity, rewritten as equality with the route — a memory
            about generators as dependencies read as a ban on importing a pure one; the
            knockout backgrounds under text, built and removed the same hour — the owner
            called them колхозно on sight, and a sketch would have said so first; the
            posters fanned three ways before the card fan the owner asked for
Loops:      docs-check ×21, three of them to re-read a verdict the tail had cut · test ×6 ·
            lint ×5 · typecheck ×4 · check:quick ×1 · check:phase ×1 · mutation over one
            file ×1, which re-read the report already on disk
Broke:      none
Gates:      check:phase · docs-check · phase-reviewer · copy: the FAQ block read by the writers
            and the prose tool, no site-reader since the owner read the page live · gallery:
            no poster changed; the two covers read cold three times · e2e: nothing in src
Found by:   the owner 9 (suits unlike suits, rails, a card over its caption, narrow bundles,
            a line into the poster, sharp bends, the knockouts, a section over another, the
            anchor gap) · the review 6 · the reader 2 · a new gate 6 (the six stale FAQ mirrors)
Landed:     scripts/docs-check/source/site-traces.ts — the pages must equal the route ·
            site-pages.ts — the FAQ must equal its JSON-LD · site-prose.ts — a FAQ question
            is a heading · TECH-DEBT.md — the palette copy, and the route tuned to today's
            text lengths · memory: a pure in-repo generator may be imported by its gate
```

The owner's nine catches came before any gate could run, on the preview, one screenshot
each; the six the review found were all in tooling written in the last hour. The gate
the phase added went red on the first run against six mirrors that had drifted in an
earlier phase, which is the number that says it was owed.
