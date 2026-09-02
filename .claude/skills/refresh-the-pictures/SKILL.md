---
name: refresh-the-pictures
description: Everything the picture gate needs once it opens — the checklist of committed pictures to regenerate (the posters, in every language and every format, the Claude Design page, the OG previews, the icons), the gallery of edge cases and how to build one that presses a real edge, how the poster-reader is briefed, and how to triage what it reports. Stage 5, so use after the diff review, when a design change has landed in code, when docs:check reports the posters out of step, or whenever a committed picture might no longer match what the product draws.
---

# Refreshing the pictures, and reading them

> **Stage 5** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

**This skill does not carry `context: fork`, and the reason is a rule rather than a
preference.** Its triage half is read by the caller *after* the drawing is done — gate
6 leaves the conclusion with whoever opened the gate — and `e2e/harness/settling.ts`
and the `deep-checkup` brief both send a reader here for one measuring command. A skill
consulted as reference may not fork, because invoking it would then run a whole gate
where one paragraph was wanted. `TECH-DEBT.md` carries what would have to move first.

Every picture in the repository is a copy of something the code or the design
can change without it. Three families are gated, the rest have nothing but this
table — so the skill *is* the checklist: after any implemented visual change,
walk it top to bottom and say for each row why it does or does not need
redrawing. Skipping a row silently is how an icon ships in last year's colour.

| Picture | Drawn by | What catches it going stale |
|---|---|---|
| `docs/posters/*-{en,ru}.svg` + `.webp` | `node scripts/tools.ts posters` | `docs:check` compares the SVG, and weighs and measures the WebP the pages carry |
| `docs/posters/*-en.png` — what README shows, at the width the bot sends | the same command | nothing — this row |
| `docs/previews/og-cover*.png` | by hand, from the site's own look | nothing — this row |
| `docs/favicon.png`, `docs/apple-touch-icon.png` | by hand, from the bot's avatar | nothing — this row |
| the Claude Design page | the `update-the-design-page` skill, end to end | `docs:check` compares `design-page.sync` |

The gate deliberately compares **SVG, never the raster** — rasterizing would drag
the native resvg binary into a documentation gate. So a resvg upgrade can change
every shipped picture while `docs:check` stays green, and the hand-made rows have
no generator at all: for those, the walk through this table is the whole
mechanism.

One exception, and it exists because nothing else could see it: the pictures the
**site** serves are also weighed and measured. Every image a page draws must be
there, must be the shape the page reserves room for, and the page's pictures
together must stay under a budget. That is bytes and dimensions, not content — a
poster can still be redrawn wrongly and pass, which is what the reader below is for.

## The procedure for the generated rows

1. **Redraw after the review, before the final commit.** The pictures stage
   sits between the diff review and the retrospective so that a review finding
   cannot force a second redraw — `docs:check` was taken out of `check:phase`
   for exactly that reason. It still compares the SVGs in CI (`check:push`) and
   before a tag (`check:release`), so a stale mockup that reaches the push is a
   red check. **Commit both halves.** The SVG is the reviewable one: a
   colour change is one readable diff line where a raster is an opaque blob. The
   raster is the one anybody actually looks at — a PNG in `README.md` and on the
   design page, a WebP on the site, which is drawn at the width it is read at
   rather than the width the bot sends.
2. **Every regenerated picture goes to the `poster-reader` agent, not to your own
   eyes.** The gate proves the file matches the renderer; it cannot say the
   renderer started drawing nonsense — the awards card grew from thirteen rules to
   thirty-eight with every gate green. **Briefing the reader** below has what to
   send and what must never go with it.
3. **Check the render against the e2e quiet window.** A poster that grows costs
   rasterizing time, and `e2e/harness/settling.ts` decides the bot has finished
   after `QUIET_MS` of silence — a window the slowest single render must fit
   inside. One redesign added ~80ms, crossed the old window, and announced
   itself as five scenarios asserting against photos that had not arrived.
   Measure before `e2e:changed`, so a red suite means the bot, not the harness:

   ```
   node -e "import('./scripts/feature-drawings.ts').then(async ({everyDrawing})=>{const {rasterize}=await import('./src/shared/drawing/rasterize.ts');for(const d of await everyDrawing(o=>o.posters())){await rasterize(d.svg);const t=performance.now();await rasterize(d.svg);console.log(d.file,(performance.now()-t).toFixed(0)+'ms');}})"
   ```

## The hand-made rows

