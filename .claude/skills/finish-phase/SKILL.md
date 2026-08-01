---
name: finish-phase
description: Run the release ritual that closes a development phase in FoolProof — the four gates (check, coverage, mutation, diff review) and the format of the phase's final commit message. Use when a phase is being wrapped up, a release is being cut, or the user asks whether the code is releasable.
---

# Finishing a phase

A phase ends with a release, and a phase is done when the code is *releasable* —
not when it works. Run all four gates before the final commit and act on what
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

A file that dropped is a file whose new tests assert too little — strengthen the
tests, never lower the bar. The instructive ones are usually a spy left dirty by
the test above, or an optional chain hiding a value that was never set.

Strengthening a spec is the `write-a-spec` skill's job — load it rather than
reaching for the nearest assertion that turns the mutant red.

Two rules about *running* it, both learned by burning most of a phase's budget on
them:

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
- **Read the survivor's own line before believing it is a gap.** Two adjacent
  ternaries in one reducer differ by one word, and a line number quoted from memory
  cost a whole extra run here: the rule everyone was worried about was already
  killed, and the survivor next to it was equivalent. Print the mutant's line and
  its replacement from `mutation.json`, not the line you remember.
- **An arithmetic mutant on a nullable accumulator is usually equivalent.**
  `sum + null` is `sum + 0` in JavaScript, so "add the value even when it is absent"
  changes nothing observable. Recognising this is cheaper than writing the test that
  cannot exist.

## 4. A review pass over the phase's whole diff

Read `git diff <phase-start>..HEAD` against `CLAUDE.md` — the whole diff at once,
not the individual commits, because a rule breaks across commits more often than
inside one. The `phase-reviewer` subagent exists for exactly this pass.

Ask of every touched file:

- Does it still read as a skeleton — the idea before the detail?
- Is every closed union dispatched with `switch`, not a chain of `if`?
- Is there a user-facing string outside the owning feature's `copy.en.ts`?
- Does every stub sit beside its subject, or beside its only consumer when the
  subject is someone else's code?
- Does the file's name still describe what is in it?

## The documents the phase owes

Load the **`write-a-doc`** skill before touching any of them: it routes a fact to
one file and says how to add it without creating the second copy that will drift.
Two steps from it matter most at the end of a phase — search the other documents for
what you are about to write, and search for the sentence the phase just made false.
`npm run docs:check` runs inside `npm run check`, so a broken link or a stale tree
fails gate 1 rather than surviving to the next cleanup.

## Scaling the ritual to the change

The four gates are not negotiable. What the phase *produces around them* is, and
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
| Gates | all four, mutation over the diff | all four, mutation over the diff |

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

**Mechanical work goes to a subagent on a cheaper model.** Once the design is
settled, writing five spec files, adding a stub, or updating an expectation is
transcription, not judgement. Delegate it as one batch with `model: "sonnet"`, and
because the agent starts cold, the brief has to carry everything: the exact files
to write, the subject each spec tests, the stubs to use by name, and the
instruction to load the `write-a-spec` skill first. Keep for yourself the parts
where being wrong is expensive — the mechanic a player will feel, a cross-feature
hazard, anything touching `shared/` or the schema.

## The final commit message

Put the resulting numbers in it — test count, coverage, mutation score. A score
is only useful if a later regression has something to be compared against.

State what changed and *why the previous shape was wrong*. A commit that says
what a reader could get from the diff has wasted the message.
