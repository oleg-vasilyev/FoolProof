# FoolProof — a Telegram bot for tracking games of Durak

## Purpose

The bot lives in a group chat of friends. It records games of Podkidnoy Durak:
who dealt first, in what order players went out, who was left the fool. It reports
statistics for the session and for arbitrary periods.

The key constraint: input happens on a Friday evening, on a phone, one-handed,
between games. Any friction in input kills the product. Optimise for the number
of taps, not for completeness of data.

## Stack

- Node 24+, TypeScript
- grammY (better typed than telegraf)
- SQLite through the built-in `node:sqlite` module
- No ORM, no query builder
- Long polling for development, webhook for production

SQLite rather than the originally proposed PostgreSQL. This is one group chat of
friends playing a few games a week — the write rate is a handful of rows an
evening, and the whole dataset will fit in a file smaller than a photo for years.
`node:sqlite` ships with Node, so there is no dependency, no daemon, no
connection string and no container to keep alive for a bot that must simply be
running on a Friday night. Backup is copying one file.

What this costs: a single writer, so the bot stays one process. That is already
true — a Telegram bot with long polling is one process by nature. If the product
ever outgrows it, the repository interface is the only thing that has to change.

## Language

Everything the bot says is **English** — this is built as an international product
from the start. All user-facing strings live in a single module so that adding a
locale never means grepping the codebase. Choosing a locale per chat is out of
scope for the first version; the seam that makes it possible is not.

Player names are user data, not copy: they may be in any script and are stored and
displayed exactly as typed.

## Code style

- Functional style, `const` over `let`
- **No comments in code.** Neither English nor Russian. The code must be
  self-documenting through naming
- Strict TypeScript, `strict: true`, no `any`

---

## Commands

Latin characters and lower case only — a Telegram requirement.

| Command | Behaviour |
|---|---|
| `/game Oleg, Anya, Roma` | Open a game. The list is the seating order around the table, clockwise |
| `/next` | A new game with the same line-up |
| `/stats` | Statistics for the latest session |

The parser must strip the `@foolproof_bot` suffix — Telegram appends it in groups
that contain more than one bot.

### Parsing the player list

Separators: `,`, `->`, `→`, `>`, newline. Trim every name.
**Do not use an LLM** — the latency is unacceptable.

Names may be in any script — the parser must not assume latin. Normalisation when
matching against existing players: Unicode NFC, lower case, and `ё` → `е` for
Cyrillic input. Merging duplicate players is done by hand in the database and is
not automated in the first version.

### `/game` and `/next` while a card is live

Both commands behave identically: no new card is created, and the bot answers
**as a reply to the live card** with the text "A game is already in progress". The
reply serves as both the answer and the navigation — tapping the quote scrolls to
the card.

A consequence: to change the line-up, the live card has to be closed first — by
Confirm or by Cancel. In the normal flow there is no friction, since a game ends
with Confirm anyway. The extra tap only appears if `/next` was already pressed and
only then does someone remember that Veronika has left: Back down to phase 1,
Cancel, then `/game`.

---

## Card state machine

```
PICK_STARTER --tap on a name--> RECORDING
PICK_STARTER --Cancel--------> CANCELLED (terminal)

RECORDING --tap on a name----> RECORDING (position += 1)
RECORDING --Back------------> RECORDING (drop the last one, recompute)
RECORDING --Back, no exits yet--> PICK_STARTER (starter is reset)
RECORDING --one player left--> READY (the last one is the fool, automatic)
RECORDING --Draw------------> READY (the two remaining share a position)

READY --Confirm-------------> FROZEN (terminal, written to the database)
READY --Back----------------> RECORDING

ANY live state --3 h idle--> ABANDONED (terminal, NOT written to the database)
```

`CANCELLED` and `ABANDONED` are never written to the database at all. This is a
deliberate decision: losing one unfinished game a month is cheaper than dragging a
`nullable position` through the whole schema.

`FROZEN` is irreversible. The keyboard is removed entirely and the result stays in
the text. There is no separate rollback command.

### When buttons appear

- **Draw** — exactly when two unmarked players remain, that is after `n − 2` taps.
  In a two-player game it is available immediately, before a single tap
- **Confirm** — once every position is determined. It replaces Draw; the two never
  coexist
- **Back** — always in phase 2, absent in phase 1
- **Cancel** — only in phase 1

### Tapping "Draw"

Both remaining players are given the same position and the card moves to `READY`.
The game is not closed — Confirm is still required. Back rolls the draw back.

---

## Telegram keyboard rules

Three things that **do not exist** in the Bot API — do not try to implement them:

1. **Button colours.** `InlineKeyboardButton` has no style field. State is conveyed
   by an emoji in the button text and by the body of the message above the keyboard
2. **Disabled buttons.** They cannot be greyed out. A button either exists or it does not
3. **Drag and drop.** An inline keyboard is taps only

### Button format

```
✅ 1 Oleg     ← went out first
✅ 2 Roma     ← went out second
Anya          ← still in the game
💀 3 Anya     ← the fool, set automatically
🤝 Draw
✔️ Confirm
↩️ Back
✖️ Cancel
```

### Message body

Above the keyboard — a readable order; it matters more than the button captions:

```
Game 3 · 5 at the table
Dealt first: Oleg

1. Oleg
2. Roma
— still in: Anya, Dima
```

### Button order

Strictly matches the seating and **never changes** over the course of a game or a
session. Muscle memory matters more than tidiness — a person reaches for the place
where the name was last time.

---

## Technical requirements for callbacks

- `callback_data` is limited to 64 bytes. Do not put names in it.
  Format: `<game_id_b62>:<action>:<slot>:<state_version>`
