# FoolProof

A Telegram bot that keeps the score for a group of friends playing Podkidnoy
Durak. It records who went first, the order players went out, and who was left
the fool, then reports how the evening went.

Input happens on a Friday night, on a phone, one-handed, between games. So the
whole product is one message with an inline keyboard: you tap the names in the
order people finish, and tap Confirm. There is nothing to type after the line-up.

```
Game 3
Went first: Oleg

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
| `/next` | A new card with the same line-up; the fool's neighbour goes first |
| `/next_with Zhenya` | The same line-up plus these players; asks for the names if sent without any, then asks where everyone sits |
| `/next_without Oleg` | The same line-up minus these players; asks the same way |
| `/stats` | How the current session is going: the chronology, then the awards |
| `/stats_chronology` | The chronology picture on its own |
| `/stats_awards` | The awards picture on its own; needs five games |
| `/merge` | Folds a name typed twice into the right one |
| `/language` | Picks the language this chat is played in — English or Russian |
| `/help` | What the commands do and how the card works |

This table is the one place the commands are listed; `PLAN.md` says what each one
has to do.

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

There is no undo, which is what the Confirm button is for. Two merges are refused
with the reason, and [PLAN.md](PLAN.md#merging-two-names-into-one) says why.

### The pictures it sends back

`/stats` answers with two PNGs: the chronology of the evening, then the awards.
Both are below at the size a phone gets them, and both were drawn by the bot's own
renderer over a sample evening rather than by hand — `node scripts/tools.ts mockups`
redraws them whenever the drawing code changes.

| The chronology — a row per game, a column per player | The awards — at most nine, and the fool last |
|---|---|
| [![The chronology poster](docs/mockups/chronology.png)](docs/mockups/chronology.png) | [![The awards poster](docs/mockups/awards.png)](docs/mockups/awards.png) |

The grid prints the finishing position in every cell, and marks only what an
ordinary finish is not: drew for last, left the fool, did not play. Under it, each
player's running share of the table — 50% is mid-table, 100% is winning every game.
The awards need five games before there are any. Thirty-six of them exist and nine
fit, so the card keeps the king and the fool and fills the rest with
[the rarest of what the evening earned](PLAN.md#two-orders-and-why-there-have-to-be-two)
— which is what stops every Friday reading the same.

Every colour, size and rule behind the two is specified in the [poster design
system](https://claude.ai/design/p/dfdd20cb-3609-4baa-935d-eb20b8257c2c?file=Durak+Stats+Poster+System.dc.html),
which lives in Claude Design rather than here and opens only for somebody with
access to that project. It is not decoration: the two mockups on it are the same
SVG committed under `docs/mockups/`, and `npm run check` fails when either stops
matching what the renderer draws. The `sync-the-mockups` skill is the procedure
that keeps the three in step.

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
[PLAN.md](PLAN.md#what-survives-a-failure) explains what each failure costs and why
the supervisor does not forward the signal itself.

## Running it on a server

A laptop that has to be awake on a Friday evening is the weakest part of the setup,
and moving off it is cheap: long polling means the host opens **no port, needs no
domain and no certificate**, so a firewall with nothing but SSH in it is enough.
Anything that runs Node 24 will do. This one runs on a free Oracle Cloud VM with
1 GB of memory, where the two processes idle at about 76 MB and the heaviest `/stats`
peaks at 411 MB.

```bash
git clone https://github.com/oleg-vasilyev/FoolProof.git
cd FoolProof
npm ci
cp .env.example .env.production
chmod 600 .env.production
```

Put the token in `.env.production`, and point `DB_PATH` at a directory **outside the
clone**, which `.env.example` explains how to spell:

```
DB_PATH=/home/ubuntu/data/foolproof.db
```

Outside, because a deploy pulls into the clone and nothing that deploys should be
able to reach the games. Copy an existing database there before the first start
(with its `-wal` and `-shm` sidecars, per the section above); the schema creates
whatever is missing, so a file from an older version needs no migration.

Then hand it to systemd. [`deploy/foolproof.service`](deploy/foolproof.service) is
the unit, and it assumes the user `ubuntu`, the clone at `/home/ubuntu/FoolProof`
and Node at `/usr/local/bin/node` — edit those three lines if yours differ:

```bash
sudo install -m 644 deploy/foolproof.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now foolproof
journalctl -u foolproof -f
```

`systemctl restart foolproof` and `systemctl stop foolproof` reach the bot the same
way `Ctrl+C` does, so the pending edit is still flushed. The unit brings the bot
back after a crash or a reboot, and gives up after five failed starts in five
minutes — [PLAN.md](PLAN.md#what-survives-a-failure) explains which failures it is
allowed to answer and which are the supervisor's.

One thing to get right before the first start: **stop whatever was polling before**,
for the reason in [Two environments, two databases](#two-environments-two-databases)
— one token serves one process.

## Asking the bot how it is doing

The bot is on a machine you are not sitting at. **`/status`** answers from the chat
with everything the terminal would have told you:

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

The command is **hidden** — not in `/help`, not in the `/` menu — and
`OPERATOR_TG_ID` in the env file makes it answer only you. `PLAN.md` explains
[what it reports and why](PLAN.md#asking-the-bot-how-it-is-doing), including why no
environment value is ever printed.

## Scripts

| Script | What it runs |
|---|---|
| `npm start` | The bot on the dev database, under the supervisor |
| `npm run start:prod` | The bot on the production database, under the supervisor |
| `npm test` | Vitest, once — units and integration together |
| `npm run test:unit` | Only the unit specs, where everything outside the file is mocked |
| `npm run test:integration` | Only `*.integration.spec.ts` — the seams where third-party code runs for real |
| `npm run test:watch` | Vitest left running while you edit |
| `npm run test:coverage` | Vitest with coverage; fails below 70% on any metric |
| `npm run test:mutation:changed` | Stryker over the files that differ from `origin/main`, about a minute |
| `npm run test:mutation` | Stryker over everything, about five minutes; both fail below 85% |
| `npm run check` | Lint, types and tests — the gate to keep at zero |
| `npm run lint` / `lint:fix` | ESLint, which enforces this project's conventions |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run e2e` | Whole scenarios against the real bot and a fake Telegram |
| `npm run e2e:watch` | The same run, slowed down, in one browser tab |
| `npm run e2e:play` | A chat in the browser to try things by hand |
| `npm run e2e:test` | Units for the harness's own pure parts |
| `npm run e2e:typecheck` | `tsc` over `e2e/`, which has its own config |
| `npm run docs:check` | Links, anchors, the source tree and the script table above |

