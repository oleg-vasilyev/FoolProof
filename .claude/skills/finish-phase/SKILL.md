---
name: finish-phase
description: "Run a development phase in FoolProof from the work being taken on to the commit or the tag that ends it — the gates (lint and types, coverage, mutation, e2e, diff review, and the conditional ones: a real evening, the poster gallery, the copy tables read as sentences when they are written, a retrospective when the phase cost something) and the format of the phase's final commit message. Load it when ANY list of changes to this repository is accepted — closing audit findings, refactoring, cleanup, tooling, a new feature — because such a list is a phase whether or not it adds a feature, and the list somebody hands you never contains the gates. Also when a phase is being wrapped up, a release is being cut, or the user asks whether the code is releasable."
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

**A renamed file is the same fault, and its grep is owed before the review
launches.** A phase that moved 29 files left the old folder name in this skill and
in a `TECH-DEBT.md` entry; both surfaced after the reviewer was already out, which
is how the hold-still rule below gets broken by something that felt like tidying.

Most style rules are ESLint rules now (`eslint.config.js`), so a lint failure is
a convention violation, not a nit — read the message before reaching for a
disable comment, which is itself banned in `src/`.

**A new check is probed against input shaped differently, not only input that is
wrong.** Breaking today's file proves the rule fires on today's file, which is the easy
half. A gate meant to catch silent failures failed silently in its first hour: it read
an `<img>` only when `src`, `width` and `height` came in that order, so a `class` in
front of them dropped the image out of every check, weighing included, without a word.
The probe that matters changes the *shape* of what the rule reads: reorder, rename,
leave a field out, hand it a format it has never seen. A rule that cannot parse its
subject must say so rather than skip it.

**A new check's first output is not a measurement.** Calibrate it against cases whose
answer you already know before quoting a number from it. One written here to ask whether
every `TECH-DEBT.md` entry names a trigger reported thirteen entries missing one, and the
number went to the owner as a finding; the file was in fact clean, and the check had
simply never been shown a trigger phrased *if*, *the next time* or *with the next phase
that*. A check that cries wolf teaches its reader to skip it, so widening its vocabulary
is the fix and never rewording the subject to suit it.

**Copying a call from another module means copying what guards it.** The site's
image writer took resvg's render call out of `rasterizer.ts` and left
`requireFonts()` behind — and a missing font makes resvg draw the picture with no
text rather than fail, so six blank posters would have been committed with every
gate green: the SVG still matched, the shape still matched, and the weight matched
*better*. If the original refuses at construction, the copy owes the same refusal;
better still, import the guard and the list it guards rather than retyping them.

**An edit made by a script ends with a lint run, not with a glance.** The editor hook
lints a file as it is written; a patch applied by a throwaway script gets no such
feedback, and its mistake is always the same shape — a line inserted without the blank
lines around it, or a deletion leaving two. Twice the phase battery has stopped on its
first gate over one, which is a two-minute answer to a two-second question.

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

**The dry run is necessary and not sufficient — read the lock's diff too.** It
resolves against the platform it runs on, so a lock written on Windows can pass it
here and fail on the Linux runner. Adding `tailwindcss` did exactly that: `npm
install` rewrote the whole file and dropped `@emnapi/core` and `@emnapi/runtime`,
two optional peers this platform decides are unnecessary and the runner requires.
The dry run was green; CI died on `npm ci` with *Missing: @emnapi/core from lock
file*. So **any line the lock loses is a finding, not noise** — a phase that adds a
dependency should only ever add lines. When `npm install` removes some anyway, put
the committed lock back and hand-write the entries: the manifest line and the
package block, which for a dependency with no dependencies of its own is all there
is.

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
of a machine that could have been running the e2e suite. Everything else can overlap
with it — writing documents, redrawing pictures, reading a subagent's report — but the
**e2e suite cannot**: `QUIET_MS` decides the bot has finished, and a machine busy with
mutants makes renders slow enough to cross it.

**That full run grows with the code**: 5637 mutants at v1.14.0, of which one feature
phase added about 2100. It took sixteen minutes until `concurrency` stopped being a
hard `4` and became `"75%"`, measured rather than guessed — 960s at four workers,
596s at twelve, with the score and the timeout count identical, so the verdict never
moved.

The percentage is not there to speed CI up — Stryker computes
`max(1, round(cores × 0.75))`, so the four-vCPU runner gets three workers where
the old constant gave it four. It is there so a number tuned on a sixteen-core
machine cannot oversubscribe a small one. Tune for the machine you measured on,
express it as a share, and check what it computes to on four cores before
committing.

