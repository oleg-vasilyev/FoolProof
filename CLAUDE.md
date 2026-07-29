# FoolProof — project rules

A Telegram bot that records games of Durak in a group chat of friends. Input
happens on a phone, one-handed, between games — **taps are the scarce resource**,
not data completeness. When a design choice trades a tap for a column, drop the
column.

`PLAN.md` is the spec: state machine, data model, invariants, edge cases. This
file is the rules for writing the code. Do not restate one in the other — when
the two disagree, `PLAN.md` wins on behaviour and this file wins on style.

## Code style

- **No comments in `src/` and `scripts/`.** Not English, not Russian. Naming
  carries the intent. This overrides the "name the constant *and* comment it"
  habit from job-finder — here a magic number still gets a named `const`, but the
  intent has to fit in the name (`ABANDON_AFTER_MS`, `EDIT_DEBOUNCE_MS`). If it
  genuinely cannot, the explanation belongs in `PLAN.md`, not in the source.
  Config files (`tsconfig.json`, `eslint.config.js`) may carry comments — a
  non-obvious compiler flag has nowhere else to live.
- **Functional style, `const` over `let`.** No mutation of arguments; return a new
  value instead.
- **Two blank lines** after the last import, before the first statement.
- **Never write an `if` without braces** — always `if (cond) { ... }`, even for a
  one-line body.
- **Separate semantically distinct blocks** with a single blank line so they don't
  visually merge.
- **Keep functions pure where you can** — a function works off its arguments, not
  module-level state. Wiring belongs in the composition root (`src/main.ts`), not
  inside the logic.
- **No magic numbers** — name them with a `const`.
- **A file must read as a skeleton, not an implementation.** Opening it should
  show the idea before any detail. The exported factory or entry point is a table
  of contents that names the steps and delegates; the steps are named
  module-level functions that take an explicit context object instead of reaching
  into closure scope. `src/main.ts` and `features/bot/cards.ts` are the reference
  shape. A function grown past a screenful is usually several functions that have
  not been named yet — and one that needs a comment to explain its sections is
  really asking to be split.
- **Dispatch on a union with `switch`, never a chain of `if`.** Actions, phases
  and transition outcomes are closed unions: a `switch` says so, and the compiler
  then checks exhaustiveness, so adding a case becomes a compile error in every
  place obliged to handle it. Keep `if` for guards and priority chains, where
  there is no discriminant to switch on.
- **Prefer a discriminated union over a nullable plus a separate reason.** A
  lookup that can fail returns `{ ok: true, … } | { ok: false, notice }`, so the
  narrowing survives the call and the caller reads as one early return
  (`findTappableCard`).
- **No `console.*` for app logging** — use the scoped logger from
  `src/shared/logger.ts`:

  ```ts
  import { createLogger } from "../../shared/logger.ts";

  const log = createLogger("scope");
  log.info("...");   // debug | info | warn | error
  ```

  `LOG_LEVEL` (debug|info|warn|error, default `info`) sets the threshold.
  Raw `console.*` is fine only in `scripts/` dev utilities.

## Language

Everything is English — code, identifiers, commits, docs **and every user-facing
string**. This is an international product from the first commit.

All copy the bot emits lives in one module (`features/render/strings.ts`) and is
referenced by key. **No string literal that a user can read may appear anywhere
else** — not in the state machine, not in a command handler, not in an
`answerCallbackQuery` call. Per-chat locale selection is out of scope for v1, but
the module boundary that makes it a small change is not: keep the strings table
flat and keyed, and put anything with a count behind a function rather than
concatenating at the call site.

Player names are user data, not copy — any script, stored and displayed exactly as
typed. The parser must not assume latin, and name matching normalises via Unicode
NFC and lower case (plus `ё` → `е` for Cyrillic).

Telegram commands are latin lower case only (`/game`, `/next`, `/stats`) — a Bot
API constraint, not a preference.

## npm scripts

**Never put comment keys (`"// ...": "..."`) in `package.json`.** The script name
has to say what the script does on its own.

Keep the list short — it is the first thing a new user reads:

```
start   test   test:coverage   check   lint   lint:fix   typecheck
```

`start` is the whole bot — there is no separate dev command, because long polling
is the only delivery mode (see `PLAN.md`). There is no `migrate` either:
`shared/db.ts` creates the schema with `CREATE TABLE IF NOT EXISTS` on startup,
the way job-finder does. Anything occasional
(one-off backfills, duplicate-player merges) goes behind `scripts/tools.ts`, which
lists itself when run with no argument. Adding a tool means one line in its table,
not a new npm script.

## Checks

