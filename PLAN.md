# FoolProof — a Telegram bot for tracking games of Durak

This is the specification: what the bot does and why. Behaviour, the state
machine, the data model, the invariants, and the design dead ends already paid
for. How the code is written lives in `CLAUDE.md`; how to run the bot lives in
`README.md`.

The dividing question is whether a fact would survive a rewrite in another
language. The Bot API's limits, the transitions and the schema would — so they
are here. Naming, layering and test conventions would not — so they are not.

What is deliberately unfinished lives in **`TECH-DEBT.md`**: the end-to-end
harness, which is parked rather than abandoned, and the files most likely to be
awkward to change next. A thing is only in that file if it has a trigger saying
when it becomes worth doing — otherwise it belongs here as an edge case, or it
belongs in a commit.

## Purpose

The bot lives in a group chat of friends. It records games of Podkidnoy Durak:
who went first, in what order players went out, who was left the fool. It reports
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
address with a valid certificate — a domain, a reverse proxy, an open port —
which is real infrastructure for a bot a handful of friends use. Polling inverts
who dials whom: the bot reaches out, so it works from behind NAT with nothing
exposed and no secret to verify. Moving it off a laptop and onto a host did not
change that: the host accepts nothing from the internet at all, which is most of
why the move was an afternoon. The cost is a couple of hundred milliseconds between a tap
and the card updating, which nobody will notice, and a process that has to
actually be running on a Friday evening. A webhook earns its keep at thousands of
chats; this is one.

## Language

The bot speaks **English or Russian, and a chat picks which**. `/language` opens a
screen of one button per language, marked with the one in use; a tap stores the
choice and the chat is spoken to in it from then on — messages, buttons, `/help`,
and the words on both `/stats` pictures.

**A chat that has never chosen is spoken to in English**, which is what every chat
got before this existed. The choice is a row in `chat_locales`, so it survives a
restart, and nothing is inferred from the Telegram language of whoever happened to
type first: the language belongs to the table, not to a player.

The command **names** stay Latin in both languages — `/game`, `/next_without` — because
Telegram allows nothing else. Their *descriptions* are republished for that chat
with `setMyCommands` scoped to it the moment the language changes, so the `/` menu
matches what the bot says. A chat that never chose keeps the global English menu.
Telegram keeps serving a scoped menu until it is explicitly replaced, so **every
start republishes the scoped menu of every chat in `chat_locales`** after the global
one — without that, a chat that once chose would keep an outdated command list after
an update until somebody happened to open `/language` again. A stored locale the
bot no longer speaks is skipped quietly on that pass: unreachable while `/language`
only stores known languages, but decided rather than accidental.

Two consequences worth stating, because both are easy to get wrong:

- **A count picks its word from the language, not from English.** Russian needs three
  forms (`1 партия`, `2 партии`, `5 партий`) where English needs two, so a copy table
  holds the forms and the rule lives outside it. Getting this wrong is invisible in
  English.
- **A reply-keyboard prompt is matched against every language's text.** `/game` with
  no names asks a question and reads the answer by matching the quoted prompt; a chat
  that switched language between the question and the answer would otherwise lose the
  reply.

Player names are user data, not copy: they may be in any script and are stored and
displayed exactly as typed. Adding a third language means an entry in the language
table, one more `copy.<code>.ts` per feature, a case in each feature's `copy.ts`, and
a plural rule if the language needs one — the compiler names every one of those, and
nothing else changes.

---

## Commands

