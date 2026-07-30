# FoolProof — a Telegram bot for tracking games of Durak

This is the specification: what the bot does and why. Behaviour, the state
machine, the data model, the invariants, and the design dead ends already paid
for. How the code is written lives in `CLAUDE.md`; how to run the bot lives in
`README.md`.

The dividing question is whether a fact would survive a rewrite in another
language. The Bot API's limits, the transitions and the schema would — so they
are here. Naming, layering and test conventions would not — so they are not.

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
- Long polling, and only long polling

SQLite rather than the originally proposed PostgreSQL. This is one group chat of
friends playing a few games a week — the write rate is a handful of rows an
evening, and the whole dataset will fit in a file smaller than a photo for years.
`node:sqlite` ships with Node, so there is no dependency, no daemon, no
connection string and no container to keep alive for a bot that must simply be
running on a Friday night. Backup is copying one file.

What this costs: a single writer, so the bot stays one process. That is already
true — a Telegram bot with long polling is one process by nature. If the product
ever outgrows it, the repository interface is the only thing that has to change.

Long polling and no webhook, for the same reason. A webhook needs a public HTTPS
address with a valid certificate — a domain, a reverse proxy, a VPS — which is
real infrastructure for a bot that runs on a laptop. Polling inverts who dials
whom: the bot reaches out, so it works from behind NAT with nothing exposed and
no secret to verify. The cost is a couple of hundred milliseconds between a tap
and the card updating, which nobody will notice, and a process that has to
actually be running on a Friday evening. A webhook earns its keep at thousands of
chats; this is one.

## Language

Everything the bot says is **English** — this is built as an international product
from the start. All user-facing strings live in a single module so that adding a
locale never means grepping the codebase. Choosing a locale per chat is out of
scope for the first version; the seam that makes it possible is not.

Player names are user data, not copy: they may be in any script and are stored and
displayed exactly as typed.

---

## Commands

Latin characters and lower case only — a Telegram requirement.

| Command | Behaviour |
|---|---|
| `/game Oleg, Anya, Roma` | Open a game. The list is the seating order around the table, clockwise |
| `/next` | A new game with the same line-up |
| `/help` | What the commands do and how the card works |
| `/stats` | The latest session as a rendered image — chronology plus running score |

The bot publishes this list through `setMyCommands` on every start, so the
commands show up in Telegram's `/` menu instead of having to be typed from
memory. A command that is not implemented yet stays out of the menu.

The parser must strip the `@foolproof_bot` suffix — Telegram appends it in groups
that contain more than one bot.

A command is an ordinary text message with an entity on it, which every framework
routes accordingly: **command handlers must be registered before any general text
handler**. A text handler that returns without passing the update along silently
swallows every command below it. This has already happened here once, and the
symptom is the worst kind — nothing fails, the commands simply stop existing.

### `/game` with no names

Tapping a command in Telegram's `/` menu sends it immediately — the client gives
no chance to type arguments, and no Bot API setting changes that. So a bare
`/game` is not an error: the bot replies with a `force_reply` prompt, the client
opens the input field with that message quoted, and the names arrive in the next
message. This also survives privacy mode, which hides ordinary group chatter from
bots but always delivers replies to the bot's own messages.

The answer is recognised by matching `reply_to_message` against the bot's own id
and the exact prompt text, so no state is needed to read it.

Two rules keep the prompt from becoming litter, both learned the hard way:

- **The prompt must itself be a reply to the command.** `selective: true` only
  targets someone if the message either @mentions them or replies to theirs. A
  standalone prompt with `selective` set targets nobody in particular, and the
  reply interface behaves erratically.
- **Delete a prompt only if it goes unanswered.** There is no API call to withdraw
  a `force_reply`, so a prompt nobody replied to would keep the reply pending in
  the chat's draft indefinitely. `/game` and `/next` therefore clear any prompt
  still standing, and at most one is ever live per chat. An **answered** prompt
  must be left alone: deleting it turns the quote inside the player's own reply
  into "Deleted message", which is permanent and looks worse than the draft it was
  meant to fix.

More generally: deleting a message that something else quotes is not a clean
undo. The quote survives as a tombstone, and unlike a stale draft it cannot be
cleared.

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

Five things that **do not exist** in the Bot API — do not try to implement them,
and do not accept a design that assumes them:

1. **Button colours.** `InlineKeyboardButton` has no style field. State is conveyed
   by an emoji in the button text and by the body of the message above the keyboard.
   The emoji's *own* colour is the only lever there is — `❌` reads red where `✖️`
   reads grey, `✅` green where `✔️` reads grey
2. **Disabled buttons.** They cannot be greyed out. A button either exists or it does not
3. **Drag and drop.** An inline keyboard is taps only
4. **Font size and colour.** Message text allows only bold, italic, underline,
   strikethrough, spoiler, code, pre, blockquote and links. Hierarchy has to come
   from weight and wording. Unicode pseudo-fonts (𝐁𝐨𝐥𝐝, 𝓼𝓬𝓻𝓲𝓹𝓽) are not a
   workaround — they break search and screen readers, and they look cheap
5. **Button label alignment.** Captions are always centred, so buttons of different
   text length will never line up with each other

### Button format

