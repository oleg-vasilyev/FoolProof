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
  into closure scope. `src/main.ts`, `src/feature-installer.ts` and
  `features/live-game/bot/card-service.ts` are the reference shape. A function
  grown past a screenful is usually several functions that have not been named yet
  — and one that needs a comment to explain its sections is really asking to be
  split.
- **A file name has to survive being read on its own.** An editor tab shows the
  basename without its folder, and a name that only means something to whoever
  wrote it costs a reader an hour later. So `card-state.ts`, not `state.ts`;
  `callback-data-codec.ts`, not `callback.ts`; `html-escape.ts`, not `html.ts`;
  `idle-sweep.ts`, not `reaper.ts`. Repeating the folder is the cheap price of
  that: `repository/repository-contract.ts` reads worse in a path and better in a
  tab, and the tab wins. `index.ts` promises a re-export, so logic never goes in
  one.
- **The same thing is called the same thing in every feature.** A feature's user
  copy is `copy.en.ts`, its entry point is `<feature>-feature.ts`, a stub for
  third-party code is named after that code (`grammy-api.stub.ts`). Two files
  named `feature.ts` in two folders are two tabs a reader cannot tell apart.
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
  import { createLogger } from "#shared/logging/logger.ts";

  const log = createLogger("scope");
  log.info("...");   // debug | info | warn | error
  ```

  `LOG_LEVEL` (debug|info|warn|error, default `info`) sets the threshold. Raw
  `console.*` is for `scripts/` dev utilities and for `shared/logging/logger.ts` itself.

`strict: true` and **no `any`**. There is no build step: `tsconfig.json` mirrors
how Node actually runs the code. `erasableSyntaxOnly` and `verbatimModuleSyntax`
keep the source type-strippable (no enums, no namespaces, `import type` for
types), and `allowImportingTsExtensions` matches the explicit `.ts` import paths.

## Language in code

Everything is English — code, identifiers, commits, docs and every user-facing
string. `PLAN.md` says why; this is what it means when writing code.

All copy the bot emits lives in the owning feature's `copy.en.ts` and is referenced by
key. **No string literal that a user can read may appear anywhere else** — not in
the state machine, not in a handler, not in an `answerCallbackQuery` call. Keep
the table flat and keyed, and put anything with a count behind a function rather
than concatenating at the call site: that is the seam that makes a second locale
a small change — the `.en` in the filename is what names that seam.

Player names are user data, not copy. Matching normalises via Unicode NFC and
lower case, plus `ё` → `е`; the parser must not assume latin
(`features/live-game/domain/lineup-parsing.ts`).

## Architecture

**A feature is a folder you can delete.** That is the whole idea, and everything
below serves it: removing `features/scoresheet/` must leave the rest compiling and
passing, and adding a feature must not require editing another one. The cost is
paid in exactly one place — the composition root names the features, so it is the
only file that changes.

**A feature folder is named after what the player gets**, not after an internal
noun: `live-game/` is the game running right now on a card of buttons,
`scoresheet/` is the picture `/stats` sends back.

```
src/
  main.ts               names the features and wires them
  feature-installer.ts  registers whatever it was given
  features/
    live-game/          playing a game on a live card
    scoresheet/         the /stats picture
  shared/
    config/             reading .env, and where the project root is
    lifecycle/          draining the stops on a signal
    logging/            the scoped logger
    repository/         the connection, the contract, the SQL
    telegram/           Bot API context types, and the feature contract
    text/               HTML escaping
    timing/             the edit debouncer
