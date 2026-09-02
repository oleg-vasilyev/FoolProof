---
name: finish-phase
description: "Take a FoolProof phase from written code to the commit or the tag that ends it — the gates (lint and types, coverage, mutation, e2e, diff review, and the conditional ones: a real evening, the poster gallery, the copy tables read as sentences when they are written, a retrospective when the phase cost something) and the format of the phase's final commit message. This is stage 3 and the stages after it, so load it when the code is written and the gates are due — a phase being wrapped up, a release being cut, an external list of changes that has run out, or the user asking whether the code is releasable. Do NOT load it at stage 1: recognising a list of changes as a phase is not the same as opening this skill, and framing needs only two things it does not hold — say the phase's size in one line, and read TECH-DEBT.md against the task."
---

# Finishing a phase

> **Stage 3** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md) — where
> the flow enters this skill. The gates it opens run on through the four stages after
> that one, which reach for their own skills as they go.

A phase is done when the code is *releasable* — not when it works. Run every gate
before the final commit and act on what it says. None of them is advisory.

**A phase ends in a tag only when it changed what a player or the operator gets.**
Everything else — tooling, documents, this process, a gate — goes to `main` and rides
the next tag, because a tag here restarts the bot and pays `check:release`: full
mutation and full e2e, ten to fifteen minutes to re-prove files the phase never
opened. Eight tags went out in four days once, several of them one-commit phases that
changed nothing the table could see. The site is the exception that needs no rule: it
ships from `main` on push, so a landing-page phase is already released when CI is
green. Say which of the two happened in the closing message.

Gates 1–4 are one command: **`npm run check:phase`** — lint, types, the suite
under coverage, mutation over the diff, e2e over the diff, with the tests
counted once. A red gate is then re-run **alone** after the fix, never by
repeating the whole chain; gate 3's rules about re-runs still apply.
**`docs:check` is deliberately not in it**: documents and pictures are finished
after the review, in their own stages, so checking them here fails on work not
yet due — and a review finding would force an expensive redraw twice. The line
still holds where it matters: `check:push` in CI and `check:release` at the tag
both run `docs:check`.
Sweep `reports/` first: `node scripts/tools.ts tidy-reports` drops what nothing owns.

## 1. Lint and types

Zero errors, no exceptions. (`npm run check` is the standalone everything command; the
phase loop reaches lint and types through `check:phase`, without `docs:check`.)

**A changed signature has callers no gate can see.** `grep` the whole repository
for the changed name, not just `src/` — `.claude/skills/` and `README.md` hold
commands that are run by hand, so nothing compiles them and nothing fails when
they rot. Making `rasterize()` asynchronous left a one-liner in
`refresh-the-pictures` timing a promise instead of a render: it reported `0ms` for
every poster, in the step whose whole job is catching a render that grew. Green
gates, a lie in a document.

**A renamed file is the same fault, and half of it is now mechanical**: `docs:check`
fails a document naming a path under a folder it tracks and cannot find, which is what a phase
that moved 29 files needed and did not get. The grep is still owed for everything
that is not a path — a command, a folder, a threshold, a shape — and it is owed
before the review launches rather than after, which is how the hold-still rule below
gets broken by something that felt like tidying.

Most style rules are ESLint rules now (`eslint.config.js`), so a lint failure is
a convention violation, not a nit — read the message before reaching for a
disable comment, which is itself banned in `src/`.

**A phase that wrote a check owes it a probe and a calibration** before quoting
anything it prints — break its subject in a shape it has never been shown, and treat its
first output as a claim about the instrument. Both rules, and the two gates that went
blind proving them, are the `fix-a-bug` skill's, under *Proving a cause*.

**A refusal is evidence about the new thing, not an obstacle in front of it.** Two
shapes, one root, and one phase hit both: a budget refused a paragraph, so two older
paragraphs were displaced to fit it — and the paragraph was then deleted, because
what the budget was saying is that it stated a rule the file next door already
enforced. The same hour, a gate was carefully repointed at a document that a check
twelve lines above already guarded, strictly, in both directions; the reviewer's
phrase for it was *the duplication rule wearing a gate's clothes*. So before paying
to fit something in, ask what already covers it: **read the neighbour before
displacing it**, and before adding a check, read every check over the same subject.

**A phase that touched `package.json` has a gate `npm run check` cannot see.** It
resolves against this machine, so a lock file written here can be unsatisfiable on
the runner: [changing a dependency](changing-a-dependency.md).

## 2. `npm run test:coverage`

70% floor on every metric. A file that dropped is a file whose new branches
nobody exercised. Find the branch, not a way to reach the number.

