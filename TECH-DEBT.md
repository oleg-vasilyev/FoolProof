# FoolProof — what is owed

Work that is finished enough to stop, but not finished. Each entry says what state
it is in, what it would cost to pick up, and — the part that matters — **what has to
be true before it is worth doing**. Nothing here is a bug in the bot: those go to
`PLAN.md` as edge cases, or get fixed.

Two rules for this file, so it stays useful:

- **An entry names a trigger, not a wish.** "Refactor `card-service.ts`" is a wish.
  "Split it when a third thing needs the debouncer" is a trigger. An entry without
  one is a note that will still be here in a year.
- **Delete an entry when its trigger fires and the work is done**, rather than
  marking it done. The git history remembers; this file is a to-do list.

---

## A backup that stops happening announces it by silence

The daily timer sends each snapshot to the operator's chat, so a run that fails
is noticed by a file *not* arriving. That works because somebody looks at that
chat daily — which is a habit, and habits are exactly what left this project with
no backups until an audit went looking. Nothing polls the timer's state, and
`/status` reports the database it is using without saying when it was last copied.

The honest fix is one line in the diagnostics report: the age of the newest file
in the backup directory, red past two days. It is small, and it is deliberately
not done yet, because it needs `/status` to read a path that is not the database
— the first time that feature would touch the filesystem for a reason other than
the one it was built for.

**Pick it up the first time a backup is missing and nobody noticed within a
week** — or sooner if the answer to "when did this last run" is ever needed while
something is actually broken.

---

## A graceful shutdown is the one path e2e cannot play

`bot-process.ts` stops a bot by killing it, because a spawned parent on Windows
cannot deliver `SIGINT` to its child. So the path a real `Ctrl+C` takes — the one
that flushes the pending debounced edit before the process ends — is exercised by
units and by hand, never by a scenario.

Closing it honestly would mean a shutdown channel in `src/` that exists only for
the harness, and this project does not put test hooks in the app: `BOT_API_ROOT` is
in `src/` because a self-hosted Bot API server is a real Telegram feature, not
because e2e wanted a seam.

**Pick it up if a lost edit on shutdown ever reaches a real Friday** — that is the
evidence that the gap costs more than the seam would.

---

## An inline keyboard is described twice

`live-game/render/inline-keyboard.ts` and `merge-names/render/merge-keyboard.ts`
each declare their own `InlineButton` and `InlineKeyboardRows`, and each feature's
`bot/` layer has its own `toMarkup` that copies the rows into the mutable shape
grammY wants. The types are duplicated on purpose — `render/` may not import grammY,
and a feature may not import another feature — so the alternative is
`shared/telegram/`.

**Move them when a third feature grows a keyboard.** Two copies of a six-line type
is cheaper than a shared module nobody else needs; three is not.

---

## Counting games is spelled out twice

`merge-names/render/game-tally.ts` and `scoresheet/render/session-tally.ts` both turn
a number into `1 game` / `12 games`. The duplication is forced from two directions: a
feature may not import another, and choosing between the singular and the plural is
exactly the decision `copy.en.ts` is forbidden to make, so it cannot live in the copy
table either. The scoresheet's copy also needed `1 player` / `3 players`, which is
why its version is named after the session rather than the game.

**Move it to `shared/text/` when a third feature needs to count something.** Four
lines twice is cheaper than a shared module with two callers.

---

## `feature-installer.ts` is faked by hand in `main.spec.ts`

The `vi.mock` factory there is the one hand-rolled fake left after
`card-context.stub.ts`, and it has the same weakness that entry named: an added
parameter on `installFeatures` or `republishChatMenus` keeps the fake compiling and
passing. The factory's return is annotated with the module's own type, which
catches a renamed or missing member — the cheap half of the protection. One
mocking consumer does not pay for a stub file.

**Write `feature-installer.stub.ts` when a second spec mocks the module**, or the
first time the fake is caught disagreeing with a real signature.

---

## Two `main.spec.ts` cases fail inside Stryker and nowhere else

`should register a handler for SIGTERM` and `should run the same shutdown on SIGTERM`
pass under `npm test` and are reported failed in every Stryker run, on any `--mutate`
target — including files that have nothing to do with signals. Stryker carries on
because both cover zero mutants, so the score is honest and the gate is not lying;
what is lost is two cases' worth of killing power over `main.ts`, and a pair of red
lines in every mutation run that a reader learns to skip past. The cause is in how
the runner's environment handles a process-level `SIGTERM` listener, not in the
assertions.

**Chase it when a mutant in `main.ts`'s signal wiring survives**, or when the noise
first makes somebody miss a real failure in that output.

## Nothing tells the harness when a render outgrows its quiet window

A scenario decides the bot has finished once `QUIET_MS` has passed with nothing
happening, so the window has to be longer than the slowest thing the bot does
between two effects — rasterizing one poster. The chronology redesign made that
render ~80ms slower and it crossed the old 600ms window, and the way it announced
itself was five scenarios asserting against photos that had not arrived: a wrong
answer, in a gate, that looked like flakiness. `QUIET_MS` is 1200 now, which buys
back roughly a doubling of render time.

The debounce has `debounceFitsQuiet()` for exactly this class of coupling, and it
works because a debounce is a constant a file can be read for. A render time is
not — it can only be measured, and `e2e/` may not import `src/` to measure it. The
guard that would actually fit is the other direction: notice that an effect landed
*after* a settle returned, and fail naming the scenario, so the harness reports its
own assumption breaking instead of the scenario reporting a bot that is fine.