- `state_version` is incremented on every transition. A callback that arrives with
  an old version → `answerCallbackQuery` with the text "Card updated", and the
  state is left unchanged. This protects against double taps under lag and against
  simultaneous taps from several people
- Every accepted tap gets an `answerCallbackQuery` with a short text ("Oleg — 1").
  Without it, lag makes it look like the tap did not register and the person taps
  a second time
- Debounce edits by 300–500 ms. In groups Telegram throttles at roughly 20 messages
  per minute, and `editMessageText` counts

---

## Data model

```sql
CREATE TABLE players (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id      INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_players_chat ON players(chat_id);

CREATE TABLE games (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id           INTEGER NOT NULL,
  message_id        INTEGER NOT NULL,
  state             TEXT NOT NULL,
  state_version     INTEGER NOT NULL DEFAULT 0,
  starter_player_id INTEGER REFERENCES players(id),
  started_at        TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at      TEXT,
  last_touched_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_games_chat_started ON games(chat_id, started_at);

CREATE UNIQUE INDEX idx_games_one_live ON games(chat_id) WHERE confirmed_at IS NULL;

CREATE TABLE game_players (
  game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id  INTEGER NOT NULL REFERENCES players(id),
  seat_index INTEGER NOT NULL,
  PRIMARY KEY (game_id, player_id)
);

CREATE TABLE game_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id   INTEGER NOT NULL REFERENCES players(id),
  position    INTEGER NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  actor_tg_id INTEGER NOT NULL
);
CREATE INDEX idx_game_events_game ON game_events(game_id);
```

Three SQLite specifics that are easy to get wrong:

- **`PRAGMA foreign_keys = ON` on every connection.** SQLite ignores foreign keys
  by default, and the `ON DELETE CASCADE` above is what keeps a cancelled game
  from leaving orphaned rows behind
- **Timestamps are TEXT** in `datetime('now')` form — `YYYY-MM-DD HH:MM:SS`, always
  UTC. That format sorts lexicographically, so `ORDER BY started_at` is correct
  without parsing
- **Telegram IDs go in INTEGER columns.** SQLite integers are 64-bit and the Bot
  API caps IDs at 52 significant bits, so they survive the round trip through a JS
  number

### A live card is a row; a dead one is not

A live card lives in `games` with `confirmed_at IS NULL` — it has to survive a
restart, since the message is already posted in the chat. Confirm sets
`confirmed_at`. **Cancel and abandonment `DELETE` the row**, which is what "never
written to the database" means in practice: nothing partial is ever left behind
for statistics to trip over.

The partial unique index makes invariant 1 the database's problem rather than the
code's — a second live card in one chat is rejected by the engine, not by a check
someone has to remember to write.

### Seating is normalised

`Oleg, Anya, Roma` and `Roma, Oleg, Anya` describe the same table. When writing
`seat_index`, the list is **rotated so that the player with the smallest `player_id`
ends up in position zero**. Without this, neighbour analytics falls apart.

### A session is computed, not a table

A session is a chain of games where consecutive starts are less than 3 hours apart.
Implement it with a window function over `games.started_at` rather than storing a
`series_id`. Then the threshold changes in one line, with no data migration.

```sql
CREATE VIEW game_series AS
SELECT *, SUM(new_series) OVER (PARTITION BY chat_id ORDER BY started_at) AS series_no
FROM (
  SELECT *,
    CASE
      WHEN LAG(started_at) OVER (PARTITION BY chat_id ORDER BY started_at) IS NULL
        OR unixepoch(started_at)
           - unixepoch(LAG(started_at) OVER (PARTITION BY chat_id ORDER BY started_at))
           > 3 * 3600
      THEN 1 ELSE 0
    END AS new_series
  FROM games WHERE confirmed_at IS NOT NULL
);
```

Window functions need SQLite 3.25+ and `unixepoch()` needs 3.38+; the build
bundled with Node 24 is well past both.

---

## Invariants

1. **Exactly one live card per chat.** Enforced by the partial unique index, not
   by a check in the code
2. **Positions are dense.** They run consecutively from 1 with no gaps. The last
   position may be duplicated — that is a draw. Duplicates in the middle are
   forbidden. Do not add `UNIQUE(game_id, position)`
3. **Removing an exit recomputes the positions.** A position is an ordinal, not an
   identifier. Remove the second player and the third becomes the second
4. **`game_events` holds a `player_id`, never a name.** This makes manual merging of
   duplicate players trivial: repoint the foreign key
5. **`actor_tg_id` is written on every event.** It gives the "who keeps the records"
   metric
6. **A game in `FROZEN` is immutable**

---

## Edge cases

| Situation | Behaviour |
|---|---|
| A player sits a game out | A new `/game` without them; there must be no live card |
| Two players go out at once mid-game | Record them in tap order. Acceptable noise |
| A draw in a two-player game | The button is available from the very start |
| A single player in the list | Reject, a minimum of two |
| Duplicate names in one `/game` | Reject with a message |
| An unknown name | Create the player silently. Merging is manual |

---

## Out of scope for the first version

- `/stats` beyond statistics for the latest session
- A Telegram Mini App and a dashboard
- AI analytics
- The trump suit and validation of the first move
- Automatic merging of duplicate players

## On AI analytics, once we get to it

On 20–50 games an LLM will happily invent patterns that are not there. Compute the
metrics deterministically in code and hand the LLM **only the finished numbers**,
with an explicit ban on deriving new correlations. Plus a significance threshold —
let the bot say "not enough data" instead of producing a pretty fabrication.
