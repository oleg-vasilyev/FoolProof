---
name: finish-phase
description: Run the release ritual that closes a development phase in FoolProof — the seven gates (check, coverage, mutation, e2e, the poster gallery, diff review, retrospective) and the format of the phase's final commit message. Use when a phase is being wrapped up, a release is being cut, or the user asks whether the code is releasable.
---

# Finishing a phase

A phase ends with a release, and a phase is done when the code is *releasable* —
not when it works. Run all seven gates before the final commit and act on what
they say. None of them is advisory.

## 1. `npm run check`

Lint, types, tests. Zero errors, no exceptions.

Most style rules are ESLint rules now (`eslint.config.js`), so a lint failure is
a convention violation, not a nit — read the message before reaching for a
disable comment, which is itself banned in `src/`.

## 2. `npm run test:coverage`

70% floor on every metric. A file that dropped is a file whose new branches
nobody exercised. Find the branch, not a way to reach the number.

## 3. `npm run test:mutation:changed`

Stryker over the files this phase touched — about a minute. The **full**
`npm run test:mutation` runs once, before a tag, not during a phase: a mutant in a
file the phase never opened was already killed in the phase that wrote it, and
re-proving it costs four minutes of every phase. Breaks below 85% either way.
Coverage says a line ran; this says a test would have noticed it break.

**`--mutate` takes a glob, and `dir/*.ts` matches the specs too.** Stryker will
happily mutate `cell-face.spec.ts`, where almost every mutant survives because
nothing tests the tests — one phase read a 55% total off a run whose per-source
files were all above 82%. List the source files, or exclude `*.spec.ts`; a total
far below the per-file numbers means the glob, not the specs.

A file that dropped is a file whose new tests assert too little — strengthen the
tests, never lower the bar. The instructive ones are usually a spy left dirty by
the test above, or an optional chain hiding a value that was never set.

Strengthening a spec is the `write-a-spec` skill's job — load it rather than
reaching for the nearest assertion that turns the mutant red.

Run gate 6's review pass **before** this gate when the diff is small: review
findings edit code, and this is the costliest gate to repeat. An edit made after
the run re-checks with `--mutate <file>` alone, never a full re-run.

**Everything a check writes goes under `reports/`** — coverage, mutation, and
Stryker's sandbox via `tempDirName`. One gitignored directory, and nothing about
testing appears next to the source. A new check that wants somewhere to write has
that answer already; `.gitignore` says the same thing in one line.

Rules about *running* it, learned by burning most of a phase's budget on them:

- **Never re-run a gate to re-read its output.** Every run writes
  `reports/mutation/mutation.json` and `reports/mutation/index.html`, and a
  backgrounded run keeps its own log — read those. `/merge` was closed with eight
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
fifteen seconds. Before a tag, run `npm run e2e` in full.

`npm run e2e:test` covers the harness's own pure parts and takes under a second; it
is not part of `npm run check` because it belongs to `e2e/`, not to the app.

## 5. Look at the gallery

`node scripts/tools.ts gallery` draws both posters across every edge the product has
to survive — one game, two players, ten long names, more games than the sheet holds,
an evening nobody lost, arrivals and departures, an award that crowns the whole
table — into `reports/gallery/`. **Open every picture.** Nothing above this gate can
see a poster that has started drawing nonsense: the SVG matches the renderer, the
tests match the SVG, and all of it stays green while a line runs off the card.

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

## 6. A review pass over the phase's whole diff

Read `git diff <phase-start>..HEAD` against `CLAUDE.md` — the whole diff at once,
not the individual commits, because a rule breaks across commits more often than
inside one. The `phase-reviewer` subagent exists for exactly this pass.

**Stop editing before you launch it.** The reviewer reads files, not a snapshot, so
a tree that moves under it produces findings against code that no longer exists and
a report that has to be re-checked line by line before it can be trusted. One phase
ran the reviewer while its own mutation fixes were still landing; the report opened
by saying so, and every finding then needed confirming twice. Land the fixes, get
`npm run check` green, *then* review.

**Spend the waiting on read-only work** — a control run, a report, the
retrospective's counting. This rule has now been broken twice, and neither time by a
decision: both times it was one small fix that seemed free because the agent was
out. If the diff is worth reviewing, it is worth holding still for five minutes.

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

## 7. A retrospective on how the phase was carried out

Gate 4 judges the diff; this one judges what producing it cost — rework, gates run
twice, subagents briefed too thinly to be useful. Load the **`retrospective`**
skill and answer its five questions with counts, then land each lesson as a rule
somewhere durable. It runs before the final commit, while the transcript that is
its evidence still exists.

## The documents the phase owes

Load the **`write-a-doc`** skill before touching any of them: it routes a fact to
one file and says how to add it without creating the second copy that will drift.
Two steps from it matter most at the end of a phase — search the other documents for
what you are about to write, and search for the sentence the phase just made false.
`npm run docs:check` runs inside `npm run check`, so a broken link or a stale tree
fails gate 1 rather than surviving to the next cleanup.

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
| `e2e/` | scenarios only if it has an inline keyboard | same |
| Gates | all six, mutation and e2e over the diff | all six, mutation and e2e over the diff |

The test rules do not bend: every file still gets a spec, because that is what
holds the mutation score up and it is the cheapest part to write. What bends is
prose about a change that has nothing new to say.

The judgement call is honest sizing, so name the size **before** starting, in one
line, and let the user shrink it.

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

- **The review pass is the one that always pays.** 89k tokens found three things
  that were about to ship, including a false sentence written earlier in the same
  phase by the same person who then re-read it and approved it. You cannot review
  your own work by reading it again.
- **Delegate transcription only when your context is the scarce resource** — after
  a compaction, or with one clearly coming. With room to spare it is cheaper to
  type the specs than to brief someone to type them.
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
  Two phases, same cause. If a design question is still open, answer it first.

## The final commit message

Put the resulting numbers in it — test count, coverage, mutation score. A score
is only useful if a later regression has something to be compared against.

State what changed and *why the previous shape was wrong*. A commit that says
what a reader could get from the diff has wasted the message.