```

**Everything in `shared/` lives in a folder named after its subject**, including
the ones holding a single module plus its spec. The alternative was a folder for
`repository/` and loose files for everything else, which reads as an accident
rather than a rule. The names are specific on purpose: a `platform/` or `infra/`
bucket would be the same vagueness the file names were just cured of.

Independence is a **lint rule, not an aspiration**: `live-game/` may not import
`scoresheet/` and the reverse, so a reach across features is a build error. Deleting
a feature was tested by deleting it — typecheck stayed clean and the only failures
were in `main.spec.ts`, which is the one spec that is *supposed* to know the
roster.

### Every import says where it comes from

**There are no relative imports in `src/`.** Every specifier is an alias, so the
line tells you which zone the code came from without counting `../`:

```ts
import type { Logger } from "#shared/logging/logger.ts";
import { copy } from "#live-game/copy.en.ts";
import { createPromptRegistry } from "#live-game/bot/prompt-registry.ts";
```

That last one is a **sibling** — `./prompt-registry.ts` would have worked. It is
written out anyway: the value of the rule is that every import reads the same way,
so a violation is visible in the line rather than in the folder you happen to be
looking at.

They are Node's own **subpath imports**, declared once in `package.json`:
`#app/*`, `#shared/*`, `#live-game/*`, `#scoresheet/*`. The `#` is not a style
choice — Node reserves that prefix for this feature, and it is the only aliasing
that survives *no build step*: `tsconfig` `paths` are invisible to
`node src/main.ts`, and `@`-prefixed aliases need a resolver hook. One declaration
then serves the compiler (`moduleResolution: nodenext` reads the same field), Node,
Vitest, and Stryker's sandbox.

The cost is that a new feature is named in two places instead of one — `main.ts`
and that `imports` map. Deleting a feature leaves a dead alias entry behind, which
is a line to remove, not a build to fix.

### Layers live inside a feature

Each feature has the same three, and imports point only **downward** — `bot` may
reach `render` and `domain`, `render` may reach `domain`, `domain` reaches nothing:

```
features/<name>/
  domain/   the pure core — no framework, no I/O, no rendering
  render/   state in, message text and SVG out; still pure
  bot/      the impure edge: grammY handlers, the debouncer, rasterizing
  copy.en.ts  every string this feature shows a user
```

There is no `integrations/` layer. It existed once and held no client: grammY is
the Telegram client and is imported directly.

Purity is enforced the same way as independence — `domain/` and `render/` may not
import `grammy`, `node:*` or the rasterizer at all. Specs and stubs sit beside
their subject, so a feature carries its own tests out of the door with it.

Two traps in the ESLint config, both called out where they live, and **both found
only by running deliberate violations**:

- Every zone sets `no-restricted-imports`, and a later flat-config block
  **replaces** an earlier one for a file matched by both. Purity and independence
  therefore have to be combined into one pattern list per zone with non-overlapping
  globs. Split across two blocks, the first silently stops applying.
- A ban is a glob, and minimatch reads a leading `#` as a **comment** — so
  `#live-game/**` matches nothing and the zone passes everything. Alias bans are
  therefore compiled to `regex` patterns instead.

Both failures are silent: a zone that never fires looks exactly like a zone with
nothing to report. So **a zone is not finished until a deliberate violation has
been shown to fail the lint** — this project has now shipped two that never fired.

### A feature registers itself, and cannot break the order

`PLAN.md` records that command handlers must be registered before any
`bot.on("message:text")` filter, because a text handler that returns without
calling `next()` swallows every command below it. With features installing
themselves that becomes a cross-feature hazard: a feature added after `live-game`
would lose its commands, silently.

So a feature does **not** get the `Bot`. It declares `commands`, and optionally a
`listen` that receives a narrow `Listeners` interface offering only `onText` and
`onTap` (`shared/telegram/feature-contract.ts`). `feature-installer.ts` registers every
feature's commands first, then the listeners. A feature physically cannot register a command late.
`/help` and the `/` menu are both generated from the same command list, so they
cannot drift from what is installed.

### The domain layer is a pure reducer

`features/live-game/domain/` holds `(state, action) => state` and nothing else. **No
database access, no grammY, no `Date.now()`, no I/O of any kind** — the clock and
the storage are passed in. Every transition in `PLAN.md` must be exercisable
without a Telegram token and without a database file. This is the rule that makes
the product testable at all; it is worth defending against convenience.

`CardState` carries no phase field: `phaseOf()` derives it. Everything about a
live card is rebuilt from `game_players` and `game_events` on every single tap,
which is what makes a restart mid-game a non-event. `PLAN.md` explains why the
`state` column still exists.