The OG previews change only when the site's look changes, the two icons only
when the avatar does. When their source moved, regenerate from it and look at
the result at the size it is served — an OG cover is judged in a link preview,
an icon in a browser tab, not in an image viewer at full width.

## The gallery, and the cases it draws

`node scripts/tools.ts gallery` draws every poster across every edge the product has
to survive — one game, two players, ten long names, more games than the sheet holds,
an evening nobody lost, arrivals and departures, a career one evening old, a career
too long for the sheet, the longest name a player may have — into `reports/gallery/`,
and lays all of them into `contact-sheet.png`. Nothing before this point can see a
poster that has started drawing nonsense: the SVG matches the renderer, the tests
match the SVG, and all of it stays green while a line runs off the card.

**A poster the gallery never draws is a gate that silently does not apply.**
`/personal` shipped in two releases without a single gallery case, and the gate ran
green over both — then the first case written for it found a name running off the
card and through the counter beside it, in the one place the bot prints user data at
126px. So `docs:check` now fails when a poster exists that no `samples/*-edges.ts` draws a
case through; a phase that adds a poster owes it cases in the same phase.

**The cases are not invented here.** They were named at stage 1, before the mockup was
drawn, and the owner approved a picture of each one — so this step copies that list
into the gallery and draws it against the real renderer. The list is a committed file,
`docs/posters/<edges module>.cases.txt`, and `docs:check` fails **both** directions —
a held case the gallery stopped drawing, and a drawn case the list does not hold — so
keeping the two in step needs no vigilance. What is still yours is that the gate
polices consistency and not approval: writing the new edge into the list yourself
makes it consistent and leaves it unapproved, so say out loud that you did.

The three rules below are stated again in the `poster-designer` brief, deliberately —
that agent's `tools:` list has no Skill tool, and a list of edges written without them is the very
failure they describe. That brief carries a fourth this step does not need, since the
list is written there: a case that cannot be constructed is a finding, not a panel
quietly dropped. Two wordings, nothing checking them against each other — change one
and change the other, **and recount them when you do**, because the sentence you are
reading is the one that goes stale first.

**An edge case has to be hostile, not merely realistic.** A case built from a
plausible extreme is a sample, and a sample passes a broken limit as easily as a
working one. The name fix above was measured, written, drawn and *looked at* against
a 32-character Russian name, and it read perfectly; the same 32 characters made of
the widest letter in the alphabet still ran through the counter beside it, because
the width model was out by a third for bold. One case, one character changed, and a
shipped-looking fix became a real one. So the widest input is **constructed** — the
widest glyph, the longest run, the emptiest history — never drawn from what a player
plausibly types.

**And it is constructed inside the product's own limits — checked at the level where
the state lives, not the level the number is written at.** A fixture answers only to
the script that writes it, so nothing stops it building a state the bot refuses:
`three-legend-rows` seated thirteen players in every game where `MOST_PLAYERS` is
ten. Illegal, and it had survived every gate, because each one asked whether the
picture was drawn correctly and none asked whether it could happen.

**But an illegal fixture is not an unreachable state, and confusing the two nearly
deleted a documented feature.** The cap is on one *game*; the chronology draws an
*evening*, and `seriesChronology` gathers every distinct player of it, so swapping
somebody in mid-evening reaches eleven players with ten seated throughout — `PLAN.md`
had costed that state in games years before the case did. The verdict "unreachable,
delete it" came from a correct measurement of `legendRowsOf` and a wrong reading of
which limit governs, and only the review caught it. So name the limit you are
pressing **and** the level it applies to, then check the state against that level. A
case whose fixture is illegal is **repaired** — there by seating a subset each round —
and only a state the product genuinely cannot reach earns a deletion, which is a
finding worth saying out loud rather than a tidy-up.

**A case earns its description only after the drawing agrees with it.** A case added
to exercise two marks that appear only when a best and a worst evening are unique
promised "evenings that actually differ" in its own sentence — but the fate behind it
repeated on a three-night cycle, so the shares tied, the marks stayed hidden, and the
case proved nothing while reading as though it proved the one thing it was written
for. The sentence beside a case is a claim about the picture, so open the picture
before believing it.

## Briefing the reader

**What the brief must carry, and what it may never carry, live in
`poster-reader.md`'s own `What the brief must carry` section** — read it before
assembling one. It is written there rather than here because the agent is the party
that suffers a bad brief, and because a contract kept in the caller's file is a
contract only the caller reads.

Two things about the errand belong here, because they are the caller's to arrange:

