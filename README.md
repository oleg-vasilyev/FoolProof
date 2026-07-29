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
| `/stats` | How the current session is going, as a text bar chart |
| `/help` | What the commands do and how the card works |

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

The database is a single SQLite file under `data/` (gitignored). Backing it up is
copying that file.

## Scripts

| Script | What it runs |
|---|---|
| `npm start` | The bot |
| `npm test` | Vitest, once |
| `npm run test:coverage` | Vitest with coverage; fails below 70% on any metric |
| `npm run test:mutation` | Stryker, about two minutes; fails below 85% |
| `npm run check` | Lint, types and tests — the gate to keep at zero |
| `npm run lint` / `lint:fix` | ESLint, which enforces this project's conventions |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

```
src/
  main.ts        the composition root: builds everything, wires it, starts polling
  features/
    game/        the state machine — a pure reducer, no I/O of any kind
    render/      state in, message text and inline keyboard out; also pure
    bot/         the impure layer: grammY handlers, debounced edits, the idle sweep
  shared/        env, logger, debounce, database and the repository
```

Imports point only downward, and ESLint enforces it.

## The other two documents

- **[PLAN.md](PLAN.md)** — what the bot does and why. The state machine, the data
  model, the invariants, the edge cases, and the design dead ends already paid
  for. Read this before changing behaviour.
- **[CLAUDE.md](CLAUDE.md)** — how the code here is written. Style, layering,
  testing, and the gates a phase has to pass. Read this before writing code.

The split is one question: *would this still be true if the bot were rewritten in
Python?* If yes it is in `PLAN.md`; if no it is in `CLAUDE.md`.
