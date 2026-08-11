import { describe, expect, it } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import { copy as english } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";
import { copyIn, type Copy } from "#scoresheet/copy.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";


const ONE = 1;

const TWO = 2;

const AWARDS_IN_THE_CATALOGUE = Object.keys(AwardName).length;

const MONTHS_IN_YEAR = 12;

const MARKER = "«marker»";

const A_TALLY = "19 games";

const reasonsOf = (copy: Copy): readonly (readonly [string, string])[] => {
  const FIFTY_ONE = 51;

  const EIGHT = 8;

  return [
    ["king", copy.kingReason(FIFTY_ONE, A_TALLY)],
    ["wireToWire", copy.wireToWireReason(A_TALLY)],
    ["theFavourite", copy.favouriteReason(EIGHT, A_TALLY)],
    ["hatTrick", copy.hatTrickReason(EIGHT)],
    ["homeAdvantage", copy.homeAdvantageReason(EIGHT, TWO)],
    ["untouchable", copy.untouchableReason(A_TALLY)],
    ["teflon", copy.teflonReason(EIGHT)],
    ["hotSeat", copy.hotSeatReason(EIGHT)],
    ["theComeback", copy.comebackReason(TWO, FIFTY_ONE)],
    ["theLadder", copy.ladderReason(EIGHT)],
    ["sweetRevenge", copy.sweetRevengeReason(FIFTY_ONE, EIGHT)],
    ["ironSeat", copy.ironSeatReason(A_TALLY)],
    ["theTruce", copy.truceReason(TWO, A_TALLY)],
    ["thePacifist", copy.pacifistReason(A_TALLY)],
    ["theNemesis", copy.nemesisReason(A_TALLY)],
    ["theDoorman", copy.doormanReason(EIGHT, A_TALLY)],
    ["neverAsked", copy.neverAskedReason(A_TALLY)],
    ["theLatecomer", copy.latecomerReason(EIGHT, FIFTY_ONE)],
    ["revolvingDoor", copy.revolvingDoorReason(A_TALLY, A_TALLY)],
    ["theCameo", copy.cameoReason(A_TALLY)],
    ["secondWind", copy.secondWindReason(TWO, A_TALLY)],
    ["theUnderstudy", copy.understudyReason(EIGHT, A_TALLY)],
    ["theFlatline", copy.flatlineReason(TWO, A_TALLY)],
    ["theInvisible", copy.invisibleReason(EIGHT, A_TALLY)],
    ["groundhogDay", copy.groundhogReason(TWO, EIGHT)],
    ["thePendulum", copy.pendulumReason(EIGHT)],
    ["theRollercoaster", copy.rollercoasterReason(FIFTY_ONE, A_TALLY)],
    ["allOrNothing", copy.allOrNothingReason(EIGHT, A_TALLY)],
    ["theIrishGoodbye", copy.irishGoodbyeReason(EIGHT, A_TALLY)],
    ["theAnchor", copy.anchorReason(A_TALLY)],
    ["theSlide", copy.slideReason(EIGHT)],
    ["falseDawn", copy.falseDawnReason(EIGHT, FIFTY_ONE)],
    ["openersCurse", copy.openersCurseReason(FIFTY_ONE, TWO)],
    ["encore", copy.encoreReason(TWO)],
    ["firstBlood", copy.firstBloodReason(A_TALLY)],
    ["foolOfTheNight", copy.foolReason(TWO, A_TALLY)],
    ["curse", copy.curseFact(EIGHT, A_TALLY)],
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

  describe("sheetTableShows()", () => {
    it("should print the finished tally it was handed rather than a bare number", () => {
      const DRAWN = "28 games";

      expect(copy.sheetTableShows(DRAWN)).toContain(DRAWN);
    });

    it("should read as what the table holds rather than as a bare count", () => {
      const DRAWN = "28 games";

      expect(copy.sheetTableShows(DRAWN).length).toBeGreaterThan(DRAWN.length);
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

      expect(copy.kingReason(FIFTY_ONE, A_TALLY)).toContain(A_TALLY);
      expect(copy.pacifistReason(A_TALLY)).toContain(A_TALLY);
    });

    it("should print both of the numbers an award was given two of", () => {
      const FIFTY_ONE = 51;

      const EIGHT = 8;

      expect(copy.sweetRevengeReason(FIFTY_ONE, EIGHT)).toContain(String(FIFTY_ONE));
      expect(copy.sweetRevengeReason(FIFTY_ONE, EIGHT)).toContain(String(EIGHT));
    });
  });
});
