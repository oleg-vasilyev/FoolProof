# Writing an integration spec

> Opened by [writing a spec](SKILL.md) only when the seam between two systems is itself the thing under test, which exactly two shapes are and nothing else is. Read rarely and on purpose: the body names every such spec this repository has and what each of them is for.

**An integration spec covers a seam the unit rule puts out of reach.** Not "several
parts that mock badly" — two specific shapes, and if a candidate is neither, it is a
unit that has not been written properly:

1. **A contract with code we did not write.** "Never exercise third-party code in a
   unit" is absolute, so every belief about grammY, `node:sqlite`, resvg and
   `node:child_process` is otherwise asserted by *our own fake*. The rule creates
   this work; it does not excuse us from it.
2. **A chain of our own modules whose every joint is mocked.** Types catch the shape
   of what crosses a joint and say nothing about the meaning of a number — which
   `position`, which `round`, counted from what. The longer the chain of pure
   modules, the less any pairwise unit knows.

What does not earn one: mocking was inconvenient, or a scenario already plays it.

Name it `*.integration.spec.ts`, so nobody mistakes it for the default, and put
it beside the code like every other spec. `npm run test:unit` and
`npm run test:integration` run them separately; `npm test` runs both.

Seven exist. Three cover the contracts:

- **`src/feature-installer.integration.spec.ts`** drives a real grammY `Bot`
  through `bot.handleUpdate()`, intercepting the network at
  `bot.api.config.use()`. Pass `botInfo` so no `getMe` call is needed. **Flush the
  card service in `afterEach`** — the real debouncer schedules a real 350 ms
  timer, and a timer that outlives its test fires into the next test's
  assertions, which this spec has already been caught doing.
- **`shared/repository/sqlite-repository.integration.spec.ts`** runs against a real
  temporary SQLite file. The SQL is the unit under test and a mocked database
  would assert nothing. Set `process.env.DB_PATH` before importing, because
  `sqlite-connection.ts` opens the connection at module load — and close the connection before
  deleting the file, or Windows refuses and the temp files pile up.
- **`shared/telegram/api-retry.integration.spec.ts`** installs the real transformer
  over a fake wire on a real `Bot`. Order matters and reads backwards: the **last**
  transformer installed is the outermost, so the wire goes on first. It pins the
  asymmetry no unit can check — a network fault **throws**, a refusal **resolves**
  as `{ ok: false }`, and a refusal that survives the retries reaches the call site
  as a thrown `GrammyError`.

Two cover the seams the harness cannot reach, because a scenario cannot make the
outside world misbehave:

- **`shared/lifecycle/child-supervisor.integration.spec.ts`** supervises a real
  child: a `.cjs` fixture written to a temp dir that exits non-zero on its first
  attempt. It pins what only a real `spawn` can — the exit code coming back, and
  `BOT_START_ATTEMPT` and `BOT_PREVIOUS_EXIT` reaching the next child, which is
  what `/status` reports. Nothing else supervises a real process: `e2e/` spawns
  `main.ts` directly, so the restart path production runs on has no other cover.
- **`scoresheet/bot/poster-rasterizing.integration.spec.ts`** rasterizes real render
  output with the shipped fonts. A missing font makes resvg draw a **blank page
  rather than fail**, so the assertion is that the raster differs from the same SVG
  with its `<text>` stripped — and again for a Cyrillic word, since half of what this
  bot writes is Russian. It also pins that `renderAsync` really **hands the event
  loop back**: a `setImmediate` registered after the call runs before the promise
  settles, which a mocked version could only assert of its own fake.

Two cover a chain:

- **`scoresheet/scoresheet-chain.integration.spec.ts`** plays an evening into a real
  database and reads the percentages back out of the **SVG string** — before
  rasterizing, while the numbers are still text. Every joint from `seriesChronology`
  to the legend is mocked in the units, and a PNG is opaque to e2e, so this is the
  only place the arithmetic of an evening is checked end to end.
- **`scoresheet/samples/sample-reachability.integration.spec.ts`** holds every state
  a `samples/` folder draws against the product's own limits — table size, name
  length, a finish the card could record, a starter who sat down. The real builders
  run on purpose: mocked, there is no fixture left to judge. **A `samples/` layer
  owes this spec**, because a case once seated thirteen at a table capped at ten and
  was drawn for months. Assert properties, never the data: a spec restating a
  fixture is the compared-against-itself trap again — which is also why
  `stryker.config.json` mutates nothing in `samples/` but `contact-sheet.ts`. A
  changed fixture is a different sample, not a broken one, and the only way to kill
  its mutants is to write the data down twice.

Four things this tier gets wrong, all paid for:

- **An integration spec is still bound by the layering.** The chain spec first
  arranged its evening with `db.prepare("UPDATE games SET starter_player_id …")` — a
  second copy of the schema inside a feature folder, written by a path production
  never takes. Arrange through the contract, and isolate cases with a **different
  `chatId`** rather than a `DELETE`. No lint zone catches this: a feature zone bans
  other features, not SQL.
- **Select by something the subject deliberately emits.** `"50%"` is a legend entry
  *and* an axis label on the share chart, so an `indexOf` picked the wrong one. The
  fix was to take the percent immediately followed by a player's name.
- **Prove it fails.** Point the font paths at files that do not exist and watch the
  ink assertions go red — the PNG-magic assertion stays green, which is exactly why
  "it is a PNG" was never enough.
- **Real time is the price.** A retry backoff and a restart delay are real waits.
  Keep the number of waiting cases countable, and reach for the branch that gives up
  without sleeping when one will do.

One trap worth keeping: `bot.catch` only participates in `bot.start()`.
`handleUpdate` rethrows, so an error handler is exercised through
`bot.errorHandler` — or, better, on the mock.
