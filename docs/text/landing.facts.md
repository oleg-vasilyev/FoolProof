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

A page held to this tree also keeps its words: `avoid-ru:` and `avoid-en:` list the
stems a language never prints, and `docs-check` fails a page that says one, or a
heading that says «он» about the bot. What the tool `node scripts/tools/tools.ts
site-prose <page>` lists is only a candidate for the site-reader to judge.

avoid-ru: пятниц, бумажк, придётся, приходится, зараста
avoid-en: friday

## The page's job

A visitor arrives from a link, plays cards with friends, and has never heard of the
bot. The page has one job: make them want to add it to their group tonight. So every
paragraph sells a benefit the table gets — no counting by hand, the evening's best
player named for certain, awards that make every player somebody, a personal record
across every game — and states the facts below as the proof of that benefit, never as
a description of the software. The owner's own lines for the tone: «играете в карты с
друзьями — FoolProof улучшит ваш опыт», «узнайте, кто лучший игрок, без ручных
подсчётов», «добавьте изюминку в игру интересными наградами для каждого игрока»,
«получите свою персональную статистику сквозь партии». Nothing may be said that the
facts do not back, and nothing may read as a burden («придётся», «приходится»).

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
- Leads to the case study, the story of how the bot was built — named so a visitor cannot mistake it («История разработки», "How it was built"), never a bare «История» or "Story".

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
- The benefit first: the table plays cards with friends and gets, without counting anything by hand, the evening's story and who its best player was.
- What it takes: add the bot to the group chat, send the line-up once, then tap who went first and tap each player out.
- What comes back: two posters about the evening, and any one player's whole record across every game as a third.
rev: 2

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
- The card names who moves first in this game, in the bot's own line («Первый ход: Олег», "Went first: Oleg"); the control row has no Cancel key at this phase, the owner's screenshot of 16 September 2026 shows exactly Back and Draw.

### card-keys
- Six keys: two players already marked first and second, two players still to tap, then the control row as the bot draws it — Back on the left, Draw on the right, each with the bot's own emoji (↩️, 🟢).
numbers: 1, 2

### card-caption
- The card is one message that the bot keeps editing as the game goes on, so the chat never fills up with score-keeping — say "edited as the game goes", never a calque of "in place".
rev: 2

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
- /next opens the same table again — and nothing about who moves first; the owner cut «и первым ходят на дурака» as a detail the visitor does not need.
rev: 3

## posters

### eyebrow
- This section shows what the bot draws.

### title
- The evening is drawn rather than listed.

### lead
- The benefit: the whole evening becomes something to look at and argue over, not a column of numbers — the best player named, the fool named, and nearly every player getting an award (nine on the poster, so not one each at a full table; the owner refused «разошлись по столу», the meaning is that the players get them).
- The posters are comfortable to use from a phone — that much and no more; the owner cut "readable across the table after Telegram recompressed them" as a detail nobody needs.
rev: 5

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
- A row per game, a column per player, and each cell prints where that player finished.
- It marks only what an ordinary finish is not: a draw for last place, being left the fool, sitting a game out.
rev: 2

### awards-command
- The command that draws the awards, /stats_awards, verbatim.

### awards-title
- The awards.

### awards-body
- More than forty awards exist and nine fit on the poster.
- Two are always shown: the king of the table, the player who finished ahead of the most opponents over the evening, and the fool of the night; the rest of the places go around the table, rarest award first.
- That is what stops two posters ever reading the same.
rev: 2

### personal-command
- The command that draws the player's card, /personal, verbatim.

### personal-title
- The player's card.

### personal-body
- One player across everything they ever played: four percentages about them, a chart of how they did evening by evening, and the facts that stuck.
- Twenty facts compete for four places, so two people at the same table rarely get cards that read alike.
rev: 2

## why

### eyebrow
- This section says why the bot is shaped the way it is.

### title
- It is built for a real game among friends at a table — never a weekday or a time of day: the owner cut «пятница» on 16 September 2026 because a stranger reads it as the only time the bot works. Warmth stays; the ritual goes.
rev: 2

### taps-title
- Taps, not typing.

### taps-body
- Keeping score is effortless and never pulls anyone out of the game: the score lives in one message with buttons, and a game is marked from a phone, one-handed, in the pause before the next deal (not "the whole bot is one message" — the bot also sends posters; not «между партиями» beside «партию», the owner refused the repeat). Say the ease, never the burden.
- A wrong tap noticed only after Confirm is not final: /reopen brings the last game back as a card, and Back takes the tap off.
rev: 3

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
- The line-up need not stay the same all evening: /next_with adds somebody who joined the table to the next game, /next_without leaves out somebody who stepped away or sits a game out — not "goes home".
rev: 3

## faq

### eyebrow
- The abbreviation the menu uses, FAQ, in both languages.
rev: 3

### title
- Questions and answers, plainly — no call: the owner tried «Ещё сомневаетесь?» both above and as the heading on 16 September 2026 and cut it, because a call over a list of factual questions stood out from the section.
rev: 3

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
- Which kind of Durak does it support?

### which-a
- It was designed around Podkidnoy Durak, two to ten players.
- It only records who went out and who was left holding cards, so any other variant works just as well.
- It does not deal cards or referee the game.

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
- A call to the reader, not a statement, and a benefit in it: sit down to play and find out who the best player really is — no weekday named, same reason as why.title.
rev: 4

### lead
- Three benefits as calls, one sentence each: learn who the best player is without counting by hand («без ручного подсчёта», never «на бумажке» or any other embellishment); give the game some spice with named awards for nearly every player (nine a poster, so not "every player"); get a personal record across every game played. The first call must not repeat the title's «кто лучший».
- Adding the bot is one tap, and names are typed only when the line-up changes — said as ease, never as a burden.
rev: 3

### add
- The button that adds the bot to a group.

### open
- The button that opens the bot.

## footer

### line
- FoolProof is a scoresheet for Podkidnoy Durak.

### story
- Leads to the case study, named as in the header: «История разработки», "How it was built".

### github
- Leads to GitHub.

### licence
- Leads to the MIT licence.

### bot
- Leads to the bot.

### disclaimer
- Not affiliated with Telegram.
