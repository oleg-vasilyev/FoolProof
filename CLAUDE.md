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
  module-level state. Wiring belongs in the composition root (`src/bot.ts`), not
  inside the logic.
- **No magic numbers** — name them with a `const`.
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
start   dev   migrate   check   lint   lint:fix   typecheck
```

`start` runs the webhook build, `dev` runs long polling. Anything occasional
(one-off backfills, duplicate-player merges) goes behind `scripts/tools.ts`, which
lists itself when run with no argument. Adding a tool means one line in its table,
not a new npm script.

## Checks

- `npm run lint` / `npm run lint:fix` — ESLint (unused imports, braces).
- `npm run typecheck` — `tsc --noEmit`, `strict` plus `noUncheckedIndexedAccess`.
- `npm run check` — both. **Keep it at zero errors.**

`strict: true` and **no `any`**. There is no build step: `tsconfig.json` mirrors
how Node actually runs the code. `erasableSyntaxOnly` and `verbatimModuleSyntax`
keep the source type-strippable (no enums, no namespaces, `import type` for
types), and `allowImportingTsExtensions` matches the explicit `.ts` import paths.

## Architecture

Imports point only **downward** — never sideways or up:

```
entry (src/bot.ts)
  → features/*  →  integrations/* + shared/*  →  (nothing)
```

- `shared/`       — infra used everywhere: env, logger, db, repository, types
- `integrations/` — thin clients for external services: telegram
- `features/`     — one folder per capability: commands, game, render, stats, reaper

The entry file stays thin and declarative — it names the steps, never the
implementation.

### The state machine is a pure reducer

`features/game/` holds `(state, action) => state` and nothing else. **No database
access, no grammY, no `Date.now()`, no I/O of any kind** — the clock and the
storage are passed in. Every transition in `PLAN.md` must be exercisable without a
Telegram token and without Postgres running. This is the rule that makes the
product testable at all; it is worth defending against convenience.

`features/render/` is the same shape one layer out: state in, message text and
inline keyboard out, pure. Anything that talks to Telegram lives in
`integrations/telegram/`.

## Data access

Features never touch the database. They depend on the **repository interface**
(`shared/repository/types.ts`) and call named domain methods:

```ts
import { games } from "../../shared/repository/index.ts";

const game = games.liveInChat(chatId);
games.confirm(game.id, positions);
```

- `shared/db.ts` — connection + schema only.
- `shared/repository/postgres.ts` — the **only** file allowed to contain SQL or
  import `db`. Adding a query means adding a method here and to the interface.
- `shared/repository/index.ts` — the composition point that binds the interface to
  the Postgres implementation.

No raw SQL, no query building, and no knowledge of column names outside the
repository.

## Telegram constraints

Three things the Bot API does not have — do not attempt them, and do not accept a
design that assumes them: **button colours**, **disabled buttons**, **drag and
drop**. State is conveyed by an emoji in the button caption and by the message
body above the keyboard.

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
