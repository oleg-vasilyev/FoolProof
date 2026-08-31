---
name: write-a-spec
description: Write or rewrite a test in FoolProof — what to mock, how to shape a stub, how to name and structure cases, and when a test is allowed to be an integration test instead. Stage 1, while framing a feature and before its interfaces are frozen, because what a spec can mock decides what a signature may take — use whenever adding a *.spec.ts, changing an existing one, or judging whether a spec is testing the file it names.
---

# Writing a spec

> **Stage 1** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

## The rule

**A spec tests one file. Everything that file imports is mocked.**

Not "the awkward parts" — everything: the library, the sibling module in the next
folder, the pure helper, the collaborator handed in through a context object.

Three consequences, the first absolute:

1. **Never exercise third-party code in a unit spec.** grammY, `node:sqlite`,
   `node:fs` — mock them. Their authors have their own tests, and a spec that
   drives them is reporting on their code while claiming to report on ours. When
   one of them breaks the spec, the failure points at the wrong file.
2. **Mock our own modules too.** `card-message.ts` is not tested by feeding it a real
   `CardState` and checking the whole rendered string — that spec fails when
   `finalPlacements` changes, which is `card-state.ts`'s business. Mock the helper,
   drive the file by what it returns, and the failure lands where the fault is.
3. **Leave data tables real.** A feature's `copy.en.ts` is keys and text, not
   behaviour; mocking it would compare a constant against itself. Everything with
   a body gets mocked.

**A mocked module cannot hand back a data table.** So a table everything reads —
a state's names, a threshold — must live in a module with **no behaviour**, or the
first spec that mocks its neighbour deletes it. This has been paid for twice in one
phase: a stub could not import `FailureKind` from the module a spec mocks, because
the hoisted `vi.mock` had not initialised it yet; and moving `Finish` into
`session-appearances.ts` turned 68 award specs red at once, since their factories
supply the functions and nothing else. The fix is never to add the table to the
factory — that is a second copy of the vocabulary — it is `game-outcomes.ts`,
`card-states.ts`, `log-levels.ts`: files with nothing in them to mock.

**A fixture spells a state no more than the subject does.** `{ kind: CellKind.Fool }`
and `award?.name === AwardName.King`, never the strings. `project/named-states`
covers specs too, and it reads the property to tell a state from a protocol: a
literal under `kind`, `outcome`, `phase`, `problem`, `finish`, `role`, `because`,
`reason` or `action` is always wrong, and a comparison must name one of those or
`.name`. What stays a literal is somebody else's wire value — `call[0] === "help"`,
`method === "sendMessage"` — and test data like `name: "Oleg"`, which is why `name`
is a legal *fixture* key and an illegal thing to compare against.

Extending the rule to specs immediately found five sites in **production** code
that a src-only sweep had missed, so do not assume the fixtures are the cheap half.

**A fixture that enumerates a union enumerates it from the table** —
`Object.values(AwardName)`, never a hand-typed list. The lint cannot help here: a
string inside an array literal is neither a comparison nor a discriminant key, which
is how thirteen hand-written award names survived both a full spec audit and the rule
written to stop exactly that. Reading the list from the table also turns the case
into a real one — it now fails when the catalogue gains a member the copy table has
no title for.

**The corollary bites: no logic may live in a data table.** Because `copy.en.ts` is
deliberately never mocked, a decision taken inside it is asserted against itself and
is therefore **unkillable** — a spec comparing `report` to `copy.problemTally(…)`
proves nothing about either. A pluraliser put in `diagnostics/copy.en.ts` left five
surviving mutants until it moved to `render/human-units.ts`; `docs:check` now fails
that shape on sight. A count still belongs behind a copy function — the *choice of
word* belongs in `render/`.

**And the same trap one step out: an expected value read from the table under test.**
`toHaveBeenCalledWith(copy.locale, RATE_LIMIT, copy.limitForms)` looks like an
assertion and is an identity — whatever `limitForms` holds, both sides hold it — so
emptying that table leaves the case green while `/status` prints a count with no noun
after it. Four of these sat in one spec, and three matching mutants survived.

The tempting fix is to type the words into the consumer's spec. That is the wrong
home, and the mutation run says so: the English literals killed the English mutants
and left the Russian ones alive, because the consumer's spec drives one locale. **The
claim "this table has words in it" belongs to the table's own `copy.spec.ts`**, which
already runs `describe.each(LOCALES)` — one line adding the missing tables to its list
killed all six at once. The consumer's reference assertion is then doing the only job
it can do, which is proving the subject reached for the right key.

