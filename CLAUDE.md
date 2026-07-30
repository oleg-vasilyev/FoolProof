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
  into closure scope. `src/main.ts`, `src/router.ts` and
  `features/card/bot/cards.ts` are the reference shape. A function grown past a
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

`strict: true` and **no `any`**. There is no build step: `tsconfig.json` mirrors
how Node actually runs the code. `erasableSyntaxOnly` and `verbatimModuleSyntax`
keep the source type-strippable (no enums, no namespaces, `import type` for
types), and `allowImportingTsExtensions` matches the explicit `.ts` import paths.

## Language in code

Everything is English — code, identifiers, commits, docs and every user-facing
string. `PLAN.md` says why; this is what it means when writing code.

All copy the bot emits lives in the owning feature's `strings.ts` and is referenced by
key. **No string literal that a user can read may appear anywhere else** — not in
the state machine, not in a handler, not in an `answerCallbackQuery` call. Keep
the table flat and keyed, and put anything with a count behind a function rather
than concatenating at the call site: that is the seam that makes a second locale
a small change.

Player names are user data, not copy. Matching normalises via Unicode NFC and
lower case, plus `ё` → `е`; the parser must not assume latin
(`features/card/domain/lineup.ts`).

## Architecture

**A feature is a folder you can delete.** That is the whole idea, and everything
below serves it: removing `features/session/` must leave the rest compiling and
passing, and adding a feature must not require editing another one. The cost is
paid in exactly one place — the composition root names the features, so it is the
only file that changes.

```
src/
  main.ts        names the features and wires them
  router.ts      registers whatever it was given
  features/
    card/        playing a game on a live card
    session/     the /stats scoresheet
  shared/        infra: env, logger, debounce, html, db, repository, telegram
```

Independence is a **lint rule, not an aspiration**: `card/` may not import
`session/` and the reverse, so a reach across features is a build error. Deleting
a feature was tested by deleting it — typecheck stayed clean and the only failures
were in `main.spec.ts`, which is the one spec that is *supposed* to know the
roster.

### Layers live inside a feature

Each feature has the same three, and imports point only **downward** — `bot` may
reach `render` and `domain`, `render` may reach `domain`, `domain` reaches nothing:

```
features/<name>/
  domain/   the pure core — no framework, no I/O, no rendering
  render/   state in, message text and SVG out; still pure
  bot/      the impure edge: grammY handlers, the debouncer, rasterizing
  strings.ts  the feature's own copy
```

There is no `integrations/` layer. It existed once and held no client: grammY is
the Telegram client and is imported directly.

Purity is enforced the same way as independence — `domain/` and `render/` may not
import `grammy`, `node:*` or the rasterizer at all. Specs and stubs sit beside
their subject, so a feature carries its own tests out of the door with it.

One trap in the ESLint config, called out where it lives: every zone sets
`no-restricted-imports`, and a later flat-config block **replaces** an earlier one
for a file matched by both. Purity and independence therefore have to be combined
into one pattern list per zone with non-overlapping globs. Split across two blocks,
the first silently stops applying — which is exactly what happened, and is why the
zones are proved with deliberate violations rather than assumed to work.

### A feature registers itself, and cannot break the order

`PLAN.md` records that command handlers must be registered before any
`bot.on("message:text")` filter, because a text handler that returns without
calling `next()` swallows every command below it. With features installing
themselves that becomes a cross-feature hazard: a feature added after `card` would
lose its commands, silently.

So a feature does **not** get the `Bot`. It declares `commands`, and optionally a
`listen` that receives a narrow `Listeners` interface offering only `onText` and
`onTap` (`shared/feature.ts`). The router registers every feature's commands
first, then the listeners. A feature physically cannot register a command late.
`/help` and the `/` menu are both generated from the same command list, so they
cannot drift from what is installed.

### The domain layer is a pure reducer

`features/card/domain/` holds `(state, action) => state` and nothing else. **No
database access, no grammY, no `Date.now()`, no I/O of any kind** — the clock and
the storage are passed in. Every transition in `PLAN.md` must be exercisable
without a Telegram token and without a database file. This is the rule that makes
the product testable at all; it is worth defending against convenience.

`CardState` carries no phase field: `phaseOf()` derives it. Everything about a
live card is rebuilt from `game_players` and `game_events` on every single tap,
which is what makes a restart mid-game a non-event. `PLAN.md` explains why the
`state` column still exists.

`render/` is the same shape one layer out: state in, message text and inline
keyboard out, pure. `card/render/callback.ts` is the codec for `callback_data`,
encoded by the keyboard and decoded by `bot`. Escaping is infra rather than a
feature's business, so `shared/html.ts` holds it — both features need it.

**A drawing is a string; only `bot` may turn it into pixels.** `/stats` renders an
image, and the cut runs between the two: `session/render/` produces SVG text and
stays pure and unit-testable, while the native rasterizer lives alone in
`session/bot/image.ts`. `svg.ts` is the analogue of `html.ts` — it is the only
place a tag is assembled, so a name cannot reach the output unescaped, and the
only place a number is formatted. Geometry belongs in `layout.ts`; nothing else
computes a coordinate from scratch.

The rasterizer takes the fonts from `assets/fonts/` with system fonts switched
off, so a picture drawn here matches one drawn on the server. **A missing font
does not raise anything — resvg silently draws the image with no text on it.**
That is why the session feature calls `requireFonts()` as it is built, before
polling starts: the check has to be explicit because the failure never announces
itself. A feature that cannot work refuses at construction, not on first use.

Two Bot API facts that are easy to get backwards in code, both explained in
`PLAN.md`:

- **Escape user data reaching the message body, never button captions.** Telegram
  does not parse HTML in captions, so escaping there renders `&amp;` literally.
- **Register command handlers before any `bot.on("message:text")` filter.**
  Commands are text messages too, so a text handler that returns without calling
  `next()` silently swallows every command below it. `router.ts` is built so a
  feature cannot get this wrong — see above.

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

Two facts about where things live, because they shape the source tree:

- Specs sit next to the code as `*.spec.ts`, and **so do the stubs** —
  `*.stub.ts` lives beside the thing it stands in for, never in a central testing
  folder. A stub for something we did not write (grammY's `Api`, a `Context`) sits
  next to its only consumer instead. Stub imports point downward like every other
  import.
- **A spec tests one file, and everything that file imports is mocked.** Third-
  party code is never exercised in a unit — that is the one rule with no
  exceptions. An integration spec is written only when the seam between systems is
  itself under test, and is named `*.integration.spec.ts` so it cannot be mistaken
  for the default. There are two; the bar for a third is a bug that got through
  the units.

Everything else about testing — what to mock, how to shape a stub, how to name
and structure cases, the traps in the two integration specs, and how to judge a
spec you did not write — lives in the **`write-a-spec` skill**. Load it before
writing or changing any spec.

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
| Imports point only downward, features stay independent | `no-restricted-imports`, one zone per feature layer |

The zones are the valuable ones: `shared/` may not import a feature, one feature
may not import another, and inside a feature `domain/` and `render/` may not
import upward or reach a framework. Because they all set one rule name, they are
written as non-overlapping globs — and **a new zone is not finished until a
deliberate violation has been shown to fail the lint.** One that never fires
proves nothing, and this project has shipped one that never fired.

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
