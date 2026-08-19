---
name: finish-phase
description: Run a development phase in FoolProof from the work being taken on to the release that ends it — the seven gates (lint and types, coverage, mutation, e2e, diff review, the poster gallery, retrospective) and the format of the phase's final commit message. Load it when ANY list of changes to this repository is accepted — closing audit findings, refactoring, cleanup, tooling, a new feature — because such a list is a phase whether or not it adds a feature, and the list somebody hands you never contains the gates. Also when a phase is being wrapped up, a release is being cut, or the user asks whether the code is releasable.
---

# Finishing a phase

> **Stage 3** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md) — where
> the flow enters this skill. The gates it opens run on through the four stages after
> that one, which reach for their own skills as they go.

A phase ends with a release, and a phase is done when the code is *releasable* —
not when it works. Run all seven gates before the final commit and act on what
they say. None of them is advisory.

Gates 1–4 are one command: **`npm run check:phase`** — lint, types, the suite
under coverage, mutation over the diff, e2e over the diff, with the tests
counted once. A red gate is then re-run **alone** after the fix, never by
repeating the whole chain; gate 3's rules about re-runs still apply.
**`docs:check` is deliberately not in it**: documents and pictures are finished
after the review, in their own stages, so checking them here fails on work not
yet due — and a review finding would force an expensive redraw twice. The line
still holds where it matters: `check:push` in CI and `check:release` at the tag
both run `docs:check`.

## 1. Lint and types

Zero errors, no exceptions. (`npm run check` is the standalone everything
command; the phase loop runs lint and types via `check:phase`, without
`docs:check` — see above.)

**A changed signature has callers no gate can see.** `grep` the whole repository
for the changed name, not just `src/` — `.claude/skills/` and `README.md` hold
commands that are run by hand, so nothing compiles them and nothing fails when
they rot. Making `rasterize()` asynchronous left a one-liner in
`refresh-the-pictures` timing a promise instead of a render: it reported `0ms` for
every poster, in the step whose whole job is catching a render that grew. Green
gates, a lie in a document.

Most style rules are ESLint rules now (`eslint.config.js`), so a lint failure is
a convention violation, not a nit — read the message before reaching for a
disable comment, which is itself banned in `src/`.

**A lock file rewritten here can be wrong somewhere else, and the dry run will not
say so.** `npm install` on Windows prunes optional packages this platform has no
use for — the wasm fallbacks a native binding carries — and leaves the package that
*depends* on them behind, which Linux then refuses to install. Both times this has
happened, every local gate was green and GitHub Actions failed on `npm ci` before
running a test. So after any change to `package-lock.json`, **diff it for removals**
and put back what was dropped:

```bash
git diff -- package-lock.json | grep -E "^-\s+\"node_modules/"
```

A removal that no dependency change explains is the bug. Restore those entries from
the last lock CI accepted rather than regenerating — `npm install --package-lock-only`
prunes them again, because it resolves for this machine too.

**A phase that touched `package.json` runs `npm ci --dry-run` before committing.**
`npm run check` uses the `node_modules/` already on this machine, so it cannot see
that the lock file it produced is unsatisfiable somewhere else. Adding
`@tailwindcss/cli` on Windows wrote a lock whose wasm fallback conflicted with the
one vitest brings; every local gate stayed green and GitHub Actions failed on
`npm ci` before running a single test. The dry run reproduces that in one second,
here. Whichever way it is then fixed, ask first what the dependency costs the
**server**, which runs `npm ci` on every deploy and would have installed a CSS
compiler it has no use for.

## 2. `npm run test:coverage`

70% floor on every metric. A file that dropped is a file whose new branches
nobody exercised. Find the branch, not a way to reach the number.

## 3. `npm run test:mutation:changed`

