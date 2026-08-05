# FoolProof — how the code here is written

This file is loaded before every session, so it holds only what has to be known
*before* the first edit. Anything needed for one specific job lives in a skill or
beside the code it describes:

| Doing this | Read |
|---|---|
| Adding a command, a screen, a feature folder | `add-a-feature` skill |
| Adding a query | `add-repository-method` skill |
| Writing or changing any spec | `write-a-spec` skill |
| Closing a phase, running the gates | `finish-phase` skill |
| Writing or changing any document | `write-a-doc` skill |
| Writing or changing an e2e scenario | `write-an-e2e-scenario` skill |
| Changing the e2e harness itself | [`e2e/README.md`](e2e/README.md) |

Four documents, one job each:

- **`README.md`** — what the bot is and how to run it. For someone arriving at the
  repository.
- **`PLAN.md`** — what the bot does and why: state machine, data model, invariants,
  edge cases, and the design dead ends already paid for.
- **`CLAUDE.md`** — this file. Style, layering, testing, gates.
- **`TECH-DEBT.md`** — what is deliberately unfinished, each entry with the trigger
  that would make it worth doing. It is a to-do list, so an entry is deleted when
  done rather than ticked.

The dividing question is *would this still be true if the bot were rewritten in
Python?* If yes it belongs in `PLAN.md` — the Bot API's limits, the state machine,
the schema. If no, it belongs here. **A fact lives where its reason lives; the other
file gets a pointer, never a retelling.** When the two disagree, `PLAN.md` wins on
behaviour and this file wins on style.

That rule has needed enforcing twice, so it is now enforced: `npm run docs:check`
(part of `npm run check`) resolves every cross-document link and anchor, checks this
tree against the real folders, checks `README.md`'s script table against
`package.json`, and holds **this file to a line budget**. The budget is what makes
appending cost something — when a new rule pushes it over, move an old paragraph
into the skill it belongs to instead of raising the number. The `write-a-doc` skill
routes a fact to its file.

## Code style

