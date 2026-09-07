import { describe, expect, it } from "vitest";
import { rotateToLowestId } from "#shared/table/seat-rotation.ts";


describe("rotateToLowestId()", () => {
  it("should rotate the lowest id into seat zero", () => {
    const rotated = rotateToLowestId([{ playerId: 7 }, { playerId: 3 }, { playerId: 9 }]);

    expect(rotated).toEqual([{ playerId: 3 }, { playerId: 9 }, { playerId: 7 }]);
  });

  it("should give the same seating for the same table typed differently", () => {
    const typedOneWay = rotateToLowestId([{ playerId: 7 }, { playerId: 3 }, { playerId: 9 }]);
    const typedAnother = rotateToLowestId([{ playerId: 9 }, { playerId: 7 }, { playerId: 3 }]);

    expect(typedAnother).toEqual(typedOneWay);
  });

  it("should preserve the cyclic order", () => {
    const rotated = rotateToLowestId([{ playerId: 5 }, { playerId: 8 }, { playerId: 2 }]);

    expect(rotated).toEqual([{ playerId: 2 }, { playerId: 5 }, { playerId: 8 }]);
  });

  it("should leave an already rotated table alone", () => {
    const seats = [{ playerId: 1 }, { playerId: 4 }, { playerId: 6 }];

    expect(rotateToLowestId(seats)).toEqual(seats);
  });

  it("should keep whatever else a seat carries", () => {
    const rotated = rotateToLowestId([
      { playerId: 4, displayName: "Anya" },
      { playerId: 2, displayName: "Oleg" },
    ]);

    expect(rotated).toEqual([
      { playerId: 2, displayName: "Oleg" },
      { playerId: 4, displayName: "Anya" },
    ]);
  });

  it("should handle an empty list", () => {
    expect(rotateToLowestId([])).toEqual([]);
  });
});