**The command list itself lives in [README.md](README.md#commands)** — one table, in
the file where a person looks it up. This section owns what each one has to *do*,
and the rules that apply to all of them.

Names are lower-case Latin, digits and `_` only — a Telegram requirement, which is
why the pair that adds and removes players is `/next_with` and `/next_without`
rather than anything hyphenated.

The bot publishes the list through `setMyCommands` on every start, so the
commands show up in Telegram's `/` menu instead of having to be typed from
memory. A command that is not implemented yet stays out of the menu.

The parser must strip the `@foolproof_bot` suffix — Telegram appends it in groups
that contain more than one bot.

A command is an ordinary text message with an entity on it, which every framework
routes accordingly: **command handlers must be registered before any general text
handler**. A text handler that returns without passing the update along silently
swallows every command below it. This has already happened here once, and the
symptom is the worst kind — nothing fails, the commands simply stop existing.

### The first contact is a button, and it has to be answered

Telegram puts a **START** button in front of anyone who opens the bot for the first
time, and tapping it sends `/start`. A bot that never registers the command answers
that tap with nothing — and the profile description Telegram was showing disappears
the moment the chat holds a message, so the newcomer is left looking at their own
`/start` and silence. That is the first impression, and it reads as broken.

So `/start` answers with what the bot is, the one thing to do next, and a pointer to
`/help` for the rest. It does not repeat the profile description, which was on the
screen a second earlier.

In a **private** chat the reply carries a single inline button — a `?startgroup=true`
deep link built from the bot's own username — because one-on-one the bot has nothing
to do: a game needs a table, and the table is in a group. That button is the only
one-tap path there; without it the newcomer has to find "Add to Group" in the bot's
profile menu. In a **group** both the invitation and the button are dropped, since
the bot is already where it belongs.

`/start` stays out of `setMyCommands`: Telegram renders it as a button of its own, so
a menu row would buy nothing.

### A command with no names asks for them

Tapping a command in Telegram's `/` menu sends it immediately — the client gives
no chance to type arguments, and no Bot API setting changes that. So a bare
`/game` is not an error: the bot replies with a `force_reply` prompt, the client
opens the input field with that message quoted, and the names arrive in the next
message. This also survives privacy mode, which hides ordinary group chatter from
bots but always delivers replies to the bot's own messages.

`/next_with` and `/next_without` do the same, with their own question and their
own placeholder, because a menu tap is exactly how they will usually be sent.

The answer is recognised by matching `reply_to_message` against the bot's own id
and then looking the **exact prompt text** up in a table of the three questions —
which is what makes three questions share one slot per chat without any state:
the quote inside the player's own reply says which one is being answered.

A reply that still names nobody is refused in words rather than asked again. A
second `force_reply` on the same question reads as a bot stuck in a loop, and in
a group it drags everyone else's input field open with it.

Two rules keep the prompt from becoming litter, both learned the hard way:

- **The prompt must itself be a reply to the command.** `selective: true` only
  targets someone if the message either @mentions them or replies to theirs. A
  standalone prompt with `selective` set targets nobody in particular, and the
  reply interface behaves erratically.
- **Delete a prompt only if it goes unanswered.** There is no API call to withdraw
  a `force_reply`, so a prompt nobody replied to would keep the reply pending in
  the chat's draft indefinitely. Every command that opens a card therefore clears
  any prompt still standing, and at most one is ever live per chat. An **answered** prompt
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
Cyrillic input. Normalisation catches a different case, not a different spelling:
`Анна` and `Аня` are two players until somebody merges them — see
[Merging two names into one](#merging-two-names-into-one).

### What a name and a table may not be

Three limits, each of which the bot had none of until somebody tried:

- **A table seats at most ten.** Not a rule of the game — the game is played with
  far fewer — but the number the rest of the design can carry: the seating screen
  puts the whole roster in `callback_data`, and ten six-digit player ids in base 62
  reach 49 of the 64 bytes the Bot API allows. Above thirteen it would not fit at
  all, so the cap is where the margin is comfortable rather than where the format
  gives out. `/game`, `/next_with` and everything that opens a card refuse past it.
- **A name is at most 32 characters**, counted in characters so an emoji costs one.
  Longer than that is unreadable on a button, and a 4000-character name pasted into
  `/game` would have made the *refusal* too long for Telegram to deliver — which is
  why the refusal names the culprit shortened, never whole.
- **A name has to be visible.** Characters in Unicode's format and control classes
  are stripped before anything else happens, so a name made only of a zero-width
  space is no name at all and is dropped like an empty one. Two consequences worth
  stating: what is stored is what is visible, and `Roma` cannot be smuggled in twice
  by hiding a joiner in the middle of one of them.

None of this is validation for its own sake. Each one is a refusal the bot can
explain, in place of a table nobody can read, a message Telegram will not send, or a
player nobody can see.

### Who goes first, and who decides

At a new table nobody can know: the first move goes to whoever drew the lowest
trump, which happens in the room. So `/game` asks, and phase 1 exists.

At a table that has just played, the house rule decides it and the bot can apply
it. The fool is attacked first, so the player seated **immediately before them**
opens the next game — one seat back in the ring, wrapping past the start.
A `/next` card therefore opens already in `RECORDING`, with that player shown.

It asks anyway whenever it cannot name one loser. A game closed with Draw leaves
two players sharing last place, and a game confirmed with nothing recorded leaves
none; either way the answer is "not exactly one", and the card falls back to
phase 1. Getting it wrong costs one Back, which resets the starter. A merge is
*not* one of these cases — it repoints the loss onto the keeper before deleting
the absorbed row, which is invariant 4.

`/next_with` and `/next_without` always ask, because the table changed and a new
trump was drawn for it.

### Changing the table between games

`/next_with Zhenya, Sasha` and `/next_without Oleg` take the last line-up and add
or remove names, so the usual "somebody arrived, somebody went home" does not
force the whole list to be typed again.

The two are not symmetrical, and the asymmetry is the whole design. **Removing
somebody keeps the ring**: everyone left sits where they sat, the gap closes, and
`/next_without` opens the card straight away. **Adding somebody destroys it** — a
new player sits wherever there is room, and the bot has no way to guess where.
Appending them to the end was the first attempt and it was wrong: the ring is
load-bearing now that `/next` reads it, so a guessed seat silently deals the wrong
person in one game later. So `/next_with` asks — see [Taking
seats](#taking-seats).

Both refuse rather than guess, because a name is how the bot identifies a person
and a silently accepted typo becomes a second player:

- a name repeated in the argument
- `/next_with` naming somebody already at the table
- `/next_without` naming somebody who was not
- `/next_without` leaving fewer than two players

Tapped from the `/` menu they arrive with no argument, and each answers with its
own `force_reply` question — see [A command with no names asks for
them](#a-command-with-no-names-asks-for-them).

**The refusal happens before any player row is created.** `/next_with Zhenya,
Oleg` with Oleg already seated must not leave a new `Zhenya` behind — that is
invariant 7 in the other direction, and the reason the check reads names rather
than resolved ids.

### Taking seats

Once `/next_with` knows who is joining it shows a screen of its own: everyone at
the new table, one per row, tapped in the order they sit. Each tap moves that name
above the unplaced ones and marks it with its seat number. The second-to-last tap
finishes the screen, because the final seat has nowhere else to go — a table of
five costs four taps, not five plus a confirmation.

It is deliberately not the card. The card is about one game; this is about who sits
where, it precedes the game, and a player who cannot tell the two screens apart will
record a game that never happened. Hence a heading of its own and 🪑 rather than the
card's ✅.

**No game is written down while the screen is open.** No game row exists, so `/game`
is not blocked and there is nothing for the idle sweep to abandon. The joiners are
the exception and have to be: the screen carries player ids rather than names, so
their rows exist before it is drawn. Cancel therefore sweeps the chat's unplayed
players the way cancelling a card does, and a mistyped `/next_with Kmi` leaves
nothing behind. Walking away without cancelling does leave `Kmi` in the roster until
some later cancelled card sweeps it — the card has an idle sweep covering that case
and this screen has nothing to sweep, which is the one place it is weaker.

The order chosen so far lives in `callback_data`, the same way
[the `/merge` screen](#merge-has-no-state) keeps its selection, which is what makes
the screen immune to a restart. Player ids are written in base 62 so that a table of
ten with six-digit ids still fits the Bot API's 64 bytes; the codec's spec asserts
that budget rather than trusting it.

Two things can have changed by the time the last seat is taken, and both are checked
then rather than assumed: a player named on the screen may have been merged away —
the screen refuses as out of date — and a game may have been started in the meantime,
which refuses the same way any second card does. When the ring does settle it is
re-normalised — see [Seating is normalised](#seating-is-normalised) — the screen is
replaced by the ring it produced, and the card opens with the deal still to be picked
by hand, because a new player changes who holds the lowest trump.

### Asking for a card while one is live

Every command that opens a card behaves identically: no new card is created, and
the bot answers
**as a reply to the live card** with the text "A game is already in progress". The
reply serves as both the answer and the navigation — tapping the quote scrolls to
the card.

A consequence: to change the line-up, the live card has to be closed first — by
Confirm or by Cancel. In the normal flow there is no friction, since a game ends
with Confirm anyway. The one awkward moment is pressing `/next` and only then
remembering that Veronika has left: Cancel, then `/next_without Veronika`. Cancel
is available immediately because nothing has been recorded yet, which is why it is
no longer tied to phase 1.

---

## Card state machine

```
PICK_STARTER --tap on a name--> RECORDING
PICK_STARTER --Cancel--------> CANCELLED (terminal)

(a /next card skips PICK_STARTER and opens in RECORDING)

RECORDING --Cancel, nothing recorded--> CANCELLED (terminal)
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
- **Cancel** — while nothing is recorded: all of phase 1, and phase 2 until the
  first exit or a Draw. A card that opened with the deal already filled in would
  otherwise cost a Back before it could be thrown away

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
Went first: <b>Oleg</b>
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
Went first: <b>Oleg</b>

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
  simultaneous taps from several people. The card is also redrawn, because the
  mismatch may mean the *message* is the stale one — see
  [What survives a failure](#what-survives-a-failure)
- Every accepted tap gets an `answerCallbackQuery` with a short text ("Oleg — 1").
  Without it, lag makes it look like the tap did not register and the person taps
  a second time
- Debounce edits by 300–500 ms. In groups Telegram throttles at roughly 20 messages
  per minute, and `editMessageText` counts
- A tap reaches the screen that owns it, never the one registered first. Each
  screen's data has a shape of its own — the live card's `<game_id_b62>:…` and the
  merge screen's `m:…` cannot be mistaken for each other — and the bot routes on
  that shape. A tap matching no shape is answered anyway, so a button from an
  older version of the bot says so instead of spinning forever

---

## Merging two names into one

Somebody types `Анна` once and `Аня` every other time, and the evening ends with a
sixth player who played one game. The chart is then wrong in a way no amount of
care during the game prevents, because the typo is only visible afterwards.

`/merge` puts the whole roster on screen as one button per name, each carrying how
many games that name has played — `Аня · 12` beside `Анна · 1` is the diagnosis.
**The first tap names the player that stays**; every later tap names one being
folded into it. That is the whole mechanic, and it needs no second screen: the
order of the taps carries the information that a second screen would have asked
for. The message reads the decision back as a sentence — `Анна → Аня` — before
anything is confirmed.

The roster is sorted by name, which puts variants of one name next to each other
for free.

| State | Screen | Controls |
|---|---|---|
| Nothing picked | Asks for the name to keep | `❌ Cancel` |
| One name picked | Says that name keeps its own | `↩️ Back` |
| Two or more | `Анна → Аня` plus what Аня will have | `↩️ Back` `✅ Confirm` |

`↩️ Back` drops the last name picked, the same meaning it has on the card.
Tapping an already-picked name lets it go; if that name was the keeper, the next
one picked becomes the keeper — the sentence on screen simply changes.

**The selection lives in `callback_data`, not in the database.** The screen is
rebuilt from the buttons that were tapped, so it survives a restart exactly the
way a live card does, and there is no new table and no state to go stale. The cost
is the 64-byte limit: at most **six names** in one merge, refused with a notice
past that. Six is what fits with room for seven-digit player ids, and merging six
misspellings of one name in one sitting is already beyond anything real.

Two refusals, both stated in words rather than swallowed:

- **They played the same game.** Then they are two people, whatever the names look
  like. This is not a nicety: `game_players` is keyed on `(game_id, player_id)`, so
  the merge would be refused by the schema anyway — the point is that the person
  tapping learns why instead of seeing a crash.
- **A game is running.** A live card is rebuilt from `game_players` on every tap,
  so moving a player underneath it changes the game in progress. `/merge` waits
  until the card is confirmed; the check runs again at `✅ Confirm`, because a game
  can start while the screen sits open.

A merge repoints `game_players`, `game_events` and `games.starter_player_id` to the
keeper and deletes the absorbed rows from `players`, all in one transaction. There
is no undo: the confirmation step is the undo.

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
  message_id        INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE chat_locales (
  chat_id   INTEGER PRIMARY KEY,
  locale    TEXT NOT NULL,
  chosen_at TEXT NOT NULL DEFAULT (datetime('now'))
);
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

### One file for every chat, not one file per chat

`chat_id` is on `players`, `games` and `chat_locales`, and **every query about a
chat is scoped by it**. The four that read across chats do so on purpose and none
of them is answering a chat's question: `liveCards` redraws every card at startup,
`rememberedChatLocales` republishes the menus, `idleCards` sweeps abandoned games,
and `storageSummary` counts the whole file for `/status`. So a chat is isolated by
the data model, and a file per chat would buy nothing while costing a connection
per chat, a schema to apply per file, and a rewritten contract in which every
method first has to find the right database.

What a file per chat *would* have given for free is throwing one away, so that is
the one thing the single file has to answer explicitly: **`forgetChat(chatId)`
deletes the chat's games, then its players, then its language choice, in one
transaction.** Games first, because **three** columns reference `players(id)` with
no `ON DELETE` clause — `games.starter_player_id`, `game_players.player_id` and
`game_events.player_id` — so deleting a player who is still seated, or who started
a game, or who is named in an exit, is refused. Deleting the games cascades the
seats and the exits away first and clears the third reference with them. Adding
`ON DELETE CASCADE` to any one of the three would not free the order; the other two
would still refuse.

The rows go, but the bytes do not: SQLite leaves deleted rows on free pages and in
the write-ahead log until a checkpoint or a `VACUUM`. So this **forgets a chat, it
does not shred it** — enough for a group that left and wants to stop being counted,
not enough to promise anything to somebody worried about the file itself.

It is deliberately **not a command**. Nobody at the table should be one tap away
from deleting the evening, and the case it exists for arrives out of band anyway.
It lives in `scripts/tools.ts`, and [README.md](README.md#scripts) says how to run
the occasional tools.

### A live card is a row; a dead one is not

A live card lives in `games` with `confirmed_at IS NULL` — it has to survive a
restart, since the message is already posted in the chat. Confirm sets
`confirmed_at`. **Cancel and abandonment `DELETE` the row**, which is what "never
written to the database" means in practice: nothing partial is ever left behind
for statistics to trip over.

That sweep has to reach the **players** too, and it did not until it was noticed on
a real evening. `/game Anna, Oleg, Dima` inserts the `players` rows while it is
still parsing the command — before the card exists at all, because `game_players`
needs real ids to seat anybody. So a typo spotted on the card and cancelled left a
permanent player behind with zero games, cluttering the `/merge` roster with names
that never played. Discarding a game therefore deletes, in the same transaction,
every player in that chat that no `game_players` row, no `game_events` row and no
`games.starter_player_id` still points at. It is a sweep rather than "the players
this command created" because abandonment, a failed `sendMessage` and the startup
cleanup all have to undo the same thing, and none of them remembers who was new.

The partial unique index makes invariant 1 the database's problem rather than the
code's — a second live card in one chat is rejected by the engine, not by a check
someone has to remember to write.

### Seating is normalised

`Oleg, Anya, Roma` and `Roma, Oleg, Anya` describe the same table. When writing
`seat_index`, the list is **rotated so that the player with the smallest `player_id`
ends up in position zero**. Without this, neighbour analytics falls apart.

### `/stats`

Two rendered PNGs of the current session, each sent with its own `sendPhoto` — the
chronology below, then [the awards card](#the-awards-card). The chronology has two
stacked parts:

- **The chronology.** One column per player, one row per game. The cell holds the
  place that player took: a plain cell for an ordinary finish, red for the fool,
  slate for a game drawn for last, and an empty outlined cell holding a dash for a
  player who was not at the table. Reading down a column is one person's evening;
  reading across a row is one game. **No state rides on hue alone** — the two that
  are easy to confuse carry a dashed outline as well, and the fool's digit is set
  bold. A key under the grid shows the three states as miniatures of the cells
  themselves; the ordinary finish needs no entry, because every cell already prints
  its own place.
- **The table share.** One line per player against game number: the fraction of the
  table they have finished ahead of, averaged over the games they have played so
  far. The axis is a fixed 0–100% with the 50% mid-table line dotted, so a height on
  the chart means the same thing in every picture ever rendered.

A text bar chart came first and was replaced. It was accurate and unreadable: two
tallies cannot show *when* anything happened, and the evening's story is entirely
in the sequence. The earlier tombstone against images cited a native dependency
and a third-party chart service; only the first is still true, and it is now
accepted deliberately. Nothing about the players leaves the machine.

**A game is worth `(players_in_that_game − place) ÷ (players_in_that_game − 1)`** —
the fraction of the table you finished ahead of. First is 1, the fool is 0, both
players of a draw score the same, and a table of three is worth exactly as much as a
table of six. A player's number is the **mean** of those fractions over the games
they actually played; a game they sat out is left out of the mean rather than
counted as a zero.

Cumulative points came first, and one real evening showed them to be wrong in two
ways at once. Summing rewarded *turning up* — nineteen mediocre games beat seven
good ones, so the leader board was measuring attendance. And scoring
`players_in_that_game − place` paid more for a bigger table, so whoever happened to
be sitting down when the fifth player arrived gained on everybody else. The mean of
a normalised fraction fixes both. It costs the chart its old drama: the lines
converge into a band instead of fanning out, which is what "these five play about
equally well" honestly looks like.

A player who has not played yet sits at 50%, and every line starts there. It is the
truthful prior, and it stops the chart opening with five lines stacked on zero.

**A line goes dashed across every game its player sat out.** A mean does not move
while somebody is absent, so a missed game leaves a flat stretch that reads as
"played, and held steady" — the one thing it does not mean. The line is therefore
split into stretches: solid across the games they played, dashed across the ones
they missed, with neighbouring stretches sharing their boundary point so the line
never actually breaks. The legend shows the dash against the same two words the
grid's key uses, **did not play**, and only when somebody missed something.

This started as the narrower rule "dashed once a player has gone home", which needed
the domain to carry the last round each player played. Dashing every gap turned out
to be both more informative and *less* machinery: going home is simply a gap that
reaches the right edge, so the extra field went away — and with it a bug where
somebody seated on a live card, with no games finished yet, was drawn as having left
the table.

**Small samples are deliberately not corrected.** Three games all finished first
reads as 100%, and shrinking it toward the middle was rejected: a number nobody can
recompute from the grid directly above it is a number people argue with. The legend
prints each player's game count under their name instead, and lets the reader
discount it themselves.

**A draw counts as neither a win nor a fool.** A shared last place means nobody
was the fool that game, so the cell is slate rather than red.

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

#### What drawing one costs everybody else

One process serves every chat, so time spent turning an SVG into pixels is time no
other chat's tap is being answered in. Measured on the host the bot runs on — two
shared vCPUs — a poster costs **about 226 ms to rasterize and another 240 ms to
encode as PNG**, and `/stats` draws two posters.

Drawing therefore belongs **off the event loop**, and that is a requirement rather
than an optimisation: with a live card mid-game in another chat, half a second is
the difference between a tap that feels instant and one that looks ignored. Any
implementation answering several chats from one process owes the same thing, which
is why it is written here rather than beside the renderer.

Only the rasterizing half is off the loop today, and freeing the loop turns out not
to be the whole requirement: `bot.start()` consumes updates **one at a time**, so a
`/stats` that is awaiting two posters delays the next tap in every chat by that long
whether or not the loop is busy. Timers and debounced edits do run during a render —
that much was won — but the queue behind it is the thing a second table would feel.
[TECH-DEBT.md](TECH-DEBT.md) has what stands in the way of the rest, and the trigger
is the same: a second chat playing.

#### Fitting a long evening

The height budget is fixed at 2560, so the number of games is what has to give.
Row height is `clamp(available ÷ games, 26, 56)` pixels: at 15 games the rows are
full size, at 30 they are 29. Past the ceiling the rows would fall below the floor,
so the sheet keeps the **most recent** games that fit and says so above the table.
Being honest about the omission matters more than fitting everything.

**Only the table is trimmed.** The chart under it has no row to run out of, so it
draws the whole evening, and the awards card judges the whole evening too — the
ceiling is a fact about one grid, not about what the session was. Everything the
reader counts therefore agrees: the header names the evening's real size, the legend
tallies every game each player sat, and the note says only that the *table below*
shows the last so-many. The one number that used to disagree was the header, which
printed the drawn count while the awards card printed the played count, so two
pictures of the same evening in the same chat quoted different totals.

That is also why a trimmed table numbers its rows **by their place in the evening** —
13…40, not 01…28. The chart's axis runs to 40, and the same game has to carry the
same number in both, or the two halves of the picture cannot be read against each
other.

That ceiling is derived, not chosen, so anything that takes room away from the grid
moves it — the labelled section headings and the taller cell key cost five rows when
they were added. It is **34 games for a table of five or fewer, 28 for six to ten,
22 for eleven to fifteen**, because the legend under the chart wraps (below) and each
wrapped row costs six games. Nothing caps the table, so the sequence continues — at
sixteen players the legend takes four rows and the ceiling is 17. The number is worth
spending on the picture — an evening reaching any of those has never happened — but
it is a real trade, not a free one.

The header date is the UTC date of the session's first game. Late-evening games
can therefore be stamped with the following day. A configured timezone is the fix
on the day it bothers anyone; inventing one would be worse.

#### The legend wraps rather than shrinks

Every legend entry is set at one size, and a row holds **at most five** of them; a
sixth player starts a second row, and the rows are balanced, so seven players read
as four and three rather than five and two.

The rule it replaced scaled the type to the slot — plausible, and worthless. Slot
and font shrank together, so the *number of characters* that fit barely moved: a
name got thirteen of them at five players and twelve at ten, while the type fell
from 30px to 15px and the game count under it to 11px. That is roughly three screen
pixels once Telegram has scaled the picture down to a phone. The whole reduction
bought one character.

So the five is derived too: a slot must hold fourteen characters at the design's
legend size, and the plot is 1390px wide. A wrapped legend costs the games ceiling
above, which is the honest trade — a ten-player table is nearly impossible at this
game, and a ten-player table playing more than 28 games is not a case worth paying
for. Column headings above the grid solve the same problem the other way, by cutting
the name, because a column cannot wrap.

### The awards card

A second picture of the same session, sent after the chronology as its own photo
rather than as an album — an album collapses into a grid of thumbnails, and each
card is meant to be read at full width. `/stats_chronology` and `/stats_awards`
send one of the two on their own.

Awards need **five games** in the session. Below that `/stats` sends the chronology
and says nothing about awards, because a card that fires three of thirty-six rules
reads as a bug rather than as a thin evening; `/stats_awards` answers in text instead.

The card is read top to bottom from glory to disgrace, and **FOOL OF THE NIGHT is
always last**, on a red plate. Under it, when it happened at all, one line about the
whole table: how often whoever opened a game was left the fool in it.

#### A shared title is no title, and nobody is crowned twice

Two rules guard the pair of pinned awards, and both exist because the card once gave
one player both crowns at the same table.

**A title has to be won outright.** If anybody is level with the leader, the award
does not fire — not just when the whole table is level, but whenever the top is
shared. Both justifications claim primacy ("nobody sat higher", "nobody played
worse"), and that is equally false against one equal as against four. The tie-break
used to award it anyway, to whoever had the lower `player_id` — which is to say, to
whoever was typed into the database first. This is not a corner case invented for a
test: two people splitting six games 3–3 are level on both merits, and fool counts are
small integers over few games, so two players on two-of-eight is ordinary. **The fool
plate is therefore absent more often than the catalogue's frequencies suggest**, and
that is the intended price. One qualified player is not a tie: alone at the top is
still standing out, and still wins.

Level is compared with a **tolerance of 1e-9**, not exactly. Both merits are means of
rationals with small denominators — share divides by table size minus one, then by
games played — so two genuinely different merits differ by more than 1e-7 even at the
worst table, while summing forty of them accumulates float error around 1e-15. There
is room either side. Exact equality was tried first and failed on the ten-player level
evening, where the shares came out `0.5833333333333334` and `0.5833333333333333` and
one bit decided who was king. If either denominator changes, this is the number to
re-derive.

**The two titles are mutually exclusive.** Even without a tie a player can hold both
the best share and the worst fool rate. When that happens the fool keeps the plate and
the crown passes to the next-best share, because the fool is a count of something that
happened and the king is a ranking of everybody else. If excluding the fool leaves
nobody qualified, no king is crowned. A passed crown **says so**: its justification
becomes "only the fool of the night sat higher", because the ordinary one would be a
lie about the very evening that produced it.

Only these two rules use the stand-out test; every other award in the catalogue still
takes the plain best-by-merit winner, ties broken as before.

#### Two orders, and why there have to be two

The catalogue holds **thirty-six** awards and the card holds **nine**, so most
evenings something is dropped. *Which* nine are chosen and *what order* they print in
are different questions, and answering both with one list was the flaw the first
thirteen shipped with: the rules were tried in printing order and the first nine that
fired won. The head of the list is the common awards, so the same ones took the card
every evening and nothing near the tail was ever seen. Adding twenty-five more rules
under that mechanism would have changed nothing at all.

So there are two orders:

- **KING OF THE TABLE and FOOL OF THE NIGHT are pinned.** They fire on essentially
  every evening that qualifies, they are the two an evening is expected to have, and
  a card missing them reads as broken rather than as unusual.
- **The seven free slots go to the rarest of whatever fired.** The ranking is
  `RAREST_FIRST` in `award-catalogue.ts`: one list, every award exactly once, rarest
  first. A spec asserts it is complete, because the selection indexes into it.
- **The card then prints the chosen nine in the catalogue's own order**, which is
  glory to disgrace.

A dull evening therefore gets the ordinary awards and a strange one gets the strange
ones. That is the entire point: the same five people should not read the same nine
headlines every Friday.

Nine is not a taste decision. The card is drawn at the same 1620 width as the
chronology and is bound by the same [2560 limit](#what-telegram-does-to-the-image),
so the row metrics are derived from that budget rather than from how the rows look
on their own: nine awards at the dense scale come to 2514, and a tenth would not
fit. Fewer than six awards switch to a roomier scale, because a short card has the
height to spare and a sparse one drawn dense reads as unfinished.

#### The catalogue

Printing order, glory to disgrace. **Fires** is the share of evenings on which the
rule finds a winner at all — the number `RAREST_FIRST` is ordered by.

| Award | Earned by | Threshold | Fires |
|---|---|---|---|
| KING OF THE TABLE | the best table share | ≥ 5 games | 100% |
| WIRE TO WIRE | in front on the chart after every game but the first | evening ≥ 10, ≥ 8 games | 27% |
| THE FAVOURITE | going out first more often than not | ≥ 50%, ≥ 8 games | 61% |
| HAT TRICK | going out first in four games running | run ≥ 4 | 54% |
| HOME ADVANTAGE | opening a game and going out of it first | ≥ 3 times | 46% |
| UNTOUCHABLE | never the fool all evening | ≥ 8 games | 62% |
| TEFLON | the longest clean run, by somebody who was burned at least once | run ≥ 7 | 49% |
| HOT SEAT | opening games and never being left the fool in one | ≥ 4 opens | 57% |
| THE COMEBACK | lowest on the chart at halfway, back above mid-table since | evening ≥ 8 | 1.3% |
| THE LADDER | finishing better than the game before, four running | run ≥ 4 | 7% |
| SWEET REVENGE | leaving first in the game after being the fool | ≥ 2 of them | 13% |
| IRON SEAT | the only player who sat through every game | evening ≥ 10 | 23% |
| THE TRUCE | everybody who was in a drawn game | a draw happened | 58% |
| THE PACIFIST | being in every drawn game of the evening | ≥ 2 draws | 18% |
| THE NEMESIS | finishing above the same rival in every game they shared | ≥ 8 shared | 46% |
| THE DOORMAN | opening more games than anybody else | ≥ 6, alone | 52% |
| NEVER ASKED | sitting a long evening without ever opening a game | ≥ 10 games | 30% |
| THE LATECOMER | arriving late and still finishing at or above mid-table | game ≥ 4, ≥ 5 games | 18% |
| REVOLVING DOOR | missing a stretch in the middle and coming back | gap ≥ 2, ≥ 5 games | 16% |
| THE CAMEO | playing exactly one game of the evening | evening ≥ 8 | 1.3% |
| SECOND WIND | the fool early, and never again | in the first 3, ≥ 8 games | 16% |
| THE UNDERSTUDY | second out again and again, first out never | ≥ 4 seconds, ≥ 5 games | 23% |
| THE FLATLINE | never leaving the band around mid-table | ≤ 6 points, ≥ 8 games | 0.9% |
| THE INVISIBLE | most games finished in the middle | ≥ 75%, ≥ 5 games | 56% |
| GROUNDHOG DAY | taking the exact same place five games running | run ≥ 5 | 50% |
| THE PENDULUM | swapping halves of the table game after game | run ≥ 6 | 15% |
| THE ROLLERCOASTER | the widest gap between their best and worst on the chart | ≥ 60 points, evening ≥ 8 | 15% |
| ALL OR NOTHING | most games finished at an edge — first out or fool | ≥ 75%, ≥ 5 games | 60% |
| THE IRISH GOODBYE | leaving before the end, and not as the fool | left early | 59% |
| THE ANCHOR | every game in the bottom half, and never the fool | ≥ 5 games | 2.4% |
| THE SLIDE | finishing worse than the game before, four running | run ≥ 4 | 8% |
| FALSE DAWN | leading the chart at halfway, below mid-table since | evening ≥ 8 | 0.6% |
| OPENER'S CURSE | opening a game and being left the fool in that same game | ≥ 2 times | 42% |
| ENCORE | the fool in three games running | ≥ 3 running | 72% |
| FIRST BLOOD | the fool of the very first game | never the same person as FOOL |  92% |
| FOOL OF THE NIGHT | the worst fool rate | ≥ 5 games | 99% |

The percentages are **modelled, not observed**. Four thousand synthetic evenings —
four to six players, five to twenty games, with arrivals, departures, missed games,
draws and the house rule for who opens — scored through the real `scoreSeries` and
put to each rule. That is enough to rank the catalogue and to catch a rule that fires
always or never; it is not a record of anything that happened at a real table.
`RAREST_FIRST` is a hand-written list precisely so that it is one edit to reorder once
enough real evenings exist to argue with the model.

On the evening of 31 July 2026 — nineteen games, five players — nine fire, the set
is entirely different from the sample evening's, and every player is named at least
once.

#### When an award would say nothing the card has not said

Two pairs are nested. The lesser is dropped when the greater names the same player,
and it is dropped **before** the free slots are handed out, so it cannot cost a rarer
award its place:

| Dropped | When | Because |
|---|---|---|
| FIRST BLOOD | FOOL OF THE NIGHT names the same player | one person, burned twice on one card |
| HOT SEAT | HOME ADVANTAGE names the same player | winning every game you opened already says you lost none of them |

Three rules about how a winner is chosen, each of which changed who won on that
evening:

- **A rate award is ranked on the rate, not on the count.** Two players with twelve
  middling games are not equal if one played seventeen and the other nineteen.
  Ranking on the count made the same player win three awards while another won none.
- **Every rate award also demands five games**, including the two the catalogue
  states only as percentages. Three games out of three is not 100%, it is three
  games, and `/stats` already refuses to shrink small samples elsewhere.
- **Ties break on games played, then on the lower `player_id`** — stable, and it
  matches the rotation the seating is normalised by.

**A reason line never contains a player's name.** SVG does not wrap text, so every
justification is one line; a 32-character name inside a sentence is the one thing
that could push it past the edge. The name has its own line, where it is the only
thing that can overflow. Each justification carries a number, because "played well"
is an opinion and "61% across 18 games" is not.

Three families of award were considered and are impossible on this data, rather than
merely unbuilt:

- **Anything about how long a game took.** `started_at → confirmed_at` measures the
  life of the card, not of the game — evenings are sometimes logged afterwards, a
  game at a time, in seconds. Fastest and longest game are unavailable.
- **Anything about the time of day**, for the same reason.
- **Who tapped the buttons most.** `game_events.actor_tg_id` is recorded, but there
  is no mapping from a Telegram id to a name at the table, so the award could name
  an account and not a player.

A fourth is merely unbuilt, and the difference matters: **anything about who sat next
to whom.** The ring is real and [normalised](#seating-is-normalised) for exactly this
kind of question, and the house rule already makes the opener a fact about seating —
whoever sat immediately before the last fool. But `seat_index` stops at the
repository: `SeriesChronology` carries the players in the order they first appeared,
not the ring of each game. So a neighbour award costs a repository method, and none
of the thirty-six needs one.

**CURTAIN CALL** — the fool of the evening's last game — is not in the catalogue at
all: the bot has no signal that an evening has ended, so mid-session it would crown
whoever lost most recently and then quietly change its mind. The same objection
retires BOOKENDS, and it is the reason no award in the catalogue reads backwards from
the most recent game.

**An award that crowns the whole table is not an award.** FULL HOUSE (nobody missed a
game) and THE ROTATION (everybody was the fool at least once) were both built, drawn
and then cut. They are facts about the evening rather than about a player, so the
winners line degenerated into every name at the table joined by an ampersand — which
at ten players left the card entirely — and, worse, they hand a row of a nine-row card
to somebody who did nothing in particular. The card exists to say what one person did
that nobody else did. A fact about the whole table has a home already: the line under
the fool's plate, where the opener's curse lives.

That leaves THE TRUCE and THE PACIFIST, which look similar and are not: their winners
are whoever was in a drawn game, which is a subset the evening picked out. When that
subset happens to be everybody, the winners line says so in words instead of listing
them — `everyWinner` in the copy table, set in neutral ink so it cannot be read as the
first winner's row.

### One player's card, for all time

`/stats` answers *how is tonight going*. `/personal` answers *who am I at this
table*, and the difference in scope is the whole feature: it reads every confirmed
game the chat has ever played, not the latest session.

The bot cannot know which player a person is — names are typed, not tagged — so
`/personal` takes no argument. It answers with the roster as a keyboard, one name
per row, and the card is drawn for whichever name is tapped. That also keeps the
input at one tap, which is what the product is for.

**A player exists inside a chat.** `players.chat_id` means the same human playing in
two chats is two players with two careers, and nothing links them. A card therefore
says *for all time in this chat*, never *for all time*.

Six numbers are always shown, and two of them carry a baseline, because a raw
percentage is not comparable between players: whoever mostly played three-handed
burns roughly a third of the time by the shape of the game, and whoever played
six-handed roughly a sixth. So next to the observed rate the card prints the rate a
player would post if places fell at random — the mean of `1 / tableSize` across the
games they actually sat in.

Two denominators are used on purpose:

- **the fool rate is over decided games**, with draws excluded from both the count
  and its baseline, because a drawn game has no fool and leaving it in would flatter
  everybody at the table;
- **out-first and dealt are over every game played**, because a draw still has a
  first player out and still had somebody deal.

Twenty facts sit below the numbers, and a card prints at most four of them: three
numbered rows and one plate. The point is that two players at the same table get
different cards — the same machinery the evening's awards use, pointed at one
career instead of one night. A rule looks at the whole history and returns its fact
or nothing; `RAREST_FIRST` orders whatever fired; a fact about a rival takes the
plate, the rest fill the rows in order, and the sheet shrinks when little fires.

The facts split by what makes them worth printing, and the split is the design:

- **A descriptive fact is true whatever the sample size.** The chief rival is one:
  among the games where the two were left in the last two places, how often the
  subject was the one holding it. It needs six such duels and one loss, picks by
  losses, then duels, then name, and states raw counts. It is not a claim that the
  rival is *better* — a duel is a coin flip, and proving a bias in one honestly
  needs about a dozen of them, which would mean the fact this feature was asked for
  almost never appeared.
- **A conditional fact claims something surprising, so it has to earn it.** "You
  burn far more than your own usual rate whenever they are at the table" is a claim
  about chance, and chance is what the binomial tail measures: `k` occurrences in
  `m` opportunities against a stated `p₀`. Which `p₀` is the whole content — against
  the seat (`1/tableSize`) for what a random player would post, against the
  subject's own rate for what changes their odds.

**The tail is a qualifier and a within-family chooser. It is never printed and
never spoken.** The copy says "left at the end together 14 times — you burned in
13", which is true about the data whatever the sample. "You statistically lose to
Dima" is a claim about the world, and picking the winner after looking at thirty
hypotheses is exactly how that claim goes wrong.

**The floor is corrected for how many candidates the fact beat.** A nightmare
chosen from thirty evenings is thirty guesses, not one, so it must clear
`NOISE_FLOOR / candidates` rather than `NOISE_FLOOR`. The numbers are measured, not
taste: simulating a table of five over two hundred purely random games, a raw 5%
floor put at least one false fact on 87% of cards — the failure where the poster
confidently names a nemesis for everybody, always. The same floor corrected per
family drops that to 19%, and at 1% to 4%, while a player carrying a genuine
fifteen-point handicap still shows something on 93% of cards. So the floor is 1%,
corrected.

Some facts have no honest null and do not use the tail at all — never having been
dealt, never having missed an evening, being there for the first evening on record,
still being new. These qualify on plain counts, the way most awards do, and they
are what stops a young table's card from being empty.

**The name in the heading is the one place the bot sets user data at 126px, and it
shares that band with the counter on the right**, so it is cut to fit rather than
allowed to overrun — the same ellipsis the chronology's column heads use. Fitting is
by character count against an assumed advance, and there is no font metric to hand:
measured off the rendered posters, ordinary text runs about 0.58 of the size and the
widest bold Cyrillic about 0.8. The heading reserves the wider figure because being
wrong there prints one line on top of another, while being wrong in a chronology
column only crowds a gutter.

**Everyone the roster offers has a card to draw**, which is not obvious from the
schema: the roster is built from who was *seated* (`game_players`) and the card from
who was *placed* (`game_events`), two different tables that could in principle
disagree. They cannot. Only confirmed games reach either query, confirming a card
writes a placement for every remaining seat rather than only the recorded exits, and
`/merge` moves both tables together. So the single refusal a tap can get is about the
*screen* being older than the bot, and there is no second refusal for a player with
an empty career — a state the bot has no way to produce.

The evening chart needs five evenings to be worth drawing; below that it is three
points and a straight line, so the section disappears and the sheet shrinks again.
It carries a point per evening and singles out two of them, **and it singles them
out only when they are the sole holders of their share**: a ring on one of six
evenings that all went equally badly claims a distinction the data does not have,
and the reader cannot see the tie-break that chose it. So an extreme that is shared
is not marked at all, which also means the two marks disappear together on a career
that never varied.

**The same event carries the same name everywhere a player can read it.** Who moved
first is picked on the live card, counted on the player card and celebrated in two
facts, and for two releases the live card called it *going first* while the stats
card credited *the dealer* — a different action, in both languages. The bot deals
nothing; the fool's neighbour attacks first. This is a documentation rule with
teeth only because a poster and a screen are reviewed apart: the gallery gate now
reads the finished pictures against each other and against the live card.
**Every section of this card is optional, and the sheet's height is the sum of
whatever survived** — a chat that played one evening gets a short, honest card
rather than a tall one full of gaps.

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
4. **`game_events` holds a `player_id`, never a name.** This is what makes merging
   two names one player a repointed foreign key rather than a rewrite
5. **`actor_tg_id` is written on every event.** It gives the "who keeps the records"
   metric
6. **A game in `FROZEN` is immutable**
7. **A player row exists only while something still points at it.** Discarding a game
   deletes every player in that chat left unreferenced by `game_players`,
   `game_events` and `games.starter_player_id`, because `/game` creates them before
   the card exists

---

## What survives a failure

A game happens once a week, and nobody is going to read a log during a hand of
cards. Every part of the evening that a failure could take away has to come back on
its own. Five failures, five answers:

**The connection drops.** Long polling already survives it: grammY retries
`getUpdates` every three seconds forever, and only an invalid token (401) or a
second poller on the same token (409) ends the loop. What it does *not* protect is
an outgoing call — an `editMessageText` that fails is an update to the card that
never appears. So every call goes through a retry: a network error, a 5xx or a 429
is tried again with a growing pause (four attempts, under four seconds in total),
and a 4xx never is, because it would fail identically. A flood limit is obeyed to
the second, unless Telegram asks for longer than a tap can wait.

The outage itself is reported **once**, not once per retry, and its end is reported
too. A run of `getUpdates` failures during a ten-minute outage is one line in the
log, followed later by one more saying Telegram answers again.

**A tap arrives against a card that has moved on.** The state is left unchanged and
the answer is still "Card updated" — but the card is now also **redrawn from the
database**. The old behaviour treated the message as right and the tap as late,
which is backwards when the reason for the mismatch is that an edit was lost: the
buttons then carry a version that no longer exists and every further tap is refused,
which is a dead card in the middle of a game. Redrawing costs one edit and makes
the failure self-correcting. The cost is a redundant edit on a genuine double tap,
which Telegram rejects as "message is not modified" — expected, and logged at debug
rather than as a warning.

**The process dies.** A card is rebuilt from `game_players` and `game_events` on
every tap, so a restart loses nothing that was confirmed. What it can lose is the
last debounced edit — up to 350 ms of taps that reached the database but not the
screen. So **every live card is redrawn as the bot starts**, before polling begins:
whatever the last run left on screen is replaced by the truth. A live row whose
message was never posted (the process died between the insert and `sendMessage`) is
deleted instead — it can never be shown or tapped.

A death also has to leave a reason behind. An uncaught exception or a rejected
promise is logged through the scoped logger and the process exits non-zero, so the
last line of the log says what happened rather than the console printing a bare
stack.

Restarting is a supervisor's job, not the bot's: `src/supervisor.ts` runs the bot as
a child process and starts it again when it dies, waiting 1 s, then 2, 4, 8 … up to
a minute. A minute of quiet is treated as a working run, so an unrelated crash an
hour later gets the fast retry again rather than an inherited backoff. An exit code
of 0 is a shutdown and is never restarted.

**The setup is wrong.** A bot that has *never* run for a full minute is given five
tries and then abandoned with an explicit line in the log. A missing token or a
database locked by the dev process would otherwise restart forever, printing the
same failure once a minute and hiding the one message that says what to fix. Once
the bot has worked, it is retried indefinitely — during a game, giving up is the
worse answer.

**The machine restarts.** The supervisor goes down with everything else, so
something outside both processes has to bring them back. That is the host's service
manager rather than code in this repository, and it is given the failures the
supervisor cannot answer and no others:

- **the host booting**, once the network is routable enough for the first
  `getUpdates` to leave
- **the supervisor itself dying** — killed for memory, or crashed
- **a process that never reached our code**: the runtime refuses to start at all
  when the env file it is pointed at is missing, so nothing in this repository is
  ever loaded and nothing here can report it

Everything else is already answered one level down, and the service manager is told
to keep out of it: an exit code of 0 is the supervisor **deciding** to stop — a stop
was asked for, or the bot could never start — and starting it again would undo a
decision that was made for a reason, hammering Telegram with the same broken token
and burying the one line that says what to fix. The backoff belongs to the
supervisor; a second restarter that also retried would only be arguing with it.

The third case needs the give-up rule repeated at that level, because it is the one
failure that leaves the supervisor's own counter unreached. **Five starts within
five minutes and then stay down** — deliberately the same shape as the five tries
below, since a host that cannot start the bot at all is the same problem as a bot
that cannot run, and the answer to both is one legible failure rather than a line
repeating in the journal for ever.

**Stopping it.** `Ctrl+C` in the terminal reaches both processes, because the console
sends it to the whole group: the bot flushes its pending edit and exits, and the
supervisor sees a stop was asked for and does not start it again. The supervisor
therefore does **not** forward the signal itself — a second `SIGINT` would arrive
after the bot's own one-shot handler had gone and kill it outright, losing the flush.
It only waits, and kills the child after five seconds if it is still there, which is
what happens when a signal reaches the parent alone.

A service manager asked to stop the bot must reach both processes the same way, and
systemd does by default — it signals the whole control group. That keeps the server
on the path `Ctrl+C` has been exercising all along. Configuring it to signal only
the main process would still work, through the five-second kill, but slowly and
along a path nothing tests.

Nothing in the recovery path may become a new reason to fail: a feature that throws
while catching up on startup is logged and skipped, the command menu is allowed to
fail unpublished, and the bot starts anyway. A bot that will not start is worse than
a bot with a stale `/` menu — and a supervisor that keeps restarting a bot which
cannot start is worse than both, which is why it counts its failures.

### Asking the bot how it is doing

The bot runs on a machine nobody is sitting at; the person responsible for it has a
phone. So the bot has to be able to answer the questions the terminal would have
answered:

- **which database is open** — the file name, its size, and what is recorded in it.
  This is the one that earns the command: a production evening that came up on the
  dev database looks completely normal in the chat, and nothing else would reveal it
- **which version is running**, read from `package.json` at the moment of asking. A
  deploy here is a timer that pulls a tag on its own schedule, so "did it land?" is a
  real question with no terminal to answer it. The manifest is read rather than baked
  in because there is no build step to bake anything into; if it cannot be read the
  report says so instead of refusing to start, since a cosmetic line is not worth a
  bot that will not run
- **how long this process has been up**, which start it is, and how the previous one
  ended — a restart nobody saw is otherwise invisible
- **how many warnings and errors** have happened since the start, and the last
  handful of them verbatim
- **whether anybody is using it** — how many chats there are in all, how many played
  in the last week, how many were first seen in that week, and how many games landed
  in the last day and the last week. A total on its own cannot tell tonight from last
  spring. The three chat numbers are counted independently and are **not** nested: a
  chat that ran `/language` this week and has not played yet is first-seen but not
  playing, which is exactly the arrival worth noticing
- **which languages those chats picked**, counted three ways: chose Russian, chose
  English, never asked. `chat_locales` holds only an explicit choice, so a chat with
  no row is on the default rather than on English by preference — collapsing the two
  would hide whether `/language` is findable at all
- **what Telegram did to the calls** since the start: how many retries were made, how
  many rate limits arrived, how many calls were finally refused. Nothing here counts
  successes; the number that matters is trouble. These three overlap on purpose and
  are not a partition — one call refused three times before landing is three retries,
  and a flood limit that is then retried is counted as both. Retries are attempts
  rather than calls because three retries of one call is a worse night than one retry
  of three, and the report exists to show the worse night
- **the slowest poster drawn** since the start, because rasterizing is the heaviest
  thing the bot does and the first thing a small server will run out of room for

Three definitions the numbers depend on. **A chat is one that has played or picked a
language** — the union of `games` and `chat_locales` — so the three language counts
add up to the chat count, and a chat that chose Russian before its first game still
counts. **First seen is the earliest of those two**, which is why `chat_locales`
keeps the timestamp of the *first* choice and a later `/language` overwrites only the
locale: a chat that changes its mind is not a new chat. **The windows are rolling**, a
day and seven days back from the moment of asking, not calendar days: the bot has no
timezone to hold a calendar in, and Friday's game recorded after midnight belongs to
Friday's evening either way.

`/status` is **hidden**: registered like any command, but left out of `/help` and out
of `setMyCommands`, so the group never learns it exists. `OPERATOR_TG_ID` is
**required** — it names the one Telegram user the command answers, and a bot with no
operator set refuses to start. It was optional while the bot lived in one chat and
the report was about that chat; the report now counts every chat the bot is in, which
is nobody else's business. **No environment value is ever printed** — not the token,
not any other key: the report is built from a typed snapshot, not from the
environment.

The report is sent as **plain text, with no `parse_mode`**. A log line can contain
anything, including angle brackets from an error message, and HTML parsing would
either mangle it or fail the send outright.

A refusal is logged at **info**, not as a warning: somebody else typing `/status`
is not a fault of the bot's, and counting it would let anyone push the real problems
out of the list of eight.

The bot keeps the **last eight** problems in memory, alongside running counts. Eight
is enough to see what a bad evening looked like and small enough that a bot left
running for a month cannot grow into it. The list dies with the process — which is
exactly why the supervisor tells the new process how the old one ended.

---

## Edge cases

| Situation | Behaviour |
|---|---|
| The connection drops mid-game | Taps queue on Telegram's side; the card catches up when it returns |
| The bot is restarted mid-game | The card is redrawn from the database as it starts |
| Two processes on one token | Telegram splits the updates; 409 ends polling, so run one |
| A player sits a game out | A new `/game` without them; there must be no live card |
| Two players go out at once mid-game | Record them in tap order. Acceptable noise |
| A draw in a two-player game | The button is available from the very start |
| A single player in the list | Reject, a minimum of two |
| Duplicate names in one `/game` | Reject with a message |
| An unknown name | Create the player silently — a typo becomes a player, and `/merge` is how it is undone |

Two the bot does **not** handle yet, both found while building the end-to-end
harness rather than in a game:

| Situation | What happens today |
|---|---|
| Somebody deletes the bot's card message in Telegram | The row stays live, so there is nothing to tap and nothing to cancel, and `/game` is refused until the idle sweep abandons it three hours later. The startup redraw deletes a game whose message was never posted, but not one whose message is gone |
| `Ctrl+C` reaches the bot on Windows through a parent process | It cannot: a spawned parent cannot deliver `SIGINT`, so the graceful flush is skipped and the last debounced edit is lost. In a terminal the console sends the signal to the whole group, which is the case that matters |

---

## Out of scope for the first version

- `/stats` beyond the current session — no arbitrary periods, no all-time table
- A Telegram Mini App and a dashboard
- AI analytics
- The trump suit and validation of the first move
- **Spotting** duplicate names by itself. `/merge` folds them once a person says so;
  guessing that `Аня` and `Анна` are one player, or that `Оля` and `Коля` are not,
  is a mistake nobody would forgive in a scoreboard

## On AI analytics, once we get to it

On 20–50 games an LLM will happily invent patterns that are not there. Compute the
metrics deterministically in code and hand the LLM **only the finished numbers**,
with an explicit ban on deriving new correlations. Plus a significance threshold —
let the bot say "not enough data" instead of producing a pretty fabrication.
