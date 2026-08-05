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

**The corollary bites: no logic may live in a data table.** Because `copy.en.ts` is
deliberately never mocked, a decision taken inside it is asserted against itself and
is therefore **unkillable** — a spec comparing `report` to `copy.problemTally(…)`
proves nothing about either. This has already happened: a pluraliser
(`1 warning` / `2 warnings`) put in `diagnostics/copy.en.ts` left five surviving
mutants until it moved to `render/human-units.ts`, where it is a unit with its own
cases and the copy function takes the finished fragment. A count still belongs behind
a copy function — the *choice of word* belongs in `render/`.

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

## Shape of the file

- Nest `describe` by unit, then by method.
- Name every number — `const ONCE = 1`, `const NEVER = 0`.
- One behaviour per `it`, phrased as `should …`.
- Separate arrange, act and assert with blank lines.
- Assert the thing that would break, not the thing that is easy to reach.

## Integration specs

**An integration spec is an exception with a reason**: several parts once went
wrong *together*, and no single unit could have caught it. Write one when the
seam between systems is itself the thing under test — never because mocking was
inconvenient.

Name it `*.integration.spec.ts`, so nobody mistakes it for the default, and put
it beside the code like every other spec. `npm run test:unit` and
`npm run test:integration` run them separately; `npm test` runs both.

Two exist, and the bar for a third is a bug that got through the units:

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
