# FoolProof — what is owed

Work that is finished enough to stop, but not finished. Each entry says what state
it is in, what it would cost to pick up, and — the part that matters — **what has to
be true before it is worth doing**. Nothing here is a bug in the bot: those go to
`PLAN.md` as edge cases, or get fixed.

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

**Stryker 10.0.0 was checked on 19 Aug 2026 and carries the same
`typed-rest-client ~2.3.0`.** So a major bump does not close this, and there is no
reason to take one for this alone.

An override is a claim that a package works against a version its own author never
tested. The mutation run is what keeps that claim honest, and it passes.

**Delete the block when Stryker ships a release that bumps `typed-rest-client`
itself** — `npm audit` going quiet without it is the check.

## A backup that stops happening announces it by silence

The timer sends each snapshot to the operator's chat, so a run that fails is
noticed by a file *not* arriving. That was thin when the timer was daily. It runs
monthly now — while one table plays, a month of cards is worth a few kilobytes —
and noticing an absence on a monthly rhythm is not something a person does.
Nothing polls the timer's state, and `/status` reports the database it is using
without saying when it was last copied.

The honest fix is one line in the diagnostics report: the age of the newest file
in the backup directory, red past forty days. It is small, and it is deliberately
not done yet, because it needs `/status` to read a path that is not the database
— the first time that feature would touch the filesystem for a reason other than
the one it was built for.

**Pick it up when the timer goes back to daily**, which is the same trigger as a
second table starting to play — or sooner, the first time the answer to "when did
this last run" is wanted while something is actually broken.

---

## A graceful shutdown is the one path e2e cannot play

`bot-process.ts` stops a bot by killing it, because a spawned parent on Windows
cannot deliver `SIGINT` to its child. So the path a real `Ctrl+C` takes — the one
that flushes the pending debounced edit before the process ends — is exercised by
units and by hand, never by a scenario.

Closing it honestly would mean a shutdown channel in `src/` that exists only for
the harness, and this project does not put test hooks in the app: `BOT_API_ROOT` is
in `src/` because a self-hosted Bot API server is a real Telegram feature, not
because e2e wanted a seam.

**Pick it up if a lost edit on shutdown ever reaches a real Friday** — that is the
evidence that the gap costs more than the seam would.

---

## Picking the holder of a title is written four times

`awards/pick-winner.ts` generalises "keep the challenger when it outranks the
holder" for the evening's awards. Three more reduces of the same shape live in
`career/`: `career-evenings.ts` carries a direction so one function serves both the
best and the worst night, `rival-facts.ts` ranks pairings by a merit with two
tie-breaks, and `rarest-of.ts` keeps the lowest binomial tail with none at all.

This is the second phase in a row to move the count rather than settle it. The last
one deleted the inline-keyboard entry for hitting exactly this trigger and created
the next one; this one deleted `career-rival.ts`'s copy and added two. The trigger
as written — "collapse them when a fourth ranking appears" — has now fired and been
stepped over, which means it was the wrong trigger: a count does not say whether
the shapes actually want to be one function, and these four genuinely differ in
what they rank on (a merit, a merit plus direction, a merit plus tie-breaks, a bare
minimum).

So the trigger is replaced by the one that would actually pay: **collapse them the
first time two of the four disagree about a tie-break and the difference turns out
to be a bug rather than a decision.** Until then the duplication costs four small
reduces; the shared `Merit` carrying a direction, a tie-break list and an ordering
would cost more than that at every call site.

## Counting games is spelled out twice

`merge-names/render/game-tally.ts` and `scoresheet/render/session-tally.ts` both turn
a number into `1 game` / `12 games`. The duplication is forced from two directions: a
feature may not import another, and choosing between the singular and the plural is
exactly the decision `copy.en.ts` is forbidden to make, so it cannot live in the copy
table either. The scoresheet's copy also needed `1 player` / `3 players`, which is
why its version is named after the session rather than the game.

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
target — including files that have nothing to do with signals. Stryker carries on
because both cover zero mutants, so the score is honest and the gate is not lying;
what is lost is two cases' worth of killing power over `main.ts`, and a pair of red
lines in every mutation run that a reader learns to skip past. The cause is in how
the runner's environment handles a process-level `SIGTERM` listener, not in the
assertions.

**Chase it when a mutant in `main.ts`'s signal wiring survives**, or when the noise
first makes somebody miss a real failure in that output.

## Half of drawing a poster still blocks the event loop

