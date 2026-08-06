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

## `card-context.ts` is mocked by hand in three places

`lineup-from-names.spec.ts`, `lineup-from-last-game.spec.ts` and `names-reply.spec.ts` each write their
own `vi.mock` factory for it rather than using a stub. That is inside the letter of
the rule — `CLAUDE.md` requires stubs for `shared/` modules and feature entry points,
and this is neither — but a `vi.mock` factory is **untyped**, which is the exact
failure the stub rule exists to stop: add a parameter to `askForNames` and all three
fakes keep compiling and keep passing.

It is not written yet because the file just shed `toSeats` and `resolveSeats` to
`seat-lookup.ts`, and three small fakes are cheaper than a stub with three callers.

**Write `card-context.stub.ts` when a fourth consumer appears**, or the first time
one of the three fakes is caught disagreeing with the real signature.

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
| `src/main.ts` | 64 | Four `??` defaults inline in the diagnostics wiring, which is the only place in `src/` with branch coverage at 50%. A typed env reader would move the defaults somewhere a unit can reach. | A fifth optional key appears |

---

## A chat that picked a language keeps a menu of its own

Choosing a language republishes that chat's `/` menu through `setMyCommands` scoped
to it. Telegram then serves that chat its own copy for good: the global menu
published at every start no longer reaches it. Add a command and a chat that once
tapped `/language` keeps the old list until somebody opens the screen again.

The honest fix is to republish every scoped menu on start, which means keeping the
list of chats that have one — `chat_locales` already is that list. It was left out
because the menu is a convenience, the commands themselves keep working, and the
first new command after this is the trigger anyway.

**Pick it up when a command is added or renamed**, since that is the moment the
stale menu starts lying.

---

## Two dev scripts hand git-derived filenames to a shell

`scripts/mutate-changed.ts` and `scripts/e2e-changed.ts` join names from
`git diff` and `git ls-files --others` into `spawnSync(..., { shell: true })`, so
a filename carrying a backtick or a `;` would execute the day somebody runs the
script over a hostile checkout. The reach is short — a developer's own working
tree, no path from a chat — which is why it is debt and not a fix. `shell: true`
exists because `npx` is a `.cmd` on Windows; the exit is resolving
`node_modules/.bin` directly, the way `.claude/hooks/lint-changed.mjs` already
does.

**Drop the shell the next time either script is edited.**

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
  one place, pass values down" actually polices. The visible cost is that
  `LOG_LEVEL` has two readers: the logger's threshold, and the copy `main.ts`
  hands the diagnostics for `/status` to report.
