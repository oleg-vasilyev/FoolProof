# FoolProof — what is owed

Work that is finished enough to stop, but not finished. Each entry says what state
it is in, what it would cost to pick up, and — the part that matters — **what has to
be true before it is worth doing**. A defect that only needs doing gets done rather
than written down; a defect whose fix needs a decision first waits here with the
decision named. Behaviour the bot means to have goes to `PLAN.md` as an edge case.

Two rules for this file, so it stays useful:

- **An entry names a trigger, not a wish.** "Refactor `card-service.ts`" is a wish.
  "Split it when a third thing needs the debouncer" is a trigger. An entry without
  one is a note that will still be here in a year.
- **Delete an entry when its trigger fires and the work is done**, rather than
  marking it done. The git history remembers; this file is a to-do list.

---

## One dependency is held past its own maintainer

`package.json` carries an `overrides` block with a single entry lifting `qs` past
a denial-of-service advisory. Nothing here depends on `qs`: Stryker pins
`typed-rest-client ~2.3.0`, and that pins the vulnerable `qs` — so the choice was
an override or a standing advisory that costs attention at every audit. It is a
development dependency and never runs on the server, which is why this is a
tidiness problem rather than a security one.

**Stryker 10.0.0 carries the same `typed-rest-client ~2.3.0`**, so a major bump does
not close this, and 2.3.1 still pins `qs 6.15.1` exactly. An override claims a package
works against a version its author never tested; the mutation run keeps that honest.

**Delete the block when Stryker ships a release that bumps `typed-rest-client`
itself** — `npm audit` going quiet without it is the check.

## A backup that stops happening announces it by silence

The timer sends each snapshot to the operator's chat, so a run that fails is
noticed by a file *not* arriving. That was thin when the timer was daily. It runs
monthly now — while one table plays, a month of cards is worth a few kilobytes —
and noticing an absence on a monthly rhythm is not something a person does.
Nothing polls the timer's state, and `/status` reports the database it is using
without saying when it was last copied.

The honest fix is one line in the diagnostics report: the age of the newest file in the
backup directory, red past forty days. It is deliberately not done yet, because it needs
`/status` to read a path that is not the database — the first time that feature would
touch the filesystem for a reason other than the one it was built for.

A checkup found the timer has never actually fired on schedule: the only snapshot is a
hand-made one from 13 August and the first scheduled run is 1 September, so the monthly
path is untested rather than merely unwatched.

**Pick it up when the timer goes back to daily**, which is the same trigger as a
second table starting to play — or sooner, the first time the answer to "when did
this last run" is wanted while something is actually broken.

---

## The deploy is idempotent against HEAD, and HEAD is not what is running

`foolproof-deploy.sh` decides there is nothing to do by comparing the newest tag
against `git rev-parse HEAD`, and its `ERR` trap keeps that true through a
*failure* by putting the previous commit back. What the trap cannot cover is being
killed outright: the checkout happens before `npm ci` and the restart, so a SIGKILL
in that window — an OOM kill on a 1 GB VM during an install is the realistic way in —
leaves HEAD at the new tag with the old code running, and every later run finds
nothing to do and exits 0. The bot silently never gets the release. The fix is a
stamp file written *after* the restart, compared instead of HEAD.

**Take it the next time anything touches `deploy/`**, alongside the `--omit=dev`
change above: same script, same need for somebody awake to watch the deploy that
follows.

---

## A graceful shutdown is the one path e2e cannot play

`bot-process.ts` stops a bot by killing it, because a spawned parent on Windows
cannot deliver `SIGINT` to its child. So the path a real `Ctrl+C` takes — the one
that flushes the pending debounced edit before the process ends — is exercised by
units and by hand, never by a scenario.

Closing it honestly would mean a shutdown channel in `src/` existing only for the
harness, and this project puts no test hooks in the app: `BOT_API_ROOT` is there because
a self-hosted Bot API server is a real Telegram feature, not because e2e wanted a seam.

**Pick it up if a lost edit on shutdown ever reaches a real Friday** — that is the
evidence that the gap costs more than the seam would.

---

## Picking the holder of a title is written four times

