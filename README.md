# FoolProof

A Telegram bot that keeps the score for a group of friends playing Podkidnoy
Durak. It records who dealt first, the order players went out, and who was left
the fool, then reports how the evening went.

Input happens on a Friday night, on a phone, one-handed, between games. So the
whole product is one message with an inline keyboard: you tap the names in the
order people finish, and tap Confirm. There is nothing to type after the line-up.

```
Game 3
Dealt first: Oleg

┌──────────────┬──────────────┐
│  ✅ 1 Oleg   │  ✅ 2 Roma   │
├──────────────┼──────────────┤
│     Anya     │     Dima     │
├──────────────┴──────────────┤
│  🤝 Draw     │  ↩️ Back      │
└──────────────┴──────────────┘
```

## Commands

| Command | What it does |
|---|---|
| `/game Oleg, Anya, Roma` | Opens a card. The list is the seating order, clockwise |
| `/game` | Same, but asks for the names — for when you tapped the command from the menu |
| `/next` | A new card with the same line-up |
| `/stats` | How the current session is going, as a rendered picture |
| `/merge` | Folds a name typed twice into the right one |
| `/help` | What the commands do and how the card works |

### When one player ends up under two names

Somebody types `Анна` once and `Аня` the rest of the evening, and `/stats` grows a
sixth player who played one game. `/merge` shows every name with the games behind
it, and the **first name you tap is the one that stays**:

```
Merging names
Анна → Аня
Аня will have 13 games.

┌──────────────────────────────┐
│        ⭐ Аня · 12           │
├──────────────────────────────┤
│        ➕ Анна · 1           │
├──────────────────────────────┤
│           Oleg · 12          │
├──────────────┬───────────────┤
│  ↩️ Back      │  ✅ Confirm   │
└──────────────┴───────────────┘
```

Two names that sat in the same game are two people, so that merge is refused with
the reason. So is a merge while a game is being played — confirm the card first.
There is no undo, which is what the Confirm button is for.

## Running it

Node 24 or newer. There is no build step — Node runs the TypeScript directly.

```bash
npm install
cp .env.example .env
```

