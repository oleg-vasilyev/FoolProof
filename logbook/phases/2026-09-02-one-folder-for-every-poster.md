# One folder for every poster

```
Asked:      «нам не нужно 2 папки с почти полностью повторяющимися постерами — давай
            соединим их в одно»
Kind:       tooling
Ran:        wall clock not measured · Opus 5 · 172,102 subagent tokens over two named agents
Path:       Framing the task and the mockup → the plan-reviewer agent →
            Writing the code and the tests → Quality gates →
            Review by an agent that did not write the diff → Writing the code and the
            tests → Quality gates → Reading every sentence, then syncing every picture →
            Retrospective — fixing the process and the documents → Release to production
Skipped:    the copy-reader agent — only what moved since, and the call sites that now exist ·
the poster-reader agent — the contact sheet ·
            npm version with the release message ·
            The checkup — occasional, and it is allowed to fix nothing
Off-map:    none
Delegated:  2 errands — plan-reviewer: 5 findings on the frozen plan before a line of code,
            three of them outright errors in it, 91,842 tokens · phase-reviewer: 7 findings,
            its blocking one an artefact of reading a half-staged index, 80,260 tokens
Rework:     the plan itself, three steps of seven wrong — but caught before any code, which
            is what that gate is for and cost nothing to undo · CYRILLIC_NAMES written as a
            hand copy of the sample names, so the test could not fail; settleable by asking
            what the assertion would do if the subject changed · the suffix constant put in
            drawn-into.ts under a name that stated meaning rather than intent, and spelled
            out rather than derived from Locale.En; settleable by asking which file the fact
            belongs to before typing it · a test asserting one offering exists where the
            compiler already forbids two, written and then deleted
Loops:      check:phase ×2 — the second after acting on review findings, which is the shape
            the drawing prescribes · the posters redrawn once, and git recognised all three
            PNGs as pure renames, so nothing was redrawn twice
Broke:      none
Gates:      lint · types · docs:check · coverage · mutation over the diff · e2e over the
            diff · plan review · diff review · retrospective — all ran. Copy gate skipped:
            no table changed. Gallery skipped: no drawing moved, proved three ways — the
            English SVG and every WebP untouched in the diff, the three PNGs recognised by
            git as renames, and the Claude Design page returning byte-identical
Found by:   the plan review — the design page would have refused on the first hyphenated
            name, a merged gate function described as doing what it never did, and a PNG
            justified by a reader that reads SVG · the diff review — a self-proving test, a
            constant in the wrong file under the wrong name, five sentences whose subject
            had gone · me — that stryker mutates only scripts/docs-check and scripts/hooks,
            so the specs added this session for design-page.ts and tidy-reports.ts are held
            by passing rather than by catching
Landed:     .claude/skills/finish-phase/SKILL.md — the review section now says to stage the
            phase before briefing. Three times today an agent was set to read a subject that
            moved under it; this was the third and the newest particular, because what moved
            was the index rather than the working tree, and the reviewer's blocking finding
            was an artefact of when it looked. Paid for by compressing two paragraphs.
```