Stryker over the files this phase touched — about a minute. The **full**
`npm run test:mutation` runs once, before a tag, not during a phase: a mutant in a
file the phase never opened was already killed in the phase that wrote it, and
re-proving it costs ten minutes of every phase. The pre-push hook enforces the
before-a-tag half — pushing a `v*` tag runs `check:release`, full mutation
included, and a red battery keeps the tag on the machine. Breaks below 85%
either way.
Coverage says a line ran; this says a test would have noticed it break.

**That full run grows with the code**: 5637 mutants at v1.14.0, of which one
feature phase added about 2100. It took sixteen minutes until `concurrency`
stopped being a hard `4` — a quarter of this machine — and became `"75%"`, which
is measured rather than guessed: 960s at four workers, 689s at eight, 596s at
twelve, with the score at 98.28 and exactly ten timeouts in all three, so the
verdict never moved.

The percentage is not there to speed CI up — Stryker computes
`max(1, round(cores × 0.75))`, so the four-vCPU runner gets three workers where
the old constant gave it four. It is there so a number tuned on a sixteen-core
machine cannot oversubscribe a small one. Tune for the machine you measured on,
express it as a share, and check what it computes to on four cores before
committing.

**`--mutate` takes a glob, and `dir/*.ts` matches the specs too.** Worse, the CLI
flag **replaces** the config's `!src/**/*.spec.ts` rather than adding to it, so the
exclusion has to be repeated on the command line every time:

```
npx stryker run --mutate "src/features/<x>/*.ts,!src/**/*.spec.ts" --reporters clear-text
```

Stryker will otherwise mutate `cell-face.spec.ts`, where almost every mutant
survives because nothing tests the tests — one phase read a 55% total off a run
whose per-source files were all above 82%, and a later one read 49% off a folder
that was actually at 100%. A total far below the per-file numbers means the glob,
not the specs.

**Paste that line into a subagent's brief rather than describing it.** This rule
was already written here when two briefs went out carrying the naive command; both
agents caught it themselves, but a brief that hands over the wrong command is
asking for an afternoon of strengthening tests that were never weak.

A file that dropped is a file whose new tests assert too little — strengthen the
tests, never lower the bar. The instructive ones are usually a spy left dirty by
the test above, or an optional chain hiding a value that was never set.

Strengthening a spec is the `write-a-spec` skill's job — load it rather than
reaching for the nearest assertion that turns the mutant red.

Run gate 5's review pass **before** this gate when the diff is small: review
findings edit code, and this is the costliest gate to repeat. An edit made after
the run re-checks with `--mutate <file>` alone, never a full re-run.

**Size is the wrong test, though — what matters is where the findings will land.**
A phase that is mostly specs and documents has every review finding aimed straight
at what mutation and e2e cover, so running them first buys nothing and pays twice.
One such phase — 671 lines, 74% of them specs — ran the full battery, then took
five review findings, then ran the whole battery again: twenty-seven minutes of
Stryker to learn the same thing twice. Ask before launching either: *could a
reviewer's note change a file this run measures?* If yes, review first.

**Everything a check writes goes under `reports/`** — coverage, mutation, and
Stryker's sandbox via `tempDirName`. One gitignored directory, and nothing about
testing appears next to the source. A new check that wants somewhere to write has
that answer already; `.gitignore` says the same thing in one line.

Rules about *running* it, learned by burning most of a phase's budget on them:

- **Never re-run a gate to re-read its output, and never truncate the run that
  produced it.** Piping a battery through `Select-Object -Last 30` throws away the
  coverage table and the mutation summary the commit message then needs, and the
  cheapest way back is running something again — which is the rule this one
  protects. Send the whole thing to a file (`Tee-Object`) and read the file. Every
  run also writes `reports/mutation/mutation.json` and `reports/mutation/index.html`,
  and a backgrounded run keeps its own log — read those. `/merge` was closed with eight
  Stryker invocations where two would have done, three of them the same full run
  repeated to look at three slices of one table.
