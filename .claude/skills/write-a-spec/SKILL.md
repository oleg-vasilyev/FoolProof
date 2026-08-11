---
name: write-a-spec
description: Write or rewrite a test in FoolProof — what to mock, how to shape a stub, how to name and structure cases, and when a test is allowed to be an integration test instead. Use whenever adding a *.spec.ts, changing an existing one, or judging whether a spec is testing the file it names.
---

# Writing a spec

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
proves nothing about either. This has already happened: a pluraliser
(`1 warning` / `2 warnings`) put in `diagnostics/copy.en.ts` left five surviving
mutants until it moved to `render/human-units.ts`, where it is a unit with its own
cases and the copy function takes the finished fragment. A count still belongs behind
a copy function — the *choice of word* belongs in `render/`.

**An existing spec file's habits are not precedent.** `feature-installer.spec.ts`
had always run `copyIn` real, and a new `describe` added there copied that instead
of the rule — it exercised the real `localeFrom` and re-proved a fact
`chat-locale.spec.ts` already pins, which the phase review then caught. When a
subject gains an import, the new cases start from this rule, not from whatever the
file around them got away with.

## Mocking is usually the more direct test

It is not a weaker substitute for the real thing. It is often the only way to
assert what the file is actually for:

- `feature-installer.ts` exists to register routes in an order that matters. On a mocked
  `Bot` that is asserted literally — `bot.command` was called before
  `bot.on("message:text")` — instead of inferred from whether a `/help` update
  happened to produce a reply.
- `card-message.ts` must route user data through `escapeHtml`. With the escaper mocked,
  that is asserted as a fact about `card-message.ts`, not guessed from spotting `&amp;`
  in the output.

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

A stub also fakes a **collaborator handed to the subject** — `Logger`,
`Repository`, `Listeners`. Same file, one class per role: `logger.stub.ts` holds
`LoggerStub` (the interface) and `LoggingStub` (the module that makes one).

Fixtures live beside stubs and read as builders, not classes:
`database-records.stub.ts` has `cardRecordOf`, `feature-contract.stub.ts` has
`featureOf`.

`*.stub.ts` lives **beside the thing it stands in for**, never in a central
testing folder — `repository.stub.ts` next to `sqlite-repository.ts`,
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
Growing the awards from thirteen to thirty-eight is what made this a rule: the
thirteen hand-written cases would have become thirty-eight, and the four that were
missing would not have been visible.

## Shape of the file

- Nest `describe` by unit, then by method.
- Name every number — `const ONCE = 1`, `const NEVER = 0`.
- One behaviour per `it`, phrased as `should …`.
- Separate arrange, act and assert with blank lines.
- Assert the thing that would break, not the thing that is easy to reach.

## Integration specs

**An integration spec covers a seam the unit rule puts out of reach.** Not "several
parts that mock badly" — two specific shapes, and if a candidate is neither, it is a
unit that has not been written properly:

1. **A contract with code we did not write.** "Never exercise third-party code in a
   unit" is absolute, so every belief about grammY, `node:sqlite`, resvg and
   `node:child_process` is otherwise asserted by *our own fake*. The rule creates
   this work; it does not excuse us from it.
2. **A chain of our own modules whose every joint is mocked.** Types catch the shape
   of what crosses a joint and say nothing about the meaning of a number — which
   `position`, which `round`, counted from what. The longer the chain of pure
   modules, the less any pairwise unit knows.

What does not earn one: mocking was inconvenient, or a scenario already plays it.

Name it `*.integration.spec.ts`, so nobody mistakes it for the default, and put
it beside the code like every other spec. `npm run test:unit` and
`npm run test:integration` run them separately; `npm test` runs both.

Six exist. Three cover the contracts:

- **`src/feature-installer.integration.spec.ts`** drives a real grammY `Bot`
  through `bot.handleUpdate()`, intercepting the network at
  `bot.api.config.use()`. Pass `botInfo` so no `getMe` call is needed. **Flush the
  card service in `afterEach`** — the real debouncer schedules a real 350 ms
  timer, and a timer that outlives its test fires into the next test's
  assertions, which this spec has already been caught doing.
