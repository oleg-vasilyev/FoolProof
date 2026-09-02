# Stop naming every chart line

```
Asked:      «убери имена с графика "выше соперников" — они там дублируются в третий раз
            и отнимают место», then four more asks arrived mid-phase
Kind:       feature
Ran:        wall clock not measured · Opus 5 · 322,378 subagent tokens over two named
            agents; the two update-the-design-page forks report none
Path:       Framing the task and the mockup → Writing the code and the tests →
            Reading every sentence, then syncing every picture → Quality gates →
            Review by an agent that did not write the diff → Writing the code and the
            tests → Quality gates → Reading every sentence, then syncing every picture →
            Retrospective — fixing the process and the documents → Release to production
Skipped:    the plan-reviewer agent ·
the copy-reader agent — only what moved since, and the call sites that now exist ·
            npm version with the release message ·
            The checkup — occasional, and it is allowed to fix nothing
Off-map:    three asks arrived mid-phase and were queued rather than started — the personal
            card's rival colour, merging docs/mockups into docs/posters, the landing page's
            poster row; the landing page was measured in the browser but not changed
Delegated:  4 errands — phase-reviewer: 5 findings, 1 blocking, 74,305 tokens, 84s ·
            poster-reader: 71 lines read on 53 pictures, 21 findings, none about this
            phase, 248,073 tokens, 626s · update-the-design-page ×2: page synced twice,
            the second only because the samples changed after the first
Rework:     the "hidden entries are always scratch" sweep rule — built, told the owner it
            was sound, reversed after review showed it deletes Stryker's live sandbox;
            settleable when the constant was written, having just deleted five sandboxes ·
            the finish-phase line — written, blew the budget, paid for by a re-wrap, then
            moved anyway because its placement was wrong; settleable by checking the budget
            before choosing prose over tooling · the README paragraph — four lines, trimmed
            to two when review said the reason belongs in the skill · the renaming helper —
            exported as two names, then hidden behind one pair; settleable by asking for the
            smallest public surface at the move
Loops:      check:phase ×2 — the second forced by my own edits after the review, and
            finish-phase already said not to start it before the tree is final ·
            design-page sync ×2 — same cause, and the skill did NOT say it, which is what
            landed below · mockups and posters redrawn ×3 (the chart, then the names, then
            the sample restructure — the third proved byte-identical and was verification)
Broke:      the app crashed mid-phase — phase-reviewer resumed from its transcript, the
            poster-reader had none and was re-run from scratch at a cost of 248,073 tokens;
            wall clock of the loss not measured
Gates:      lint · types · docs:check · coverage · mutation over the diff · e2e over the
            diff · review · gallery · retrospective — all ran. Copy gate skipped: no table
            changed. Real evening skipped: no poster's wording moved
Found by:   the review — PLAN.md still promising the removed labels (blocking), the sweep
            rule's live-sandbox hazard, three smaller · the gallery reading — 21, all
            pre-existing, one confirmed by bytes (two gallery cases draw the same picture) ·
            me — the palette collision above ten players, before the first edit
Landed:     .claude/skills/finish-phase/SKILL.md — "do not start it until the tree is final"
            was written for Stryker alone while the next sentence said redrawing pictures
            overlaps safely; it does not, and that sentence was untrue. Now every job that
            reads the whole tree owes the rule, the design page named as the proof.
            Paid for by re-wrapping a link split across two lines.
Landed:     memory/verify-with-bytes-and-on-the-platform.md — two traps, both hit here.
            sed strips CR, so cat -A behind it reports LF on a CRLF file and talked me out
            of a rule I already had. And a bare dollar in a String.replace replacement is a
            control character: one in prose spliced the whole file into itself, and the
            script printed ok.
```
