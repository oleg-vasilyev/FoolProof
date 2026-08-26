import { expect, it } from "vitest";
import { describeScenario } from "../../harness/describe-scenario.ts";


const MOST_PLAYERS = 10;

const named = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, at) => `P${String(at + 1)}`);

const A_FULL_TABLE = named(MOST_PLAYERS);

const ONE_TOO_MANY = named(MOST_PLAYERS + 1);

const ALMOST_FULL = named(MOST_PLAYERS - 1);

const CANCEL = "❌ Cancel";

const BACK = "↩️ Back";

const LAST = -1;

describeScenario("a table nobody could sit at", (chat) => {
  it("should refuse a line-up one player past the cap", async () => {
    await chat.say(`/game ${ONE_TOO_MANY.join(", ")}`);

    expect(chat.lastText()).toBe("A table seats at most 10 players.");
    expect(chat.captions()).toEqual([]);
  });

  it("should have created nobody while refusing", async () => {
    await chat.say("/merge");

    expect(chat.lastText()).toContain("nothing to merge");
    expect(chat.captions()).toEqual([]);
  });

  it("should open a table that is exactly full", async () => {
    await chat.say(`/game ${A_FULL_TABLE.join(", ")}`);

    expect(chat.captions()).toEqual([...A_FULL_TABLE, CANCEL]);
  });

  it("should play a full table through to a result", async () => {
    await chat.tap("P1");

    for (const name of A_FULL_TABLE.slice(0, MOST_PLAYERS - 1)) {
      await chat.tap(name);
    }

    await chat.tap("✅ Confirm");

    expect(chat.lastText()).toContain(`${String(MOST_PLAYERS)} · <b>P10</b> — fool`);
  });

  it("should refuse a joiner the full table has no room for", async () => {
    await chat.say("/next_with Kim");

    expect(chat.lastText()).toBe("A table seats at most 10 players.");
    expect(chat.captions()).toEqual([]);
  });

  it("should free a seat when somebody goes home", async () => {
    await chat.say("/next_without P10");

    expect(chat.captions()).toEqual([...ALMOST_FULL, CANCEL]);

    await chat.tap("P1");

    for (const name of ALMOST_FULL.slice(0, ALMOST_FULL.length - 1)) {
      await chat.tap(name);
    }

    await chat.tap("✅ Confirm");

    expect(chat.lastText()).toContain(`${String(ALMOST_FULL.length)} · <b>P9</b> — fool`);
  });

  it("should seat a joiner in the seat that opened, filling the table again", async () => {
    await chat.say("/next_with Kim");

    expect(chat.lastText()).toContain("Taking seats");
    expect(chat.captions()).toEqual([...ALMOST_FULL, "Kim", CANCEL]);
  });

  it("should keep a seating screen for a full table inside the Bot API's button budget", async () => {
    await chat.tap("Kim");

    expect(chat.captions()[0]).toBe("🪑 1 Kim");
    expect(chat.captions().at(LAST)).toBe(BACK);

    await chat.tap(BACK);
    await chat.tap(CANCEL);

    expect(chat.captions()).toEqual([]);
  });
});