`rasterize()` draws through `renderAsync`, which hands the work to a thread and
gives the loop back. The encode after it does not: `asPng()` is synchronous and
**`@resvg/resvg-js` publishes no asynchronous form of it**, so the larger of the two
costs in [PLAN.md](PLAN.md#what-drawing-one-costs-everybody-else) still stops
everything while it runs.

Closing it means running the whole rasterizer in a `node:worker_threads` worker:
either one spawned per poster, which costs its own startup and undoes some of the
saving, or a pool, which is a lifecycle to own — starting it, keeping it warm,
draining it on shutdown alongside the stops `main.ts` already composes. That is a
real amount of machinery for a bot whose busiest hour is one Friday evening.

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
chart is the picture — which is why this is not a two-line patch.

It came out of the first cold read of the whole gallery, along with sixteen others
that live in `reports/poster-findings.md`. That file is gitignored, so the rest of
the queue is one laptop away from being lost; this entry is the one finding
confirmed in the code, and it is here so at least that much survives.

**Take it with the next phase that redraws a poster**, which will want a
`poster-designer` mockup anyway — or the first time a real chat seats nine.

---

## The server installs the whole toolbox to run two packages

`deploy/foolproof-deploy.sh` runs a plain `npm ci`, which installs devDependencies,
so every deploy puts Stryker, vitest, eslint, typescript and now a WebP encoder onto
a production box that imports none of them. `src/` needs exactly two packages —
`grammy` and `@resvg/resvg-js` — because Node strips types natively and nothing in
the running bot reaches for a test runner.

`npm ci --omit=dev` is the whole fix and it makes deploys smaller and faster. It was
not taken when the encoder was added, because that phase ran overnight while the
owner slept and a deploy script is the one place with no automatic gate: a wrong
guess there is a bot that does not start, found in the morning.

**Take it the next time anything touches `deploy/`**, when somebody is awake to
watch the deploy that follows — or the first time an install is slow enough to
notice.

---

## Every `docs:check` rule is proven once, by hand, and never again

`scripts/` has no specs and Stryker mutates only `src/**`, so the checks in
`scripts/check-docs.ts` are held up by lint and the type checker alone. Neither can
see the thing that actually goes wrong with them: a rule that runs, reports nothing,
and would report nothing whatever the repository looked like. That has already
shipped here — a poster rule whose regexp lost a backslash on the way through a
generated patch matched every path and passed forever, and the same escaping bug
was caught again while writing the approved-cases rule, one substring check away
from shipping twice.

The standing answer is the probe: break each branch on purpose, watch the complaint,
put the repository back. It works, it caught both, and it is a thing a person
remembers to do rather than a thing that happens. A rule added in a hurry is a rule
with no proof, and it looks exactly like the others.

Nothing here is cheap. Specs for `scripts/` would be the first in the folder and
would need the whole filesystem stubbed; running each rule against a fixture
repository means building one.

**Give `check-docs.ts` a spec the first time a rule is found to have been passing
vacuously in the field** — that is the second occurrence of a failure that has now
happened once, and it is the evidence that a probe at authoring time is not enough.

---

## The design page's sync marker proves the splice, not the push

`docs/mockups/design-page.sync` holds the fingerprint of the drawings
`node scripts/tools.ts design-page` put into the page, and `docs:check` fails while
that fingerprint and the mockups disagree — which is what stopped the page falling
two releases behind again. But the splice writes the marker locally and the push
happens afterwards, by hand, over the MCP. So a phase that sees the gate red and
reruns the tool goes green without the page ever receiving anything, and `git add -A`
takes the marker along. The `update-the-design-page` skill orders the two — commit
the marker only after the byte-identical read-back — and that ordering is prose,
which is the kind of thing this gate exists because prose failed at.

Nothing cheap closes it: the page lives behind a login, so no check that runs in CI
can ask what the page currently holds.

**Move the marker's write to the end of the push when the MCP can be driven from a
script** — or the first time the gate is cleared by a rerun that pushed nothing,
which is the failure this entry exists to make recognisable.

---

## The keys still say "dealt" where the strings now say "first move"

Every user-visible string about who opens a game was moved off dealing wording, in
both languages, because the bot deals nothing — the fool's neighbour attacks first,
and the live card had always called it *going first*. The identifiers were left
behind: `tileDealt` now holds `THE FIRST MOVE`, `neverDealt` holds
`NEVER ONCE WENT FIRST`, and `dealtGiftReason` / `dealtCurseReason` sit beside them,
backed by `CareerFactName.NeverDealt` and `neverDealt()` in `opening-facts.ts`. So a
key claims something its contents contradict — the fault CLAUDE.md names for file
names, one level down. Nothing a player can see, and the rename runs through the
fact catalogue, `RAREST_FIRST`, the fact-lines switch and four specs.

**Rename when the opening facts are next opened for any other reason** — the cost is
almost entirely in the same files that change then, and doing it alone buys nothing a
reader could not get from this entry.

---

## The `/personal` roster keyboard is the only one with no ceiling

`roster-keyboard.ts` draws one row per player the chat has ever seated, and nothing
caps the list. Every other keyboard in the bot is bounded by the table — at most ten
seats — but this one grows with the chat's whole history, and it is a *reply markup*,
which the Bot API limits by payload size rather than by a documented row count. Nine
players today, so nothing is close; what the real limit is has never been measured,
only assumed, and the failure mode would be `/personal` refusing to send its screen
at all rather than degrading.

**Measure the real ceiling and paginate when a chat passes twenty players** — or
sooner, the first time a `sendMessage` carrying this markup is refused. The measuring
is the work: a scenario that builds the markup for fifty names and asks a real
`getMe`-less grammY to serialize it says more than the documentation does.

---

## Two attendance facts fire together, on the same players, forever

`everPresent` and `foundingMember` are structural rather than earned: whoever has
been at every evening since the first gets both, on every card they ever draw, and
they outrank most of the measured facts once a career is long. The gallery's
`a-long-career` and `always-burned` cases show it — two of the three rows are the
same two facts, and only the top row and the plate differ. For the regulars, who are
exactly the people asking for the card most often, that is less variety than the
twenty rules suggest.

The fix is not obvious enough to guess at: it could be overshadowing (a founder who
never missed one needs only one of the two lines), a decay by career length, or a
rule that a card may carry at most one attendance fact.

**Pick one when a chat has run twenty evenings** — that is when a regular's card has
had the same two rows on it long enough to be worth complaining about, and when
there is real data to choose between the three shapes rather than argue.

---

## `WIDEST_ADVANCE` is out by a third, and the widest letter is not the one it names

`card-metrics.ts` fits a name to its space with `WIDEST_ADVANCE = 0.8` em per
character. Measured against the shipped bold face with resvg, that is not the widest
anything: latin `W` is 0.967 em, `Ш` is 1.063 and `Щ` is 1.074. The model therefore
under-measures by about a third at the worst input, and the player card's heading is
where it shows — a name of 32 `Щ` puts 1218px of ink where 949px is free, so it runs
into the games-and-evenings counter beside it. Live today, and reachable: a line-up
takes any name a person types.

The gallery cannot see it because `one-huge-name` pads its 32 characters with `я`,
which is 0.60 em — a plausible extreme rather than a constructed one, and it passes
the broken limit exactly as easily as a working one.

The fix is a real choice, not a number to bump. Raising the constant to 1.08 closes
the hole in one line and makes every ordinary name truncate noticeably earlier,
because the worst case is then charged to everybody. Measuring the actual string
against a table of per-character advances costs nothing for ordinary names and is
exact, but adds a generated table to the repository, which then needs its own gate
against going stale. **Pick this up the first time a real player's name is cut wrong
on a card, or when a second renderer needs to fit text** — the second reader is what
turns the table from over-engineering into the obvious answer.

---

## A long name on a crowded evening exists nowhere on its own sheet

The chronology cuts a column heading to fit its column, and the legend under the chart
is where a reader recovers the whole name. On an evening with eleven or more distinct
players the legend wraps to three rows, its slots narrow to the same order of width as
a heading, and both copies of the name are cut — so «Владимир-Вяче…» and
«Александра-Ко…» appear on the sheet twice and in full nowhere. A cold reading of the
thirteen-player case found it; the ten-player cases are unaffected, because two legend
rows leave slots wide enough.

The fix is layout with taste in it — wrap a legend name to a second line, or drop the
share to give the name the width, or print the roster once at full width somewhere —
and it is worth choosing with a mockup rather than guessing. **Pick it up when a real
chat first seats eleven distinct players in one evening**, which has never happened;
until then the case is in the gallery and the defect is visible on it, which is the
right place for a limit nobody has reached.

---

## The Russian copy speaks to a man, and the table does not know who it is talking to

Names are typed, not tagged, so the bot cannot know a player's gender — and the
Russian table is written in the masculine past tense throughout: «Ходил первым»,
«Пропустил», «Сыграл», «Побывал дураком», «Вёл график», «Вышел первым». Against a
female name every one of those is wrong, and a cold reading of the awards sheet named
two of them by hand before anybody counted the rest.

It cannot be fixed one line at a time. Two of nine corrected reads worse than none —
the remaining seven then look deliberate — and the fix is not a lookup either, because
gender is not derivable from a typed name. What the language does allow is a voice with
no past-tense verb in it: a noun phrase, a count, a colon. «Первых ходов — 5, и дураком
в 2 из них» already reads that way, and it is the sheet's best line.

**Rewrite the Russian reasons into that voice the next time the awards copy is opened
for anything else** — the cost is one pass over one table, and it is much cheaper
attached to a phase already editing those lines than as a phase of its own. Until then
a woman at the table reads a sheet written about a man.

---

## Files that may be worth splitting

None of these is wrong. They are the places where the next change is most likely to
be awkward, with the trigger that would make the split pay for itself.

| File | Lines | Why it is on the list | Split it when |
|---|---|---|---|
| `features/live-game/bot/card/card-service.ts` | 398 | The largest file in `src/`, and the only one doing four jobs: looking a card up, applying a tap, scheduling the debounced edit, and sweeping idle cards. It reads as a skeleton, which is why it has survived. | A fifth job arrives, or something other than the card service needs the debouncer |
| `shared/repository/sqlite-repository.ts` | 443 | Every query in the app. It is meant to be the only file with SQL, so length is the price of that rule, not a smell. | The scoresheet's queries and the live card's queries stop overlapping — then two files behind one contract |
| `e2e/fake-telegram/fake-telegram.ts` | 406 | One `switch` over nine Bot API methods, mixing protocol shapes with the chat log. A `bot-api-methods.ts` was planned and folded in to save a file; that was probably the wrong trade. | A tenth method is needed, or the fake starts refusing more than two things |
| `e2e/harness/scenario-chat.ts` | 273 | Module-level singletons plus a 25-member `Chat` interface that scenarios use as a language. The interface grows every time a scenario wants a new question answered. | The interface passes ~30 members — then split the driving verbs from the queries |
| `e2e/hub/hub-server.ts` | 259 | Proxy, cache, page serving and port probing in one file. | Anything is added to the hub |
| `src/main.ts` | 67 | Two `??` defaults left inline in the diagnostics wiring, still the only place in `src/` with branch coverage at 50% (lines 48–49), and the one surviving mutant in the file. `optionalEnv()` took the other two and the empty-means-missing bug with them; these two remain because the fallback runs only when the key is absent, and `main.spec.ts` imports the module once, with the spy returning a value. | A second spec file reaches both branches — vitest isolates files, so no `vi.resetModules()` is involved. What stops it is the price: 180 lines of setup and fifteen `vi.mock` calls duplicated for two branches. Do it once that header is worth extracting for another reason |

---

## Not debt, deliberately

Listed so nobody "fixes" them:

- **`e2e/` uses relative imports.** The `#`-aliases are the app's; the harness is
  not the app, and a relative import there is a reminder of that.
- **`e2e/` imports nothing from `src/`** — not even `copy.en.ts`. A harness that
  imported the copy table would assert a constant against itself.
- **The chat page renders the bot's HTML raw.** That is what Telegram does with
  `parse_mode: "HTML"`, and it is what makes a missing escape visible as markup.
- **`diagnostics/` has no `domain/`.** There is nothing to decide there.
- **The same product constraint opens `README.md` and `PLAN.md`.** A visitor must
  not have to open the spec to learn why the bot is a keyboard. It is the one
  overlap `docs:check` and the `write-a-doc` skill deliberately allow.
- **`percent-label.ts` puts the `%` outside `copy.en.ts`.** It is a numeric format, the
  way `svg-tags.ts` rounds a coordinate, not a sentence anyone would translate — and
  the copy rule exists so a second locale is a small change, which a percent sign is
  not. Two review passes have now had to decide this independently, which is why it
  is written down.
- **`chronology-layout.ts` puts the truncation `…` outside the copy table**, for the
  same reason as the `%`: it marks that a name was cut to fit its column, and no
  language spells that differently.
- **`merge-callback-codec.spec.ts` imports `MOST_NAMES_AT_ONCE` from the domain**
  instead of mocking it, which every other spec would. The case it serves — that a
  full selection still fits in 64 bytes — is meaningless against a mocked cap: it
  would assert the spec's own number. The real coupling is that the codec's byte
  budget bounds the domain's cap, and this is the one place both are visible. It
  already earned its keep by failing at eight names.
- **No tap is gated by who tapped it.** An inline button acts for whoever presses
  it — Telegram's model, and the right one for a single table of friends, where
  every action is reversible or one tap to redo. The one authorization in the
  product is `/status` answering only `OPERATOR_TG_ID`.
- **`logger.ts` and `sqlite-connection.ts` read the environment at module scope.**
  A logger is created wherever code runs and the connection opens at import, so
  neither can be handed values the way feature code is — which is what "read in
  one place, pass values down" actually polices. There is no visible cost left now
  that `/status` has stopped reporting the log level: `LOG_LEVEL` has one reader
  again. Pick this up if a second module ever needs the same value.