So: when an assertion turns out to be an identity, ask which spec the claim belongs to
before typing a literal. And note what the surviving list looked like — the copy spec
named four counted nouns out of seven, and a list that is *nearly* complete reads
exactly like one that is.

**An existing spec file's habits are not precedent.** `feature-installer.spec.ts`
had always run `copyIn` real, and a new `describe` added there copied that instead
of the rule — it exercised the real `localeFrom` and re-proved a fact
`chat-locale.spec.ts` already pins, which the phase review then caught. When a
subject gains an import, the new cases start from this rule, not from whatever the
file around them got away with.

## Mocking is usually the more direct test

It is not a weaker substitute for the real thing. It is often the only way to
assert what the file is actually for:

- `feature-installer.ts` exists to register routes in an order that matters. On a
  mocked `Bot` that is asserted literally — `bot.command` was called before
  `bot.on("message:text")` — instead of inferred from whether a `/help` update
  happened to produce a reply.
- `card-message.ts` must route user data through `escapeHtml`. With the escaper
  mocked, that is a fact about `card-message.ts`, not a guess from spotting `&amp;`.

## "It appears in the output" is not an assertion about where it went

A spec asserting that every number an object carries turns up *somewhere* in the
rendered sentence cannot see two of them swapped. The awards sheet spent a release
claiming somebody opened three games and went out first in four, because `render/`
handed the copy table its two counts the wrong way round and both were still present
in the result. Types agree — both are numbers — and Stryker does not mutate argument
order, so nothing could go red.

**Whenever a function passes two values of the same type into something positional,
one case must assert the finished result against that call with the roles spelled
out**, with values that cannot be confused (`A_PART = 3`, `A_WHOLE = 7`, never
`1` and `2`). Yes, it restates the source line — that is what a transcription
check is, and it is the only shape that fails when the transcription is wrong.

**The tell that a spec has drifted is an assertion it has no business making.**
A keyboard spec checking the 64-byte callback limit; a stats spec checking that
`&` becomes `&amp;`. Both were really testing another module, and both already
had a proper home. When you find one, delete it — do not port it.

## Mechanics

`vi.mock` is hoisted above the imports, so declare the spies first, mock, then
load the subject last:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#live-game/copy.en.ts";


const nameAtSpy = vi.fn();

vi.mock("#live-game/domain/card-state.ts", () => ({
  nameAt: (state: unknown, slot: number) => nameAtSpy(state, slot),
}));

const { renderCard } = await import("#live-game/render/card-message.ts");
```

That is why specs here import their subject at the bottom of the header rather
than at the top. Reset with `vi.clearAllMocks()` in `beforeEach` and set the
default return values there, so each case overrides one thing.

## A fake never reimplements what it replaces

This is the mistake to watch for, and it hides in a one-liner:

```ts
// wrong: the spec now knows how requireEnv resolves a key
requireEnv: (env: Record<string, string>, key: string) => env[key],
```

The test then passes because the *fake* works. Replace the behaviour with a spy
and assert the fact you actually care about — that the subject asked for the right
key out of the environment it loaded:

```ts
expect(env.requireEnvSpy).toHaveBeenCalledWith(env.loaded, "BOT_TOKEN");
```

If a fake needs an `if`, a lookup or a loop to satisfy its caller, it has stopped
being a fake and started being a second implementation.

**A mocking fault is never in one file.** When you find one — a `vi.mock` whose keys
the subject never reads, a fake that reimplements, a spy nothing asserts — grep the
sibling specs for the same shape before moving on. Two specs in `render/chronology/`
mocked `card-metrics.ts` values into the `chronology-layout.ts` factory, so the
subject read the *real* table and the mock was dead; the phase that found and fixed
exactly that in `cell-key.spec.ts` then rewrote both neighbours without carrying the
fix across, and a review pass had to find it. The tell that a mock is dead is cheap
to build in: **give it values that differ from the real ones**. A spec whose
`IMAGE_WIDTH` is 900 while the design says 1620 proves it controls what the subject
reads; one that repeats 1620 proves nothing and passes either way.

## Stubs

**Every module in `shared/` has a stub, and a spec uses it rather than writing a
fake by hand.** The stub carries a `module` field typed
`typeof import("…")`, so mocking is one line:

```ts
const env = new EnvStub({ BOT_TOKEN: TOKEN_FROM_ENV });

