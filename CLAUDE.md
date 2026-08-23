# FoolProof — how the code here is written

This file is loaded before every session, so it holds only what has to be known
*before* the first edit. Anything needed for one specific job lives in a skill or
beside the code it describes:

| Doing this | Read |
|---|---|
| Adding a command, a screen, a feature folder | `add-a-feature` skill |
| Adding a query | `add-repository-method` skill |
| Writing or changing any spec | `write-a-spec` skill |
| Taking on a list of changes, and closing it | `finish-phase` skill |
| Judging how the work itself went | `retrospective` skill |
| Writing a commit message, cutting a release | `write-a-commit` skill |
| Writing or changing any document | `write-a-doc` skill |
| Writing or changing an e2e scenario | `write-an-e2e-scenario` skill |
| The phase drew something, or a picture may have gone stale | `refresh-the-pictures` skill |
| The Claude Design page fell behind the code | `update-the-design-page` skill |
| Changing the e2e harness itself | [`e2e/README.md`](e2e/README.md) |
| A mockup for anything the bot draws | `poster-designer` agent |
| A phase's whole diff, before its final commit | `phase-reviewer` agent |
| A frozen plan, before any code is written for it | `plan-reviewer` agent |
| Reading a drawing or a line as a player would | `poster-reader` agent |
| A copy table, read as finished sentences in both languages | `copy-reader` agent |
| A weekly look at the project and its server | `deep-checkup` agent |

Five documents, one job each:

- **`README.md`** — what the bot is and how to run it. For someone arriving at the
  repository.
- **`deploy/README.md`** — the operator's half: provisioning, the units, the deploy
  timer, the backup, and what to do when the bot is unwell. It sits beside the units
  it describes so it leaves with them.
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

That rule has needed enforcing twice, so it is enforced: `npm run docs:check` holds
every document against the repository it describes — links, tables, the schema, the
pictures, the flow drawing, and **a line budget on this file, on `TECH-DEBT.md` and
on every skill**. Each complaint carries its own reason, which is why none is
repeated here. The budget makes appending cost something: a rule that pushes a file
over displaces an older one into the file loaded when it applies. `write-a-doc`
routes a fact to its home.

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
- **A name says what is inside, not what the file is about.** The test is cold:
  shown only the basename, guess the exports. `evening.ts` was specific and still
  failed it; `session-appearances.ts` predicts the `Appearance` type and the
  per-player helpers actually in it. A topic passes the rule above and fails this
  one, so both have to be asked.
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
- **No `console.*` for app logging** — take one from
  `createLogger("scope")` in `#shared/logging/logger.ts`. `LOG_LEVEL`
  (debug|info|warn|error, default `info`) sets the threshold; raw `console.*` is for
  `scripts/` and for the logger itself.

`strict: true` and **no `any`**. There is no build step: `tsconfig.json` mirrors how
Node actually runs the code. `erasableSyntaxOnly` and `verbatimModuleSyntax` keep
the source type-strippable (no enums, no namespaces, `import type` for types), and
`allowImportingTsExtensions` matches the explicit `.ts` import paths.

## Everything a user can read lives in a copy table

Code, identifiers, commits and docs are English. What the bot *says* is whichever
language the chat picked, so every feature carries `copy.en.ts`, `copy.ru.ts` and a
`copy.ts` whose `copyIn(locale)` switches between them. `copy.en.ts` declares the
shape (`export type Copy = typeof copy`) and every other table is annotated with it,
so a key missing from one language is a compile error.

**No string literal a user can read may appear anywhere else** — not in the state
machine, not in a handler, not in an `answerCallbackQuery` call, and not as the
separator a `render/` file joins two of them with. Keep the table flat.

**Copy is a parameter, never an import.** A `render/` or `bot/` function that speaks
takes `copy: Copy` first; only an entry point and its handlers resolve one, from the
chat's language. A module-level `import { copy }` pins the bot to one language.

**A copy function interpolates; it never decides.** Choosing between `1 game` and
`2 партии` is a `render/` job — the table holds `{ one, few, many }` and
`shared/locale/plural-rules.ts` picks by the table's own `locale`. Specs leave copy
tables real on purpose, so a decision made inside one is compared against itself and
no test can catch it breaking; `write-a-spec` has the mutants that proved it, and
`docs:check` now fails the shape on sight.

Player names are user data, not copy. Matching normalises via Unicode NFC and lower
case, plus `ё` → `е`, and the parser must not assume latin
(`features/live-game/domain/lineup-parsing.ts`).

## Architecture

**A feature is a folder you can delete.** Removing `features/scoresheet/` must leave
the rest compiling and passing, and adding a feature must not require editing
another one. Deleting one was tested by deleting it, twice: the only failures are in
`main.ts` and `main.spec.ts`, the composition root and the one spec *supposed* to
know the roster. **Nothing in `scripts/` may name a feature** — the tooling asks
what features offer through `shared/drawings/drawings-contract.ts` and finds them at
run time, so a deleted folder simply stops being listed, and `docs:check` reports
the pictures it left behind instead of failing to compile. The procedure for adding
one is the `add-a-feature` skill.

