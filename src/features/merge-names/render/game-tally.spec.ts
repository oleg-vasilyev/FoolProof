import { describe, expect, it } from "vitest";
import { gameTally } from "#merge-names/render/game-tally.ts";


const NO_GAMES = 0;

const ONE_GAME = 1;

const TWO_GAMES = 2;

describe("gameTally()", () => {
  it("should keep one game singular", () => {
    expect(gameTally(ONE_GAME)).toBe("1 game");
  });

  it("should make two games plural", () => {
    expect(gameTally(TWO_GAMES)).toBe("2 games");
  });

  it("should make no games plural too", () => {
    expect(gameTally(NO_GAMES)).toBe("0 games");
  });
});