vi.mock("#shared/config/env.ts", () => env.module);
```

An imported stub works inside a hoisted `vi.mock`: the factory body runs when the
mocked module is first requested, which is after the spec's own consts are
initialized.

The rule exists because inline fakes had already failed twice, both silently:

- `main.spec.ts` faked `createShutdown` by **rewriting its loop**. The
  ordering assertions were exercising the fake, not `main.ts`. With a stub the
  spec instead asserts what `main.ts` composed — the feature stops first, the
  connection last — which is the actual fact about the file.
- `row-records.spec.ts` had `num` return `"num(1)"`. A `vi.mock` factory is
  **untyped**, so nothing objected; the typed stub made it a compile error, because
  `num` returns a `number`. The markers became distinct in-type return values plus
  assertions on which column reached which coercion.

**Open the stub before writing against it.** Its verbs are not the ones you remember
from somewhere else: a unit's `ContextStub` says `callbackTap`, `chatlessTap`,
`lastReply` and `lastEdit`, while the e2e harness's `Chat` — a different object, for
a different world — says `tap`, `tapRaw` and `lastAnswer`. Writing from memory of the
other one costs two round trips to learn what one `grep` for `public ` would say.

A stub also fakes a **collaborator handed to the subject** — `Logger`,
`Repository`, `Listeners`. Same file, one class per role: `logger.stub.ts` holds
`LoggerStub` (the interface) and `LoggingStub` (the module that makes one).

Fixtures live beside stubs and read as builders, not classes:
`database-records.stub.ts` has `cardRecordOf`, `feature-contract.stub.ts` has
`featureOf`.

`*.stub.ts` lives **beside the thing it stands in for**, never in a central
testing folder — `repository-contract.stub.ts` next to the contract it stands for,
`card-state.stub.ts` next to the reducer, `env.stub.ts` next to `env.ts`. A stub
for something we did not write (grammY's `Api`, a
synthetic `Update`, a `Context`) sits next to its only consumer instead, which is
usually a feature's `bot/` folder.

A stub is a **class** whose public `*Spy` fields are `vi.fn()`s, with sensible
defaults set in the constructor, and whose methods delegate to those spies. Tests
override one spy instead of rebuilding a fake.

Expose the assembled object as a **field set in the constructor, not a getter**.
A getter builds a new object per call, and `toBe` identity checks then fail for
no reason a reader can see.

```ts
export class CardServiceStub {
  public openSpy = vi.fn();

  public readonly service: CardService;

