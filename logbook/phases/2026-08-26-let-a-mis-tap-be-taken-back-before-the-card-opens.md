# Let a mis-tap be taken back before the card opens

```
Asked:      /next_without and /next_with break the expectations every other screen sets — give both the merge footer, and stop creating the game before anybody said to
Kind:       feature
Ran:        3h31m from the previous commit to this one, which also holds an unrelated measurement · Opus 5, both reviewers on Fable · 164,139 subagent tokens
Path:       Framing the task and the mockup → check the tech debt → every question at once → the size of the phase in one line → the plan-reviewer agent → Writing the code and the tests → Quality gates → Review by an agent that did not write the diff → fix the code and re-run only the affected gate → the write-an-e2e-scenario skill → Quality gates → Retrospective → Release to production
Skipped:    Reading every sentence, then syncing every picture · The checkup · the poster-designer agent · write both copy tables first · briefs to every subagent in one go · write the failing test at the layer that can still see the fault
Off-map:    breaking the fix on purpose to prove the new scenario fails without it — the drawing has no step for probing a gate this phase wrote
Delegated:  2 errands — the plan reviewer returned 4 findings, one of which moved the wire format off both codecs onto one before a file existed; the diff reviewer returned 4, one blocking
Rework:     the codec design, rebuilt from "fixed width in the shared codec, both screens" to "the leaving codec alone, with a version marker" — the plan review settled it at zero files written twice; the stale-screen Back hole, written and shipped through green gates — PLAN.md's own paragraph on Cancel being answered before the staleness check sat three paragraphs from the one being edited; three redundant guards, written and then deleted — the mutation gate named them
Loops:      the TECH-DEBT budget, three rounds of compress-and-measure — the entry was written before its headroom was measured
Broke:      none
Gates:      check, coverage, mutation over the diff, e2e over the diff, docs:check, the diff review, the plan review, the retrospective · copy not read: no copy table changed · gallery not opened: nothing drawn
Found by:   the owner — the phase itself; the plan review — 3 (the wire format killing every screen already in a chat, a PLAN paragraph in a third section, two e2e files missing from the list); the review — 4 (a marked stale screen with no way out, a forged shape decoding instead of refusing, two exports nobody imports, a name covering half of what it returns); a gate — 4 (mutation: three redundant guards and one regex case lost in a spec rewrite); me — 2 (a codec action and a handler branch with no spec, found reading git status before launching the reviewer)
Landed:     .claude/skills/write-an-e2e-scenario/SKILL.md — a button's data is captured in the state the invariant is about, not the first state the flow reaches
```

The phase's own defect and the gate that should have caught it are the same story. The
scenario guarding *a stale screen can always be closed* captured Cancel's callback data
from an **unmarked** leaving screen. This phase made Cancel disappear the moment a mark
exists — so the guarantee broke in every marked state, and the scenario went on passing
over the single state where it could not break. Nothing else could see it: the unit
specs mock the staleness check, and a keyboard spec has no idea what its buttons are
promised to do. It took a reader who had not written the diff.

That is also the answer to the rule this phase introduced. *A footer never shows two
buttons that close the screen* counts to two and cannot count to zero: it sees a
redundant way out and is blind to a state with no way out at all. A rule phrased as a
maximum needs its minimum written beside it.

Two numbers worth carrying forward rather than reading once. The plan review cost 78,750
tokens and saved writing a codec change twice, in both screens, before any of it existed
— the first errand in this logbook whose payoff is measurable in files never written.
And the mutation gate moved 95.42 → 96.59 not by adding tests but by **deleting three
guards it proved were already covered**; the missing test was one of four causes, and
the least common.

`Ran:` is honest but blunt: the span is commit to commit, and this one contains an hour
of unrelated measurement work done before the owner opened the phase. There is no
timestamp on the message that started it, so the narrower number is not available rather
than unrecorded.