Anything a machine can check is a lint rule, not a paragraph — see
[What enforces what](#what-enforces-what). What is left needs judgement:

- **A file must read as a skeleton, not an implementation.** Opening it shows the
  idea before any detail: the exported factory is a table of contents that names
  the steps and delegates, and the steps are module-level functions taking an
  explicit context object instead of reaching into closure scope. `src/main.ts`,
  `src/feature-installer.ts` and `features/live-game/bot/card/card-service.ts` are the
  reference shape. A function that needs a comment to explain its sections is
  asking to be split.
- **A file name has to survive being read on its own.** An editor tab shows the
  basename without its folder, so `card-state.ts`, not `state.ts`;
  `callback-data-codec.ts`, not `callback.ts`. Repeating the folder is the cheap
  price of that — `repository/repository-contract.ts` reads worse in a path and
  better in a tab, and the tab wins. `index.ts` promises a re-export, so logic
  never goes in one.
- **A name says what is inside, not what the file is about.** `evening.ts` was
  specific and still told a reader nothing; it became `session-appearances.ts`,
  which predicts the `Appearance` type and the per-player helpers actually in it.
  The test is cold: shown only the basename, guess the exports. A topic passes the
  first rule and fails this one, so both have to be asked.
- **The same thing is called the same thing in every feature.** User copy is
  `copy.en.ts`, the entry point is `<feature>-feature.ts`, a stub for third-party
  code is named after that code (`grammy-api.stub.ts`). Two files named
  `feature.ts` in two folders are two tabs a reader cannot tell apart.
- **Dispatch on a union with `switch`, never a chain of `if`.** Actions, phases and
  transition outcomes are closed unions: a `switch` makes the compiler check
  exhaustiveness, so adding a case becomes a compile error everywhere obliged to
  handle it. Keep `if` for guards and priority chains.
- **Prefer a discriminated union over a nullable plus a separate reason.** A lookup
  that can fail returns `{ ok: true, … } | { ok: false, notice }`, so the narrowing
  survives the call and the caller reads as one early return.
- **Keep functions pure where you can** — a function works off its arguments, not
  module-level state, and never mutates them; return a new value. Wiring belongs in
  a composition root, not inside the logic.
- **Separate semantically distinct blocks** with a single blank line so they do not
  visually merge.
- **No comments in `src/` and `scripts/`** — naming carries the intent. A magic
  number still gets a named `const`, but the intent has to fit in the name
  (`ABANDON_AFTER_MS`, `EDIT_DEBOUNCE_MS`); if it genuinely cannot, the explanation
  belongs in `PLAN.md`. Config files (`tsconfig.json`, `eslint.config.js`) are
  exempt — a non-obvious compiler flag has nowhere else to live.
- **No `console.*` for app logging** — use the scoped logger. `LOG_LEVEL`
  (debug|info|warn|error, default `info`) sets the threshold; raw `console.*` is for
  `scripts/` and for the logger itself.

  ```ts
  import { createLogger } from "#shared/logging/logger.ts";

  const log = createLogger("scope");
  log.info("...");
  ```

`strict: true` and **no `any`**. There is no build step: `tsconfig.json` mirrors how
Node actually runs the code. `erasableSyntaxOnly` and `verbatimModuleSyntax` keep
the source type-strippable (no enums, no namespaces, `import type` for types), and
`allowImportingTsExtensions` matches the explicit `.ts` import paths.

## Everything a user can read lives in `copy.en.ts`

Everything is English — code, identifiers, commits, docs and every user-facing
string. `PLAN.md` says why.

All copy the bot emits lives in the owning feature's `copy.en.ts`, referenced by
key. **No string literal a user can read may appear anywhere else** — not in the
state machine, not in a handler, not in an `answerCallbackQuery` call, and not as
the separator a `render/` file joins two of them with. Keep the
table flat, and put anything with a count behind a function rather than
concatenating at the call site: that seam is what makes a second locale a small
change, and the `.en` in the filename names it.

**A copy function interpolates; it never decides.** Choosing between `1 game` and
`2 games` is a `render/` job (`merge-names/render/game-tally.ts`) and the copy
function takes the finished fragment. The reason is mechanical: specs leave the copy
table real on purpose, so a decision made inside it is compared against itself and
no test can catch it breaking — the `write-a-spec` skill has the five mutants that
proved it.

Player names are user data, not copy. Matching normalises via Unicode NFC and lower
case, plus `ё` → `е`, and the parser must not assume latin
(`features/live-game/domain/lineup-parsing.ts`).

## Architecture

**A feature is a folder you can delete.** Removing `features/scoresheet/` must leave
the rest compiling and passing, and adding a feature must not require editing
another one. Deleting one was tested by deleting it: the only failures were in
`main.spec.ts`, which is the one spec *supposed* to know the roster. The procedure
for adding one is the `add-a-feature` skill.

**The commands a feature declares are the list of its sub-features.** `scoresheet`
declares `/stats`, `/stats_chronology` and `/stats_awards`, so it gives the player
two pictures; `live-game` declares four commands that between them open a card and
change the table. When a layer holds files serving more than one of those things,
each gets a subfolder **named after that thing** — a picture, a screen, an entity
the commands are about: `render/chronology/`, `render/seating-screen/`,
`bot/lineup/`. Only what all of them use stays at the layer root. Two ways to get
this wrong, both paid for here: a bucket (`helpers/`, `common/`, `shared/` inside a
feature) is the vagueness the file names were cured of, and a **process** name is
worse than it looks — `bot/opening/` reads fine to whoever just split the folder
and tells everybody else nothing, because opening is not something the player ends
up holding. A single-command feature never subdivides.

`docs:check` fails a layer root above nine files, which is unambiguous crowding
rather than a real limit — the fix is always a named subfolder, never a bigger
number. It is a late alarm on purpose: a count of seven fired on a folder that
turned out to need no split, so the question is the rule and the count only makes
somebody ask it.

**A feature folder is named after what the player gets**, not after an internal
noun. `diagnostics/` is the exception that proves the rule — its reader is whoever
runs the bot, and what they get is a diagnosis.

```
src/
  supervisor.ts         starts main.ts again when it dies
  main.ts               names the features and wires them
  feature-installer.ts  registers whatever it was given
  features/
    live-game/          playing a game on a live card
    merge-names/        the /merge screen that makes two names one player
    scoresheet/         the /stats picture
    diagnostics/        the /status report about the bot itself
  shared/
    config/             reading .env, and where the project root is
    lifecycle/          draining the stops, restarting after a crash
    logging/            the scoped logger
    repository/         the connection, the contract, the SQL
    telegram/           context types, the feature contract, api retries,
                        the client options that let a run be pointed elsewhere
    text/               HTML escaping
    timing/             the edit debouncer
```

**Everything in `shared/` lives in a folder named after its subject**, including the
ones holding a single module plus its spec. A `platform/` or `infra/` bucket would
be the same vagueness the file names were just cured of.

**There are no relative imports in `src/`** — every specifier is a `#` alias, even
for a sibling, so every import line reads the same way and a violation is visible
in the line rather than in the folder you happen to be looking at. They are Node's
own subpath imports, declared in `package.json`: the only aliasing that survives
having no build step.

### Layers live inside a feature

Each feature has the same three, and imports point only **downward** — `bot` may
reach `render` and `domain`, `render` may reach `domain`, `domain` reaches nothing:

```
features/<name>/
  <name>-feature.ts  the entry point: builds the parts and declares the commands
  copy.en.ts         every string this feature shows a user
  domain/            the pure core — no framework, no I/O, no rendering
  render/            state in, message text and SVG out; still pure
  bot/               the impure edge: grammY handlers, the debouncer, rasterizing
```

The entry point sits at the feature root, not inside a layer: it is the feature's
composition root, the same job `src/main.ts` does one level up. There is no
`integrations/` layer — grammY is the Telegram client and is imported directly.

Purity and independence are **lint rules, not aspirations**: `domain/` and `render/`
may not import `grammy`, `node:*` or the rasterizer, and one feature may not import
another. Specs and stubs sit beside their subject, so a feature carries its own
tests out of the door with it.

### The domain layer is a pure reducer

`domain/` holds `(state, action) => state` and nothing else. **No database access,
no grammY, no `Date.now()`, no I/O of any kind** — the clock and the storage are
passed in. Every transition in `PLAN.md` must be exercisable without a Telegram
token and without a database file. This is the rule that makes the product testable
at all; it is worth defending against convenience.

Derive rather than store: `CardState` carries no phase field, `phaseOf()` computes
it, and everything about a live card is rebuilt from `game_players` and
`game_events` on every tap — which is what makes a restart mid-game a non-event.
The `/merge` screen goes further and keeps its selection in `callback_data`, so it
has no state to go stale at all.

`render/` is the same shape one layer out: state in, message text and inline
keyboard out, pure. **A drawing is a string; only `bot` may turn it into pixels** —
`scoresheet/render/` produces SVG text and the native rasterizer lives alone in
`scoresheet/bot/rasterizer.ts`. `shared/text/html-escape.ts` and
`scoresheet/render/svg-tags.ts` are each the only place their kind of markup is
assembled, so a name cannot reach the output unescaped. Geometry belongs in
`chronology-layout.ts` and `card-metrics.ts`; nothing else computes a coordinate.

One Bot API fact that is easy to get backwards, and `PLAN.md` explains why:
**escape user data reaching the message body, never button captions** — Telegram
does not parse HTML in captions, so escaping there renders `&amp;` literally.

**A feature that cannot work refuses at construction, not on first use.** The
scoresheet calls `requireFonts()` as it is built, because a missing font makes resvg
draw the picture with no text on it rather than fail.

### Two things live in one place on purpose

- **Retrying.** `shared/telegram/api-retry.ts` is installed once with
  `bot.api.config.use()`, so **no feature ever writes a retry**. A transformer sees
  every outgoing call, which nothing at a call site can. The decision of what to do
  with a failure is the pure `planFor()`; which calls may be retried is a `PLAN.md`
  question. Note the two shapes are not interchangeable: a network error **throws**,
  a refusal from Telegram **resolves** as `{ ok: false, error_code }`.
- **Data access.** Features never touch the database; they depend on
  `shared/repository/repository-contract.ts` and call named domain methods.
  `sqlite-repository.ts` is the only file allowed to contain SQL or import the
  connection; the coercions (`column-values.ts`) and the row mappers
  (`row-records.ts`) stay out of it, because a file that imports the connection can
  only be tested against a real SQLite — and that split is what took the layer's
  mutation score from 90.48% to 98.51%. Adding a query has a procedure: the
  `add-repository-method` skill.

```ts
import { repository } from "#shared/repository/repository-instance.ts";

const card = repository.liveCardInChat(chatId);
```

### The lifecycle is split three ways so it can be tested

`supervisor.ts` resolves a path and hands it to
`shared/lifecycle/child-supervisor.ts`; whether to restart is a pure function in
`restart-policy.ts`. That is what makes a restart loop testable at all — the policy
is exercised as arithmetic, the supervisor against a fake child process. What the
restarts do is `PLAN.md`'s [What survives a
failure](PLAN.md#what-survives-a-failure).

`shared/lifecycle/crash-exit.ts` installs **both** handlers on purpose: `main.ts`
ends in a top-level `await bot.start()`, so a rejection there arrives as
`uncaughtException`, not `unhandledRejection`, and a handler for only the latter
prints a bare stack with no scope. Both log through the scoped logger and exit
non-zero, and neither tries to carry on — the state is unknown by definition.

## Tests

The `write-a-spec` skill has everything about writing one. Four facts shape the
source tree, so they are here:

- Specs sit next to the code as `*.spec.ts`, and **so do the stubs**. A stub for
  something we did not write (grammY's `Api`, a `Context`) sits next to its only
  consumer instead.
- **Everything mockable has a stub, and specs use it instead of a hand-written
  fake** — everything in `shared/`, and every feature entry point. A stub exposes a
  `module` field typed `typeof import("…")`, so `vi.mock("#…", () => stub.module)`
  is the whole call site. This is not tidiness: a `vi.mock` factory is **untyped**,
  so an inline fake drifts from the real module in silence.
- **A fake never contains logic.** If it needs an `if`, a lookup or a loop to
  satisfy its caller, it has become a second implementation and the test passes
  because the fake works.
- **A spec tests one file, and everything that file imports is mocked.** Third-party
  code is never exercised in a unit — the one rule with no exceptions. An
  integration spec is written only when the seam between systems is itself under
  test, and is named `*.integration.spec.ts`. There are two; the bar for a third is
  a bug that got through the units.

`e2e/` is a different world with its own rules: writing one is the
`write-an-e2e-scenario` skill and the harness is [`e2e/README.md`](e2e/README.md).
It is **a gate now, not a parked experiment** — `npm run e2e:changed` plays the
scenarios the diff can reach. One obligation reaches back here: **a feature with an
inline keyboard gets scenarios**, because whether a tap reaches the feature that
owns it is a fact about real grammY.

## Checks

`README.md` lists what each npm script runs. Two rules about that list: **never put
comment keys (`"// ...": "..."`) in `package.json`** — the script name has to say
what it does — and **keep it short**, because it is the first thing a new reader
sees. Anything occasional goes behind one `scripts/tools.ts` that lists itself when
run with no argument.

**Everything a check writes goes under `reports/`** — coverage, mutation, and
Stryker's sandbox via `tempDirName`. One gitignored directory, and nothing about
testing appears next to the source.

### What enforces what

A rule that can be checked mechanically is a lint rule, not a paragraph — prose is
for judgement. `eslint.config.js` holds the checkable ones, including three with no
core equivalent defined inline there:

| Rule | Enforced by |
|---|---|
| No comments in `src/` and `scripts/` | `project/no-comments` |
| Two blank lines after the last import | `project/blank-lines-after-imports` (autofixed) |
| A number must be named by a `const` | `project/named-numbers` |
| A state is read from its own table, specs included | `project/named-states` |
| Braces on every `if`, `const` over `let` | `curly`, `prefer-const`, `no-var` |
| No `console.*` outside the logger (and `scripts/`) | `no-console` |
| Imports point only downward, features stay independent | `no-restricted-imports`, one zone per feature layer |
| An alias ban (`#live-game/**`) actually fires | the same rule, compiled to a `regex` pattern |

The zones are the valuable ones, and **a zone is not finished until a deliberate
violation has been shown to fail the lint**: one that never fires looks exactly like
one with nothing to report, and this project has shipped two that never fired. The
`add-a-feature` skill has both traps and how to prove a new zone.

A `PostToolUse` hook lints each file as it is written, so a violation surfaces at
the edit instead of at the end of the turn.

### Finishing a phase

A phase is done when the code is *releasable*, not when it works. Six gates run
before the final commit — `npm run check`, coverage (70% floor), mutation (breaks
below 85%), `npm run e2e:changed`, a review pass over the whole diff, and a
retrospective on how the phase was carried out — and the numbers go in the commit
message. The procedure is the **`finish-phase` skill**; the review pass has a
`phase-reviewer` subagent.

**Say how big the phase is before starting it**, in a line, so it can be argued
down: a phase inside one feature folder that adds no repository method and changes
no `shared/` type does not owe a `PLAN.md` section or a `TECH-DEBT.md` entry.

## Configuration

Secrets live in `.env` and `.env.production`, both gitignored, next to
`.env.example` — the shareable template, which must list every key the app reads.
Read them in one place, `shared/config/env.ts`, and pass values down: no
`process.env` in feature code.

**Node loads the file, we do not parse it.** `--env-file` on the start scripts means
`loadEnv()` is a copy of `process.env` and nothing else. The hand-rolled reader that
used to live here made `.env` readable during a production run, so a key missing
from `.env.production` was inherited instead of missing. Two consequences to keep:

- **One file is the whole configuration for its run.** No fallback between them.
- **The unsafe target needs an explicit command.** `DB_PATH` defaults to the dev
  database, so forgetting a variable cannot reach production, and `--env-file` (not
  `--env-file-if-exists`) makes the production command refuse to start without its
  file.

`loadEnv(source = process.env)` takes its source as an argument. That is not
configurability — it is the only way to exercise the `undefined` branch its type
demands, since `process.env` never holds one. What each environment means for
whoever runs the bot is in [README.md](README.md#two-environments-two-databases).