Coverage and mutation write their reports into `reports/`, which is gitignored
whole — nothing about testing lands next to the source.

Occasional jobs stay out of that table and live behind one script, which lists
itself and what each one is for when run with no argument:

```bash
node scripts/tools.ts
```

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

The same run with a pause after every action, and **one browser tab** —
<http://127.0.0.1:8080>. Down the left is **every scenario by name**, marked as it
passes, fails or runs; the middle holds every world side by side as a live frame.
Picking a scenario from the list fills the page with that one chat and nothing else,
which is the way to answer "what is this group of tests actually doing". Each frame
is the chat: the messages as Telegram would show them, the inline keyboard, the
callback answers as toasts, the `/stats` picture, and a divider between scenarios so
nothing scrolls away.

It is one tab rather than one per world because **a tab opened by the operating
system cannot be closed again by the process that opened it** — five of them
outlived every run and had to be dismissed by hand.

**The chats stay readable after the run ends.** The hub keeps the last state of
every world and the pictures it drew, so the page still has everything when the
scenarios have finished and their bots are gone; it says so in the header rather
than looking broken. Ctrl+C in the terminal ends it.

```bash
npm run e2e:play
```

One chat, nobody driving it, pointed at the dev database. Type in the box and tap
the buttons — it is the same fake Telegram, so the bot cannot tell the difference.
Add `--db=data/somewhere.db` to keep an experiment out of the dev database.

The harness is deliberately walled off from the app, and it is **a release gate**:
`npm run e2e:changed` plays the scenarios a diff can reach.
[`e2e/README.md`](e2e/README.md) has its rules, `TECH-DEBT.md` has the one thing
still wrong with it.

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
    merge-names/        the /merge screen
    scoresheet/         the picture /stats sends back
    diagnostics/        the /status report about the bot itself
    language/           the /language screen that picks the chat's language
  shared/               config, lifecycle, locale, logging, repository,
                        telegram, text, timing — a folder per subject
assets/fonts/           the two faces the scoresheet is drawn with
docs/mockups/           the two posters this file shows, drawn by scripts/tools.ts
deploy/                 the systemd unit a server copy is installed from
scripts/                dev utilities that are not part of the bot
e2e/                    the fake Telegram and the scenarios played against it
```

Inside every feature the same three layers — `domain/` pure, `render/` pure,
`bot/` the impure edge — with imports pointing only downward, and specs and stubs
sitting next to the file they stand for. ESLint enforces it: a cross-feature import
and a framework import in `domain/` are both build errors.
[CLAUDE.md](CLAUDE.md#layers-live-inside-a-feature) has the rest.

## The other three documents

- **[PLAN.md](PLAN.md)** — what the bot does and why: the state machine, the data
  model, the invariants, the edge cases, and the design dead ends already paid for.
  Read it before changing behaviour.
- **[CLAUDE.md](CLAUDE.md)** — how the code here is written: style, layering,
  testing, and the gates a phase has to pass. Read it before writing code.
- **[TECH-DEBT.md](TECH-DEBT.md)** — what is deliberately unfinished, and the
  trigger that would make each item worth picking up.

`CLAUDE.md` opens with the question that decides which file a fact goes in.
