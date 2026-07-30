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

`/stats` draws a PNG, which needs the two font files in `assets/fonts/`. They are
committed, so a clone has them; the bot refuses to start without them, because a
missing font makes the renderer draw the picture with no text on it rather than
fail. Rasterizing uses `@resvg/resvg-js`, which ships a prebuilt binary per
platform — still no build step, but `npm install` now needs to be run on the
machine that will run the bot rather than copied from another one.

## Scripts

| Script | What it runs |
|---|---|
| `npm start` | The bot |
| `npm test` | Vitest, once — units and integration together |
| `npm run test:unit` | Only the unit specs, where everything outside the file is mocked |
| `npm run test:integration` | Only `*.integration.spec.ts` — the real grammY bot and a real SQLite file |
| `npm run test:coverage` | Vitest with coverage; fails below 70% on any metric |
| `npm run test:mutation` | Stryker, about two minutes; fails below 85% |
| `npm run check` | Lint, types and tests — the gate to keep at zero |
| `npm run lint` / `lint:fix` | ESLint, which enforces this project's conventions |
| `npm run typecheck` | `tsc --noEmit` |

Coverage and mutation write their reports into `reports/`, which is gitignored
whole — nothing about testing lands next to the source.

## Layout

A feature is a folder you can delete: nothing outside it imports it except the
composition root, which names the roster.

```
src/
  main.ts               names the features and wires them; starts polling
  feature-installer.ts  registers whatever features it was given
  features/
    live-game/          playing a game on a live card of buttons
    scoresheet/         the picture /stats sends back
  shared/               config, lifecycle, logging, repository,
                        telegram, text, timing — a folder per subject
assets/fonts/           the two faces the scoresheet is drawn with
```

Inside a feature the same three layers every time, and imports point only
downward:

```
features/scoresheet/
  domain/        the pure core — no framework, no I/O
  render/        state in, SVG out; still pure
  bot/           the impure edge: grammY, rasterizing
  copy.en.ts     every string this feature shows a user
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