- **One round of survivor-killing per phase, and only for mutants whose death
  would prevent a bug a player could see.** Above roughly 95% the survivors are
  mostly equivalent mutants and type-narrowing guards; the threshold is 85. A
  survivor left alive on purpose is worth a sentence in the commit message, not
  another two rounds.
- **Moving code moves its mutants — re-run the gate after a split or a rename.**
  Assertions do not always survive being ported: splitting one render file into two
  silently dropped four that had been killing mutants, including the early return
  that made a conditional legend conditional. The score is the only thing that
  notices, so a refactor after the mutation run is a refactor before another one.
  That is the second round the rule above forbids, and it is the one case where
  taking it is right.
- **`--reporters` replaces the configured set, it does not add to it.** Passing
  `--reporters clear-text` drops the `json` one, so `reports/mutation/mutation.json`
  still holds the *previous* run's survivors — and the rule above sends you straight
  to that stale file. This has already produced a confident reading of seven
  survivors from a run that mutated three files and found two. Override the
  reporters or read the report, never both.
- **Read the survivor's own line before believing it is a gap.** Two adjacent
  ternaries in one reducer differ by one word, and a line number quoted from memory
  cost a whole extra run here: the rule everyone was worried about was already
  killed, and the survivor next to it was equivalent. Print the mutant's line and
  its replacement from `mutation.json`, not the line you remember.
- **An arithmetic mutant on a nullable accumulator is usually equivalent.**
  `sum + null` is `sum + 0` in JavaScript, so "add the value even when it is absent"
  changes nothing observable. Recognising this is cheaper than writing the test that
  cannot exist.

## 4. `npm run e2e:changed`

Plays the scenarios the diff can reach: a change under `src/features/<X>/` plays
what `scripts/e2e-changed.ts` lists for `<X>`, a change under `shared/`, `main.ts`
or the harness plays everything, and a changed scenario file plays itself. It errs
towards playing too much — an unknown feature folder means the map is out of date,
so everything runs rather than nothing.

This is a real gate rather than a smoke test, and it is cheap because it is
selective: a phase inside one feature usually plays two or three files in about
fifteen seconds. The full `npm run e2e` runs before a tag — enforced by the
same pre-push hook that runs the rest of `check:release`.

`npm run e2e:test` covers the harness's own pure parts and takes under a second; it
is not part of `npm run check` because it belongs to `e2e/`, not to the app.

## 5. A review pass over the phase's whole diff

Read `git diff <phase-start>..HEAD` against `CLAUDE.md` — the whole diff at once,
not the individual commits, because a rule breaks across commits more often than
inside one.

**This pass is always the `phase-reviewer` subagent, and never a re-read.** It is
not a size judgement and not something to ask permission for: you cannot review
your own diff by reading it, because you are still holding the reasoning that made
it look right. A phase that reviewed itself here shipped two awards whose sentences
said the same thing in different words, and only noticed when somebody opened the
rendered poster one gate later.

**Stop editing before you launch it.** The reviewer reads files, not a snapshot, so
a tree that moves under it produces findings against code that no longer exists and
a report that has to be re-checked line by line before it can be trusted. One phase
ran the reviewer while its own mutation fixes were still landing; the report opened
by saying so, and every finding then needed confirming twice. Land the fixes, get
`npm run check` green, *then* review.

**Spend the waiting on read-only work** — a control run, a report, the
retrospective's counting. This rule has now been broken three times, and never by a
decision: every time it was one small fix that seemed free because the agent was
out. If the diff is worth reviewing, it is worth holding still for five minutes.

The three breaks had one shape, so the fix is a question asked **before** launching,
not more resolve afterwards: **what does this phase change outside `src/`?** Deploy
scripts, the unit file, the server's env file, the CI workflow — almost nothing
there has an automatic check (`docs:check` does compare `configure-server.sh`'s
`REQUIRED_KEYS` against `main.ts`, and nothing else), so it surfaces late, feels
urgent, and lands under a running agent. The third time, `OPERATOR_TG_ID` became required in `main.ts` and
`deploy/configure-server.sh` still guarded only `BOT_TOKEN`, which would have shipped
a config that crash-loops. Answer the question, make those edits, *then* launch.

