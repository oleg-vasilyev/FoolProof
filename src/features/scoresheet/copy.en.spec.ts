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
    it("should count games and players", () => {
      const GAMES = 12;
      const PLAYERS = 5;

      expect(copy.sheetSubtitle(GAMES, PLAYERS)).toBe("12 games · 5 players");
    });

    it("should keep a single game singular", () => {
      expect(copy.sheetSubtitle(ONE, TWO)).toBe("1 game · 2 players");
    });

    it("should keep a single player singular", () => {
      expect(copy.sheetSubtitle(TWO, ONE)).toBe("2 games · 1 player");
    });
  });

  describe("sheetOmitted()", () => {
    it("should say how many games were left out", () => {
      const DROPPED = 7;

      expect(copy.sheetOmitted(DROPPED)).toContain("7");
    });
  });
});