**Build it the next time a scenario fails in a way that turns out to be timing**,
or when a poster gains enough to make somebody wonder about the window again.

## Half of drawing a poster still blocks the event loop

`rasterize()` draws through `renderAsync`, which hands the work to a thread and
gives the loop back. The encode after it does not: `asPng()` is synchronous and
**`@resvg/resvg-js` publishes no asynchronous form of it**, so the larger of the two
costs in [PLAN.md](PLAN.md#what-drawing-one-costs-everybody-else) still stops
everything while it runs.

Closing it means running the whole rasterizer in a `node:worker_threads` worker:
either one spawned per poster, which costs its own startup and undoes some of the
saving, or a pool, which is a lifecycle to own — starting it, keeping it warm,
draining it on shutdown alongside the stops `main.ts` already composes. That is a
real amount of machinery for a bot whose busiest hour is one Friday evening.

**Pick it up when more than a handful of chats use the bot at once**, or the first
time a tap on a live card visibly waits behind somebody else's `/stats`. The number
to beat is in [PLAN.md](PLAN.md#what-drawing-one-costs-everybody-else).

---

## Files that may be worth splitting

None of these is wrong. They are the places where the next change is most likely to
be awkward, with the trigger that would make the split pay for itself.

| File | Lines | Why it is on the list | Split it when |
|---|---|---|---|
| `features/live-game/bot/card/card-service.ts` | 398 | The largest file in `src/`, and the only one doing four jobs: looking a card up, applying a tap, scheduling the debounced edit, and sweeping idle cards. It reads as a skeleton, which is why it has survived. | A fifth job arrives, or something other than the card service needs the debouncer |
| `shared/repository/sqlite-repository.ts` | 383 | Every query in the app. It is meant to be the only file with SQL, so length is the price of that rule, not a smell. | The scoresheet's queries and the live card's queries stop overlapping — then two files behind one contract |
| `e2e/fake-telegram/fake-telegram.ts` | 406 | One `switch` over nine Bot API methods, mixing protocol shapes with the chat log. A `bot-api-methods.ts` was planned and folded in to save a file; that was probably the wrong trade. | A tenth method is needed, or the fake starts refusing more than two things |
| `e2e/harness/scenario-chat.ts` | 273 | Module-level singletons plus a 25-member `Chat` interface that scenarios use as a language. The interface grows every time a scenario wants a new question answered. | The interface passes ~30 members — then split the driving verbs from the queries |
| `e2e/hub/hub-server.ts` | 259 | Proxy, cache, page serving and port probing in one file. | Anything is added to the hub |
| `src/main.ts` | 70 | Two `??` defaults left inline in the diagnostics wiring, still the only place in `src/` with branch coverage at 50% (lines 50–51), and the one surviving mutant in the file. `optionalEnv()` took the other two and the empty-means-missing bug with them; these two remain because the fallback runs only when the key is absent, and `main.spec.ts` imports the module once, with the spy returning a value. | A second spec file reaches both branches — vitest isolates files, so no `vi.resetModules()` is involved. What stops it is the price: 180 lines of setup and fifteen `vi.mock` calls duplicated for two branches. Do it once that header is worth extracting for another reason |

---

## Not debt, deliberately

Listed so nobody "fixes" them:

- **`e2e/` uses relative imports.** The `#`-aliases are the app's; the harness is
  not the app, and a relative import there is a reminder of that.
- **`e2e/` imports nothing from `src/`** — not even `copy.en.ts`. A harness that
  imported the copy table would assert a constant against itself.
- **The chat page renders the bot's HTML raw.** That is what Telegram does with
  `parse_mode: "HTML"`, and it is what makes a missing escape visible as markup.
- **`diagnostics/` has no `domain/`.** There is nothing to decide there.
- **The same product constraint opens `README.md` and `PLAN.md`.** A visitor must
  not have to open the spec to learn why the bot is a keyboard. It is the one
  overlap `docs:check` and the `write-a-doc` skill deliberately allow.
- **`percent-label.ts` puts the `%` outside `copy.en.ts`.** It is a numeric format, the
  way `svg-tags.ts` rounds a coordinate, not a sentence anyone would translate — and
  the copy rule exists so a second locale is a small change, which a percent sign is
  not. Two review passes have now had to decide this independently, which is why it
  is written down.
- **`chronology-layout.ts` puts the truncation `…` outside the copy table**, for the
  same reason as the `%`: it marks that a name was cut to fit its column, and no
  language spells that differently.
- **`merge-callback-codec.spec.ts` imports `MOST_NAMES_AT_ONCE` from the domain**
  instead of mocking it, which every other spec would. The case it serves — that a
  full selection still fits in 64 bytes — is meaningless against a mocked cap: it
  would assert the spec's own number. The real coupling is that the codec's byte
  budget bounds the domain's cap, and this is the one place both are visible. It
  already earned its keep by failing at eight names.
- **No tap is gated by who tapped it.** An inline button acts for whoever presses
  it — Telegram's model, and the right one for a single table of friends, where
  every action is reversible or one tap to redo. The one authorization in the
  product is `/status` answering only `OPERATOR_TG_ID`.
- **`logger.ts` and `sqlite-connection.ts` read the environment at module scope.**
  A logger is created wherever code runs and the connection opens at import, so
  neither can be handed values the way feature code is — which is what "read in
  one place, pass values down" actually polices. There is no visible cost left now
  that `/status` has stopped reporting the log level: `LOG_LEVEL` has one reader
  again. Pick this up if a second module ever needs the same value.