**The reviewer reads the diff — it does not run anything.** Whatever this phase
changed outside `src/` has to be *executed* by somebody as well, and the two catch
different faults: the same night that four reviews each found a real bug, two more
were sitting in a bash script that read perfectly (`set -e` without `-E` never
calls an `ERR` trap from inside a function) and surfaced only when the script ran.
A green review of a shell script, a systemd unit or a workflow is half a gate.

**When the phase is mostly a restructure, run this gate on the source before the
specs exist.** Everything a move is judged on — does the file's name describe what
is in it, is it a bucket, does the type name collide with one next door — is
visible in the source alone, and every such finding invalidates specs written
against the old shape. A phase that split one file into five wrote 88 spec cases
first and paid a second agent to rework them; the review would have said the same
thing an hour earlier and for nothing.

**Run any rule the phase itself introduced against the phase's own diff, first.**
A new rule is at its least believed by the person who just wrote it, because they
are still holding the reasoning that made it obvious. A phase that added "a folder
is named after what the player gets" then named two folders after processes
(`bot/opening/`, `render/seating/`) and shipped them in the same commit as the
rule; a threshold proposed in the same phase misfired on the first folder outside
the two it was written for, which one command against the tree would have shown.
Apply it, then test it, then commit it — in that order.

**Then ask what shape of the same mistake the rule cannot see, and grep the whole
tree for that shape once.** A lint rule catches the syntax somebody thought of.
`project/named-states` knew a case clause, a discriminant property and a
comparison; it did not know a `return`, so `phaseOf` kept handing back
`"PICK_STARTER"` for two releases after the table existed, in a file the rule ran
over cleanly every time. The grep is one command and it is the only thing that
looks at the code the rule was written to protect rather than at the diff.

**The brief names paths, never purposes.** Say which files to read; do not say what
each one is for. A reviewer handed "`evening.ts` — turns the chronology into a
reading of the evening" judges the name against that sentence and passes it; the
same reviewer given only the path opens the file cold and says the name predicts
nothing. That is exactly how a file called `evening.ts` shipped through a review
whose checklist already contained the naming question.

Ask of every touched file:

- Does it still read as a skeleton — the idea before the detail?
- Is every closed union dispatched with `switch`, not a chain of `if`?
- Is there a user-facing string outside the owning feature's `copy.en.ts`?
- Does every stub sit beside its subject, or beside its only consumer when the
  subject is someone else's code?
- Shown only the basename, could you guess the exports? A name that states the
  file's topic rather than its contents passes every other test and fails this one.
- Does any state's name — a phase, an outcome, a kind — appear as a bare string
  literal outside the module that declares it?

And of the feature as a whole: it declares one command per thing it gives the
player, so can a reader tell from the file names which files serve which?

## 6. The pictures — only when the phase drew something

This gate runs after the review, because review findings edit code and edited code
can change a drawing. It opens when the diff touched anything a picture is made of
— an SVG template, geometry, copy that lands on a poster, the site's pages — and
stays shut otherwise, with the commit message carrying the reason
(`write-a-commit` has the shape).

`node scripts/tools.ts gallery` draws every poster across every edge the product has
to survive — one game, two players, ten long names, more games than the sheet holds,
an evening nobody lost, arrivals and departures, a career one evening old, a career
too long for the sheet, the longest name a player may have — into `reports/gallery/`.
**Open every picture.** Nothing above this gate can see a poster that has started
drawing nonsense: the SVG matches the renderer, the tests match the SVG, and all of
it stays green while a line runs off the card.

