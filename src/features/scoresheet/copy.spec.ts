import { describe, expect, it } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import { copy as english } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";
import { copyIn, type Copy } from "#scoresheet/copy.ts";


const ONE = 1;

const TWO = 2;

const AWARDS_IN_THE_CATALOGUE = 13;

const MONTHS_IN_YEAR = 12;

const MARKER = "«marker»";

const reasonsOf = (copy: Copy): readonly (readonly [string, string])[] => {
  const FIFTY_ONE = 51;

  const EIGHT = 8;

  return [
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
    ["openersCurse", copy.openersCurseReason(FIFTY_ONE, TWO)],
    ["firstBlood", copy.firstBloodReason("19 games")],
    ["foolOfTheNight", copy.foolReason(TWO, "15 games")],
    ["curse", copy.curseFact(EIGHT, "19 games")],
  ];
};

describe("copyIn()", () => {
  it("should hand back the English table for English", () => {
    expect(copyIn(Locale.En)).toBe(english);
  });

  it("should hand back the Russian table for Russian", () => {
    expect(copyIn(Locale.Ru)).toBe(russian);
  });

  it.each(LOCALES)("should hand back a table that knows it is %s", (locale) => {
    expect(copyIn(locale).locale).toBe(locale);
  });
});

describe.each(LOCALES)("the %s copy table", (locale) => {
  const copy = copyIn(locale);

  it("should interpolate every argument every copy function is given", () => {
    const table: Record<string, unknown> = copy;

    for (const [key, value] of Object.entries(table)) {
      if (typeof value !== "function") {
        continue;
      }

      const shapes: Record<string, unknown> = english;
      const master = shapes[key];
      const arity = typeof master === "function" ? master.length : 0;
      const given = Array.from({ length: arity }, (_unused, index) => [
        `${MARKER}${String(index)}`,
      ]);
      const written = String((value as (...args: unknown[]) => string)(...given));

      expect(written, `${key} wrote nothing`).not.toBe("");
      expect(written, `${key} wrote nothing`).not.toBe("undefined");

      for (const [index] of given.entries()) {
        expect(written, `${key} dropped argument ${String(index)}`).toContain(
          `${MARKER}${String(index)}`
        );
      }
    }
  });

  describe("the table itself", () => {
    it("should leave no key without copy, however deep the table goes", () => {
      const walk = (value: unknown, path: string): void => {
        if (typeof value === "string") {
          expect(value, path).not.toBe("");

          return;
        }

        if (typeof value === "object" && value !== null) {
          for (const [key, nested] of Object.entries(value)) {
            walk(nested, `${path}.${key}`);
          }
        }
      };

      walk(copy, "copy");
    });

    it("should name all twelve months", () => {
      expect(copy.months).toHaveLength(MONTHS_IN_YEAR);
    });

    it("should give every month a name of its own", () => {
      expect(new Set(copy.months).size).toBe(MONTHS_IN_YEAR);
    });

    it("should leave no month unnamed", () => {
      for (const month of copy.months) {
        expect(month).not.toBe("");
      }
    });

    it("should give every counted noun all three forms", () => {
      for (const forms of [copy.sheetGameForms, copy.sheetPlayerForms]) {
        expect(forms).toEqual(
          expect.objectContaining({
            one: expect.any(String),
            few: expect.any(String),
            many: expect.any(String),
          })
        );
      }
    });
  });

  describe("sheetDate()", () => {
    it("should print the day, the month's name and the year in that order", () => {
      const printed = copy.sheetDate("24", copy.months[TWO - ONE] ?? "", "2026");

      expect(printed.startsWith("24")).toBe(true);
      expect(printed.endsWith("2026")).toBe(true);
    });

    it("should print the month between them", () => {
      const month = copy.months[0] ?? "";

      expect(copy.sheetDate("4", month, "2026")).toContain(month);
    });
  });

  describe("sheetSubtitle()", () => {
    it("should join the two finished fragments it was given", () => {
      expect(copy.sheetSubtitle("12 games", "5 players")).toContain("12 games");
      expect(copy.sheetSubtitle("12 games", "5 players")).toContain("5 players");
    });

    it("should not decide singular or plural itself, only join what it is handed", () => {
      expect(copy.sheetSubtitle("1 game", "2 players")).toContain("1 game");
      expect(copy.sheetSubtitle("2 games", "1 player")).toContain("1 player");
    });
  });

  describe("sheetOmitted()", () => {
    it("should say how many games were left out", () => {
      const DROPPED = 7;

      expect(copy.sheetOmitted(DROPPED)).toContain("7");
    });
  });

  describe("the awards", () => {
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

    it("should print a number in every justification", () => {
      for (const [name, reason] of reasonsOf(copy)) {
        expect(reason, name).toMatch(/\d/);
      }
    });

    it("should interpolate the count it was handed rather than a fixed one", () => {
      const EIGHT = 8;

      expect(copy.teflonReason(EIGHT)).toContain(String(EIGHT));
      expect(copy.encoreReason(TWO)).toContain(String(TWO));
    });

    it("should print the finished tally it was handed rather than a bare number", () => {
      const FIFTY_ONE = 51;

      expect(copy.kingReason(FIFTY_ONE, "18 games")).toContain("18 games");
      expect(copy.truceReason("1 game", "19 games")).toContain("1 game");
    });

    it("should print both of the numbers an award was given two of", () => {
      const FIFTY_ONE = 51;

      const EIGHT = 8;

      expect(copy.sweetRevengeReason(FIFTY_ONE, EIGHT)).toContain(String(FIFTY_ONE));
      expect(copy.sweetRevengeReason(FIFTY_ONE, EIGHT)).toContain(String(EIGHT));
    });
  });
});
