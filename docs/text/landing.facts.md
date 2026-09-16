# The landing page, as facts

The structure of `docs/index.html` and `docs/ru/index.html`, and what each block of
text on them is there to say. A page is written from this file, never from the other
language's page: the writer gets a block's facts and says them the way a reader of
that language would. `node scripts/gates/gate-runner.ts docs-check` holds both pages
to this tree — same blocks, same order, same numbers.

A `##` heading is a section, a `###` heading a block, and the block's id on the page
is `section.block` in a `data-block` attribute. Under a block, bullets are the facts
it must carry. `numbers:` lists every number its text may print in both languages;
`numbers-en:` or `numbers-ru:` a number only that language prints as digits, where the
other spells it as a word (*era 2* against *во второй эпохе*); `commits:` every hash
it may cite; and `rev:` climbs when a fact changes so the pages go red until
rewritten. A block is one paragraph unless it says `granularity: section`.

## header

### skip
- The link a keyboard user takes past the header to the content.

### brand
- The product name, beside the icon.

### nav-how
- Leads to the section that walks through an evening.

### nav-posters
- Leads to the section showing the three posters.

### nav-faq
- Leads to the questions.

### nav-story
- Leads to the case study, the story of how the bot was built.

### nav-source
- Leads to the source on GitHub.

### lang-current
- The two-letter code of the language this page is in.

### lang-en
- The English page, named in English.

### lang-ru
- The Russian page, named in Russian.

### add
- The button that adds the bot to a Telegram group.

## hero

### eyebrow
- Three words above the title: a Telegram bot, for Podkidnoy Durak, free.

### title
- The one line the page is about: the players play the cards, the bot keeps the score.

### lead
- Add the bot to the group chat where the table gathers.
- The line-up is sent once; after that the players tap who went first and tap each player out.
- By the end of the night the evening comes back as two posters, and any one player's whole record as a third.

### add
- The button that adds the bot to a group.

### open
- The button that opens the bot itself.

### footnote
- No accounts, nothing to install, and the bot reads only commands and replies to its own messages.

### card-title
- The mock card is headed as the third game of the evening.
numbers: 3

### card-first
- The card names who went first in this game.

### card-keys
- Six keys: two players already marked first and second, two players still to tap, a draw key and a back key.
numbers: 1, 2

### card-caption
- The card is one message edited in place, so the chat never fills up with score-keeping.

## how

### eyebrow
- This section walks through an evening from start to end.

### title
- Three actions, and only one of them repeats.

### step1-label
- The first step.
numbers: 1

### step1-title
- Send the line-up.

### step1-body
- The command is /game followed by the names; the order of the names is the seating order, clockwise.
- The bot opens one card in the chat.

### step2-label
- The second step.
numbers: 2

### step2-title
- Tap who went out.

### step2-body
- First tap who went first, then one tap per player in the order they finish, then Confirm.
- Whoever is left unmarked is the fool.
- Nothing is typed.

### step3-label
- The third step.
numbers: 3

### step3-title
- Ask how the evening went.

### step3-body
- /stats draws the chronology, and the awards too once five games are in.
- /personal draws one player across every evening they played.
- /next opens the same table again, and the fool's neighbour goes first.

## posters

### eyebrow
- This section shows what the bot draws.

### title
- The evening is drawn rather than listed.

### lead
- All three posters are drawn by the bot itself, sized to be read at arm's length across a table after Telegram has recompressed them.

### tab-chronology
- The tab that shows the chronology.

### tab-awards
- The tab that shows the awards.

### tab-personal
- The tab that shows the player's card.

### chronology-command
- The command that draws the chronology, /stats_chronology, verbatim.

### chronology-title
- The chronology.

### chronology-body
- A row per game, a column per player.
- It marks only what an ordinary finish is not: a draw for last place, being left the fool, sitting a game out.

### awards-command
- The command that draws the awards, /stats_awards, verbatim.

### awards-title
- The awards.

### awards-body
- More than forty awards exist and nine fit on the poster.
- The king and the fool are always shown; the rest of the places go around the table, rarest award first.
- That is what stops every Friday's poster reading the same.

### personal-command
- The command that draws the player's card, /personal, verbatim.

### personal-title
- The player's card.

### personal-body
- One player across everything they ever played.
- Twenty facts compete for four places, so two people at the same table rarely get cards that read alike.

## why

### eyebrow
- This section says why the bot is shaped the way it is.

### title
- It is built for a Friday evening.

### taps-title
- Taps, not typing.

### taps-body
- Input happens on a phone, one-handed, between games, so the whole product is one message with a keyboard on it.
- A wrong tap noticed only after Confirm is not final: /reopen brings the last game back as a card, and Back takes the tap off.

### privacy-title
- The bot cannot read the rest of the chat.

### privacy-body
- In Telegram's default privacy mode a bot receives only commands and replies to its own messages; the conversation never reaches it.

### restart-title
- A restart costs nothing.

### restart-body
- The card is rebuilt from what was recorded, so a crash or a deploy in the middle of a game leaves the evening intact.

### names-title
- One player under two names.

### names-body
- Somebody types a name one way once and another way the rest of the night; /merge folds the two back into one person.
- When a whole evening went under the wrong name, /replace moves it to the right one.

### language-title
- English or Russian.

### language-body
- /language sets the language for that chat, including the words printed on the posters.

### table-title
- Two to ten at the table.

### table-body
- /next_with and /next_without change the line-up when somebody arrives or goes home.

## faq

### eyebrow
- Questions to settle before adding the bot.

### title
- Questions.

### free-q
- Is it free?

### free-a
- Yes: no accounts, no ads, nothing to buy.

### chat-q
- Does it read the chat?

### chat-a
- No: in Telegram's default privacy mode a bot receives only commands and replies to its own messages, and the rest of the conversation never reaches it.

### store-q
- What does it store?

### store-a
- The names sent to it, the results of the games played in that chat with each tap recorded against the Telegram id of whoever made it, and the language that chat picked; nothing else.

### which-q
- Which Durak does it score?

### which-a
- Podkidnoy, two to ten players.
- It records the finishing order and the fool; it does not deal cards or referee the game.

### install-q
- Does anything have to be installed?

### install-a
- No: add the bot to the group and send /game with the names.

### copy-q
- Can a reader run their own copy?

### copy-a
- Yes, the whole thing is open source under MIT, with a link to the repository; it needs Node 24 and has no build step.
numbers: 24

## cta

### title
- The reader's table plays on Friday.

### lead
- This time the score keeps itself.
- Adding the bot is one tap, and the only thing ever typed is names, and only when the line-up changes.

### add
- The button that adds the bot to a group.

### open
- The button that opens the bot.

## footer

### line
- FoolProof is a scoresheet for Podkidnoy Durak.

### story
- Leads to the case study.

### github
- Leads to GitHub.

### licence
- Leads to the MIT licence.

### bot
- Leads to the bot.

### disclaimer
- Not affiliated with Telegram.