**Two calls, not one.** Comparing what shipped against what stage 1 signed off is the
one comparison nothing else in the flow makes, and it has to happen — but the approved
mockup of a chart *is* the answer to "what appears here", so a reader holding it can no
longer read a hint about that chart cold. One reading without it, then a fresh call
with it. The order is not politeness; the first reading is worthless if the second
call's material arrives in the same message.

**Regenerate before briefing.** The reader is handed pictures, not a promise about
them, and a stale PNG produces findings against a drawing that no longer exists.

**A model that refuses or dies mid-run is yours to re-run, not the agent's** — that
rule and the rest of what to do when a subagent fails live in `finish-phase`'s
[delegating-work.md](../finish-phase/delegating-work.md), and this step reaches it because it also
runs on its own trigger, without that skill ever being loaded. What may not be
substituted is the property the reader was chosen for: a context that did not draw
the picture.

**Reading the pictures against each other is the reader's second pass**, and the
questions it asks live in `poster-reader.md` rather than here, so there is one wording
of them. What belongs here is why the pass exists: a poster can be flawless alone and
still contradict the one beside it, and no single-picture pass can see it. Three failures
landed at once here, and none of them was visible in a single image — the
live card asked *who went first* while the stats card credited *the dealer*, in both
languages, for the same event; a chart captioned "one point per evening" drew no
points at all, only a line and two unlabelled marks; and the one poster that explained
its own percentage scale was not the one a player reads their own number off. Two of
the three were reported by the owner, from the finished pictures, after the gate had
passed.

All three were comparisons between pictures, and comparisons are made twice now: the contact sheet at
stage 1 puts the new drawing beside its neighbour before a renderer exists, and this
step reads the finished set again. The earlier pass is the cheaper one and does not
replace this one — it judges a mockup, and only this one sees what the code drew.

## Reading what comes back

**A cold reading reports the symptom; the defect is usually one level away from where
it points.** Three findings in a row were real and none was where it read. "30% over
28 times with 96 games — the percentage is wrong" was a correct percentage over the
games that *had* a fool, and the fix was to print that denominator. "These two awards
contradict each other arithmetically" was two awards that can both hold, and the fix
was a phrase implying an order the rule never checks. "The number is off by one" was a
number the grid could confirm and a sentence claiming one comparison too many. So
before changing either half, ask **which of the number and the words is wrong** — and
check the rule that produced the number, not the sentence that reported it. Changing
the arithmetic to match a sentence is how a correct statistic gets broken by a reading
of it.

**The cross-reading is also where the answer usually already is.** A new section doing
the same job as one on another poster should copy that section's *structure* before a
word of new copy is written for it. One chart caption was written three times — scale
and legend crammed into one line, which collided with its own section label in
Russian; then split across two places; then finally shaped like the chronology's,
which puts the scale in the caption and the symbols elsewhere and had been sitting in
the gallery the whole time. The owner settled it in one glance by putting the two
charts side by side. Look at the working example first; three renders were spent
reasoning about text lengths instead.

**And it borrows that section's *name*, never invents a second one.** A section drawn
in two states — full and empty, present and promised — is one thing to a player, so it
keeps one label and lets a hint carry the difference. A phase gave the empty state of
the evening chart its own name, wrote a copy key for it, and asserted in a spec that
the two names differ — a designed tension that walked straight into `PLAN.md`'s own
rule about one thing carrying one name everywhere a player reads it. The review caught
it and the fix deleted a copy key rather than adding one. The question before writing
any new label: **is this a new thing, or an old thing in a new state?**

**Checking the readings against the code is a second scope, and it is delegable.** The
findings arrive as a list, each one independently answerable out of the source, none
of them touching the files the phase changed. A phase spent five sequential calls
confirming that two award sentences described their rules correctly while its own
retrospective waited, and every one of those calls was a grep somebody cold could have
run in parallel. Send the list, ask for the rule behind each number and a verdict of
*sentence wrong*, *number wrong* or *reader wrong*, and keep the deciding.

**Fix what is plainly wrong; ask about what is taste or wording.** A line overflowing
the card is a defect and needs no permission. Which of three phrasings replaces it is
the owner's call, and asking costs one message where guessing costs a rewrite. The
first run of this gate found both kinds at once: two awards ran their winners off the
right edge, and two more crowned a comeback that never fell below mid-table.

## What this skill hands off

If the posters were redrawn, the page in Claude Design is now behind
the code — a separate job with its own trap list, and a `context: fork` skill — so
invoke **`update-the-design-page`**, naming which drawings moved, and read its answer.