**A new export and its spec land together**, in the same edit — not in the same
phase, in the same edit. A helper added without one costs the whole battery a second
run to learn what its author already knew, and this gate is the one that notices
last: coverage falls by a hundredth of a percent, well clear of the floor, and only
a reader who looks at the number rather than the verdict sees it at all.

## 3. `npm run test:mutation:changed`

Stryker over the files this phase touched — about a minute. The **full**
`npm run test:mutation` runs once, before a tag, not during a phase: a mutant in a
file the phase never opened was already killed in the phase that wrote it, and
re-proving it costs ten minutes of every phase. The pre-push hook enforces the
before-a-tag half — pushing a `v*` tag runs `check:release`, full mutation
included, and a red battery keeps the tag on the machine.
Coverage says a line ran; this says a test would have noticed it break.

**Two families, two runs, two bars, and both must pass.** The bot breaks below 85%
(`stryker.config.json`); the tooling under `scripts/docs-check/` and `scripts/hooks/`
breaks below 80% (`stryker.scripts.json`). The bars differ because the failures do:
a survivor in `src/` is a bot that misbehaves in front of a player, a survivor in a
gate is a shape of input the gate will not notice. They are separate runs rather
than one, because a single score would let 1400 tooling mutants hide inside 5600
good ones — which is the aggregate-hides-a-family trap this project has paid for
before. `mutate-changed.ts` routes a changed file to its own family.

**Do not start it until the tree is final.** Stryker reads the files once and reports
at the end, so a run started while a review is still landing measures a tree that no
longer exists — and there is no partial result to salvage, because the report is
written last. One phase started the changed-file run in the background, took eight
review findings during it, and had to kill it at fifteen minutes with nothing to show.
Backgrounding it is right; backgrounding it *before the last edit* is fifteen minutes
of a machine that could have been running the e2e suite. **Every job that reads the
whole tree owes the same rule**: redrawing the pictures syncs the design page against
what the renderer draws, so a sample edited after it buys a second sync. Documents and
a subagent's report overlap safely; the **e2e suite cannot**: `QUIET_MS` decides the
bot has finished, and a machine busy with mutants makes renders slow enough to cross it.

Everything about *running* it sits in [running the mutation
gate](running-the-mutation-gate.md) — the glob that quietly mutates the specs and
prints a score half what it should be, the reporter flag that leaves the previous
run's survivors on disk, what worker count was measured and why it is a share, and
which second run is right after code moved. Open it when the gate is red, when a
file was split or renamed, or before pasting a command into a brief. None of it
changes what the gate decides; all of it changes whether the number you read is real.

A file that dropped is a file whose new tests assert too little — strengthen the
tests, never lower the bar. **That work is the `write-a-spec` skill's**, which reads a
survivor and routes it to the rule it belongs to; load it rather than reaching for
the nearest assertion that turns the mutant red.

**Run gate 5's review pass before this one. Always.** Review findings edit code, and
this is the costliest gate to repeat; an edit made after the run re-checks with
`--mutate <file>` alone, never a full re-run. Size is not the test and neither is
subject matter — a phase of 671 lines, 74% specs, ran the battery, took five
findings, and ran it again: twenty-seven minutes of Stryker to learn the same thing
twice; a phase touching no code at all looked immune until the review's best finding
became a new rule in `scripts/check-docs.ts`. Judge the diff the review will *leave
behind*, not the one you have — prose turns into code, and that is what a good
finding does. Running the two in parallel needs a reason you can say out loud.

**Everything a check writes goes under `reports/`** — coverage, mutation, and
Stryker's sandbox via `tempDirName`. One gitignored directory, and nothing about
testing appears next to the source. A new check that wants somewhere to write has
that answer already; `.gitignore` says the same thing in one line.

## 3a. Read one real evening, if the phase changed what a poster says

Every other gate judges a layout or a file. None of them asks the only question a
player asks — *what does tonight's sheet actually say* — and the gallery cannot: its
cases are built to stress the drawing (widest name, most awards, tallest sheet), so a
selection rule that quietly hands one player four of nine rows passes every one of them.

```bash
node scripts/tools.ts evening <chat id>
```

It prints the awards a real chat's newest evening would carry, in that chat's own
language, and it reads whatever `DB_PATH` points at. Take the snapshot with
`VACUUM INTO` from a read-only connection, never by copying the database file: the
newest games live in the `-wal` sidecar and a copy leaves them behind.