Put a token from [@BotFather](https://t.me/BotFather) in `BOT_TOKEN`, then:

```bash
npm start
```

The bot connects by long polling, so it needs no public address, no certificate
and no reverse proxy — it works from a laptop behind NAT. It does need to
actually be running when people play.

Add the bot to the group and leave BotFather's privacy mode at its default. In
that mode a bot sees only commands and replies to its own messages — which is
exactly what this one needs, and it never reads the rest of the conversation.

## Two environments, two databases

Real evenings and experiments must not land in the same file, so each run names
its own configuration:

| Command | Env file | Database |
|---|---|---|
| `npm start` | `.env`, skipped if absent | `data/foolproof.dev.db` |
| `npm run start:prod` | `.env.production`, **required** | `data/foolproof.db` |

The two commands run the same code the same way — **the env file, and therefore the
database, is the only difference**. Whatever you try in dev is what happens on a
Friday.

```bash
cp .env.example .env.production   # then put the token in it
npm run start:prod
```

Node loads the file itself (`--env-file`), so there is no dependency and nothing
to remember about shell syntax. Three properties are worth knowing:

- **Each file is the whole configuration for its run.** Nothing is inherited from
  `.env`, so a key missing from `.env.production` is missing rather than silently
  taken from dev — which is how a real Friday would otherwise end up written to the
  dev database.
- **`npm run start:prod` refuses to start without `.env.production`.** The dev
  command tolerates a missing `.env` and then fails on the first missing key, which
  is the friendlier order for a fresh clone.
- **The default database is the dev one.** Reaching production takes an explicit
  command; forgetting a variable cannot.

One bot token serves both, as long as only one process runs at a time — two
pollers on one token make Telegram hand each update to whichever asked first. The
same bot answering in the same group is also why dev is best driven from a private
chat with it: the chat cannot tell you which database is behind it.

Both databases are SQLite files under `data/` (gitignored). Back one up by copying
the `.db` file **together with its `-wal` and `-shm` sidecars**, or after stopping
the bot — the write-ahead log can hold games the main file does not have yet.

`/stats` draws a PNG, which needs the two font files in `assets/fonts/`. They are
committed, so a clone has them; the bot refuses to start without them, because a
missing font makes the renderer draw the picture with no text on it rather than
fail. Rasterizing uses `@resvg/resvg-js`, which ships a prebuilt binary per
platform — still no build step, but `npm install` now needs to be run on the
machine that will run the bot rather than copied from another one.

## When something goes wrong

Both commands start a **supervisor**, which runs the bot as a child process and
starts it again if it dies — 1 s, then 2, 4, 8, up to a minute apart. Everything the
bot prints still goes straight to your terminal; the extra lines say `supervisor:`.

```
INFO  supervisor: starting the bot
INFO  polling: listening for updates by long polling
WARN  supervisor: the bot died (exit code 1), starting it again in 1000ms
```

Lose the wifi and nothing needs doing: every call to Telegram is retried, the card
catches up when the connection comes back, and the log says so once at each end
rather than once per retry.

```
WARN  polling: telegram is unreachable during getUpdates (…) — retrying until it answers
INFO  polling: telegram is answering again
```

Restart it mid-game and the live card is redrawn from the database as it starts, so
what is on screen is always what was actually recorded. A tap that arrives against a
card whose buttons are out of date redraws it too, instead of refusing every further
tap.

A bot that has never managed to run for a minute is given five tries and then
abandoned, so a missing token or a locked database is one clear message instead of a
loop:

```
ERROR supervisor: the bot never got going (exit code 1) — fix what the log above says and start it again
```

`Ctrl+C` stops both, and lets the bot finish the edit it was in the middle of.
`PLAN.md` explains what each failure costs and why the supervisor does not forward
the signal itself.

## Asking the bot how it is doing

The laptop is at home and you are not. **`/status`** answers from the chat with
everything the terminal would have told you:

```
Bot status

Database: foolproof.db (44 KB)
Recorded: 6 players, 28 games, 0 live
Last game: 2026-07-31 19:42:10 UTC

Up for 3h 12m
Start #2 — the one before it ended with exit code 1
Log level: info
Since this start: 1 warning, 0 errors

Latest:
19:31:04 WARN polling: could not edit message 500: message to edit not found
```

The database line is the one that matters most: it names the file, so a production
run that quietly came up on the dev database is one glance away from being caught.

The command is **hidden** — it is not in `/help` and not in the `/` menu, so the
group never sees it. Set `OPERATOR_TG_ID` in the env file to make it answer only
you; leave it empty and anyone may run it. Nothing in the report is a secret: the
token is never printed, and neither is any other environment value.

## Scripts

| Script | What it runs |
|---|---|
| `npm start` | The bot on the dev database, under the supervisor |
| `npm run start:prod` | The bot on the production database, under the supervisor |
| `npm test` | Vitest, once — units and integration together |
| `npm run test:unit` | Only the unit specs, where everything outside the file is mocked |
| `npm run test:integration` | Only `*.integration.spec.ts` — the real grammY bot and a real SQLite file |
| `npm run test:coverage` | Vitest with coverage; fails below 70% on any metric |
| `npm run test:mutation` | Stryker, about two minutes; fails below 85% |
| `npm run check` | Lint, types and tests — the gate to keep at zero |
| `npm run lint` / `lint:fix` | ESLint, which enforces this project's conventions |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run e2e` | Whole scenarios against the real bot and a fake Telegram |
| `npm run e2e:watch` | The same run, slowed down, in the browser |
| `npm run e2e:play` | A chat in the browser to try things by hand |

Coverage and mutation write their reports into `reports/`, which is gitignored
whole — nothing about testing lands next to the source.

## Watching it play

`npm test` proves the pieces. `npm run e2e` proves the bot: it starts
`src/main.ts` as a real process against a real SQLite file, and puts a **fake
Telegram** on the other end of it — a small Bot API server that records the chat
instead of sending it anywhere. A scenario then plays a whole evening the way a
person would: type `/game Oleg, Anya, Roma`, tap the names, tap Confirm, ask for
`/stats`. No token, no network, no rate limits.

```bash
npm run e2e
```

Every scenario gets its own bot process, its own database and its own port, so
they run at the same time — one per worker.

```bash
npm run e2e:watch
```

The same run with a pause after every action, and **a browser tab per world** as
each one starts — the tab is titled after the scenario running in it, with a `✓` or
a `✗` once it is done. Each tab is the chat: the messages as Telegram would show
them, the inline keyboard, the callback answers as toasts, the `/stats` picture, and
a divider between scenarios so nothing scrolls away.
<http://127.0.0.1:8080> shows all of them together if you want one page.

**The chats stay up after the run ends.** The hub keeps the last state of every
world and the pictures it drew, so the tabs are still there to read when the
scenarios have finished and their bots are gone. Ctrl+C in the terminal lets them
go.

```bash
npm run e2e:play
```

One chat, nobody driving it, pointed at the dev database. Type in the box and tap
the buttons — it is the same fake Telegram, so the bot cannot tell the difference.
Add `--db=data/somewhere.db` to keep an experiment out of the dev database.

The whole harness lives in `e2e/`, imports nothing from `src/`, and has its own
`tsconfig.json` and Vitest configuration — `npm test`, coverage and mutation never
see it.

## Layout

A feature is a folder you can delete: nothing outside it imports it except the
composition root, which names the roster.

```
src/
  supervisor.ts         runs main.ts and starts it again if it dies
  main.ts               names the features and wires them; starts polling
  feature-installer.ts  registers whatever features it was given
  features/
    live-game/          playing a game on a live card of buttons
    scoresheet/         the picture /stats sends back
  shared/               config, lifecycle, logging, repository,
                        telegram, text, timing — a folder per subject
assets/fonts/           the two faces the scoresheet is drawn with
e2e/                    the fake Telegram and the scenarios played against it
```

Inside a feature the same three layers every time, and imports point only
downward:

```
features/scoresheet/
  scoresheet-feature.ts  the entry point: what this feature offers the bot
  copy.en.ts             every string this feature shows a user
  domain/                the pure core — no framework, no I/O
  render/                state in, SVG out; still pure
  bot/                   the impure edge: grammY, rasterizing
```

Specs (`*.spec.ts`) and stubs (`*.stub.ts`) sit next to the file they stand for,
so a feature carries its own tests with it.

Nothing in `src/` imports by relative path. Every import goes through an alias
declared in `package.json` — `#shared/logging/logger.ts`,
`#live-game/bot/prompt-registry.ts` — so a line says which zone it reached into.
These are Node's own subpath imports, which is why they work with no build step
and no loader flag.

ESLint enforces all of it: a cross-feature import and a framework import in
`domain/` are both build errors.

## The other two documents

- **[PLAN.md](PLAN.md)** — what the bot does and why. The state machine, the data
  model, the invariants, the edge cases, and the design dead ends already paid
  for. Read this before changing behaviour.
- **[CLAUDE.md](CLAUDE.md)** — how the code here is written. Style, layering,
  testing, and the gates a phase has to pass. Read this before writing code.

The split is one question: *would this still be true if the bot were rewritten in
Python?* If yes it is in `PLAN.md`; if no it is in `CLAUDE.md`.
