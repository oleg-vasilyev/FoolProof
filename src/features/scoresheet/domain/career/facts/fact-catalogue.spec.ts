import { describe, expect, it } from "vitest";
import { CareerFactName, RAREST_FIRST } from "#scoresheet/domain/career/facts/fact-catalogue.ts";


const A_WHOLE_CATALOGUE = Object.values(CareerFactName).length;

const NOTHING = 0;

const UNPLACED = -1;

describe("RAREST_FIRST", () => {
  it("should rank every fact the catalogue names", () => {
    expect([...RAREST_FIRST].sort()).toEqual([...Object.values(CareerFactName)].sort());
  });

  it("should rank no fact twice", () => {
    expect(new Set(RAREST_FIRST).size).toBe(RAREST_FIRST.length);
  });

  it("should place every name it holds, so that none sorts ahead of the rarest", () => {
    const placed = Object.values(CareerFactName).map((name) => RAREST_FIRST.indexOf(name));

    expect(placed).not.toContain(UNPLACED);
    expect(placed).toHaveLength(A_WHOLE_CATALOGUE);
    expect(A_WHOLE_CATALOGUE).toBeGreaterThan(NOTHING);
  });

  it("should rank a rarer fact ahead of a commoner one", () => {
    expect(RAREST_FIRST.indexOf(CareerFactName.TheBlinder)).toBeLessThan(
      RAREST_FIRST.indexOf(CareerFactName.TheNewcomer)
    );
  });
});
