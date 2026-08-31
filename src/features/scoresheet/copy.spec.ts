import { describe, expect, it } from "vitest";
import { LOCALES, Locale } from "#shared/locale/locales.ts";
import { copy as english } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";
import { copyIn, type Copy } from "#scoresheet/copy.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  fontSize,
  GRID_RIGHT,
  PAD,
  USUAL_FALLBACK,
  WIDEST_FALLBACK,
} from "#scoresheet/render/card-metrics.ts";
import { KEY_LABEL_ROOM } from "#scoresheet/render/chronology/cell-key.ts";
import { ENOUGH_TO_JUDGE_A_NIGHT } from "#scoresheet/domain/career/career-evenings.ts";
import { TILE_TRACKING, personalFont } from "#scoresheet/render/personal/personal-metrics.ts";
import { gameTally } from "#scoresheet/render/tally-phrases.ts";
import {
  CURSE_FACT_FONT,
  CURSE_LABEL_FONT,
  CURSE_TRACKING,
  ROOMY,
  TEXT_LEFT,
} from "#scoresheet/render/awards/awards-layout.ts";
import { widthOf } from "#scoresheet/render/name-to-fit.ts";


const NOTHING = 0;

const ONE = 1;

const TWO = 2;

const AWARDS_IN_THE_CATALOGUE = Object.keys(AwardName).length;

const MONTHS_IN_YEAR = 12;

const MARKER = "«marker»";

const A_TALLY = "19 games";

const ANOTHER_TALLY = "4 times";

const A_GAP_BETWEEN = 40;

const A_WIDE_TALLY = "199 партий";

const A_NAME = "Вильгельмина";

const reasonsOf = (copy: Copy, tally: string): readonly (readonly [string, string])[] => {
  const FIFTY_ONE = 51;

  const EIGHT = 8;

  return [
    ["king", copy.kingReason(FIFTY_ONE, tally)],
    ["wireToWire", copy.wireToWireReason(tally)],
    ["theFavourite", copy.favouriteReason(EIGHT, tally)],
    ["hatTrick", copy.hatTrickReason(tally)],
    ["homeAdvantage", copy.homeAdvantageReason(EIGHT, TWO)],
    ["untouchable", copy.untouchableReason(tally)],
    ["teflon", copy.teflonReason(tally)],
    ["hotSeat", copy.hotSeatReason(EIGHT)],
    ["theComeback", copy.comebackReason(TWO, FIFTY_ONE)],
    ["theLadder", copy.ladderReason(tally)],
    ["sweetRevenge", copy.sweetRevengeReason(tally, ANOTHER_TALLY)],
    ["ironSeat", copy.ironSeatReason(tally)],
    ["theTruce", copy.truceReason(TWO, tally)],
    ["thePacifist", copy.pacifistReason(tally)],
    ["theNemesis", copy.nemesisReason(tally)],
    ["theDoorman", copy.doormanReason(EIGHT, tally)],
    ["neverAsked", copy.neverAskedReason(tally)],
    ["theLatecomer", copy.latecomerReason(EIGHT, FIFTY_ONE)],
    ["revolvingDoor", copy.revolvingDoorReason(EIGHT, tally)],
    ["theCameo", copy.cameoReason(tally)],
    ["secondWind", copy.secondWindReason(TWO, tally)],
    ["theUnderstudy", copy.understudyReason(tally, tally)],
    ["theFlatline", copy.flatlineReason(TWO, tally)],
    ["theInvisible", copy.invisibleReason(EIGHT, tally)],
    ["groundhogDay", copy.groundhogReason(TWO, tally)],
    ["thePendulum", copy.pendulumReason(tally)],
    ["theRollercoaster", copy.rollercoasterReason(FIFTY_ONE, tally)],
    ["allOrNothing", copy.allOrNothingReason(EIGHT, tally)],
    ["theIrishGoodbye", copy.irishGoodbyeReason(EIGHT, tally)],
    ["theAnchor", copy.anchorReason(tally)],
    ["theSlide", copy.slideReason(tally)],
    ["falseDawn", copy.falseDawnReason(EIGHT, FIFTY_ONE)],
    ["openersCurse", copy.openersCurseReason(FIFTY_ONE, TWO)],
    ["encore", copy.encoreReason(tally)],
    ["firstBlood", copy.firstBloodReason],
    ["theViceroy", copy.viceroyReason(FIFTY_ONE, tally)],
    ["theKingslayer", copy.kingslayerReason(tally, tally)],
    ["theLastStand", copy.lastStandReason(tally, tally)],
    ["theirHour", copy.theirHourReason(tally, tally)],
    ["theHalfNight", copy.halfNightReason(tally, FIFTY_ONE)],
    ["personalBest", copy.personalBestReason(FIFTY_ONE, tally)],
    ["firstCleanNight", copy.firstCleanNightReason(tally, tally)],
    ["firstWin", copy.firstWinReason(tally)],
    ["newAtTheTable", copy.newAtTheTableReason(tally)],
    ["foolOfTheNight", copy.foolReason(TWO, tally)],
    ["curse", copy.curseFact(EIGHT, tally, TWO)],
  ];
};

