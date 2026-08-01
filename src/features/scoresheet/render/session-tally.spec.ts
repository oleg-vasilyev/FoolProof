import { describe, expect, it } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";
import { gameTally, playerTally } from "#scoresheet/render/session-tally.ts";


const ONE = 1;

const MANY = 4;

const NOTHING = 0;

describe("gameTally()", () => {
  it("should count the games", () => {
    expect(gameTally(MANY)).toBe(`${String(MANY)} ${copy.sheetGamePlural}`);
  });

  it("should keep a single game singular", () => {
    expect(gameTally(ONE)).toBe(`${String(ONE)} ${copy.sheetGameSingular}`);
  });

  it("should keep zero games plural", () => {
    expect(gameTally(NOTHING)).toBe(`${String(NOTHING)} ${copy.sheetGamePlural}`);
  });
});

describe("playerTally()", () => {
  it("should count the players", () => {
    expect(playerTally(MANY)).toBe(`${String(MANY)} ${copy.sheetPlayerPlural}`);
  });

  it("should keep a single player singular", () => {
    expect(playerTally(ONE)).toBe(`${String(ONE)} ${copy.sheetPlayerSingular}`);
  });

  it("should keep zero players plural", () => {
    expect(playerTally(NOTHING)).toBe(`${String(NOTHING)} ${copy.sheetPlayerPlural}`);
  });
});
