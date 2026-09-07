# Put the last evening under the right name with /replace, and rotate the table after every merge

```
Asked:      «нужна команда, которая для текущего вечера позволит изменить имя так,
            чтобы Рома стал Романи» · «согласен по всем трём, попутно закрой merge —
            начинай фазу»
Kind:       feature
Ran:        ≈1h10m (2026-09-07T11:20Z, the size line, → 2026-09-07T12:30Z, this log) ·
            Fable 5.1 throughout · 993,480 subagent tokens (plan-reviewer 98,273 ·
            copy-reader 33,889 · render writer 101,502 · bot writer 104,450 · wiring
            writer 96,887 · phase-reviewer 131,281 · retrospective fork 427,198)
Path:       Framing the task and the mockup → check the tech debt → every question at
            once, before any work → the size of the phase in one line → the
            add-a-feature skill → the write-a-spec skill → the add-repository-method
            skill → freeze the interfaces → the plan-reviewer agent → the finding,
            while nothing is written yet → Writing the code and the tests → write both
            copy tables first → the copy-reader agent → briefs to every subagent in one
            go → Quality gates → the finish-phase skill → Review by an agent that did
            not write the diff → the phase-reviewer agent → the write-an-e2e-scenario
            skill → Retrospective — fixing the process and the documents → the
            retrospective skill → npm run docs:check → Release to production → the
            write-a-commit skill → npm version with the release message
Skipped:    the fix-a-bug skill · the poster-designer agent · one cold reader per
            language, given the built page · Reading every sentence, then syncing every
            picture (no table moved after stage 2, no drawing changed) · the
            refresh-the-pictures skill · the update-the-design-page skill · the
            skill-auditor agent
Off-map:    the copy tables were written and read while the plan-reviewer was still
            out — the drawing puts the plan review first, and the reviewer spent a
            finding on the drift; the mutation gate was measured three extra times to
            prove a stale report and an equivalent mutant, with an `if (false)` probe
            and the instrumented sandbox file as the evidence
Delegated:  7 errands — plan-reviewer: 9 findings, 6 acted on before code (the arriving
            player swept from under an open screen, the seat rotation's second home,
            the unreachable SameName, the tally debt, the stripCommand home, the
            same-evening recheck); copy-reader: 8 lines, 8 landed; render: 8 files, 53
            tests; bot: 3 files, 35 tests; wiring: 6 files, 70 tests and the fence
            probe; phase-reviewer: 11 promises held, 8 findings, 6 taken; retrospective
            fork: the six-line block and three rules
Rework:     PlanResult refrozen after the review — a bare `because` lacked the date and
            the two names its copy lines interpolate, so the handler and two specs were
            rewritten; the codec's KINDS_BY_CODE map and its `undefined` branch deleted
            after mutation — copied from /merge's `[a-z]` codec into a `[kx]` one, dead
            on arrival; three early-return guards deleted from the repository — SQLite
            accepts `IN ()`, so they were equivalent from the first line; one spec Edit
            landed mid-case and broke its neighbour, one extra vitest run
Loops:      mutation ×4 — the gate, a re-run after the review, a re-run because the
            json on disk was the previous run's, and a `coverageAnalysis off` run that
            proved nothing the sandbox file did not; e2e:changed ×2 plus one file
            alone; docs:check ×3 (index row, tree line, then the skill budget)
Broke:      the stale mutation.json named tests that no longer existed — one triage
            wasted; the skill budget refused five lines and the neighbour they
            displaced was a retelling of CLAUDE.md
Gates:      check:phase green — 4584 tests in 196 files, coverage 99.86/97.62/100/99.85,
            mutation 96.33% over the diff (97.26% over the four files re-mutated after
            the review; four survivors left alive on purpose, see the commit), e2e 188
            cases in 16 files · copy: read at stage 2 by the copy-reader, 8 of 46 lines
            rewritten, nothing moved since · gallery: not opened, no drawing changed ·
            plan-reviewer: owed and run · npm version: minor, a new command
Found by:   the plan-reviewer 9 (6 taken) · the copy-reader 8 (8 taken) · the
            phase-reviewer 8 (6 taken: firstGameId on Evening, the refusal union, the
            limits mock, Cancel's order, DecodedTap, the status scenario's map row; 2
            left: a "FROZEN" literal inherited from its file, a private Evening in
            scoresheet) · the gates 2 (docs:check's index row and tree line) · the
            mutation gate 3 (a dead codec branch, three equivalent guards, four
            narrowing guards named) · the retrospective 3 · me 2 (the stale report, the
            parser's home)
Landed:     .claude/skills/finish-phase/running-the-mutation-gate.md — the --mutate
            recipe keeps the json reporter; .claude/skills/add-a-feature/SKILL.md — a
            refusal union is frozen against its copy lines, and the copy bullet became a
            pointer at CLAUDE.md to pay for it; .claude/skills/write-a-spec/reading-a-
            survivor.md — the narrowing-guard and dead-alphabet-branch proofs;
            TECH-DEBT.md — the counting entry rewritten, a dating entry added;
            PLAN.md — a section, the seating rule, invariant 6
```