- `npm run lint` / `npm run lint:fix` — ESLint (unused imports, braces).
- `npm run typecheck` — `tsc --noEmit`, `strict` plus `noUncheckedIndexedAccess`.
- `npm test` — vitest. `npm run test:coverage` fails below **70%** on every metric.
- `npm run check` — all three. **Keep it at zero errors.**
- `npm run test:mutation` — Stryker, roughly two minutes. Coverage only proves a
  line ran; the mutation score proves a test would notice if it broke. It is not
  part of `check` because of the runtime, but the build **breaks below 85%**, and a drop from the current ~92%
  means new tests are watching without asserting.

### Finishing a phase

A phase ends with a release, and a phase is done when the code is *releasable* —
not when it works. Before the final commit of a phase, run all four gates and act
on what they say:

1. **`npm run check`** — lint, types, tests. Zero errors, no exceptions.
2. **`npm run test:coverage`** — 70% floor on every metric. A file that dropped
   is a file whose new branches nobody exercised.
3. **`npm run test:mutation`** — Stryker, breaks below 85%. Coverage says a line
   ran; this says a test would have noticed it break. A file that dropped is a
   file whose new tests assert too little — strengthen them, do not lower the bar.
4. **A review pass over the phase's whole diff**, read against this file rather
   than against the individual commits: does each touched file still read as a
   skeleton, is every union dispatched with `switch`, are there comments that
   crept into `src/`, is there a user-facing string outside `strings.ts`, does
   every stub sit beside its subject?

Put the resulting numbers in the phase's final commit message. A score is only
useful if a later regression has something to be compared against.

### Tests

Specs sit next to the code as `*.spec.ts`, and **so do the stubs** — `*.stub.ts`
lives beside the thing it stands in for, never in a central testing folder. This
is the same feature-based rule the source follows: `repository.stub.ts` next to
`sqlite.ts`, `state.stub.ts` next to the reducer. A stub for something we did not
write — grammY's `Api`, a synthetic `Update` — sits next to its only consumer
instead, which is `features/bot/`. Stub imports point downward like every other
import.

A stub is a **class** whose public `*Spy` fields are `vi.fn()`s, with sensible
defaults set in the constructor, and whose methods just delegate to those spies.
Tests then override one spy instead of rebuilding a fake. Nest `describe` by unit
and then by method, name numbers (`const ONCE = 1`), and separate
arrange/act/assert with blank lines.

Two deliberate exceptions to "mock everything":

- `repository/sqlite.spec.ts` runs against a **real** temporary SQLite file. Its
  whole job is the SQL, and a mocked database would assert nothing. Set
  `process.env.DB_PATH` before importing, because `db.ts` opens the connection at
  module load.
- `features/bot/index.spec.ts` drives a **real** grammY `Bot` through
  `bot.handleUpdate()` with synthetic updates, intercepting the network at
  `bot.api.config.use()`. Middleware order is exactly what that file gets wrong,
  and only the real router can catch it. Pass `botInfo` so no `getMe` call is
  needed. Note `bot.catch` only runs under `bot.start()` — `handleUpdate` rethrows,
  so test the handler through `bot.errorHandler`.

`strict: true` and **no `any`**. There is no build step: `tsconfig.json` mirrors
how Node actually runs the code. `erasableSyntaxOnly` and `verbatimModuleSyntax`
keep the source type-strippable (no enums, no namespaces, `import type` for
types), and `allowImportingTsExtensions` matches the explicit `.ts` import paths.

## Architecture

Imports point only **downward** — never sideways or up:

```
entry (src/main.ts)
  → features/*  →  shared/*  →  (nothing)
```

- `shared/`   — infra used everywhere: env, logger, debounce, db, repository
- `features/` — one folder per capability: game, render, bot

There is no `integrations/` layer. It existed once and held no client: grammY is
the Telegram client and is imported directly, so the folder only contained two
dependency-free modules and two stubs, each with a single consumer. A module goes
in the feature that uses it; a second external service can have its own folder on
the day it exists.

The entry file stays thin and declarative — it names the steps, never the
implementation.

Keep cross-feature imports rare and one-directional. There is exactly one:
`bot` → `game` + `render`. `bot` is the orchestration layer that owns everything
impure — the database, the grammY handlers, the debounced edits, the idle sweep —
so that `game` and `render` can stay pure. Nothing may import `bot`.

### The state machine is a pure reducer

`features/game/` holds `(state, action) => state` and nothing else. **No database
access, no grammY, no `Date.now()`, no I/O of any kind** — the clock and the
storage are passed in. Every transition in `PLAN.md` must be exercisable without a
Telegram token and without a database file. This is the rule that makes the
product testable at all; it is worth defending against convenience.

`CardState` carries no phase field: `phaseOf()` derives it from whether a starter
is set, how many players remain, and whether a draw was accepted. The `state`
column exists only so a restart can tell an accepted draw (two remain) from an
automatic fool (one remains) — everything else about a live card is rebuilt from
`game_players` and `game_events` on every single tap, which is what makes a
restart mid-game a non-event.