const WITHOUT_A_FIGURE: readonly string[] = ["firstBlood"];

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
          expect(Object.keys(value), `${path} holds nothing`).not.toHaveLength(NOTHING);

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
      for (const forms of [
        copy.sheetGameForms,
        copy.sheetPlayerForms,
        copy.sheetEveningForms,
        copy.sheetEveningsOwedForms,
        copy.sheetTimeForms,
      ]) {
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

  describe("what more play would add", () => {
    const REMAINDER = "2 games";

    const EVENINGS_LEFT = "2 evenings";

    it("should print the remainder it was handed in the chronology's caption", () => {
      expect(copy.moreGamesForAwards(REMAINDER)).toContain(REMAINDER);
    });

    it("should say more in that caption than the remainder alone", () => {
      expect(copy.moreGamesForAwards(REMAINDER).length).toBeGreaterThan(REMAINDER.length);
    });

    it("should print the remainder it was handed when refusing the awards", () => {
      expect(copy.awardsTooSoon(REMAINDER)).toContain(REMAINDER);
    });

    it("should point the refused player at the chronology they can have", () => {
      expect(copy.awardsTooSoon(REMAINDER)).toContain("/stats_chronology");
    });

    it("should print the evenings it was handed in the chart's hint", () => {
      expect(copy.personalChartArrives(EVENINGS_LEFT)).toContain(EVENINGS_LEFT);
    });

    it("should say more in that hint than the count alone", () => {
      expect(copy.personalChartArrives(EVENINGS_LEFT).length).toBeGreaterThan(
        EVENINGS_LEFT.length
      );
    });

    it("should leave naming the chart to the section label it sits beside", () => {
      expect(copy.personalChartArrives(EVENINGS_LEFT)).not.toContain(copy.personalChartLabel);
    });

    it("should not decide singular or plural itself, only print what it is handed", () => {
      expect(copy.moreGamesForAwards("1 game")).toContain("1 game");
      expect(copy.personalChartArrives("1 evening")).toContain("1 evening");
    });
  });

  describe("personalPicked()", () => {
    it("should print the name it was handed", () => {
      expect(copy.personalPicked(A_NAME)).toContain(A_NAME);
    });

    it("should read as a card that exists rather than as work in progress", () => {
      expect(copy.personalPicked(A_NAME)).not.toContain("…");
    });
  });

  describe("the awards", () => {
    it("should give every award in the catalogue a title", () => {
      expect(Object.keys(copy.awardTitles)).toHaveLength(AWARDS_IN_THE_CATALOGUE);
    });

    it("should leave the note under the player card's tiles inside the card", () => {
      const CARD_ROOM = GRID_RIGHT - PAD;

      expect(
        widthOf(copy.tileExpectationNote, personalFont.tileNote, USUAL_FALLBACK),
        copy.tileExpectationNote
      ).toBeLessThanOrEqual(CARD_ROOM);
    });

    it("should measure every award the catalogue names, so no new line escapes the room check", () => {
      const CURSE_IS_NOT_AN_AWARD = "curse";

      const measured = reasonsOf(copy, A_TALLY)
        .map(([name]) => name)
        .filter((name) => name !== CURSE_IS_NOT_AN_AWARD);

      expect([...measured].sort()).toEqual([...Object.values(AwardName)].sort());
    });

    it("should leave no award title empty", () => {
      for (const [name, title] of Object.entries(copy.awardTitles)) {
        expect(title, name).not.toBe("");
      }
    });

    it("should give every award a title of its own", () => {
      expect(new Set(Object.values(copy.awardTitles)).size).toBe(AWARDS_IN_THE_CATALOGUE);
    });

    it("should print a number in every justification earned on one", () => {
      const counted = reasonsOf(copy, A_TALLY).filter(([name]) => !WITHOUT_A_FIGURE.includes(name));

      for (const [name, reason] of counted) {
        expect(reason, name).toMatch(/\d/);
      }
    });

    it("should exempt only a justification that prints nothing it was handed", () => {
      const exempt = reasonsOf(copy, A_TALLY).filter(([name]) => WITHOUT_A_FIGURE.includes(name));

      expect(exempt).toHaveLength(WITHOUT_A_FIGURE.length);

      for (const [name, reason] of exempt) {
        expect(reason, name).not.toContain(A_TALLY);
      }
    });

    it("should interpolate the count it was handed rather than a fixed one", () => {
      const EIGHT = 8;

      expect(copy.hotSeatReason(EIGHT)).toContain(String(EIGHT));
      expect(copy.encoreReason(A_TALLY)).toContain(A_TALLY);
    });

    it("should print the finished tally it was handed rather than a bare number", () => {
      const FIFTY_ONE = 51;

      expect(copy.kingReason(FIFTY_ONE, A_TALLY)).toContain(A_TALLY);
      expect(copy.pacifistReason(A_TALLY)).toContain(A_TALLY);
    });

    it("should leave the chart's hint clear of the label it shares a line with", () => {
      const label =
        widthOf(copy.personalChartLabel, personalFont.sectionLabel, WIDEST_FALLBACK) +
        copy.personalChartLabel.length * TILE_TRACKING;
      const hint = widthOf(
        copy.personalShortNight(gameTally(copy, ENOUGH_TO_JUDGE_A_NIGHT)),
        personalFont.axis,
        WIDEST_FALLBACK
      );

      expect(label + hint + A_GAP_BETWEEN).toBeLessThanOrEqual(GRID_RIGHT - PAD);
    });

    it("should leave every key label inside the slot the grid's key gives it", () => {
      for (const label of [copy.sheetKeyDrawn, copy.sheetKeyFool, copy.sheetKeyAbsent]) {
        expect(widthOf(label, fontSize.keyLabel, WIDEST_FALLBACK), label).toBeLessThanOrEqual(
          KEY_LABEL_ROOM
        );
      }
    });

    it("should leave every award's justification inside the row it is printed on", () => {
      const room = GRID_RIGHT - TEXT_LEFT;

      for (const [name, reason] of reasonsOf(copy, A_WIDE_TALLY)) {
        expect(widthOf(reason, ROOMY.reasonFont, USUAL_FALLBACK), `${name}: ${reason}`)
          .toBeLessThanOrEqual(room);
      }
    });

    it("should leave the curse fact room beside the label it shares a line with", () => {
      const A_WHOLE_EVENING = 19;

      const A_TENTH_OF_IT = 2;

      const label =
        widthOf(copy.awardsCurseLabel, CURSE_LABEL_FONT, WIDEST_FALLBACK) +
        copy.awardsCurseLabel.length * CURSE_TRACKING;
      const fact = widthOf(
        copy.curseFact(A_WHOLE_EVENING, A_TALLY, A_TENTH_OF_IT),
        CURSE_FACT_FONT,
        USUAL_FALLBACK
      );

      expect(label + fact).toBeLessThanOrEqual(GRID_RIGHT - PAD);
    });

    it("should print both the tallies an award was given, not one of them twice", () => {
      expect(copy.sweetRevengeReason(A_TALLY, ANOTHER_TALLY)).toContain(A_TALLY);
      expect(copy.sweetRevengeReason(A_TALLY, ANOTHER_TALLY)).toContain(ANOTHER_TALLY);
    });
  });
});