`awards/pick-winner.ts` generalises "keep the challenger when it outranks the
holder" for the evening's awards. Three more reduces of the same shape live in
`career/`: `career-evenings.ts` carries a direction so one function serves both the
best and the worst night, `rival-facts.ts` ranks pairings by a merit with two
tie-breaks, and `rarest-of.ts` keeps the lowest binomial tail with none at all.

Two phases moved the count rather than settling it, so the count was the wrong trigger:
these four genuinely differ in what they rank on. **Collapse them the first time two of
them disagree about a tie-break and the difference turns out to be a bug rather than a
decision.** Until then the duplication costs four small reduces, and a shared `Merit`
carrying a direction, a tie-break list and an ordering would cost more at every call site.

## Counting games is spelled out twice

`merge-names/render/game-tally.ts` and `scoresheet/render/tally-phrases.ts` both
export a `gameTally` turning a number into `1 game` / `12 games`. The duplication is
forced from two directions: a feature may not import another, and choosing between
singular and plural is exactly what `copy.en.ts` is forbidden to decide. The
scoresheet's side has grown to seven such phrases, hence the name.

**Move it to `shared/text/` when a third feature needs to count something.** Four
lines twice is cheaper than a shared module with two callers.

---

## `feature-installer.ts` is faked by hand in `main.spec.ts`

The `vi.mock` factory there is the one hand-rolled fake left after
`card-context.stub.ts`, and it has the same weakness that entry named: an added
parameter on `installFeatures` or `republishChatMenus` keeps the fake compiling and
passing. The factory's return is annotated with the module's own type, which
catches a renamed or missing member — the cheap half of the protection. One
mocking consumer does not pay for a stub file.

**Write `feature-installer.stub.ts` when a second spec mocks the module**, or the
first time the fake is caught disagreeing with a real signature.

---

## Two `main.spec.ts` cases fail inside Stryker and nowhere else

`should register a handler for SIGTERM` and `should run the same shutdown on SIGTERM`
pass under `npm test` and are reported failed in every Stryker run, on any `--mutate`
target — including files with nothing to do with signals. Stryker carries on because
both cover zero mutants, so the score is honest; what is lost is two cases' worth of
killing power over `main.ts` and a pair of red lines a reader learns to skip. The
cause is the runner's handling of a process-level `SIGTERM` listener, not the
assertions.

**Chase it when a mutant in `main.ts`'s signal wiring survives**, or when the noise
first makes somebody miss a real failure in that output.

## Half of drawing a poster still blocks the event loop