**`--mutate` takes a glob, and `dir/*.ts` matches the specs too.** Worse, the CLI
flag **replaces** the config's `!src/**/*.spec.ts` rather than adding to it, so the
exclusion has to be repeated on the command line every time. `mutate-changed.ts`
now reads those patterns out of `stryker.config.json` and appends them itself, so
the changed-file gate obeys the config — do not give it a second copy of the list.
An exclusion added to the config is not in force until you have found everything
else that decides the same thing; this one was silently ignored for a whole run:

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

Rules about *running* it, learned by burning most of a phase's budget on them:

- **Never re-run a gate to re-read its output, and never truncate the run that
  produced it — grepping the stream is truncating it.** A battery piped through
  `Select-Object -Last 30`, or through a `grep` whose pattern misses the summary
  line, throws away the coverage table and the mutation score the commit message
  then needs, and the cheapest way back is running the thing again — which is the
  rule this one protects. Send the whole run to a file and grep the file. Every
  run also writes `reports/mutation/mutation.json` and `reports/mutation/index.html`,
  and a backgrounded run keeps its own log — read those. `/merge` was closed with eight
  Stryker invocations where two would have done, three of them the same full run
  repeated to look at three slices of one table.
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

**What the brief must carry is `phase-reviewer.md`'s own section, not this one** —
the base ref, the paths, what changed outside `src/`, any rule the phase invented,
and nothing about what a file is *for*. Read it before writing one.

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

## 5b. The sentences — read when the table is written, re-read only if it moved

The gallery proves a line **fits**. Nothing else asks whether it is something a person
would say. Two releases shipped *«Дурак в этот вечер был — и всё равно 9 партий подряд
начисто»* and *«К середине — дно графика и 28%, сейчас — 50%»*, both drawn correctly,
both read by a poster reader, both word salad; the owner found seven of them in ten
minutes on a Friday night.

They survive because a copy table is read as **templates**, by the person who wrote
them, in the language they were composed in. `` `... и всё равно ${streak} подряд
начисто` `` looks like a sentence with a hole in it. The hole is where the meaning was.

So the reading is the **`copy-reader`** agent's, and it may not be done by whoever
wrote the table. What the brief must carry is that agent's own section, and so are
the four questions it asks. It reads **every** line filled in with real values, not
only the ones a poster happens to draw; the lines nothing draws are where this rot
survives longest.

**A drawing carries sentences too, and they are read before the owner sees them.**
The mockup's labels and captions are written by the designer and, until this was
added, read by nobody until the owner opened the contact sheet — which asks him to
approve wording as though he were the gate, which is the failure that produced this
agent in the first place. So the sheet goes to the reader before it goes to him, with
the designer's own inventory of every line on it. Say in the brief that the subject is labels
on a drawing — the agent's own contract says what that narrows the pass to, and
what happens to every placeholder on the sheet when nobody says it. Findings are fixed and the
sheet redrawn before it is shown — approval of wording that then changes is not
approval.

**The reading of the tables happens in stage 2, the moment they are written** — before render
code, specs or pictures are built on them. That is the whole economy of this gate: a
finding here edits one file, and the same finding at the end of the phase edits a
table, the code behind a sentence, the specs asserting it, and every poster drawing
it. The phase that introduced the gate ran it beside the pictures and paid twice, so
it moved ahead of them; the phase that measured it moved it again, all the way to the
artifact it reads.

At the end of the phase it runs a second time **only over what moved since** — keys
edited after the first reading, and prose that lives outside a copy table, like the
site's pages. A phase that changed no copy after stage 2 owes nothing here and says so
in the commit.

Its third question is the one that pays for the gate twice: following a sentence back
to the rule that earns it has already caught a claim no rule guaranteed and two
arguments handed over in the wrong order. That question needs call sites, so at stage 2
it is asked against the frozen signatures, and any of it left unanswerable waits for
the second pass.

**Freeze the files before briefing a cold agent.** A reader starts by reading; if you
are still editing its subject, it reports on a tree that no longer exists and you
cannot tell which of its findings are stale. This has happened twice in one phase — a
reviewer watched one file change under it mid-pass and said so, and a copy reader had
to be sent back to re-read a table edited while it worked. Brief an agent on files you
will not touch until it returns, or wait. The same rule Stryker has, for the same
reason.