```
✅ 1 Oleg     ← went out first
✅ 2 Roma     ← went out second
Anya          ← still in the game
💀 Anya       ← the fool, set automatically
🤝 Anya       ← shared last place after a draw
🤝 Draw
✔️ Confirm
↩️ Back
✖️ Cancel
```

Exactly three emoji carry meaning on player buttons — done, fool, draw. Medals for
the top three were tried and reverted: at button size they read as
indistinguishable coloured dots, and a row of them makes the card look cheaper,
not richer.

### Message body

**The live card does not repeat the standings.** The buttons already are the
table — every name carries its own position — so a list above them says the same
thing twice and costs a screenful of height on a phone. The body carries only
what the keyboard cannot: which game this is and who dealt.

```
<b>Game 3</b>
Dealt first: <b>Oleg</b>
```

**And it stops changing once the starter is picked.** A progress line and a
"tap Confirm" prompt were both tried and removed: text that grows and shrinks
makes the message reflow under the keyboard on every tap, and the twitch is more
distracting than the line is useful. After the starter is chosen the body is
frozen and only the buttons move.

The standings appear exactly once, on Confirm, because that is the moment the
keyboard disappears and the text becomes the only record left in the chat:

```
<b>Game 3</b>
Dealt first: <b>Oleg</b>

1 · Oleg
2 · Roma
3 · Dima
4 · Kim
5 · <b>Anya</b> — fool
```

The table size is not printed anywhere — the buttons are the table, and counting
them is easier than reading a number.

After a draw, both players share the last number and are labelled `draw`. A
monospace `<pre>` block was tried for column alignment and reverted: Telegram
renders it as a code block with a "copy" header, which is meaningless for a
scoreboard.

**Player names are user data and must be HTML-escaped** before they reach the
message body — a player called `Аня & Оля` would otherwise break the markup and
one called `<b>x</b>` would inject it. Button captions are the opposite case
entirely: Telegram does not parse HTML there, so escaping them would show
`&amp;` literally.

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

### `/stats`

A rendered PNG of the current session, sent with `sendPhoto`. Two stacked parts:

- **The chronology.** One column per player, one row per game. The cell holds the
  place that player took; black means they sat that game out, red means they were
  the fool, teal means the game was drawn. Reading down a column is one person's
  evening; reading across a row is one game.
- **The cumulative score.** One line per player against game number, so the shape
  of the evening — who pulled away, who never recovered — is visible at a glance.

A text bar chart came first and was replaced. It was accurate and unreadable: two
tallies cannot show *when* anything happened, and the evening's story is entirely
in the sequence. The earlier tombstone against images cited a native dependency
and a third-party chart service; only the first is still true, and it is now
accepted deliberately. Nothing about the players leaves the machine.

**A place is worth `players_in_that_game − place`.** The fool always scores zero,
a win at a table of six is worth more than a win at a table of three, and both
players of a draw score the same. A fixed scale was rejected: it would pay the
same for beating two people as for beating five.

**A draw counts as neither a win nor a fool.** A shared last place means nobody
was the fool that game, so the cell is teal rather than red.

#### What Telegram does to the image

Measured against the Bot API rather than taken from the documentation, because the
failure is silent:

| Sent | Kept |
|---|---|
| 1440×2275 | unchanged |
| **1620×2560** | **unchanged** |
| 2000×3160 | downscaled to 1620×2560 |
| 320×6400 | downscaled to 128×2560 |
| 4000×6320 | rejected, `PHOTO_INVALID_DIMENSIONS` |

Three limits: **the long side must not exceed 2560**, the aspect ratio must not
exceed 20, and the sides must sum to under 10000. `sendPhoto` always re-encodes to
JPEG; at 1620 wide the loss measures 46.8 dB against the source, against 37.7 dB
at 1080, so the artefacts that are visible on a phone at 1080 are effectively gone
at 1620.

**Do not render larger than 1620×2560 hoping for more detail.** Anything longer is
downscaled by the server, which costs real pixels of text. Oversampling on purpose
— rendering at 3240 and letting Telegram halve it — was measured and produces
identical sharpness with 6 dB worse fidelity and 2.3× the upload, so it buys
nothing.

`sendDocument` was measured too: it returns the PNG byte-identical at any size,
including 4000×6320. It is rejected anyway, because the chat shows a file card
with a 203×320 thumbnail instead of the picture, and the point of the sheet is to
be glanceable without a tap.

#### Fitting a long evening

The height budget is fixed at 2560, so the number of games is what has to give.
Row height is `clamp(available ÷ games, 26, 56)` pixels: at 22 games the rows are
full size, at 40 they are 30. Past roughly 47 games the rows would fall below the
floor, so the sheet keeps the **most recent** 47 and says so in the corner. Being
honest about the omission matters more than fitting everything.

The header date is the UTC date of the session's first game. Late-evening games
can therefore be stamped with the following day. A configured timezone is the fix
on the day it bothers anyone; inventing one would be worse.

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

- `/stats` beyond the current session — no arbitrary periods, no all-time table
- A Telegram Mini App and a dashboard
- AI analytics
- The trump suit and validation of the first move
- Automatic merging of duplicate players

## On AI analytics, once we get to it

On 20–50 games an LLM will happily invent patterns that are not there. Compute the
metrics deterministically in code and hand the LLM **only the finished numbers**,
with an explicit ban on deriving new correlations. Plus a significance threshold —
let the bot say "not enough data" instead of producing a pretty fabrication.