Two real evenings, read this way, produced eight defects in ten minutes — two numbers
printed in each other's place, awards clustering on one player while another went
unnamed, a "curse" that was below chance, one rival called both easy prey and a hard
opponent, and three sentences that said things the picture did not. Every one of them
had shipped through green gates.

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

Read `git diff <phase-start>..HEAD` against `CLAUDE.md` — the whole diff at once, not
the individual commits, because a rule breaks across commits more often than inside one.

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
by saying so, and every finding then needed confirming twice. **A defect you already
know about is landed before the launch, never deferred until the report is back** — a
reading of a tree you knew was wrong is a reading you have to take twice. Land the
fixes, get `npm run check` green, *then* review.

**Spend the waiting on read-only work** — a control run, a report, the
retrospective's counting. It has been broken repeatedly and never by a decision:
usually one small fix that seemed free because the agent was out. If the diff is worth
reviewing, it is worth holding still for five minutes.

**The other half of holding still is not yours.** A review launched while the owner is
still refining something in the diff is killed by their next message rather than by
your edit — one phase killed two reviews inside four minutes, both over the same
drawing, and paid for two runs that reported nothing. Whatever is still being discussed
with the owner, the review waits on the discussion and not on the code.

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

**What the brief must carry is `phase-reviewer.md`'s own section, not this one** —
the base ref, the paths, what changed outside `src/`, any rule the phase invented,
and nothing about what a file is *for*. Read it before writing one.

Its checklist is richer than any kept here — skeleton, `switch` over a union, a
string outside `copy.en.ts`, where a stub sits, the basename read back against the
exports — so ask only the two things it does not:

- Does any state's name — a phase, an outcome, a kind — appear as a bare string
  literal outside the module that declares it?
- The feature declares one command per thing it gives the player, so can a reader
  tell from the file names which files serve which?

## 5b. The sentences — read when the table is written, re-read only if it moved

The gallery proves a line **fits**. Nothing else asks whether it is something a
person would say, and two releases shipped word salad that was drawn correctly and
approved by everyone who saw it. So the reading is the **`copy-reader`** agent's, it
may not be done by whoever wrote the table, and it happens in stage 2 **the moment
the table is written** — a finding there edits one file, and the same finding at the
end of the phase edits a table, the code behind a sentence, the specs asserting it
and every poster drawing it.

At the end of the phase it runs a second time **only over what moved since**. A phase
that changed no copy after stage 2 owes nothing here and says so in the commit.

What the reader's brief owes it, why it reads **every** line filled with real values
rather than only the ones a poster draws, what a drawing's own labels owe before the
owner is shown them, and the question that pays for this gate twice are in [reading
the sentences](reading-the-sentences.md).

## 6. The pictures — only when the phase drew something

This gate runs after the review, because review findings edit code and edited code
can change a drawing. It opens when the diff touched anything a picture is made of
— an SVG template, geometry, copy that lands on a poster, the site's pages — and
stays shut otherwise, with the commit message carrying the reason
(`write-a-commit` has the shape).

**Load the `refresh-the-pictures` skill and follow it.** What the gallery draws, how a
case is built so that it presses a real edge, how the reader is briefed, and what to do
with what comes back all live there — every line of it needed only while this gate is
open, which is the whole argument for it living there and not here.

Three things decide whether this is a gate at all, so they are known before it opens:

- **The looking is the `poster-reader` agent's, and this is the one gate you may not
  perform yourself.** Not because you would be careless — because you cannot read
  your own copy cold. You know what the chart is going to be, so a hint that only
  parses if you know reads perfectly to you. A released card told a player *"по точке
  за вечер — ещё 3 вечера"*, which names the mechanics of a picture that is not on
  the screen and never says what arrives. It was drawn to the gallery and looked at
  **on purpose, at this gate**, by the author of the sentence it replaced. The owner
  read it cold and asked what it was supposed to mean.
- **You still own the conclusion.** The agent produces readings; deciding that a
  reading is wrong, and what the line should say instead, is yours.
- **The output is specific claims, not a verdict**, and those readings go into the
  commit's `Gallery:` line. "Looked, fine" is the green light with nothing behind it;
  a gate whose evidence never leaves the launching agent's context is satisfiable by
  saying it ran.

**A gate that covers part of a checklist replaces that part, never the list.** Two
phases in a row redrew the mockups here without ever loading `refresh-the-pictures`,
because `docs:check` had already named which pictures were stale — so the loop ran
off the failing gate, and the rows that had no gate were never walked. The Claude
Design page was one of them, and it went two releases without a poster that had been
shipping all along. It has a gate now; the half that generalises is the other one —
when a check tells you what to fix, ask what that check cannot see before believing
the list is finished.