## 6. The pictures — only when the phase drew something

This gate runs after the review, because review findings edit code and edited code
can change a drawing. It opens when the diff touched anything a picture is made of
— an SVG template, geometry, copy that lands on a poster, the site's pages — and
stays shut otherwise, with the commit message carrying the reason
(`write-a-commit` has the shape).

**Load the `refresh-the-pictures` skill and follow it.** What the gallery draws, how
a case is built so that it presses a real edge, how the reader is briefed, and what
to do with what comes back all live there — every line of it needed only while this
gate is open, which is the whole argument for it living there and not here.

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
twice, subagents briefed too thinly to be useful. Load the **`retrospective`** skill
and answer its five questions with counts, then land each lesson as a rule somewhere
durable. It runs before the final commit, while the transcript that is its evidence
still exists.

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

A phase's cost is dominated by rework, not by thinking. Every line below was paid for
here at least once:

- **Freeze every signature that crosses a layer before the first `Write`.** `/merge`
  flipped `mergePlayers` between `number` and `void` after the SQL, the stub and the
  integration spec were written, and paid for three files twice.
- **Waiting on gates that did not need running.** See gate 3.
- **A new path that bypasses an old one inherits its obligations.** List what the old
  path did *besides* the obvious thing — a cleanup, a sweep, a refusal — and say for
  each whether the new one still does it. Noticing a side effect and filing it as
  minor is not that check: the seating screen dropped the sweep that made a mistyped
  name disappear, and the phase then wrote a `PLAN.md` paragraph claiming it had not.
- **Decide where a rule lives before writing it, not after.** If one rule already
  earned a `domain/` module, its siblings belong beside it: a phase left the line-up
  arithmetic inline ten lines from `starter-rule.ts`, and the review's move cost two
  specs a second writing. In reverse, a `domain/` predicate that gates a button is
  unfinished until the `render/` side reads it — until then the rule is unreachable
  and nothing fails.
- **Anything the owner will look at gets rendered and shown before a spec is written
  against it**, and a choice between two defensible shapes is asked rather than
  picked. Five rounds went on a chart's legend because two guesses were cheaper to
  make than one question, and each guess cost a render, a spec pass and a screenshot.
- **A design settled in a session that has ended is not settled.** Frozen signatures,
  an approved mockup and a decisions note survive a restart; the owner's agreement
  does not, because what he agreed to was a picture he can no longer see. A resumed
  phase shows the drawing again before writing a line against it — one that did not
  wrote the module its notes had frozen, and deleted it the same hour. The tell is
  cheap: if you are *reading* a decision instead of remembering making it, re-show it.
- **Read the commit messages of the work you pick up, before contradicting any of
  it.** One session was a command away from "repairing" a gallery fixture back to a
  state a previous session had already tried, caught in review and written up at
  length. Reading cost a minute; the correction would have cost the phase.
- **A bulk rewrite is a script written to a file and run with `node`** — never a
  heredoc, which died twice on shell quoting before the first one landed. Anchor on
  the call as it appears, not on the name: replacing `awardRow(` blindly also rewrote
  `describe("awardRow()")`. **And it reports every replacement it did not make, then
  exits non-zero** — `String.replace` returns the string unchanged when the needle is
  absent, so one script here announced "cases rewritten" over a file it had not
  touched, CRLF against LF-shaped needles, and the lie held until the suite failed
  with the old case names still in it.

## What to delegate, and what it costs

Measured rather than assumed: one phase spent 493k tokens across six agents and saved
none. A cold agent re-reads the subject, the skill and the spec that are already in
your context, so delegation never buys tokens. It buys two things — room in your own
window, and wall-clock while you work on something disjoint.

**The review, the readings and the checkup are delegated always.** Their whole value
is that the reader did not write the thing: 89k tokens caught three things about to
ship, including a false sentence written earlier in the same phase by the same person
who then re-read it and approved it. Four phases in one night went four for four on
real bugs rather than style — a systemd unit that would have restarted the bot every
ten seconds forever when `.env.production` was missing, a measuring command in a skill
left broken by a signature change, a test that by construction could not fail, a false
`PLAN.md` claim about cross-chat queries, and a deploy that would have rolled
production back onto an older tag. You cannot review your own work by reading it again.

**Writing is delegated only above ten files, and only once the artifact those files
are written against has been generated and looked at.** That narrows an earlier rule
here — *an independent scope is delegated on sight* — and the narrowing is the
owner's, decided against this skill's own ledger after three phases in a row paid the
same rework. Below the threshold, doing it yourself is cheaper than briefing.

