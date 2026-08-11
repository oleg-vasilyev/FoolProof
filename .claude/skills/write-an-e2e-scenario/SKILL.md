---
name: write-an-e2e-scenario
description: Write or change a scenario in FoolProof's e2e/ folder — when one is owed at all, the verbs a scenario drives the chat with, what to assert so it cannot silently start watching a different screen, and how it must end. Use whenever adding or editing a *.e2e.spec.ts, or deciding whether a change needs one.
---

# Writing an e2e scenario

A unit mocks everything around one file. A scenario does the opposite: it plays a
whole evening against a **real `src/main.ts` process** on a real SQLite file, with a
fake Telegram on the other end. How the harness is built, and what is wrong with it,
is [`e2e/README.md`](../../../e2e/README.md) — read that when changing the harness,
not when writing a scenario.

## First: is one owed?

Usually not. A scenario is the slowest test this project has, and `npm run
e2e:changed` will play it on every phase that touches its feature — so it is a
standing cost, not a one-off. Two things earn one:

- **A feature with an inline keyboard.** Whether a tap reaches the feature that owns
  it is a fact about real grammY that no unit can reach, and it was wrong once
  already. Both keyboard features arrived with scenarios and both immediately found
  a wrong assumption about the bot's own behaviour.
- **A bug that got through the units.** That is evidence the seam is real.
- **An extreme of real input the product has to survive** — the fullest table, the
  longest names, the evening that outgrows the sheet. Not because the output will be
  pretty there, but because nothing else plays the whole chain at that size.

Anything a unit can prove belongs in a unit. A scenario that re-proves a reducer is
slower, flakier and asserts less.

## When you catch yourself describing a limit, something must assert it

**A sentence about how the product behaves at an edge is an untested claim until a
test says it.** "At ten players it cuts to five letters and an ellipsis" was written
in a report, not in a spec, and the ten-player scenario had been green through the
whole life of the bug it was describing — because it asserted the PNG's magic bytes
and its caption, and nothing else.

So when a limit turns up in prose, ask the second question too: **can the scenario
see the thing you just described?** A scenario holds a rasterized PNG, so it can
prove the picture arrives, its width, and that it fits inside Telegram's height —
and it can prove nothing whatever about a font size or a truncated word. Those live
in the SVG, which means the assertion belongs where the SVG is still a string:
`scoresheet-chain.integration.spec.ts` renders one from a real database, and reading
attributes out of it is what proves every heading takes the same size.

Splitting it that way is the point. A scenario that asserts only what it can
actually see is a guard; one that asserts a photo arrived is a green light with
nothing behind it.

## The shape

One file, one or more `describeScenario` blocks. **Cases inside a block share one
chat and run in order** — that is what makes it a scenario rather than a pile of
tests, and it is why a case may depend on the one above it.

```ts
import { expect, it } from "vitest";
import { describeScenario } from "../harness/describe-scenario.ts";


describeScenario("somebody arrives, somebody goes home", (chat) => {
  it("should play a first game to have a line-up to change", async () => {
    await chat.say("/game Oleg, Anya, Roma");
    await chat.tap("Oleg");
```

Name the block the way you would tell somebody what happened at the table, not
after the command — the name is what the watch hub lists, and it is the whole index
of a run. Relative imports, always: the `#` aliases are the app's and this is not
the app. **Nothing from `src/`** — not a type, not `copy.en.ts`. A harness that
imported the copy table would assert a constant against itself, so expected text is
written out in full.

A helper shared by several cases is a plain function taking `chat` — see
`playAnotherGame` in `the-stats-picture.e2e.spec.ts`. It takes the same `Chat` the
cases use and holds no state of its own.

## Driving the chat

`chat.say(text)`, `chat.tap(caption)`, `chat.replyToPrompt(text)`,
`chat.tapRaw(messageId, data)`, `chat.restartBot()`. Each of them waits for the
chat to go quiet before returning, so **a scenario never sleeps and never polls** —
if you find yourself reaching for a timer, the verb you want is missing from
`Chat` and belongs there.

`chat.tap` finds the caption on the **newest** bot message that still has buttons.
Two open screens therefore cannot both be tapped by caption; close one first, or use
`tapRaw` with the id you kept.

Reading: `chat.captions()`, `chat.cardText()`, `chat.lastText()`, `chat.lastAnswer()`
(the callback toast), `chat.messages()`, `chat.photoBytes()`, `chat.promptId()`,
`chat.commands()`.

## Two rules with teeth

- **Assert the text before the captions when a screen boundary is involved.** A new
  screen inserted before an old one usually lists the same names, so a scenario
  asserting only `captions()` keeps passing while looking at a different message —
  guarding nothing, at exactly the moment there is something new to guard. This has
  happened: the seating screen slipped in front of the card and every assertion in
  `changing-the-table` stayed green.
- **End the way an evening ends.** Nothing may be left carrying a keyboard — a card
  ends on Confirm or Cancel, a `/merge` screen the same. `describeScenario` fails a
  scenario that leaves one open and names the message, because the chat log outlives
  the database reset between files: a screen left open sits there for the rest of the
  run, tappable, against a game that no longer exists. Closing is behaviour worth its
  own `it`, not teardown — the stale-tap scenario has to *finish* its game, since
  Cancel is gone once an exit is recorded.

## Judging one you did not write

1. Would every assertion fail if the bot broke, or does it only prove a message
   arrived?
2. Does anything assert a caption where the screen it came from is ambiguous?
3. Does the block leave a keyboard behind?
4. Could a unit have proved this? If yes, it belongs in a unit.

## Running it

`npm run e2e` for the whole suite, `npm run e2e:watch` to watch it play in the
browser — the hub lists every scenario by name down the left, and picking one fills
the page with that chat alone. The watch run paces every action, so use it to read a
scenario you are writing rather than to debug a failure.
