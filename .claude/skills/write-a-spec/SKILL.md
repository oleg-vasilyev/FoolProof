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
2. **Mock our own modules too.** `card.ts` is not tested by feeding it a real
   `CardState` and checking the whole rendered string — that spec fails when
   `finalPlacements` changes, which is `state.ts`'s business. Mock the helper,
   drive the file by what it returns, and the failure lands where the fault is.
3. **Leave data tables real.** `features/render/strings.ts` is keys and text, not
   behaviour; mocking it would compare a constant against itself. Everything with
   a body gets mocked.

## Mocking is usually the more direct test

It is not a weaker substitute for the real thing. It is often the only way to
assert what the file is actually for:

- `router.ts` exists to register routes in an order that matters. On a mocked
  `Bot` that is asserted literally — `bot.command` was called before
  `bot.on("message:text")` — instead of inferred from whether a `/help` update
  happened to produce a reply.
- `card.ts` must route user data through `escapeHtml`. With the escaper mocked,
  that is asserted as a fact about `card.ts`, not guessed from spotting `&amp;`
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
import { strings } from "../render/strings.ts";


const nameAtSpy = vi.fn();

vi.mock("../game/state.ts", () => ({
  nameAt: (state: unknown, slot: number) => nameAtSpy(state, slot),
}));

const { renderCard } = await import("./card.ts");
```

That is why specs here import their subject at the bottom of the header rather
than at the top. Reset with `vi.clearAllMocks()` in `beforeEach` and set the
default return values there, so each case overrides one thing.

## Stubs

`*.stub.ts` lives **beside the thing it stands in for**, never in a central
testing folder — `repository.stub.ts` next to `sqlite.ts`, `state.stub.ts` next
to the reducer. A stub for something we did not write (grammY's `Api`, a
synthetic `Update`, a `Context`) sits next to its only consumer instead, which is
usually `features/bot/`.

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

- **`features/bot/router.integration.spec.ts`** drives a real grammY `Bot`
  through `bot.handleUpdate()`, intercepting the network at
  `bot.api.config.use()`. Pass `botInfo` so no `getMe` call is needed. **Flush the
  card service in `afterEach`** — the real debouncer schedules a real 350 ms
  timer, and a timer that outlives its test fires into the next test's
  assertions, which this spec has already been caught doing.
- **`shared/repository/sqlite.integration.spec.ts`** runs against a real
  temporary SQLite file. The SQL is the unit under test and a mocked database
  would assert nothing. Set `process.env.DB_PATH` before importing, because
  `db.ts` opens the connection at module load — and close the connection before
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
