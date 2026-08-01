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

## Parked: the end-to-end harness

`e2e/` plays whole scenarios against a real bot process and a fake Telegram, in the
browser. It works — 75 cases across 8 scenario files, `npm run e2e`, and
`README.md` says how to watch it. It is **parked**, which specifically means:

- it is **not a release gate**. `npm run check` does not run it, and the gates
  in the `finish-phase` skill do not mention it;
- nothing depends on it, so it can rot without breaking a release;
- if it breaks and is not worth fixing at that moment, deleting `e2e/` plus three
  lines in `package.json` costs nothing else. That was the point of keeping it
  outside `src/` with its own tsconfig.

**Why parked and not finished:** the phase after it was going to be edge cases, and
real evenings arrived first. Feedback from people actually playing is worth more
than coverage of cases nobody has hit.

**Pick it up when** a bug reaches a real Friday that a scenario would have caught —
that is the evidence that the harness is cheaper than the alternative. Not before.

### What is honestly wrong with it

Seven things, in the order they would bite:

1. **The two pages are neither typechecked nor linted.** `chat-page.ts` and
   `hub-page.ts` hold a browser program inside a template literal — 300 lines of
   JavaScript that TypeScript sees as a string. This is not a stylistic complaint:
   it is why a page that fetched a relative `chat/state` looked dead for two
   rounds of "fixed it" instead of failing. Any change to those strings is
   unverified until a human opens a browser. Either move them to real `.ts` files
   the compiler sees, or accept that they are a viewing tool and never assert
   anything through them.
2. **`settle()` is coupled to `EDIT_DEBOUNCE_MS` with nothing to enforce it.**
   The harness waits 600 ms of quiet; `card-service.ts` debounces edits by 350 ms.
   Raise the debounce in `src/` and every scenario silently starts asserting
   against a card that has not been redrawn yet. There is no import between them —
   `e2e/` may not reach into `src/` — so this can only be a comment or a scenario
   that measures it.
3. **`isolate: false` is load-bearing.** It is what makes one world outlive its
   scenario file, and it depends on Vitest reusing a worker's module registry
   across files. A Vitest upgrade that changes that reuses nothing, and the
   symptom is not a failure — it is a chat that loses its history and a port that
   races itself.
4. **World ports and database names come from `VITEST_WORKER_ID`,** which Vitest
   does not promise to keep in `0…maxWorkers`. Observed ids have gone above the
   worker count. The hub probes a fixed nine-port window as a result, which is a
   guess dressed as a constant.
5. **`HANDOVER_MS` is a sleep covering a race.** Every scenario file pauses 700 ms
   before stopping its bot, purely so the hub can read the final verdict before the
   world dies. The honest fix is for the world to tell the hub, rather than for the
   hub to poll and the world to wait.
6. **Stopping the bot is a hard kill on Windows,** because a spawned parent cannot
   deliver `SIGINT`. So the one path e2e cannot exercise is the graceful shutdown
   that flushes the pending edit — which is exactly the path a real `Ctrl+C` takes.
7. **The pure parts of the harness have no specs.** `chat-log.ts`,
   `multipart-body.ts` and `world-cache.ts` are pure functions with real branching
   and no tests, on purpose: adding them means teaching Vitest about a second set
   of specs. If the harness stops being disposable, they are the first thing to
   cover.

### What it did prove, so it is not wasted

Worth keeping in mind even while parked, because these were found by running the
whole bot and could not have been found by a unit:

- A fake that accepts an edit to a message it has never seen hides a lost message.
  Telegram answers `400`; so does the fake now.
- A redraw of a card that is already correct is refused as `message is not
  modified`. The observable is that the bot **attempted** the edit, not that the
  message changed — which is what `PLAN.md` says and what the scenarios assert.
- `/status` reports the `BOT_API_ROOT` warning, so a run pointed away from Telegram
  cannot hide. That is asserted by a scenario, and it is the reason the seam is
  safe to leave in `src/`.

**Parked is not abandoned.** `/merge` arrived with scenarios of its own, because a
second screen with buttons was the first thing units could not check: whether a tap
reaches the feature that owns it is a fact about real grammY. Writing them cost an
hour and immediately found two wrong assumptions about the bot's own behaviour. So
the rule is narrower than "do not touch it": **a feature with an inline keyboard
gets scenarios; nothing else has to.**

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

## Files that may be worth splitting

None of these is wrong. They are the places where the next change is most likely to
be awkward, with the trigger that would make the split pay for itself.

| File | Lines | Why it is on the list | Split it when |
|---|---|---|---|
| `features/live-game/bot/card-service.ts` | 370 | The largest file in `src/`, and the only one doing four jobs: looking a card up, applying a tap, scheduling the debounced edit, and sweeping idle cards. It reads as a skeleton, which is why it has survived. | A fifth job arrives, or something other than the card service needs the debouncer |
| `features/live-game/bot/update-handlers.ts` | 280 | Six exported handlers plus the preamble they share. The three `/next*` commands differ only in how they build the line-up, and that difference is already pure and elsewhere — what is left here is Telegram plumbing repeated three times. | A fourth way to open a card arrives — then the `/next*` family earns a file of its own |
| `shared/repository/sqlite-repository.ts` | 365 | Every query in the app. It is meant to be the only file with SQL, so length is the price of that rule, not a smell. | The scoresheet's queries and the live card's queries stop overlapping — then two files behind one contract |
| `e2e/fake-telegram/fake-telegram.ts` | 371 | One `switch` over nine Bot API methods, mixing protocol shapes with the chat log. A `bot-api-methods.ts` was planned and folded in to save a file; that was probably the wrong trade. | A tenth method is needed, or the fake starts refusing more than two things |
| `e2e/harness/scenario-chat.ts` | 266 | Module-level singletons plus a 24-member `Chat` interface that scenarios use as a language. The interface grows every time a scenario wants a new question answered. | The interface passes ~30 members — then split the driving verbs from the queries |
| `e2e/hub/hub-server.ts` | 208 | Proxy, cache, page serving and port probing in one file. | Anything is added to the hub |
| `src/main.ts` | 54 | Four `??` defaults inline in the diagnostics wiring, which is the only place in `src/` with branch coverage at 50%. A typed env reader would move the defaults somewhere a unit can reach. | A fifth optional key appears |

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
- **`copy.sheetDate` formats a date inside the copy table**, though a decision in
  `copy.en.ts` is normally forbidden. The month names *are* the locale's data, so
  splitting the lookup from the names would put one format across two files, and its
  mutants die anyway: `copy.en.spec.ts` asserts it against literals rather than
  against itself, which is what makes the rule necessary elsewhere.
- **`merge-callback-codec.spec.ts` imports `MOST_NAMES_AT_ONCE` from the domain**
  instead of mocking it, which every other spec would. The case it serves — that a
  full selection still fits in 64 bytes — is meaningless against a mocked cap: it
  would assert the spec's own number. The real coupling is that the codec's byte
  budget bounds the domain's cap, and this is the one place both are visible. It
  already earned its keep by failing at eight names.