**A poster the gallery never draws is a gate that silently does not apply.**
`/personal` shipped in two releases without a single gallery case, and this gate ran
green over both of them — then the first case written for it found a name running off
the card and through the counter beside it, in the one place the bot prints user data
at 126px. So `docs:check` now fails when a `render/**/*-svg.ts` exists that no
`scripts/gallery*.ts` imports; a phase that adds a poster owes it cases in the same
phase, and the cases are chosen the way the old ones were — the emptiest thing the
renderer can be handed, the fullest, and the widest name.

**An edge case has to be hostile, not merely realistic.** A gallery case built from a
plausible extreme is a sample, and a sample passes a broken limit as easily as a
working one. The name fix above was measured, written, drawn and *looked at* against
a 32-character Russian name, and it read perfectly; the same 32 characters made of
the widest letter in the alphabet still ran through the counter beside it, because
the width model was out by a third for bold. One case, one character changed, and a
shipped-looking fix became a real one. So the widest input is **constructed** —
the widest glyph, the longest run, the emptiest history — and never drawn from what
a player plausibly types.

**And a case earns its description only after the drawing agrees with it.** A gallery
case here was added to exercise two marks that only appear when a best and a worst
evening are unique, and its own sentence promised "evenings that actually differ" —
but the fate behind it repeated on a three-night cycle, so the shares tied, the marks
stayed hidden, and the case proved nothing while reading as though it proved the one
thing it was written for. The sentence beside a case is a claim about the picture, so
open the picture before believing it.

**Then read the pictures against each other, not only each on its own.** A poster can
be flawless alone and still contradict the one beside it, and no single-picture pass
can see it. Lay the set out and ask: does the same thing carry the same name on every
poster and on the live card; does every symbol drawn have something that says what it
means; does a caption promise something the picture does not show. All three failed at
once here, and none of them was visible in a single image: the live card asked *who
went first* while the stats card credited *the dealer*, in both languages, for the
same event; a chart captioned "one point per evening" drew no points at all, only a
line and two unlabelled marks; and the one poster that explained its own percentage
scale was not the one a player reads their own number off. Two of the three were
reported by the owner, from the finished pictures, after the gate had passed.

**The cross-reading is also where the answer usually already is.** A new section that
does the same job as one on another poster should copy that section's *structure*
before a word of new copy is written for it. The chart caption here was written three
times — scale and legend crammed into one line, which collided with its own section
label in Russian; then split across two places; then finally shaped like the
chronology's, which puts the scale in the caption and the symbols somewhere else and
had been sitting in the gallery the whole time. The owner settled it in one glance by
putting the two charts side by side. Look at the working example first; three renders
were spent reasoning about text lengths instead.

The output is **specific claims, not a verdict.** "Looked, fine" is the green light
with nothing behind it that `write-an-e2e-scenario` warns about — if you cannot name
what you saw on a picture, you did not look at it. Of each, ask:

- does any row repeat another in different words?
- does every sentence read like the language it is in, plurals included?
- does anything run past the edge, or get cut where a reader cannot recover it?
- is a number claiming something the evening did not actually do?

**Fix what is plainly wrong; ask about what is taste or wording.** A line overflowing
the card is a defect and needs no permission. Which of three phrasings replaces it is
the user's call, and asking costs one message where guessing costs a rewrite. The
first run of this gate found both kinds at once: two awards ran their winners off the
right edge, and two more crowned a comeback that never fell below mid-table.

**A gate that covers part of a checklist replaces that part, never the list.** Two
phases in a row redrew the mockups here without ever loading `refresh-the-pictures`,
because `docs:check` had already named which pictures were stale — so the loop ran
off the failing gate, and the rows that had no gate were never walked. The Claude
Design page was one of them, and it went two releases without a poster that had been
shipping all along. It has a gate now, which the skill that owns it describes; the
lesson that generalises is the other half — when a check tells you what to fix, ask
what that check cannot see before believing the list is finished.

