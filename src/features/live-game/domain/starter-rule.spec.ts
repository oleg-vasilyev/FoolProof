import { describe, expect, it } from "vitest";
import { playerIdOf } from "#shared/repository/database-records.stub.ts";
import { seatsOf } from "#live-game/domain/card-state.stub.ts";
import { starterAfterLoss } from "#live-game/domain/starter-rule.ts";


const THREE = seatsOf("Oleg", "Anya", "Roma");

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const NOT_SEATED_ID = 999;

describe("starterAfterLoss()", () => {
  it("should give the seat immediately before the loser when the loser is in the middle", () => {
    expect(starterAfterLoss(THREE, [playerIdOf(ANYA)])).toBe(OLEG);
  });

  it("should give the seat immediately before the loser when the loser is at the end", () => {
    expect(starterAfterLoss(THREE, [playerIdOf(ROMA)])).toBe(ANYA);
  });

  it("should wrap around to the last seat when the loser is at index zero", () => {
    expect(starterAfterLoss(THREE, [playerIdOf(OLEG)])).toBe(ROMA);
  });

  it("should return null when there are two loser ids", () => {
    expect(starterAfterLoss(THREE, [playerIdOf(OLEG), playerIdOf(ANYA)])).toBeNull();
  });

  it("should return null when there are no loser ids", () => {
    expect(starterAfterLoss(THREE, [])).toBeNull();
  });

  it("should return null when the loser is not seated", () => {
    expect(starterAfterLoss(THREE, [NOT_SEATED_ID])).toBeNull();
  });
});