**The threshold does not open what was always closed.** Whatever is expensive to be
wrong about stays in your hands at any size — the mechanic a player will feel, a
cross-feature hazard, anything touching `shared/` or the schema. A twelve-file batch
across `shared/` is not delegable because it is twelve files; it is the case the count
was never about.

When a batch does go out, on `model: "sonnet"` because settled transcription is not
judgement:

- **The brief carries everything** — the exact files to write, the subject each spec
  tests, the stubs to use by name, the skill to load first — and tells the agent to
  run **only its own files**, or it spends a turn investigating your half-finished
  edits and deciding they are not its business.
- **State the property and the evidence, not the fix.** *Assert the actual words
  rather than the table reference* bought exactly that: English literals in a spec
  that drives one locale, killing the English mutants and leaving the Russian ones
  alive. The property wanted was "every counted noun has its three forms, in every
  language", and its home was the copy table's own spec, which already loops over
  both. Name the mutant that must die and let the cold agent find the home — it reads
  the tree without the answer already in mind, which is the whole reason to send it.
- **Never against a subject that is not settled, and a subject that draws something
  is not settled until you have looked at what it draws.** The `/personal` phase
  spawned four spec agents and first opened the rendered poster eleven minutes later;
  both corrections it then had to send were visible in the first PNG. For a subject
  that draws nothing: name the observation that would change your mind, and make it
  before briefing anybody. If you cannot name one, the design is settled.
- **Freeze the paths an agent was given.** A phase moved `render/*` into subfolders
  while an agent was writing specs against those very paths, and the agent spent its
  last turn on stale mocks.
- **Before parallelising, name the exclusive resource they share.** Disjoint files
  are not enough: agents share one working tree, and any tool that copies it, writes
  a fixed temp directory or a fixed report file can only be run by one of them at a
  time. Three writers were told to run Stryker, whose sandbox lives *inside* the
  repository — so one run copied another's half-written sandbox and died, and the
  brief needed two corrections mid-flight. Ask what each agent runs, and where that
  writes; anything exclusive stays with you and runs after they finish. The same hour
  produced the general form of the mistake twice more, a config flag and a threshold
  flag both invented rather than read: **a tool's behaviour you did not observe is a
  guess**, and `--help` costs a second.
- **Launch parallel agents in one message**, and do not block on one whose files are
  disjoint from yours. Their reports are not shown to the owner — relay what matters.
- **"Launched" is not "running".** A launch can return success and leave nothing
  behind: no task, an empty output file, no folder on disk. One designer failed that
  way and was reported to the owner as still thinking, thirteen minutes late. Follow
  a launch with a non-blocking status check, and tell an agent that produces files to
  create its output folder first, so progress is visible on disk instead of inferred.
- **Stalled twice means finished — but read the tree before redoing anything.** Take
  what landed, do the rest yourself, repair what it left half-edited; one phase lost
  twenty minutes and still hand-wrote five of twelve files, and another nearly
  rewrote seven specs the agent had in fact delivered ten minutes earlier.
- **Say what its report must carry, because a hand-briefed agent has no file to hold
  it.** The six named agents each declare a `What comes back`; this one is defined by
  the brief alone, and what a caller cannot reconstruct is **which files it actually
  wrote**, which it was given and did not, why, and anything it touched that the
  brief never named. Ask for that list in those words.
- **An agent that cannot do something says so instead of doing something adjacent.**
  Nothing propagates upward here: a report is text, a narrowed pass reads exactly
  like a completed one, and no gate is watching. Put it in the brief in those words.
- **A model that refuses or dies mid-run is the caller's problem, not the agent's.**
  Re-run the errand on another model and say in the phase's record which one — what
  may not be substituted is the property the agent was chosen for, which for every
  reading pass here is a context that did not write the thing.
- **What never leaves your hands:** copy, commit messages and document prose, because
  the voice is the product here, and anything resting on why-context this session
  accumulated — why a threshold is 7 and not 5 — which no brief can carry. The poster
  gallery is the exception that runs the other way: judging a drawing needs eyes that
  have not lived the phase, so it is delegated *because* it is judgement. What stays
  yours there is the conclusion — which reading is wrong, and what the line should say.

## The final commit message

Load the **`write-a-commit`** skill and follow it — it holds the title and body
rules, the gate numbers a phase-final commit carries, and the release format.