The gallery is drawn fresh, but the repository also holds **committed** pictures
that fall behind the code silently. The same trigger opens the
**`refresh-the-pictures`** skill — its table lists every one, mockups to icons,
including the hand-made rows no automatic check watches — and when a redrawn
picture also lives on the Claude Design page, **`update-the-design-page`** carries
it back there.

## 7. A retrospective on how the phase was carried out

Gate 5 judges the diff; this one judges what producing it cost — rework, gates run
twice, subagents briefed too thinly to be useful. Load the **`retrospective`**
skill and answer its five questions with counts, then land each lesson as a rule
somewhere durable. It runs before the final commit, while the transcript that is
its evidence still exists.

## The documents the phase owes

Load the **`write-a-doc`** skill before touching any of them: it routes a fact to
one file and says how to add it without creating the second copy that will drift.
Two steps from it matter most at the end of a phase — search the other documents for
what you are about to write, and search for the sentence the phase just made false.
Run `npm run docs:check` once the documents are updated — it is the last step of
the retrospective stage, and CI's `check:push` holds the same line after the push.

## Scaling the ritual to the change

The seven gates are not negotiable. What the phase *produces around them* is, and
the default was written for a phase that changes a contract. A **small** phase —
one that stays inside a single feature folder, adds no repository method, changes
no schema and no `shared/` type — earns a shorter path:

| | Small phase | Contract-changing phase |
|---|---|---|
| `PLAN.md` | a row in the commands table | a section: states, refusals, the reasons |
| `README.md` | a row in the commands table | a row, plus a screen if the shape is new |
| `CLAUDE.md` | untouched | edited only when a *rule* changed |
| `TECH-DEBT.md` | untouched | an entry only if something is actually owed |
| `e2e/` | scenarios only if a button carries `callback_data` | same |
| The plan | judged by the size line alone | the `plan-reviewer` agent, before the first file |
| Gates | all seven, mutation and e2e over the diff | all seven, mutation and e2e over the diff |

The test rules do not bend: every file still gets a spec, because that is what
holds the mutation score up and it is the cheapest part to write. What bends is
prose about a change that has nothing new to say.

The plan review is the one row that happens **before** any of this, at the end of
stage 1 once the interfaces are frozen. **This is the definition of what earns it,
and the only one** — the drawing, the routing table in `CLAUDE.md` and the agent's
own `description:` point here rather than restating it:

> A phase earns the plan review when it **adds something a player can reach that
> did not exist** — a command, a screen, a notice, a state — or **changes a
> contract other code depends on**: a repository method, the schema, a type in
> `shared/`.

That is deliberately **not** the small-versus-contract-changing predicate of the
table above, and the difference is the whole point. The five-file notice described
below was small by that measure — one feature folder, no query, no schema, no
shared type — and it is the exact defect this pass exists to catch. A predicate
that excludes its own motivating example is not a predicate, so this one is
written out separately and paid for with the extra line.

The pass is priced this way because gate 5 reads a diff: everything it finds has
already been written. The notice below is the proof — gate 5 did kill it, which is
the system working, but only after five files and their specs existed and were
green. That is the cost being moved earlier, not a gate being replaced.

The judgement call is honest sizing, so name the size **before** starting, in one
line, and let the user shrink it.

**A finding that says UNVERIFIED is a question, not a task.** An audit reports what
it could not establish as well as what it found, and that word is the whole content
of the entry: resolving it can delete the work rather than direct it. A checkup
reported that one refusal toast "also answers this case; reachability UNVERIFIED",
and the phase closing it wrote the second notice, in two languages, with its handler
branch, its spec case and a `PLAN.md` paragraph — then the reviewer asked the
question, and forty minutes of reading the schema showed the state cannot occur:
only confirmed games reach the roster, confirming places every seat, and `/merge`
moves both tables. All five files came back out. The paragraph that replaced them —
*why* the two tables cannot disagree — is worth more than the feature was, and it
was available before the first line was written. Answer the word first.