`render/` is the same shape one layer out: state in, message text and inline
keyboard out, pure. `live-game/render/callback-data-codec.ts` is the codec for
`callback_data`, encoded by the keyboard and decoded by `bot`. Escaping is infra
rather than a feature's business, so `shared/text/html-escape.ts` holds it — both
features need it.

**A drawing is a string; only `bot` may turn it into pixels.** `/stats` renders an
image, and the cut runs between the two: `scoresheet/render/` produces SVG text and
stays pure and unit-testable, while the native rasterizer lives alone in
`scoresheet/bot/rasterizer.ts`. `svg-tags.ts` is the analogue of `html-escape.ts`
— it is the only place a tag is assembled, so a name cannot reach the output
unescaped, and the only place a number is formatted. Geometry belongs in
`sheet-layout.ts`; nothing else computes a coordinate from scratch.

The rasterizer takes the fonts from `assets/fonts/` with system fonts switched
off, so a picture drawn here matches one drawn on the server. **A missing font
does not raise anything — resvg silently draws the image with no text on it.**
That is why the scoresheet feature calls `requireFonts()` as it is built, before
polling starts: the check has to be explicit because the failure never announces
itself. A feature that cannot work refuses at construction, not on first use.

Two Bot API facts that are easy to get backwards in code, both explained in
`PLAN.md`:

- **Escape user data reaching the message body, never button captions.** Telegram
  does not parse HTML in captions, so escaping there renders `&amp;` literally.
- **Register command handlers before any `bot.on("message:text")` filter.**
  Commands are text messages too, so a text handler that returns without calling
  `next()` silently swallows every command below it. `feature-installer.ts` is
  built so a feature cannot get this wrong — see above.

### Data access

Features never touch the database. They depend on the **repository contract**
(`shared/repository/repository-contract.ts`) and call named domain methods:

```ts
import { repository } from "#shared/repository/repository-instance.ts";

const card = repository.liveCardInChat(chatId);
```

- `shared/repository/sqlite-connection.ts` — connection and schema only. It owns the pragmas
  and the timestamp format that `PLAN.md` describes; nothing else may assume them.
- `shared/repository/sqlite-repository.ts` — the **only** file allowed to contain
  SQL or to import the connection.
- `shared/repository/column-values.ts` — `node:sqlite` hands back `unknown`, so
  every column goes through one coercion here (`num`, `nullableNum`, `text`,
  `nullableText`). Pure.
- `shared/repository/row-records.ts` — turns rows into the record shapes the
  contract promises, and nothing else. Pure.
- `shared/repository/repository-instance.ts` — binds the contract to the SQLite
  implementation. It is the one file a feature imports.

**Keep the coercions and the mappers out of the SQL file**, even though they are
about the database. A file that imports the connection can only be tested against
a real one, and a real SQLite never returns the wrong type for a column — so every
defensive branch inside it is unreachable from its own spec. Split out, the same
branches are ordinary unit tests. That is what took this layer's mutation score
from 90.48% to 98.51%: not one new SQL test, just moving the pure part somewhere a
unit could reach it.

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

**Everything a check writes goes under `reports/`** — `reports/coverage/`,
`reports/mutation/`, and Stryker's sandbox in `reports/.stryker-tmp/` via
`tempDirName`. One gitignored directory instead of three at the root, and nothing
about testing appears next to the source.

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
| No `console.*` outside `shared/logging/logger.ts` | `no-console` |
| Imports point only downward, features stay independent | `no-restricted-imports`, one zone per feature layer |
| An alias ban (`#live-game/**`) actually fires | the same rule, compiled to a `regex` pattern |

The zones are the valuable ones: `shared/` may not import a feature, one feature
may not import another, nothing below the root may import `#app/`, and inside a
feature `domain/` and `render/` may not import upward or reach a framework.
Because they all set one rule name, they are written as non-overlapping globs —
and **a new zone is not finished until a deliberate violation has been shown to
fail the lint.** One that never fires proves nothing, and this project has now
shipped two that never fired: see the two traps under
[Layers live inside a feature](#layers-live-inside-a-feature).

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
— `shared/config/env.ts` — and pass values down; no `process.env` in feature code.