  public constructor() {
    this.openSpy.mockResolvedValue(undefined);

    this.service = { open: this.openSpy, … } as unknown as CardService;
  }
}
```

## A catalogue is tested with a table, not with a case each

When the subject switches over a closed set that is going to grow — the award
catalogue, the locales, anything read out of a `const … as const` table — do not
write one `it` per member. Build a table of samples in the spec, drive it with
`it.each`, and add **one case asserting the table covers the union**:

```ts
it("should have a sample for every award the catalogue names", () => {
  expect(SAMPLES.map((award) => award.name).sort()).toEqual([...NAMES].sort());
});
```

That case is the whole point: it turns "somebody forgot to test the new member"
into a red test instead of a silent gap. Give each sample **values unique to it**
and add a case asserting the outputs are all distinct — otherwise a `switch` arm
falling through to its neighbour still produces something plausible and survives.
Growing the awards from thirteen to thirty-eight made this a rule: four members
arrived untested and nothing said so.

## Shape of the file

- Nest `describe` by unit, then by method.
- Name every number — `const ONCE = 1`, `const NEVER = 0`.
- One behaviour per `it`, phrased as `should …`.
- Separate arrange, act and assert with blank lines.
- Assert the thing that would break, not the thing that is easy to reach.

## A line drawn at a fixed size owes a spec that measures it

A poster has no reflow: text set at 34px in a column 1360px wide either fits or runs off
the edge, and nothing in the pipeline notices — the SVG is valid, the PNG renders, the
gate that weighs the picture sees the same bytes. The only reader that catches it is a
person looking at the panel where the sentence happened to be longest.

So when copy is printed at a known size into a known width, the spec that owns that copy
measures it: `widthOf(line, font, USUAL_FALLBACK)` against the room. **The list of lines it
measures is itself a case**, asserting it equals the union it came from — the list is
hand-written, and the phase adding a line is the phase that forgets it. Nine award reasons
walked past this guard with it already in place; the completeness case failed on the first.

Use the widest plausible interpolation, not a typical one: a tally is `199 партий`, not
`3 games`. Width is measured per glyph, so the advance passed is only a fallback for a
glyph the table never saw: the margin comes from the interpolation, not the constant.

## Integration specs

**An integration spec is an exception with a reason**: several parts once went wrong
*together*, and no single unit could have caught it. Write one when the seam between
systems is itself the thing under test — never because mocking was inconvenient. Name
it `*.integration.spec.ts`, so nobody mistakes it for the default, and put it beside
the code like every other spec.

Exactly two shapes earn one — a contract with code we did not write, and a chain of
our own modules whose every joint is mocked — and nothing else does. Those shapes,
every such spec this repository has, what each is testing and the traps that come
with driving a real grammY `Bot` or a real SQLite file are in [writing an
integration spec](an-integration-spec.md).

## A green spec is not a checked spec

`vitest run` does not typecheck. A spec can pass every case while asserting
something the compiler would refuse — most often a property read off a
discriminated union without narrowing it, which is exactly what a fact or an award
or a cell is: `expect(theBogey(...)?.duels)` runs happily and fails `tsc`, because
`duels` lives on one member of twenty.

So **run `npx tsc --noEmit` after editing a spec, not just the spec itself.** The
phase gate catches it either way; the difference is one second against an
eight-minute battery. Comparing the whole returned object with `toEqual` avoids the
narrowing question altogether and asserts more.

## Reading a survivor the mutation gate left alive

A survivor is a sentence about the spec, not a hole to plug, and the fix that turns
it red is usually not the fix it is asking for. What a survivor can mean — a missing
test is only one of the answers, and rarely the commonest — and how to tell those
apart are in [reading a survivor](reading-a-survivor.md), the page gate 3 opens when
it goes red.

## A message's reason is content, not decoration

A complaint from `docs:check` or a lint rule carries its own reason precisely
because that reason lives nowhere else — `CLAUDE.md` does not repeat it. So a spec
asserting `toContain("What comes back")` has checked the *name of the thing* and
left the whole explanation unheld: eight of eleven survivors in one new gate module
were the second halves of its own messages, every one of them deletable without a
test noticing. Assert a distinctive phrase from the reason as well as the subject,
and prefer one a paraphrase would break.

The same applies in reverse to a message you shorten later: if no assertion names
the sentence you are cutting, nothing will tell you it was the only place the reason
was written down.

## Judging a spec you did not write

Ask, in this order:

1. Does it import anything unmocked besides its subject, its stubs and a data
   table? If yes it is not a unit, and it is not named like an integration spec.
2. Does any assertion belong to another module?
3. Would every assertion fail if the subject broke? A test that only proves the
   code ran is what the mutation score is for — see the `finish-phase` skill.
4. **Does it tell absence apart from never happening?** `expect(markupOf()).toBeUndefined()`
   passes when the reply carried no keyboard *and* when there was no reply at all,
   because the optional chain that reaches for it swallows the difference. So the
   case guarding "a group gets no button" stayed green against the very silence the
   phase existed to fix. Any assertion whose subject is something *missing* needs a
   sibling asserting the interaction happened — `expect(callsTo("sendMessage")).toHaveLength(ONCE)`
   — or it guards nothing. Inverting a branch does not catch this; unregistering the
   handler does.
5. **Is it a port?** A spec moved into a new file is rewritten, not copied — the
   old file's sins travel with it and arrive looking established. Two phases
   running have proved it: splitting a render file silently dropped four
   assertions that had been killing mutants, and splitting a handler file carried
   a fake that lowercased its own input, so the case "should not create the same
   name twice" was asserting `String.prototype.toLowerCase`. Read every ported
   case against these questions as if it were new, because to this file it is.
5. **Does any assertion stand on a `filter` or a `find` that could match nothing?**
   That is how a spec goes vacuous without ever failing. A legend spec selected its
   rows by exact font size; the font later became a function of the slot width, the
   filter stopped matching, and `Math.max` over the empty result returned
   `-Infinity`, so the bound check passed for months against nothing at all. Select
   by something the subject deliberately emits — a marker string, a spied call —
   never by a value another change is free to alter, and assert the selection is
   non-empty before asserting anything about it.

   **A loop counted off the subject is the same trap.** A spec that called every
   copy function with one marker per parameter took the count from
   `value.length` — the function under test. Stryker's `() => undefined` mutant has
   no parameters, so the loop ran zero times and the case passed against nothing;
   forty mutants survived a test written to kill exactly them. Count off something
   the mutation cannot move (here the English table, which is the shape master), and
   assert the output is neither `""` nor `"undefined"` before looking inside it.

6. **Does a negative assertion exclude anything the positive one beside it allows?**
   On a call that happens once, `not.toHaveBeenCalledWith(a, b, WRONG, d)` is already
   implied by `toHaveBeenCalledWith(a, b, RIGHT, d)`, so it kills no mutant of its own
   and costs a reader a second pass over an argument list. Worse, it needs a constant
   for a value nothing else names, and the nearest one is usually wrong: a case written
   this way passed the call-count `NEVER` where a column index belonged, so it read as
   "never called with" while meaning "not called with column zero". Keep the negative
   only where the subject can make the call more than once, and then assert the count
   as well.
