import { describe, expect, it } from "vitest";
import { AwardName, RAREST_FIRST } from "#scoresheet/domain/awards/award-catalogue.ts";


const ONCE = 1;

const LAST = -1;

const SECOND_TO_LAST = -2;

describe("RAREST_FIRST", () => {
  it("should rank every award the catalogue names", () => {
    expect([...RAREST_FIRST].sort()).toEqual([...Object.values(AwardName)].sort());
  });

  it("should rank no award twice", () => {
    expect(new Set(RAREST_FIRST).size).toBe(RAREST_FIRST.length);
  });

  it("should leave the king of the table at the common end, where it cannot take a free slot", () => {
    expect(RAREST_FIRST.at(LAST)).toBe(AwardName.King);
  });

  it("should leave the fool of the night beside it, for the same reason", () => {
    expect(RAREST_FIRST.at(SECOND_TO_LAST)).toBe(AwardName.FoolOfTheNight);
  });

  it("should rank a rarer award ahead of a commoner one", () => {
    expect(RAREST_FIRST.indexOf(AwardName.FalseDawn)).toBeLessThan(
      RAREST_FIRST.indexOf(AwardName.TheTruce) - ONCE
    );
  });
});