**The commands a feature declares are the list of its sub-features.** `scoresheet`
declares `/stats`, `/stats_chronology` and `/stats_awards`, so it gives the player
two pictures; `live-game` declares four commands that between them open a card and
change the table. When a layer holds files serving more than one of those things,
each gets a subfolder **named after that thing** — a picture, a screen, an entity
the commands are about: `render/chronology/`, `render/seating-screen/`,
`bot/lineup/`. Only what all of them use stays at the layer root. Never a bucket
(`helpers/`, `common/`) and never a **process**; a single-command feature never
subdivides. The `add-a-feature` skill has both traps and why `docs:check` fails a
layer root above nine files.

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
    language/           the /language screen a chat picks its language on
  shared/
    config/             reading the environment, and where the project root is
    drawing/            turning one SVG string into pixels
    drawings/           what a feature offers to be drawn, and by which tool
    fonts/              the faces the posters are drawn in, and the refusal
    lifecycle/          draining the stops, restarting after a crash
    locale/             the language table, the plural rules, the chat's choice
    logging/            the scoped logger
    repository/         the connection, the contract, the SQL
    table/              how many may sit down, and how long a name may be
    telegram/           context types, the feature contract, api retries and
                        what they cost, the client options pointing a run elsewhere
    text/               HTML escaping
    timing/             the edit debouncer, the slowest render this run drew
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
  <name>-feature.ts   the entry point: builds the parts and declares the commands
  <name>-drawings.ts  what the tools may draw of it, and the tools it offers them
  copy.en.ts          every string this feature shows a user
  domain/             the pure core — no framework, no I/O, no rendering
  render/             state in, message text and SVG out; still pure
  samples/            the states it is worth drawing at, built for a human to judge
  bot/                the impure edge: grammY handlers, the debouncer, rasterizing
```

`samples/` holds the sample evening and every edge the gallery draws. A sample is a
**state**, not a picture, so it sits beside `render/` under the same fence and never
rasterizes, reads a file or talks to Telegram. It is not scaffolding and gets no
exemption: it carries specs, and `write-a-spec` says what they must assert.

The entry point sits at the feature root, not inside a layer: it is the feature's
composition root, the same job `src/main.ts` does one level up. There is no
`integrations/` layer — grammY is the Telegram client and is imported directly.

Purity and independence are **lint rules, not aspirations**: `domain/`, `render/`
and `samples/` may not import `grammy`, `node:*` or the rasterizer, one feature may
not import another, and `scripts/` may name none of them. Specs and stubs sit beside
their subject, so a feature carries its own tests out of the door with it.

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
keyboard out, pure. **A drawing is a string; only the edge may turn it into pixels**
— `scoresheet/render/` produces SVG text and the native rasterizer lives alone in
`shared/drawing/rasterize.ts`, beside the fonts it draws with, because the bot and
the website's build both need it and neither may reach into the other's feature.
`shared/text/html-escape.ts` and
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
`uncaughtException`, not `unhandledRejection`. Both log and exit non-zero; neither
carries on, because the state is unknown by definition.

## Tests

The `write-a-spec` skill has everything about writing one. Two facts shape the
source tree, so they are here:

- Specs sit next to the code as `*.spec.ts`, and **so do the stubs**. A stub for
  something we did not write (grammY's `Api`, a `Context`) sits next to its only
  consumer instead.
- **Everything mockable has a stub, and specs use it instead of a hand-written
  fake** — everything in `shared/`, and every feature entry point. The skill has
  the two silent failures that made it a rule.

`e2e/` is a different world with its own rules — the `write-an-e2e-scenario` skill
and [`e2e/README.md`](e2e/README.md) — and it is a gate, not an experiment. One
obligation reaches back here: **a keyboard whose buttons carry `callback_data` gets
scenarios**, because whether a tap reaches the feature owning it is a fact about
real grammY. A URL button routes nothing back.

## Checks

`README.md` lists what each npm script runs, and the rules that list obeys live in
the `write-a-doc` skill, which is where a script is added from.

### What enforces what

A rule that can be checked mechanically is a lint rule, not a paragraph — prose is
for judgement. `eslint.config.js` holds the checkable ones, including four with no
core equivalent defined inline there:

| Rule | Enforced by |
|---|---|
| No comments in `src/` and `scripts/` | `project/no-comments` |
| An import belongs in the header, not further down | `project/imports-first` |
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

**Any list of changes to this repository is a phase**, feature or not — closing
findings, refactoring, tooling. A phase is done when the code is *releasable*, not
when it works, and what that costs is the **`finish-phase` skill**'s gates, with
their numbers in the commit message. Three of them — the diff reviewed, the copy
read as finished sentences, the gallery looked at — may not be done by whoever wrote
the diff, which is why each is a named agent above. **A tag is cut only when a
player or the operator gets something new**; everything else rides the next one.
**Say how big the phase is before starting it**, in a line, so it can be argued
down. The list somebody hands you never contains the gates.

## Configuration

**One npm script starts the real bot, and the server's unit calls that script** —
so `start:prod` is production rather than a description of it, and the two cannot
drift. It is also the only script that loads an env file: the server's, the only
one that exists. `.env.example` is its template and must list every key the app
reads. Read the environment in one place, `shared/config/env.ts`, and pass values
down — no `process.env` in feature code. Two rules follow from one loaded file:

- **It is the whole configuration for its run.** No fallback to another. Node loads
  it and we do not parse it; a hand-rolled reader once inherited a missing key from
  a second file instead of reporting it.
- **A key left empty counts as missing.** `requireEnv` refuses it, `optionalEnv`
  falls back; `.env.example` has the outage that made it a rule.

What a run costs whoever operates it is in
[deploy/README.md](deploy/README.md#running-it-on-a-server).
