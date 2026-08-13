---
name: add-a-feature
description: Add a new feature folder to FoolProof — the layers, the feature contract (commands, listen, resume), the two places a feature is named, the lint zone that fences it off, and the hazards the installer exists to prevent. Use when adding a command or a screen that is not part of an existing feature, or when changing what a feature declares to the installer.
---

# Adding a feature

**A feature is a folder you can delete.** Removing `features/scoresheet/` must leave
the rest compiling and passing, and adding one must not require editing another.
The cost is paid in exactly two files — `src/main.ts` and `package.json` — and
every step below serves that.

Name the folder after **what the player gets**, not after an internal noun:
`live-game/` is the game running right now on a card of buttons, `merge-names/` is
the screen that makes two names one player. A folder called `players/` or
`handlers/` is a bucket, and the next feature will be dumped in it.

## 1. The three layers, and imports point downward only

```
features/<name>/
  <name>-feature.ts  the entry point: builds the parts and declares the commands
  copy.en.ts         every string this feature shows a user
  domain/            the pure core — no framework, no I/O, no rendering
  render/            state in, message text and SVG out; still pure
  bot/               the impure edge: grammY handlers, debouncing, rasterizing
```

`bot` may reach `render` and `domain`; `render` may reach `domain`; `domain` reaches
nothing. Skip a layer that has nothing in it rather than leaving it empty —
`diagnostics/` has no `domain/` because it decides nothing.

**The entry point sits at the feature root, not inside a layer.** It is the
feature's composition root, the same job `src/main.ts` does one level up, so
opening the folder shows what the feature *is* before how it works.

**`docs:check` fails a layer root above nine files**, which is unambiguous crowding
rather than a real limit — the fix is always a named subfolder, never a bigger
number. It is a late alarm on purpose: seven fired on a folder that needed no split,
so the question is the rule and the count only makes somebody ask it. `CLAUDE.md`
has the rule the subfolder has to satisfy: name it after a thing the player ends up
holding, never after a process.

## 2. What the feature declares

A feature does **not** get the `Bot`. It returns a `Feature`
(`shared/telegram/feature-contract.ts`):

- `commands` — each with `menuDescription` and `help`, both from `copy.en.ts`.
  `/help` and the `/` menu are generated from this one list, so they cannot drift
  from what is installed. `hidden: true` keeps a command out of both while still
  registering it, which is how the installer filters twice from a single list.
- `listen` — optional, receives a narrow `Listeners` with only `onText` and
  `onTap`.
- `resume` — optional, called once after the commands are installed and before
  polling starts: the seam for catching up on whatever the previous run left
  behind. **It may never be the reason the bot fails to start** — a `resume` that
  throws is logged and skipped.
- `stop` — optional, for a timer or a pending edit that must be flushed.

Two hazards this contract exists to prevent, both of which have already happened
here:

- **Commands must be registered before any `bot.on("message:text")` filter**, or a
  text handler that returns without calling `next()` silently swallows every
  command below it. The installer registers every feature's commands first, then
  the listeners, so a feature physically cannot get this wrong.
- **`onTap` takes the pattern the feature owns**, not just a handler:
  `listeners.onTap(MERGE_TAPS, handler)`. A bare `bot.on("callback_query:data")`
  per feature meant the first feature registered saw every tap and answered "Card
  updated" for data that was never its own — the second feature's buttons were dead
  before they were written. Export the pattern from the feature's own codec and
  make sure it cannot match another screen's data. A tap matching nothing is
  answered by the installer itself.

## 3. Name it in exactly two places

- `package.json` `imports`: `"#<name>/*": "./src/features/<name>/*"`. These are
  Node's own subpath imports, the only aliasing that survives having no build step,
  and one declaration serves the compiler, Node, Vitest and Stryker's sandbox.
- `src/main.ts`: build it and put it in the `features` array. `main.spec.ts` is the
  one spec that is *supposed* to know the roster, so it changes too.

There are **no relative imports in `src/`** — not even for a sibling file. The value
of the rule is that every import line reads the same way.

## 4. Fence it off, and prove the fence

Add the folder name to `FEATURES` in `eslint.config.js`. That generates the zones:
`domain/` and `render/` may not import a framework or reach upward, and neither may
reach into another feature or `#app/`.

**A zone is not finished until a deliberate violation has been shown to fail the
lint.** Write a throwaway file in each new zone that imports something banned, run
`npx eslint` on it, see it fail, delete it. This project has shipped two zones that
never fired, both silently:

- a later flat-config block **replaces** an earlier one for a file matched by both,
  so purity and independence have to be one pattern list per zone;
- minimatch reads a leading `#` as a **comment**, so `#live-game/**` matches
  nothing — alias bans are compiled to `regex` patterns instead.

## 5. Tests, copy, and how big the phase is

- Every file gets a spec beside it, and everything it imports is mocked. Load the
  `write-a-spec` skill before writing them.
- Every user-readable string lives in `copy.en.ts` and nowhere else. **A copy
  function interpolates; it never decides** — choosing between `1 game` and
  `2 games` is a `render/` job, because specs leave the copy table real and a
  decision made inside it is compared against itself.
- A keyboard whose buttons carry `callback_data` gets e2e scenarios; see
  [`e2e/README.md`](../../../e2e/README.md). A **URL** button does not earn one on
  its own — nothing routes back to the bot, so there is no dispatch to prove.
  `/start` offers one and is covered by `feature-installer.integration.spec.ts`,
  which drives a real grammY `Bot`.
- A new feature that adds a repository method or a screen with states is a
  contract-changing phase: it owes a `PLAN.md` section. The `finish-phase` skill has
  the table and the gates.
