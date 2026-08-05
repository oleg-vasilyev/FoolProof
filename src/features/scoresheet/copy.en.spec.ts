import { describe, expect, it } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";


const ONE = 1;

const TWO = 2;

describe("the copy table", () => {
  describe("the table itself", () => {
    it("should leave no key without copy", () => {
      for (const [key, value] of Object.entries(copy)) {
        if (typeof value === "string") {
          expect(value, key).not.toBe("");
        }
      }
    });
  });

  describe("sheetDate()", () => {
    it("should name all twelve months", () => {
      const MONTHS_IN_YEAR = 12;
      const named = Array.from({ length: MONTHS_IN_YEAR }, (_unused, index) =>
        copy.sheetDate(`2026-${String(index + ONE).padStart(TWO, "0")}-15`)
      );

      for (const printed of named) {
        expect(printed).toMatch(/^15 [A-Z][a-z]{2} 2026$/);
      }
    });

    it("should give every month a name of its own", () => {
      const MONTHS_IN_YEAR = 12;
      const named = Array.from({ length: MONTHS_IN_YEAR }, (_unused, index) =>
        copy.sheetDate(`2026-${String(index + ONE).padStart(TWO, "0")}-15`)
      );

      expect(new Set(named).size).toBe(MONTHS_IN_YEAR);
    });

    it("should print the day, the month's name and the year", () => {
      expect(copy.sheetDate("2026-07-24")).toBe("24 Jul 2026");
    });

    it("should drop the leading zero from a single-digit day", () => {
      expect(copy.sheetDate("2026-07-04")).toBe("4 Jul 2026");
    });

    it("should name the first month", () => {
      expect(copy.sheetDate("2026-01-15")).toBe("15 Jan 2026");
    });

    it("should name the last month", () => {
      expect(copy.sheetDate("2026-12-15")).toBe("15 Dec 2026");
    });

    it("should fall back to what it was given when the month is out of range", () => {
      expect(copy.sheetDate("2026-13-15")).toBe("2026-13-15");
    });

    it("should fall back to what it was given when the date is not a date", () => {
      expect(copy.sheetDate("tonight")).toBe("tonight");
    });

    it("should fall back rather than print a partial date", () => {
      expect(copy.sheetDate("2026-07")).toBe("2026-07");
    });
  });

  describe("sheetSubtitle()", () => {
    it("should join the two finished fragments it was given", () => {
      expect(copy.sheetSubtitle("12 games", "5 players")).toBe("12 games · 5 players");
    });

    it("should not decide singular or plural itself, only join what it is handed", () => {
      expect(copy.sheetSubtitle("1 game", "2 players")).toBe("1 game · 2 players");
      expect(copy.sheetSubtitle("2 games", "1 player")).toBe("2 games · 1 player");
    });
  });

  describe("sheetOmitted()", () => {
    it("should say how many games were left out", () => {
      const DROPPED = 7;

      expect(copy.sheetOmitted(DROPPED)).toContain("7");
    });
  });

  describe("the awards", () => {
    const AWARDS_IN_THE_CATALOGUE = 13;

    it("should give every award in the catalogue a title", () => {
      expect(Object.keys(copy.awardTitles)).toHaveLength(AWARDS_IN_THE_CATALOGUE);
    });

    it("should leave no award title empty", () => {
      for (const [name, title] of Object.entries(copy.awardTitles)) {
        expect(title, name).not.toBe("");
      }
    });

    it("should give every award a title of its own", () => {
      expect(new Set(Object.values(copy.awardTitles)).size).toBe(AWARDS_IN_THE_CATALOGUE);
    });

    describe("every justification carries its numbers", () => {
      const FIFTY_ONE = 51;

      const EIGHT = 8;

      const reasons: readonly [string, string][] = [
        ["king", copy.kingReason(FIFTY_ONE, "18 games")],
        ["untouchable", copy.untouchableReason("11 games")],
        ["teflon", copy.teflonReason(EIGHT)],
        ["sweetRevenge", copy.sweetRevengeReason(FIFTY_ONE, EIGHT)],
        ["ironSeat", copy.ironSeatReason("19 games")],
        ["theTruce", copy.truceReason("1 game", "19 games")],
        ["allOrNothing", copy.allOrNothingReason(EIGHT, "18 games")],
        ["theInvisible", copy.invisibleReason(EIGHT, "17 games")],
        ["theIrishGoodbye", copy.irishGoodbyeReason(EIGHT, "19 games")],
        ["encore", copy.encoreReason(TWO)],
        ["dealersCurse", copy.dealersCurseReason(FIFTY_ONE, TWO)],
        ["firstBlood", copy.firstBloodReason("19 games")],
        ["foolOfTheNight", copy.foolReason(TWO, "15 games")],
        ["curse", copy.curseFact(EIGHT, "19 games")],
      ];

      it("should print a number in every one of them", () => {
        for (const [name, reason] of reasons) {
          expect(reason, name).toMatch(/\d/);
        }
      });

      it("should interpolate the count it was handed rather than a fixed one", () => {
        expect(copy.teflonReason(EIGHT)).toContain(String(EIGHT));
        expect(copy.encoreReason(TWO)).toContain(String(TWO));
      });

      it("should print the finished tally it was handed rather than a bare number", () => {
        expect(copy.kingReason(FIFTY_ONE, "18 games")).toContain("18 games");
        expect(copy.truceReason("1 game", "19 games")).toContain("1 game");
      });

      it("should print both of the numbers an award was given two of", () => {
        expect(copy.sweetRevengeReason(FIFTY_ONE, EIGHT)).toContain(String(FIFTY_ONE));
        expect(copy.sweetRevengeReason(FIFTY_ONE, EIGHT)).toContain(String(EIGHT));
      });
    });
  });
});