## 7. A retrospective — when the phase actually cost something

Gate 5 judges the diff; this one judges what producing it cost — rework, gates run
twice, subagents briefed too thinly to be useful. **Run the `retrospective` skill in a
fork of this conversation** — its evidence is the transcript, so a cold agent is blind
to it and a fork inherits it whole — then land each lesson as a rule somewhere durable
yourself, rather than letting the fork write while a reviewer may still be reading.

**It opens when there is something to count**: something was rebuilt, a gate ran
twice, an agent was paid for a report nobody used, or a decision was guessed that was
the owner's. A phase of one commit that went in a straight line has no answers to give
and says so in the `Retro:` line instead — that is the whole of it, one clause.

The condition is the point rather than a concession: a ritual that always runs and
usually finds nothing teaches the reader to skip the line where a real finding would
eventually sit. Sixteen per cent of five days' churn here went into the process rather
than the bot, most of it landed by retrospectives with nothing to report but an
obligation to report it. Why the `Retro:` line has to be written even so is
`write-a-commit`'s to explain, and it does.

## The documents the phase owes

Load the **`write-a-doc`** skill before touching any of them: it routes a fact to
one file and says how to add it without creating the second copy that will drift.
Two steps from it matter most at the end of a phase — search the other documents for
what you are about to write, and search for the sentence the phase just made false.
Run `npm run docs:check` once the documents are updated — it is the last step of
the retrospective stage, and CI's `check:push` holds the same line after the push.

## A tool that refuses is a decision to re-open

`node scripts/tools.ts site-css` stopped running mid-phase, and the fastest fix —
install the missing package — silently reversed a decision taken ten days earlier and
argued in `README.md`, in the same paragraph that gave its reason: the server runs
`npm ci` on every deploy, so a compiler in the manifest is installed onto the machine
that runs the bot. The argument was one grep on the tool's name away.

So when a generator, a hook or a script refuses, grep the documents for its name
before changing how it is invoked. Either the obvious fix is the one already
rejected — and then reversing it is a decision that owes a rewritten paragraph, not a
silent `npm install` — or nothing is written about it, and one command told you so.

The same failure carried a second lesson: the tool had **never** run from a clean
tree. It had worked exactly once, off a `node_modules` the commit before it left
behind. A generated artifact whose gate only checks the artifact can go years without
anybody discovering that its generator is broken, so **a phase that regenerates
something is the phase that finds out** — treat the first refusal as evidence about
the tool, not about your machine.

## Scaling the ritual to the change

The gates are not negotiable, and which of them open is decided by the diff, never
by the hurry. What the phase *produces around them* is, and
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
| Gates | every one the diff opens, mutation and e2e over the diff | the same, and the diff opens more of them |

The test rules do not bend: every file still gets a spec, because that is what
holds the mutation score up and it is the cheapest part to write. What bends is
prose about a change that has nothing new to say.

The plan review is the one row that happens **before** any of this, at the end of
stage 1 once the interfaces are frozen. **This is the authority on what earns it** —
but a drawing's guard and an agent's `description:` have to stand alone, so the flow
and `plan-reviewer` each carry a short form, and narrowing it edits all three:

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
line, and let the user shrink it. **Read `TECH-DEBT.md` against the task first** — its
entries name triggers, and a task that trips one takes that entry into scope, so a
size quoted without checking is a size that grows later for a reason already written
down. That reading belongs with framing, before any work is classified as a fault or
as something new, because it is owed by every task either way.

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

A phase's cost is dominated by rework, not by thinking, and the same few mistakes
have produced most of it here: a signature that crossed a layer before it was frozen,
a new path that silently dropped what the old one also did, a design settled in a
session that has since ended, a bulk rewrite that reported success over a file it
never touched. Read [where a phase's budget actually goes](where-the-budget-goes.md)
while planning one, and again after one cost more than it should have.

## What to delegate

**The review, the readings and the checkup are delegated always** — their whole value
is that the reader did not write the thing, and you cannot review your own work by
reading it again. **Writing is delegated only above ten files**, and only once the
artifact those files are written against has been generated and looked at. **A question
the repository can answer is delegated at any size** — no brief-versus-code arithmetic
applies to reading. Whatever is expensive to be wrong about stays in your hands at any
size.

What a brief owes, what delegation does and does not buy — measured, not assumed — and
what never leaves your hands: [delegating work](delegating-work.md).

## The final commit message

Load the **`write-a-commit`** skill and follow it — it holds the title and body
rules, the gate numbers a phase-final commit carries, and the release format.
