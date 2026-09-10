# Reference run — 2026-09-10, Fable 5.1 (low), interactive, by the task's author

Not a clean cell: the same context wrote the brief, so it never had to discover the
frozen names. Use it for the reference numbers and the diff, not for a model comparison.

## Timeline (wall clock)

| when | what |
|---|---|
| 16:52 | start; reading the award family, the copy tables, the specs, the skills |
| 16:58 | card, brief and hidden acceptance written for THE BOOKENDS |
| 17:01 | code inserted; `grep bookends` found PLAN.md retiring the shape; everything reverted |
| 17:04 | FLYING START: brief, acceptance, code, specs, gallery case — first green on 6 spec files |
| 17:05 | copy-reader (40 s, no change) and lint+typecheck green; phase-reviewer launched |
| 17:09 | reviewer back: 6 findings; 2 must-fix + 3 notes landed, 1 left to the owner |
| 17:10 | docs-check green; posters and gallery redrawn; poster-reader launched |
| 17:12 | one real evening read (dev snapshot, 7 Aug); the 31 Jul snapshot was refused by the sandbox classifier on the env-var form of the command |
| 17:13 | `npm run check:phase` started (tree final) |
| 17:17 | battery green |

Before gates: ~17 min including the 7-minute BOOKENDS detour. Gates and readers: ~13 min.

## Gates paragraph (pasted from the phase battery)

Gates: check:phase green — 4889 tests in 212 files, coverage 99.84/97.62/100/99.83, mutation 95.08% over the changed source and nothing to run over the tooling, e2e 26 cases in 3 files.

## Decisions made without an owner (the brief said to decide and say)

- **The fire-rate simulator TECH-DEBT.md asks for was not taken into scope.** The brief
  gives 4% as the owner's estimate; PLAN.md's sentence under the catalogue now says so
  for this one award, so the table and its caption agree.
- **FLYING START and FROM THE OFF are not made a nested pair.** Both the reviewer and the
  poster-reader saw them coincide on the gallery case — there they must, because the
  gallery's fixture makes the opener the player who went out first. At a real table
  FROM THE OFF counts wins in games a player opened anywhere in the evening, so neither
  implies the other. Owner's call whether that is worth a pair; left as is.
- **The gallery case was written into `gallery-edges.cases.txt` by hand**, so it is
  consistent and unapproved — the skill says to say so.
- **"Out first" is unexplained on the sheet** (poster-reader's second finding) — a
  vocabulary the whole poster already uses, not this phase's; not touched.

## Retrospective (the six questions, counted)

1. **Rework:** one — the whole BOOKENDS pass (catalogue, registry, copy, renderer,
   three specs, PLAN row), reverted after ~7 minutes. Settled earlier by one grep of
   PLAN.md for the *concept* before freezing the brief. A second, small one: the
   overshadow spec's expected order (rules print in RULES_IN_ORDER order, not in the
   order the spec fired them) — one red run.
2. **Repeated commands:** test ×4 (6 files, 3 files, 1 file, then inside the battery),
   lint ×2, typecheck ×2, docs-check ×1, coverage ×1, mutation ×1, e2e:changed ×1. One
   wasted call: `gate-runner check:phase` (batteries run through `npm run`), and its
   exit code was masked by a `| tail` — the gate-behind-a-pipe rule, again. One wasted
   `coverage` call under the wrong name.
3. **Subagents:** copy-reader 30k tokens / 40 s → no change, but it is the gate;
   phase-reviewer 99k / 4 min → 2 must-fix that docs-check would have caught later and
   3 improvements it would not; poster-reader 44k / 90 s → one real cross-poster
   reading, one pre-existing vocabulary note. All three ran while I read skills. Worth
   it; nothing delegated was redone.
4. **Sequencing:** the reviewer was launched on a tree that then changed only by its
   own findings — correct. The mutation gate waited for the final tree — correct. The
   first `check:phase` attempt fired before the review (skill says review first); it
   happened not to run, by luck.
5. **Reading:** DEVELOPMENT-FLOW.md and write-a-spec were read from a saved 32 KB tool
   output in two passes — cheaper to have read the skill file alone. The session-
   appearances stub was read twice.
6. **Obsolescence:** nothing in the repository's rules became untrue. PLAN.md's
   "percentages are modelled" needed a qualifier rather than a deletion.

## Commit message this run would have used (nothing was committed)

```
Crown three firsts from the very first game of the night

The catalogue read a run of firsts only as a hat trick — four anywhere in the
evening — so three from the off, which is rarer and reads differently to the table,
went unnamed. FLYING START names it: out first in the first game, the second and the
third, without a game missed, and the row carries how far the run went. When the same
player also has a hat trick the row is dropped, because four running already says
more than three from the start. Its 4% in the catalogue is the owner's estimate, not
the model's, and PLAN.md says so until the simulator TECH-DEBT.md asks for exists.

Gates: check:phase green — 4889 tests in 212 files, coverage 99.84/97.62/100/99.83,
mutation 95.08% over the changed source and nothing to run over the tooling, e2e 26
cases in 3 files.
Copy: both new lines read by copy-reader as written, before the code; no change.
Gallery: flying-start case drawn; the reader saw FLYING START and FROM THE OFF
coincide on one player, a fixture artefact left to the owner.
Review: 6 findings, 2 fixed before the pictures, 3 taken, 1 (the pair question) owner's.
Retro: rework 1 (a retired shape, caught by grep), repeated gates 2 wasted calls →
lesson to the task card; nothing obsolete.
Tag: rides the next one — a new award is a minor, and the owner has not seen it.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```
