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

## 3. `npm run test:mutation`

Stryker, roughly two minutes. Breaks below 85%. Coverage says a line ran; this
says a test would have noticed it break.

A file that dropped is a file whose new tests assert too little — strengthen the
tests, never lower the bar. Read `reports/mutation/mutation.html` for the
survivors, or run `npx stryker run --mutate <file> --reporters clear-text` to
list them for one file. The instructive ones are usually a spy left dirty by the
test above, or an optional chain hiding a value that was never set.

Strengthening a spec is the `write-a-spec` skill's job — load it rather than
reaching for the nearest assertion that turns the mutant red.

## 4. A review pass over the phase's whole diff

Read `git diff <phase-start>..HEAD` against `CLAUDE.md` — the whole diff at once,
not the individual commits, because a rule breaks across commits more often than
inside one. The `phase-reviewer` subagent exists for exactly this pass.

Ask of every touched file:

- Does it still read as a skeleton — the idea before the detail?
- Is every closed union dispatched with `switch`, not a chain of `if`?
- Is there a user-facing string outside `features/render/strings.ts`?
- Does every stub sit beside its subject, or beside its only consumer when the
  subject is someone else's code?
- Does the file's name still describe what is in it?

## The final commit message

Put the resulting numbers in it — test count, coverage, mutation score. A score
is only useful if a later regression has something to be compared against.

State what changed and *why the previous shape was wrong*. A commit that says
what a reader could get from the diff has wasted the message.
