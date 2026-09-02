# Colour a rival in their own colour

```
Asked:      «в персонал Аня должна быть такого же цвета как и на последней хронологии»
Kind:       fault
Ran:        wall clock not measured · Opus 5 · 239,176 subagent tokens over two named agents
Path:       Framing the task and the mockup → Writing the code and the tests →
            Reading every sentence, then syncing every picture → Quality gates →
            Review by an agent that did not write the diff → Writing the code and the
            tests → Quality gates → Reading every sentence, then syncing every picture →
            Retrospective — fixing the process and the documents → Release to production
Skipped:    the plan-reviewer agent ·
the copy-reader agent — only what moved since, and the call sites that now exist ·
            npm version with the release message ·
            The checkup — occasional, and it is allowed to fix nothing
Off-map:    none — the three asks queued during the previous phase stayed queued
Delegated:  2 errands — phase-reviewer: 6 findings, 1 blocking, resumed once when I moved
            the tree under it, 102,477 tokens · poster-reader: 30 lines read on 24
            pictures, 12 findings, 1 of them about this phase, 136,699 tokens
Rework:     holderIdOf shipped with no spec — the mutation gate found it, not me;
            settleable by extending fact-lines.spec.ts in the same edit that added the
            function, which write-a-spec already requires · the colour lookup written by
            hand at four call sites and its type at three, then extracted to
            columnLookupOf; settleable at the second call site · the interface named Row,
            colliding with the Row in row-records.ts; settleable by grepping the name
            before using it · two assertions that could not fail — one through the real
            colourFor, one comparing factLines against holderIdOf, subject against
            subject; settleable by asking of each whether it would pass on wrong code
Loops:      check:phase ×3 — the second and third forced by my own post-review edits,
            and both DEVELOPMENT-FLOW.md and finish-phase say to re-run only the affected
            gate, never the chain; I used the right command once (stryker --mutate on one
            file, 15s against the chain's minutes) and then went back to the chain twice ·
            mockups and site posters redrawn ×2, the second proving byte-identical
Broke:      none
Gates:      lint · types · docs:check · coverage · mutation over the diff · e2e over the
            diff · review · gallery · retrospective — all ran. Copy gate skipped: no table
            changed. Real evening skipped: no poster's wording moved
Found by:   the mutation gate — holderIdOf held by nothing · the review — PLAN.md
            contradicting the new behaviour, the Row collision, the duplicated lookup, two
            self-proving assertions · the gallery reading — the rival's colour reads as
            undecodable cold, since every card carrying THE PATSY carries the same rival
Landed:     .claude/skills/write-a-spec/SKILL.md — the paragraph on assertions that turn
            out to be identities gained the case it did not name: an expectation the
            subject computes is not one, and belongs in the table beside its case. Merged
            into that paragraph rather than appended, so the file stayed at its budget.
Landed:     memory/a-pointer-to-a-contract-is-an-order-to-open-it.md — six violations of
            three written rules in one phase, every one of them read earlier in the same
            session. The failure is substituting a recollection for the file; "I have
            already read it" is the signal that I am about to get the particulars wrong.
```