**A list somebody hands you is not this list.** Work driven by an audit's findings
register, a review's report or a user's numbered requests carries its own sense of
completeness: the last item closes and the work feels finished, because the list
that defined it is empty. It is not finished — that list never contained the gates.
A phase that closed eleven audit findings ran gates 1 to 5 by reflex, considered the
sixth because a commit template asked, and skipped the retrospective entirely,
having never once opened this file. **When an external list runs out, that is the
moment to load this skill, not the moment to commit.**

## Where the budget actually goes

A phase's cost is dominated by two things, and neither of them is thinking:

- **Re-deciding a shape after writing it.** Settle every signature that crosses a
  layer — what a repository method returns, what a transition carries — in one
  short design note before the first `Write`. `/merge` flipped `mergePlayers`
  between `number` and `void` after the SQL, the stub and the integration spec were
  already written, and paid for those three files twice.
- **Waiting on gates that did not need running.** See gate 3.
- **A new path that bypasses an old one inherits its obligations.** Before replacing
  a call, list what the old path did *besides* the obvious thing — a cleanup, a
  sweep, a refusal — and say for each whether the new one still does it. Noticing a
  side effect and filing it as minor is not that check: the seating screen dropped
  the sweep that made a mistyped name disappear, and the phase then wrote a `PLAN.md`
  paragraph claiming it had not.
- **Deciding where a rule lives after writing it.** Settling the signatures is not
  the whole design note: also ask, for every rule the phase adds, whether it is
  pure — and if one of them already earned a `domain/` module, its siblings almost
  certainly belong beside it. A phase wrote `starter-rule.ts` and then left the
  line-up arithmetic inline in two handlers ten lines away; the review sent it to
  `domain/`, and the specs for those handlers had to be written twice. The same
  question in reverse: a predicate added to `domain/` that gates a button is not
  finished until the `render/` side reads it, or the new rule is unreachable and
  nothing fails.
- **Guessing a decision that was the user's.** Anything they will *look at* — a
  picture, a layout, a wording — gets rendered and shown before the first spec is
  written against it, and a choice between two defensible shapes gets asked rather
  than picked. One phase spent five rounds on a chart's legend because two guesses
  were cheaper to make than a question, and each guess cost a render, a spec pass
  and a screenshot. A phase that starts a subagent while waiting on such an answer
  has already lost that agent's work.

- **Rewriting the same shape in fifty files by hand.** A signature that gains a
  parameter changes every call site and every mock factory; do it with a **script
  written to a file** and run with `node`, never a heredoc — two heredocs died on
  shell quoting before the first one landed. The script must anchor on syntax, not
  on a name: replacing `awardRow(` blindly also rewrote `describe("awardRow()")`
  into `describe("awardRow(copy, )")` and turned one assertion into
  `toHaveBeenCalledWith(copy, copy, …)`. Anchor on the call as it appears —
  `expect(fooSpy).toHaveBeenCalledWith(` — and let the failures name the rest.

**Mechanical work goes to a subagent on a cheaper model.** Once the design is
settled, writing five spec files, adding a stub, or updating an expectation is
transcription, not judgement. Delegate it as one batch with `model: "sonnet"`, and
because the agent starts cold, the brief has to carry everything: the exact files
to write, the subject each spec tests, the stubs to use by name, and the
instruction to load the `write-a-spec` skill first. **Tell each agent to run only
its own files** — a brief that ends "run the folder" makes the agent report your
own half-finished edits as its failures, and it will spend a turn investigating
them before deciding they are not its business. Keep for yourself the parts
where being wrong is expensive — the mechanic a player will feel, a cross-feature
hazard, anything touching `shared/` or the schema.

**What delegation actually costs, measured over two phases.** P30 spent 493k
tokens across six agents. It did not save tokens and never will: a cold agent
re-reads the subject, the skill and the spec that are already in your context. It
buys two things — room in your own window, and wall-clock while you work on
something disjoint. So the policy is not "delegate the mechanical work", it is:

- **The review pass is the one that always pays, and that is measured, not assumed.**
  89k tokens found three things that were about to ship, including a false sentence
  written earlier in the same phase by the same person who then re-read it and
  approved it. Four phases in one night then went four for four, each on a real bug
  rather than a matter of style: a systemd unit that would have restarted the bot
  every ten seconds forever when `.env.production` was missing, a measuring command
  in a skill left broken by a signature change, a test that by construction could
  not fail, a false claim in `PLAN.md` about cross-chat queries, and a deploy that
  would have rolled production back onto an older tag. You cannot review your own
  work by reading it again.
- **An independent scope is delegated on sight, without being asked.** This replaces
  an earlier rule here — *delegate only when your own context is the scarce resource*
  — which the owner overruled: the parallelism is to be tried on its own merits, so
  spotting a delegable scope is part of planning the phase rather than a favour to
  request. Three conditions, and all three have to hold. The scope touches **no file
  you have open**, nor one you will open while the agent runs. The brief fits in
  **one message** — a cold agent that has to guess the skill, the paths or the
  contract guesses wrong, plausibly, and you find out at merge. And only the
  **result** matters: a report, a list, a file that compiles and passes or does not.
- **What never leaves your hands.** Copy, commit messages and document prose — the
  voice is the product here, and an agent that has not lived the phase writes flat.
  Gates that are judgement: the gallery needs eyes, and "looks fine" from an agent is
  the green light with nothing behind it. And anything resting on why-context this
  session accumulated — why a threshold is 7 and not 5 — which no brief can carry.
- **Launch parallel agents in one message**, not one after another, and do not block
  on an agent whose files are disjoint from yours. Their reports are not shown to the
  user, so relay what matters rather than assuming it arrived.
- **A background agent that has stalled twice has produced what it is going to
  produce.** Take what landed on disk, finish the rest yourself, and repair whatever
  it left half-edited — resuming a third time costs another watchdog timeout for
  nothing. One phase lost about twenty minutes of wall clock this way and still had
  to finish five of the twelve files by hand, including a spec the agent had stopped
  in the middle of rewriting.
- **Freeze the paths an agent was given.** Renaming or moving the files it is
  writing into is the same mistake as delegating an unsettled subject, one level
  up: a phase moved `render/*` into subfolders while an agent was writing specs
  against those very paths, and the agent spent its last turn on stale mocks. If a
  restructure is coming, do it before the brief or after the agent lands.
- **Check whether it landed before redoing its work.** A background agent that was
  interrupted may finish after you looked. One was reported here as having written
  nothing, which was true at that moment and false ten minutes later; its seven
  spec files were nearly rewritten by hand.
- **Never delegate against a subject that is not settled.** Delegation multiplies
  the cost of rework: a placement decision you would fix in five minutes yourself
  cost a whole second agent here, and cost a stopped agent in the phase before.
  **Three phases now, same cause**, which means the rule as written does not bite —
  every one of those phases believed its subject was settled. So it needs a test
  rather than a resolution:

  **A subject that draws something is not settled until you have looked at what it
  draws.** The /personal phase spawned four spec agents and first opened the
  rendered poster eleven minutes later; both corrections it then had to send —
  a rule rewritten from inferential to descriptive, an ordering flipped — came
  from finally seeing the output. Neither was a late idea. Both were visible in
  the first PNG. Generate the artifact, open it, *then* delegate.

  The general form, for a subject that draws nothing: name the observation that
  would change your mind, and make it before you brief anybody. If you cannot name
  one, the design is settled. If you can, that observation is the phase's next
  step, not the agents'.

## The final commit message

Load the **`write-a-commit`** skill and follow it — it holds the title and body
rules, the gate numbers a phase-final commit carries, and the release format.
