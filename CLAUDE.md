# FoolProof — how the code here is written

Three documents, one job each:

- **`README.md`** — what the bot is and how to run it. For someone arriving at
  the repository.
- **`PLAN.md`** — what the bot does and why. State machine, data model,
  invariants, edge cases, and the design dead ends already paid for.
- **`CLAUDE.md`** — this file. How code is written here: style, layering,
  testing, gates.

The dividing question is *would this still be true if the bot were rewritten in
Python?* If yes, it belongs in `PLAN.md` — the Bot API's limits, the state
machine, the schema. If no, it belongs here. A fact lives where its reason lives;
the other file gets a pointer, never a retelling. When the two disagree, `PLAN.md`
wins on behaviour and this file wins on style.

## Code style

Anything a machine can check is a lint rule, not a paragraph — see
[What enforces what](#what-enforces-what). What is left needs judgement:

- **A file must read as a skeleton, not an implementation.** Opening it should
  show the idea before any detail. The exported factory or entry point is a table
  of contents that names the steps and delegates; the steps are named
  module-level functions that take an explicit context object instead of reaching
  into closure scope. `src/main.ts`, `features/bot/router.ts` and
  `features/bot/cards.ts` are the reference shape. A function grown past a
  screenful is usually several functions that have not been named yet — and one
  that needs a comment to explain its sections is really asking to be split.
- **A file is named after what it holds.** `index.ts` promises a re-export, so
  logic never goes in one: `router.ts` registers routes, `handlers.ts` holds
  handlers, `prompts.ts` owns the prompt registry.
- **Dispatch on a union with `switch`, never a chain of `if`.** Actions, phases
  and transition outcomes are closed unions: a `switch` says so, and the compiler
  then checks exhaustiveness, so adding a case becomes a compile error in every
  place obliged to handle it. Keep `if` for guards and priority chains, where
  there is no discriminant to switch on.
- **Prefer a discriminated union over a nullable plus a separate reason.** A
  lookup that can fail returns `{ ok: true, … } | { ok: false, notice }`, so the
  narrowing survives the call and the caller reads as one early return
  (`findTappableCard`).
- **Keep functions pure where you can** — a function works off its arguments, not
  module-level state. Wiring belongs in the composition root (`src/main.ts`), not
  inside the logic.
- **Functional style.** No mutation of arguments; return a new value instead.
- **Separate semantically distinct blocks** with a single blank line so they
  don't visually merge.
- **No comments in `src/` and `scripts/`** — naming carries the intent. A magic
  number still gets a named `const`, but the intent has to fit in the name
  (`ABANDON_AFTER_MS`, `EDIT_DEBOUNCE_MS`). If it genuinely cannot, the
  explanation belongs in `PLAN.md`, not in the source. Config files
  (`tsconfig.json`, `eslint.config.js`) are exempt — a non-obvious compiler flag
  has nowhere else to live.
- **No `console.*` for app logging** — use the scoped logger:

  ```ts
  import { createLogger } from "../../shared/logger.ts";

  const log = createLogger("scope");
  log.info("...");   // debug | info | warn | error
  ```

  `LOG_LEVEL` (debug|info|warn|error, default `info`) sets the threshold. Raw
  `console.*` is for `scripts/` dev utilities and for `shared/logger.ts` itself.

## Language in code

Everything is English — code, identifiers, commits, docs and every user-facing
string. `PLAN.md` says why; this is what it means when writing code.

All copy the bot emits lives in `features/render/strings.ts` and is referenced by
key. **No string literal that a user can read may appear anywhere else** — not in
the state machine, not in a handler, not in an `answerCallbackQuery` call. Keep
the table flat and keyed, and put anything with a count behind a function rather
than concatenating at the call site: that is the seam that makes a second locale
a small change.

Player names are user data, not copy. Matching normalises via Unicode NFC and
lower case, plus `ё` → `е`; the parser must not assume latin
(`features/game/lineup.ts`).

## Architecture

Imports point only **downward** — never sideways or up. ESLint enforces it with
one zone per layer, so a bad import is a build error:

```
entry (src/main.ts)
  → features/*  →  shared/*  →  (nothing)
```

- `shared/`   — infra used everywhere: env, logger, debounce, db, repository
- `features/` — one folder per capability: game, render, bot

There is no `integrations/` layer. It existed once and held no client: grammY is
the Telegram client and is imported directly. A module goes in the feature that
uses it; a second external service can have its own folder on the day it exists.

Cross-feature imports are rare and one-directional. There are exactly two:
`bot` → `game` + `render`, and `render` → `game`. `bot` is the orchestration
layer that owns everything impure — the database, the grammY handlers, the
debounced edits, the idle sweep — so that `game` and `render` can stay pure.
Nothing may import `bot`.

The entry file stays thin and declarative: it names the steps, never the
implementation.

### The state machine is a pure reducer

`features/game/` holds `(state, action) => state` and nothing else. **No database
access, no grammY, no `Date.now()`, no I/O of any kind** — the clock and the
storage are passed in. Every transition in `PLAN.md` must be exercisable without
a Telegram token and without a database file. This is the rule that makes the
product testable at all; it is worth defending against convenience.

`CardState` carries no phase field: `phaseOf()` derives it. Everything about a
live card is rebuilt from `game_players` and `game_events` on every single tap,
which is what makes a restart mid-game a non-event. `PLAN.md` explains why the
`state` column still exists.

`features/render/` is the same shape one layer out: state in, message text and
inline keyboard out, pure. It also owns the two wire-format modules the card
needs — `html.ts` escapes the body, `callback.ts` is the codec for
`callback_data`, encoded by the keyboard and decoded by `bot`.

Two Bot API facts that are easy to get backwards in code, both explained in
`PLAN.md`:

- **Escape user data reaching the message body, never button captions.** Telegram
  does not parse HTML in captions, so escaping there renders `&amp;` literally.
- **Register command handlers before any `bot.on("message:text")` filter**
  (`features/bot/router.ts`). Commands are text messages too, so a text handler
  that returns without calling `next()` silently swallows every command below it.

### Data access

Features never touch the database. They depend on the **repository interface**
(`shared/repository/types.ts`) and call named domain methods:

```ts
import { repository } from "../../shared/repository/index.ts";

const card = repository.liveCardInChat(chatId);
```

- `shared/db.ts` — connection and schema only. It owns the pragmas and the
  timestamp format that `PLAN.md` describes; nothing else may assume them.
- `shared/repository/sqlite.ts` — the **only** file allowed to contain SQL or to
  import `db`.
- `shared/repository/index.ts` — binds the interface to the SQLite implementation.

No raw SQL, no query building, and no knowledge of column names outside the
repository. Swapping storage engines should mean writing one new file. Adding a
query has a procedure: the `add-repository-method` skill.

## Tests

Specs sit next to the code as `*.spec.ts`, and **so do the stubs** — `*.stub.ts`
lives beside the thing it stands in for, never in a central testing folder. A
stub for something we did not write (grammY's `Api`, a synthetic `Update`) sits
next to its only consumer instead. Stub imports point downward like every other
import.

A stub is a **class** whose public `*Spy` fields are `vi.fn()`s, with sensible
defaults set in the constructor, and whose methods just delegate to those spies.
Expose the assembled object as a **field set in the constructor, not a getter** —
a getter builds a new object per call, and `toBe` identity checks then fail for
no reason a reader can see. Tests override one spy instead of rebuilding a fake.

Nest `describe` by unit and then by method, name numbers (`const ONCE = 1`), and
separate arrange/act/assert with blank lines.

A module mocked with `vi.mock` is hoisted above the imports, so the file under
test is loaded afterwards with `const { thing } = await import("./thing.ts")`.
That is why the specs here import their subject at the bottom of the header
rather than at the top.

### Units by default, integration by exception

**A spec tests one file. Everything that file imports is mocked.** Not "the
awkward parts" — everything: the library, the sibling module in the next folder,
the pure helper, the collaborator handed in through a context object.

Three rules follow from that, and the first is absolute:

1. **Never exercise third-party code in a unit spec.** grammY, `node:sqlite`,
   `node:fs` — mock them. Their authors have their own tests, and a spec that
   drives them is reporting on their code while claiming to report on ours. When
   one of them breaks our spec, the failure points at the wrong file.
2. **Mock our own modules too.** `card.ts` is not tested by feeding it a real
   `CardState` and checking the whole rendered string — that spec fails when
   `finalPlacements` changes, which is `state.ts`'s business. Mock the helper,
   drive the file by what it returns, and the failure lands where the fault is.
3. **Leave data tables real.** `features/render/strings.ts` is keys and text, not
   behaviour; mocking it would compare a constant against itself. Everything with
   a body gets mocked.

Mocking is usually the *more* direct test, not a weaker one:

- `router.ts` exists to register routes in an order that matters. On a mocked
  `Bot` that is asserted literally — `bot.command` was called before
  `bot.on("message:text")` — instead of inferred from whether a `/help` update
  happened to produce a reply.
- `card.ts` must route user data through `escapeHtml`. With the escaper mocked
  that is asserted as a fact about `card.ts`, not guessed from spotting `&amp;`
  in the output.

The tell that a spec has drifted is an assertion it has no business making: a
keyboard spec checking the 64-byte callback limit, a stats spec checking that
`&` becomes `&amp;`. Both were really testing another module, and both already
had a proper home elsewhere.

**An integration spec is an exception with a reason**: several parts once went
wrong *together*, and no single unit could have caught it. Do not write one
because mocking is inconvenient — write it when the seam between systems is
itself the thing under test. It is named `*.integration.spec.ts`, so nobody
mistakes it for the default, and it sits beside the code like every other spec.
`npm run test:unit` and `npm run test:integration` run them separately; `npm test`
runs both.

There are two, and the bar for a third is a bug that got through the units:

- `features/bot/router.integration.spec.ts` drives a **real** grammY `Bot`
  through `bot.handleUpdate()`, intercepting the network at
  `bot.api.config.use()`. Pass `botInfo` so no `getMe` call is needed. **Flush the
  card service in `afterEach`** — the real debouncer schedules a real 350 ms
  timer, and a timer that outlives its test fires into the next test's
  assertions, which this spec has already been caught doing.
- `shared/repository/sqlite.integration.spec.ts` runs against a **real**
  temporary SQLite file. The SQL is the unit under test and a mocked database
  would assert nothing. Set `process.env.DB_PATH` before importing, because
  `db.ts` opens the connection at module load — and close the connection before
  deleting the file, or Windows refuses and the temp files pile up.

One trap worth keeping: `bot.catch` only participates in `bot.start()`.
`handleUpdate` rethrows, so an error handler is exercised through
`bot.errorHandler` — or, better, on the mock.

`strict: true` and **no `any`**. There is no build step: `tsconfig.json` mirrors
how Node actually runs the code. `erasableSyntaxOnly` and `verbatimModuleSyntax`
keep the source type-strippable (no enums, no namespaces, `import type` for
types), and `allowImportingTsExtensions` matches the explicit `.ts` import paths.

## Checks

`README.md` lists what each npm script runs. Two rules about the list itself:
**never put comment keys (`"// ...": "..."`) in `package.json`** — the script name
has to say what it does — and **keep the list short**, because it is the first
thing a new reader sees. Anything occasional (backfills, merging duplicate
players) goes behind a single `scripts/tools.ts` that lists itself when run with
no argument; adding a tool is then one line in its table, not a new npm script.

### What enforces what

A rule that can be checked mechanically is a lint rule, not a paragraph — prose
is for judgement. `eslint.config.js` holds the checkable ones, including three
with no core equivalent that are defined inline there:

| Rule | Enforced by |
|---|---|
| No comments in `src/` | `project/no-comments` |
| Two blank lines after the last import | `project/blank-lines-after-imports` (autofixed) |
| A number must be named by a `const` | `project/named-numbers` |
| Braces on every `if`, `const` over `let` | `curly`, `prefer-const`, `no-var` |
| No `console.*` outside `shared/logger.ts` | `no-console` |
| Imports point only downward | `no-restricted-imports`, one zone per layer |

The layering zones are the valuable ones: `shared/` may not import a feature,
`features/game/` may not import another feature, and `features/render/` may not
import `bot`.

A `PostToolUse` hook lints each file as it is written, so a violation surfaces at
the edit instead of at the end of the turn.

### Finishing a phase

A phase ends with a release, and a phase is done when the code is *releasable* —
not when it works. Four gates run before the final commit: `npm run check`,
coverage (70% floor), mutation (breaks below 85%), and a review pass over the
phase's whole diff. The procedure lives in the `finish-phase` skill, and the
review pass has a subagent (`phase-reviewer`). The resulting numbers go in the
final commit message — a score is only useful if a later regression has something
to be compared against.

## Configuration

Secrets live in `.env` (gitignored) next to `.env.example`, which is the
shareable template and must list every key the app reads. Read them in one place
— `shared/env.ts` — and pass values down; no `process.env` in feature code.