- **`shared/repository/sqlite-repository.integration.spec.ts`** runs against a real
  temporary SQLite file. The SQL is the unit under test and a mocked database
  would assert nothing. Set `process.env.DB_PATH` before importing, because
  `sqlite-connection.ts` opens the connection at module load — and close the connection before
  deleting the file, or Windows refuses and the temp files pile up.
- **`shared/telegram/api-retry.integration.spec.ts`** installs the real transformer
  over a fake wire on a real `Bot`. Order matters and reads backwards: the **last**
  transformer installed is the outermost, so the wire goes on first. It pins the
  asymmetry no unit can check — a network fault **throws**, a refusal **resolves**
  as `{ ok: false }`, and a refusal that survives the retries reaches the call site
  as a thrown `GrammyError`.

Two cover the seams the harness cannot reach, because a scenario cannot make the
outside world misbehave:

- **`shared/lifecycle/child-supervisor.integration.spec.ts`** supervises a real
  child: a `.cjs` fixture written to a temp dir that exits non-zero on its first
  attempt. It pins what only a real `spawn` can — the exit code coming back, and
  `BOT_START_ATTEMPT` and `BOT_PREVIOUS_EXIT` reaching the next child, which is
  what `/status` reports. Nothing else supervises a real process: `e2e/` spawns
  `main.ts` directly, so the restart path production runs on has no other cover.
- **`scoresheet/bot/rasterizer.integration.spec.ts`** rasterizes real render output
  with the shipped fonts. A missing font makes resvg draw a **blank page rather
  than fail**, so the assertion is that the raster differs from the same SVG with
  its `<text>` stripped — and separately for a Cyrillic word, since half of what
  this bot writes is Russian. It also pins that `renderAsync` really **hands the
  event loop back** — a `setImmediate` registered after the call has to run before
  the promise settles. A mocked version of that asserts its own fake resolving, so
  the case can only live here.

One covers a chain:

- **`scoresheet/scoresheet-chain.integration.spec.ts`** plays an evening into a real
  database and reads the percentages back out of the **SVG string** — before
  rasterizing, while the numbers are still text. Every joint from `seriesChronology`
  to the legend is mocked in the units, and a PNG is opaque to e2e, so this is the
  only place the arithmetic of an evening is checked end to end.

Four things this tier gets wrong, all paid for:

- **An integration spec is still bound by the layering.** The chain spec first
  arranged its evening with `db.prepare("UPDATE games SET starter_player_id …")` —
  a second copy of the schema inside a feature folder, writing by a path production
  never takes. Arrange through the contract (`repo.updateCard(…)`, and a phase
  crosses it as a plain string), and isolate cases with a **different `chatId`**
  rather than a `DELETE`. No lint zone catches this: a feature zone bans other
  features, not SQL.
- **Select by something the subject deliberately emits.** `"50%"` is a legend entry
  *and* an axis label on the share chart, so an `indexOf` picked the wrong one. The
  fix was to take the percent immediately followed by a player's name.
- **Prove it fails.** Point the font paths at files that do not exist and watch the
  ink assertions go red — the PNG-magic assertion stays green, which is exactly why
  "it is a PNG" was never enough.
- **Real time is the price.** A retry backoff and a restart delay are real waits.
  Keep the number of waiting cases countable, and reach for the branch that gives up
  without sleeping when one will do.

One trap worth keeping: `bot.catch` only participates in `bot.start()`.
`handleUpdate` rethrows, so an error handler is exercised through
`bot.errorHandler` — or, better, on the mock.

## Judging a spec you did not write

Ask, in this order:

1. Does it import anything unmocked besides its subject, its stubs and a data
   table? If yes it is not a unit, and it is not named like an integration spec.
2. Does any assertion belong to another module?
3. Would every assertion fail if the subject broke? A test that only proves the
   code ran is what the mutation score is for — see the `finish-phase` skill.
4. **Is it a port?** A spec moved into a new file is rewritten, not copied — the
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