`rasterize()` draws through `renderAsync`, which hands the work to a thread and
gives the loop back. The encode after it does not: `asPng()` is synchronous and
**`@resvg/resvg-js` publishes no asynchronous form of it**, so the larger of the two
costs in [PLAN.md](PLAN.md#what-drawing-one-costs-everybody-else) still stops
everything while it runs.

Closing it means running `shared/drawing/rasterize.ts` in a `node:worker_threads`
worker: one per poster, which costs its own startup and undoes some of the saving,
or a pool, which is a lifecycle to own — starting it, keeping it warm, draining it
alongside the stops `main.ts` already composes. Real machinery for a bot whose
busiest hour is one Friday evening.

**Pick it up when more than a handful of chats use the bot at once**, or the first
time a tap on a live card visibly waits behind somebody else's `/stats`. The number
to beat is in [PLAN.md](PLAN.md#what-drawing-one-costs-everybody-else).

---

## Ten seats share eight colours

`PLAYER_COLOURS` holds eight and `colourFor` indexes it modulo eight, while
`MOST_PLAYERS` is ten. A nine- or ten-handed table therefore gives two players the
same colour — in the chronology's legend, in its column headings, and on the awards
sheet, where the coloured bar beside a name is the only thing telling two winners
apart. The `crowded-table` gallery case is exactly ten and does it twice; a checkup
confirmed it against the code rather than the picture.

Two more colours would close the arithmetic and not the question: colour is doing
the whole job of identity on those sheets, and at ten players a palette that stays
legible on a dark ground is already stretched. The honest fix is a drawing decision
— a second distinguishing mark, or an admission that the legend is the key and the
chart is the picture — which is why this is not a two-line patch. It came out of the
first cold read of the whole gallery and is the one finding from it confirmed in the
code and still standing.

**Take it with the next phase that redraws a poster**, which will want a
`poster-designer` mockup anyway — or the first time a real chat seats nine.

---

## The server installs the whole toolbox to run two packages

`deploy/foolproof-deploy.sh` runs a plain `npm ci`, which installs devDependencies,
so every deploy puts Stryker, vitest, eslint, typescript and now a WebP encoder onto
a production box that imports none of them. `src/` needs exactly two packages —
`grammy` and `@resvg/resvg-js` — because Node strips types natively and nothing in
the running bot reaches for a test runner.

`npm ci --omit=dev` is the whole fix and makes deploys smaller and faster. It was not
taken when the encoder was added: that phase ran overnight while the owner slept, and
a deploy script is the one place with no automatic gate — a wrong guess there is a bot
that does not start, found in the morning.

**Take it the next time anything touches `deploy/`**, when somebody is awake to
watch the deploy that follows — or the first time an install is slow enough to
notice.

---

## Half of `docs:check` is proven once, by hand, and never again

The failure these rules have is peculiar to them: a rule that runs, reports nothing,
and would report nothing whatever the repository looked like. It has shipped three
times — a poster rule whose regexp lost a backslash matched every path forever; the
same escaping bug caught again one substring from shipping; and the copy-table rule
blind to a counted word after the non-breaking space a poster line uses, which no
probe found because the space was invisible in the source.

Half the answer is now mechanical: splitting `check-docs.ts` into `scripts/docs-check/`
put every rule that *reasons* — a trigger, a mermaid lane, a PNG header, a baked
word form — behind a pure function taking its subject as an argument, and writing
one of those specs is what found the third bug. The stubbed filesystem this entry
feared was not needed. The other half still reads the repository — links, budgets,
the schema, the committed pictures — and there the standing answer is the probe:
break it on purpose, watch the complaint, put it back, which a person remembers
rather than something that happens.

**Build the fixture repository the first time a filesystem rule is found to have
been passing vacuously in the field.** Until then the probe is cheaper than the
fixture, and the rules that could be tested without one already are.

---

## The design page's sync marker proves the splice, not the push

`docs/mockups/design-page.sync` holds the fingerprint of the drawings
`node scripts/tools.ts design-page` put into the page, and `docs:check` fails while
that fingerprint and the mockups disagree — which is what stopped the page falling
two releases behind again. But the splice writes the marker locally and the push
happens afterwards, by hand, over the MCP. So a phase that sees the gate red and
reruns the tool goes green without the page ever receiving anything, and `git add -A`
takes the marker along. The `update-the-design-page` skill orders the two — commit the
marker only after the byte-identical read-back — and that ordering is prose, which is
what this gate exists because prose failed at. Nothing cheap closes it: the page lives
behind a login, so no CI check can ask what it holds.

**Move the marker's write to the end of the push when the MCP can be driven from a
script** — or the first time the gate is cleared by a rerun that pushed nothing,
which is the failure this entry exists to make recognisable.

---

## The `/personal` roster keyboard is the only one with no ceiling

`roster-keyboard.ts` draws one row per player the chat has ever seated, and nothing
caps the list. Every other keyboard is bounded by the table — at most ten seats — but
this one grows with the chat's whole history, and it is a *reply markup*, which the
Bot API limits by payload size rather than by a documented row count. Nine players
today, so nothing is close; the real limit has never been measured, and the failure
mode is `/personal` refusing to send its screen at all rather than degrading.

**Measure the real ceiling and paginate when a chat passes twenty players** — or
sooner, the first time a `sendMessage` carrying this markup is refused. The measuring
is the work: a scenario that builds the markup for fifty names and asks a real
`getMe`-less grammY to serialize it says more than the documentation does.

---

## Two attendance facts fire together, on the same players, forever

`everPresent` and `foundingMember` are structural rather than earned: whoever has
been at every evening since the first gets both, on every card they ever draw, and
they outrank most measured facts once a career is long. The gallery's `a-long-career`
and `always-burned` cases show it — two of the three rows are the same two facts. For
the regulars, who ask for the card most often, that is less variety than the twenty
rules suggest.

The fix is not obvious enough to guess at: overshadowing (a founder who never missed
one needs only one line), a decay by career length, or a cap of one attendance fact
per card.

**Pick one when a chat has run twenty evenings** — that is when a regular's card has
had the same two rows on it long enough to be worth complaining about, and when
there is real data to choose between the three shapes rather than argue.

---

## A glyph the face was never measured for is still guessed at

`name-to-fit.ts` now measures a name glyph by glyph against a table generated from the
shipped bold face, so `Щ` costs its real 1.071 em rather than the flat 0.8 the old
`WIDEST_FALLBACK` charged everything. What survives is the fallback: a glyph outside the
144 the table carries — Latin, Cyrillic, digits and the punctuation the copy uses — is
still charged whatever advance the caller passed, which is a guess. A player may type a
name in any script, and `lineup-parsing.ts` deliberately does not assume Latin.

The hole is far narrower than the one it replaced, and it fails in the safe direction for
`USUAL_FALLBACK` callers and the unsafe one for `WIDEST_FALLBACK` callers. Widening the
table is one line in `scripts/measure-advances.ts` and a rerun; the reason not to do it
blind is that every added range costs a resvg render at generation time and bytes in a
file every poster imports.

**Widen it the first time a real player's name is drawn wrong, or when the bot is asked
to speak a third language** — either is evidence about which ranges are worth carrying,
which guessing now is not.

## A long name on a crowded evening exists nowhere on its own sheet

The chronology cuts a column heading to fit its column, and the legend under the chart
is where a reader recovers the whole name. On an evening with eleven or more distinct
players the legend wraps to three rows, its slots narrow to the same order of width as
a heading, and both copies of the name are cut — so «Владимир-Вяче…» and
«Александра-Ко…» appear on the sheet twice and in full nowhere. The ten-player cases
are unaffected: two legend rows leave slots wide enough.

The fix is layout with taste in it — wrap a legend name to a second line, drop the
share to give the name the width, or print the roster once at full width somewhere —
and it wants a mockup rather than a guess. **Pick it up when a real chat first seats
eleven distinct players in one evening**, which has never happened; until then the
case is in the gallery and the defect is visible on it, which is the right place for
a limit nobody has reached.

---

## The Russian copy speaks to a man, and the table does not know who it is talking to

Names are typed, not tagged, so the bot cannot know a player's gender — and the
Russian table is written in the masculine past tense throughout: «Ходил первым»,
«Пропустил», «Сыграл», «Побывал дураком», «Вёл график», «Вышел первым». Against a
female name every one of those is wrong, and a cold reading of the awards sheet named
two of them by hand before anybody counted the rest.

It cannot be fixed one line at a time: two of nine corrected reads worse than none,
since the remaining seven then look deliberate, and a lookup cannot help because
gender is not derivable from a typed name. What the language does allow is a voice
with no past-tense verb in it — a noun phrase, a count, a colon. «Первых ходов — 5, и
дураком в 2 из них» already reads that way, and it is the sheet's best line.

**Rewrite the Russian reasons into that voice the next time the awards copy is opened
for anything else** — the cost is one pass over one table, and it is much cheaper
attached to a phase already editing those lines than as a phase of its own. Until then
a woman at the table reads a sheet written about a man.

## The player card never says which table its expectation is read off

Every tile on `/personal` prints «рассадка предсказывает 20%», averaged from
`1/tableSize` in `career-tally.ts`. The card never prints the table size, so the same
caption shows a different number on two players' cards with nothing on either to
explain why. Naming it costs a line the card does not have; the fix is a drawing
decision, not a caption.

**Take it with the next phase that opens the player card.**

## One scale, two vocabularies, one poster apart

The player card's tile says «0% — последнее место, 100% — первое»; the season sheet's
hint says «50% — половина стола · 100% — первое место в каждой партии». Neither is
wrong and both describe the same quantity, but a player who reads both is taught the
scale twice in vocabularies that do not overlap: one names the ends, the other the
middle. A cold reader found it only by holding the two side by side.

**Take it with the next phase that opens the scoresheet copy** — the decision is which
of the two teaches the scale, not which sentence to edit.

## The grid's hint hands the cell a printer's verb, in English

`copy.en.ts`'s `sheetGridHint` reads "every cell prints the place taken", where a
reader wants what the cell *shows*. The Russian has no verb at all — «в клетке занятое
место» — so this was only ever about the one language.

**Take it with the next phase that opens the awards copy.**

## A sentence names a rule instead of what the picture shows

The arithmetic behind it is right; what fails is that a reader cannot get from the
sentence back to the picture. **«то верхняя половина, то нижняя»** at an odd table —
the top half is `position <= tableSize / 2`, so third of five counts as the bottom, and
nothing on the sheet lets a reader work that out.

This entry used to fault **«ничья за последнее место»** in the grid's key for having no
verb. The owner settled it the other way: the label is just «ничья» now, no verb either,
but in the same voice as «дурак» and «пропуск» beside it. Register was the defect, not
verblessness. The overlap it also caused is held by a spec — `cell-key.ts` publishes
`KEY_LABEL_ROOM` and `scoresheet/copy.spec.ts` measures every label against it.

**Take the surviving bullet with the next phase that opens the awards copy.**

## The grid's key explains one red digit and the grid draws two

The key shows the fool as a red digit of the biggest table the evening seated, so a
four-handed game inside a five-handed evening prints a red **4** the key never accounts
for — while that game counts toward «Дураком в N из M» on the awards sheet. Reading the
digit takes working out that somebody sat out.

A later phase reached this entry and could not take it, which sharpens the trigger. The
key lays its entries on a fixed pitch of 380px from `GRID_LEFT`, and three of them
already end at 1286 of the 1560 available — a fourth would run past the right edge. So a
second key entry is a relayout, not an addition.

A poster reading found a second hole of the same shape: **the three entries are never
drawn together in either language** — a sheet draws only what its evening earned, and the
one gallery evening with draws in it is English, so the Russian «ничья» is measured by a
gate and looked at by nobody.

**Take both with the phase willing to move the key's slots** — where a mark not depending
on the table size goes, and where a gallery case drawing all three entries in the other
language belongs. `KEY_LABEL_ROOM` holds the copy inside today's pitch until then.

## Four findings from the first gallery reading were never checked against the code

That reading produced seventeen. Twelve are fixed, one is the colour entry above, and
these four were never opened — they are questions rather than tasks, and checking one
can delete it:

- a crown drawn with nothing keying it, on the one sheet of twenty-nine with a red
  banner, and that banner never appears in the Russian set at all;
- the card owner's name cut to nine characters while an opponent's is drawn whole;
- one name cut to two different lengths on one sheet, the legend shorter than the
  column heading that exists to recover it;
- «Аня» and «Anya» listed as two players in one legend — the picture of the problem
  `/merge` exists for, and maybe a gallery fixture rather than a defect.

The middle two may be one defect seen twice — the entries above about fitting a name
to its space cover the same ground. **Check them with the phase that fits names to
their space**, which opens the same three files anyway.

---

## The design-page gate assumes one account owns both the repository and the page

`docs:check` compares `docs/mockups/design-page.sync` against the drawings the code
produces, and that is the only thing in the repository that can notice the Claude
Design page has gone stale — the page lives behind a login, so nothing else can see
it. The gate is right to exist. What it silently assumes is that whoever can commit
can also write the page.

On 21 August 2026 that assumption broke. The mockups moved in `9072e2e`, the page did
not follow, and this machine had meanwhile switched to an account that does not own
it: `DesignSync` answers 404, and a share link grants a human a browser view rather
than granting the API a write. So `main` went red on one line with the code fine, and
only switching accounts back could clear it.

Two things are wrong, and only the second is worth code. The first is that a red
`main` now means either "the code is broken" or "somebody committed from the wrong
account". The second is the gate's teeth: a stale page must never reach a **tag**,
because a release is what somebody reads the page against — but it need not block
every **push**, because a push is a checkpoint and the page can catch up before the
tag. Moving this check from `check:push` to `check:release` keeps the guarantee that
matters and stops an account switch painting `main` red.

**That is a gate losing teeth, so it is the owner's call, not a cleanup.** Pick it up
the next time an account switch or a lost login makes this red again — twice is a
pattern. What is red here is never the code, which is why the gate says nothing
useful about whether a phase is finished: every phase that draws anything turns it
red until its last step.

---

## Two screens carry the same scaffolding, word for word

`bot/seating-screen.ts` and `bot/leaving-screen.ts` are the same shape: `AS_HTML`, a
`screenOptions` that wraps a keyboard in a markup, a `redraw` that edits the message and
answers the tap, and a final step that refuses when a card went live and otherwise opens
one. The last of those is the sharpest: the `liveCardInChat` check with its
`show_alert` is now written twice, and it exists because `cards.open` does not defend
itself.

Copying it was the right call at two. The screens are not variations on one idea — one
orders players, the other subtracts them — and the shared parts are four small
functions, so a common base would invent a concept that does not exist yet.

**Pick it up at the third screen, or the first time that alert changes.** Either is
evidence the scaffolding is a thing rather than a coincidence.

## Files that may be worth splitting

None of these is wrong. They are the places where the next change is most likely to
be awkward, with the trigger that would make the split pay for itself.

**The line counts this table used to carry are gone**: half were stale and no gate
could have said so. The trigger decides a split, and `wc -l` answers the rest.

| File | Why it is on the list | Split it when |
|---|---|---|
| `features/live-game/bot/card/card-service.ts` | The largest file in `src/`, and the only one doing four jobs: looking a card up, applying a tap, scheduling the debounced edit, and sweeping idle cards. It reads as a skeleton, which is why it has survived. | A fifth job arrives, or something other than the card service needs the debouncer |
| `shared/repository/sqlite-repository.ts` | Every query in the app. It is meant to be the only file with SQL, so length is the price of that rule, not a smell. | The scoresheet's queries and the live card's queries stop overlapping — then two files behind one contract |
| `e2e/fake-telegram/fake-telegram.ts` | One `switch` over nine Bot API methods, mixing protocol shapes with the chat log. A `bot-api-methods.ts` was planned and folded in to save a file; that was probably the wrong trade. | A tenth method is needed, or a change has to reach into the protocol shapes *and* the chat log to be made. The count of refusals was the trigger here and it was the wrong one: it had already fired before it was written, it fired twice more without anybody wanting the split, and refusals turn out to sit above the switch in four-line helpers that mix nothing |
| `e2e/harness/scenario-chat.ts` | Module-level singletons plus a 25-member `Chat` interface that scenarios use as a language. The interface grows every time a scenario wants a new question answered. | The interface passes ~30 members — then split the driving verbs from the queries |
| `e2e/hub/hub-server.ts` | Proxy, cache, page serving and port probing in one file. | Anything is added to the hub |
| `scripts/docs-check/source/committed-pictures.ts` | Two subjects sharing only the word *committed*: whether the drawings on disk match what the renderers draw now, and whether the gallery's approved case lists match the samples. | Either subject grows a third kind of artifact |
| `scripts/docs-check/source/site-pages.ts` | CSS coverage, image geometry and a page weight budget — three questions that meet only in the site they are asked about. | The site gains a kind of page, or the weight budget needs reasoning of its own |
| `scripts/docs-check/source/source-tree.ts` | Holds `scriptsOutOfStep`, whose subject is `package.json` and not the tree, and a crowded-layer rule that names no document at all. | Anything else starts asking `package.json` a question — then the script table is its own file |
| `scripts/docs-check/documents/document-references.ts` | Two kinds of reference — a link with an anchor and an entry in the spec's contents — read by two separate parsers. A third kind lived here until the flow drawing turned out to gate it already, strictly, in both directions. | A third kind of reference arrives, and is one nothing else already checks |
| `src/main.ts` | Two `??` defaults left inline in the diagnostics wiring, still the only place in `src/` with branch coverage at 50% (lines 48–49), and the one surviving mutant in the file. `optionalEnv()` took the other two and the empty-means-missing bug with them; these two remain because the fallback runs only when the key is absent, and `main.spec.ts` imports the module once, with the spy returning a value. | A second spec file reaches both branches — vitest isolates files, so no `vi.resetModules()` is involved. What stops it is the price: 180 lines of setup and fifteen `vi.mock` calls duplicated for two branches. Do it once that header is worth extracting for another reason |

---

## A rule that fits several players still names one, so somebody goes unnamed

Two real evenings, and one of the six players — Вероника — appears on neither sheet.
Spreading the rows fixed the case where a player's award was crowded out by rarity; it
cannot fix this one, because on 21 August **no rule fired for her at all**. She left
after game 7 of 13, which is exactly THE IRISH GOODBYE, and the rule went to the other
player who left, because `bestBy` returns one winner.

So the catalogue's coverage of a table is narrower than its thirty-six rules suggest:
several describe a situation two people can be in, and each hands out one row. The fix
is not a participation award — the card says what one person did that nobody else did —
but a rule fitting two players could name the runner-up where there is room, the way
the truce already names everybody in a drawn game.

**Pick it up when a third real evening leaves somebody unnamed**, and check it against
the evenings on disk rather than against the simulation, which cannot see this: it
measures how often each rule fires, never how the chosen rows are spread over a table.

## Sixteen user-visible lines the gallery never draws

A cold reader given the full list of award and fact titles found only twenty of them on
any panel. Sixteen — six awards (ГОРЯЧИЙ СТУЛ, ПАЦИФИСТ, ЖЕЛЕЗНЫЙ СТУЛ, С ОПОЗДАНИЕМ,
ТО ЕСТЬ ТО НЕТ, КАМЕО) and ten card facts (ВЫХОДИТ СУХИМ, СЧАСТЛИВЫЙ ТАЛИСМАН, ЧЁРНАЯ
КОШКА, ЛЁГКАЯ ДОБЫЧА, ЕСТЬ ГДЕ РАЗВЕРНУТЬСЯ, ТЕРЯЕТСЯ В ТОЛПЕ, БЕЗ ПЕРВОГО ХОДА, ПЕРВЫЙ
ХОД НЕ К ДОБРУ, СНОВА ЗА СТОЛОМ, ЧЁРНАЯ ПОЛОСА) — are drawn by no gallery case in either
language, so the reading gate cannot see them and the width guard is all that can.

The gallery's cases were built to stress the **drawing** — the widest name, the most
awards, the tallest sheet — and a rule that fires on an ordinary evening is not an edge,
so nothing pulled it in. The same blind spot the spread rule had.

**Pick it up when a case can cover several of them at once**, which is the only way this
is worth the drawing time: one evening constructed so that the quiet awards fire together,
rather than sixteen fixtures. Until then the width spec covers the mechanical half and
nobody has read the other.

## An award names a rival it cannot print

ЛИЧНЫЙ КОШМАР is earned against one specific opponent — the rule finds a player who
finished above the same person in every game the two shared — and the sentence has to
say «один и тот же соперник», because `awardReason` is handed an `Award` and an `Award`
carries player **ids**, not names. The awards sheet resolves names one layer up, in
`awards-svg.ts`, and only for the winners.

A cold reader called it exactly: the player card's НЕУДОБНЫЙ СОПЕРНИК names the rival
in its holder line and reads twice as well for it.

**Pick it up when a second award needs a name it does not have** — a head-to-head or a
seat-neighbour rule would be the second. The fix is resolving names before
`awardReason` rather than after: a change to what the render layer is handed, and not
worth making for one line.

## Rarity ranks a vivid fact below an abstract one

On the 31 July evening the spread rule gave Олег his second row, and rarity chose THE
SLIDE — four games each worse than the last — over SWEET REVENGE, which is being left
the fool and taking the very next game. The second is the one anybody at that table
would repeat out loud; the model says it is commoner, and commoner is all the ranking
knows.

Rarity was the right first answer: measurable, and it broke the "same nine every
Friday" problem. What it cannot express is that some facts are stories and others are
statistics.

**Pick this up when there are enough real evenings to argue with the model** — the
percentages are simulated, and `RAREST_FIRST` is a hand-written list precisely so that
reordering it is one edit. A second column, or a hand-placed thumb on the scale for the
dozen rules that describe a moment rather than a shape, is the shape of the fix.

## Two names are one example short of being decided

`samples/` holds the states a feature is worth drawing at — a state, not a picture —
and `samples/contact-sheet.ts` is the exception: it computes coordinates, assembles
SVG, and is the one file there Stryker still mutates, which is the tell. It cannot
move to `render/`, where `CLAUDE.md` puts coordinates, because
`postersOutOfTheGallery` would demand gallery cases for it and a contact sheet is what
the gallery *is*. The honest home is `shared/drawing/`, and the move takes the
scoresheet's `svg-tags.ts` with it.

`shared/drawings/drawings-contract.ts` has the mirror problem: three of the four
things it declares are pictures, and the fourth, `tools`, prints text and draws
nothing — so its name describes three quarters of it.

**Decide each the first time a second example arrives** — a second feature that draws
anything, a second dev tool. Then `svg-tags.ts` has two callers and moves with the
sheet following it, and the contract says whether it is *drawings plus a passenger* or
*what a feature lends the tool box*. With one example each, every answer is a coin
toss. A third name was on this list — the phase-log field parsers living under a
*paths* name — and its second example arrived: they are `phase-log-fields.ts` now.

## Three corners of the tooling the mutation gate still cannot see

`scripts/docs-check/` and `scripts/hooks/` are mutated at 80% now — 83.79% over the
whole folder — and three things that reason sit outside both families:
`design-page.ts`, whose `refuse()` branches have no spec; `e2e-changed.ts`, which
decides which scenarios a diff can reach; and `mutate-changed.ts`, which routes a
changed file to one of the two runs and is scored by neither.

One module also passes only on the average — `source/env-keys.ts` at 78.02%, short
by its readers. Those are reachable: mocking `node:fs` lifted `source-tree.ts` from
60.98% to 92.68%, and took `reading-budgets.ts` 77.78% to 100% the moment a diff
left it alone with nowhere to hide.

**Worth doing with the next phase that changes what one of these files decides, or
that opens the mutation gate** — "touches `scripts/`" fired on one that only moved them.

## The picture gate cannot fork until its triage half moves out

`refresh-the-pictures` may not wear `context: fork` while three readers want its text
rather than its task; the skill's own opening names them. **Fork it once that triage
sits on a page beside `finish-phase`, the measuring one-liner is written where it is
needed rather than pointed at, and one real picture phase has proven the handoff** — a
fork that cannot reach the `poster-reader` would read pictures its own run drew, and
that returns looking exactly like success.

## Not debt, deliberately

Listed so nobody "fixes" them:

- **The chat page renders the bot's HTML raw.** That is what Telegram does with
  `parse_mode: "HTML"`, and it is what makes a missing escape visible as markup.
- **`diagnostics/` has no `domain/`.** There is nothing to decide there.
- **The same product constraint opens `README.md` and `PLAN.md`.** A visitor must
  not have to open the spec to learn why the bot is a keyboard. It is the one
  overlap `docs:check` and the `write-a-doc` skill deliberately allow.
- **`percent-label.ts` puts the `%` outside `copy.en.ts`, and `chronology-layout.ts`
  the truncation `…`.** Both mark something about a number or a column rather than
  saying anything, the way `svg-tags.ts` rounds a coordinate, and no language spells
  either differently; the copy rule exists so a second locale is a small change, which
  a percent sign is not. Two review passes decided the `%` independently.
- **`merge-callback-codec.spec.ts` imports `MOST_NAMES_AT_ONCE` from the domain**
  instead of mocking it. Its case — that a full selection still fits in 64 bytes —
  would assert the spec's own number against a mocked cap. The codec's byte budget
  really does bound the domain's cap, this is the one place both are visible, and it
  earned its keep by failing at eight names.
- **No tap is gated by who tapped it.** An inline button acts for whoever presses
  it — Telegram's model, and the right one for a single table of friends, where
  every action is reversible or one tap to redo. The one authorization in the
  product is `/status` answering only `OPERATOR_TG_ID`.
- **`logger.ts` and `sqlite-connection.ts` read the environment at module scope.**
  A logger is created wherever code runs and the connection opens at import, so
  neither can be handed values the way feature code is — which is what "read in one
  place, pass values down" actually polices. `LOG_LEVEL` has one reader again now
  `/status` has stopped reporting it, so nothing visible is owed. Pick this up if a
  second module ever needs the same value.