`features/render/` is the same shape one layer out: state in, message text and
inline keyboard out, pure. It also owns the two wire-format modules the card
needs — `html.ts` escapes the body and `callback.ts` is the codec for
`callback_data`, encoded by the keyboard and decoded by `bot`.

## Data access

Features never touch the database. They depend on the **repository interface**
(`shared/repository/types.ts`) and call named domain methods:

```ts
import { games } from "../../shared/repository/index.ts";

const game = games.liveInChat(chatId);
games.confirm(game.id, positions);
```

- `shared/db.ts` — connection + schema only.
- `shared/repository/sqlite.ts` — the **only** file allowed to contain SQL or
  import `db`. Adding a query means adding a method here and to the interface.
- `shared/repository/index.ts` — the composition point that binds the interface to
  the SQLite implementation.

No raw SQL, no query building, and no knowledge of column names outside the
repository. Swapping storage engines should mean writing one new file.

Storage is SQLite via the built-in `node:sqlite` — no dependency and no daemon.
Three things `shared/db.ts` owns and nothing else may assume:

- `PRAGMA foreign_keys = ON`, `journal_mode = WAL`, `busy_timeout`. Foreign keys
  are **off** by default in SQLite, and the schema leans on `ON DELETE CASCADE`.
- Timestamps are TEXT in `datetime('now')` form, always UTC. Never store a locale
  format — the columns are sorted on directly.
- The database file lives under `data/`, which is gitignored.

## Telegram constraints

Five things the Bot API does not have — do not attempt them, and do not accept a
design that assumes them: **button colours**, **disabled buttons**, **drag and
drop**, **font size or colour**, and **button label alignment** (captions are
always centred). State is conveyed by an emoji in the button caption and by the
message body above the keyboard; the emoji's own colour is the only palette there
is (`❌` red, `✅` green, `✔️`/`✖️` grey).

- `callback_data` is capped at 64 bytes. **Never put a name in it** —
  `<game_id_b62>:<action>:<slot>:<state_version>`.
- Every accepted tap gets an `answerCallbackQuery`, always. Without it, lag reads
  as a dropped tap and the person taps again.
- `state_version` is checked on every callback and bumped on every transition. A
  stale version answers "Card updated" and changes nothing. This is what
  makes double taps and simultaneous tappers safe — it is a correctness
  requirement, not an optimisation.
- Debounce edits by 300–500 ms; `editMessageText` counts against the group rate
  limit.
- Button order follows the seating and **never changes** within a game or a
  session. Muscle memory beats tidiness.
- Cards go out with `parse_mode: "HTML"`. Player names are user data, so anything
  reaching the **message body** goes through `escapeHtml` first. **Button captions
  are the opposite** — Telegram does not parse HTML there, and escaping them would
  render `&amp;` literally. Getting this backwards is silent in testing and
  obvious in the chat.
- Emoji are load-bearing, not decoration: ✅ done, 💀 fool, 🤝 draw, and the control
  buttons. Two dead ends already paid for — medals for the top three (coloured dots
  at button size) and a `<pre>` block for aligned columns (Telegram renders it as a
  code block with a "copy" header). Reach for weight and wording before reaching
  for another emoji.
- **The live card never repeats what the buttons already say**, and stops changing
  once the starter is picked. Player buttons carry their own positions, so the body
  holds only the game number and the starter — no progress line, no table size, no
  "tap Confirm" prompt. Text whose length changes makes the message reflow under
  the keyboard on every tap. The standings render once, on Confirm —
  `renderResult`, not `renderCard`.
- Command handlers must be registered **before** any `bot.on("message:text")`
  filter. Commands are text messages too, so a text handler that returns without
  calling `next()` will silently swallow every command below it.
- A `force_reply` prompt cannot be withdrawn through the API — the client holds
  the pending reply in the chat draft until the message it points at is deleted.
  Delete a prompt **only when it went unanswered**; deleting an answered one turns
  the quote in the user's reply into "Deleted message" for good. `selective: true`
  works only if the prompt is itself a reply to the user's message.
- More generally: deleting a message that something else quotes is not a clean
  undo. The quote survives as a tombstone, and unlike a stale draft it cannot be
  cleared.

## Configuration

Secrets live in `.env` (gitignored) next to `.env.example`, which is the shareable
template and must list every key the app reads. Read them in one place —
`shared/env.ts` — and pass values down; no `process.env` in feature code.

## Data integrity

- `game_events` stores a `player_id`, **never a name**. Merging duplicate players
  must stay a foreign-key repoint.
- `CANCELLED` and `ABANDONED` games are never written to the database.
- `FROZEN` is immutable. There is no rollback path, and adding one is a `PLAN.md`
  decision, not an implementation detail.
