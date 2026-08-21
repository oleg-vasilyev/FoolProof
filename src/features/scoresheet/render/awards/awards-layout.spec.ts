import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerColumn, SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { Award, Honours, TableCurse } from "#scoresheet/domain/awards/award-catalogue.ts";


const colourForSpy = vi.fn();

const NEUTRAL_INK = "neutral-ink";

vi.mock("#scoresheet/render/palette.ts", () => ({
  colourFor: (column: number) => colourForSpy(column),
  palette: { inkHint: NEUTRAL_INK },
}));

const {
  CAP_GAP,
  CAP_WIDTH,
  CARD_BOTTOM,
  COLUMN_GAP,
  CROWDED,
  CURSE_BASELINE_DROP,
  CURSE_RULE_LIFT,
  PLATE_TEXT_LEFT,
  PLATE_TITLE_LEFT,
  RANK_LEFT,
  RANK_WIDTH,
  ROOMY,
  ROWS_TOP,
  TEXT_LEFT,
  TICK_WIDTH,
  awardsLayoutOf,
  baselineOf,
  plateBoxOf,
} = await import("#scoresheet/render/awards/awards-layout.ts");

const PAD = 60;

const STARTED_ON = "2026-07-24";

const GAMES = 1;

const TELEGRAM_LONG_SIDE_LIMIT = 2560;

const CROWDED_ABOVE = 5;

const playersOf = (count: number): readonly PlayerColumn[] =>
  Array.from({ length: count }, (_unused, index) => ({ playerId: index, displayName: `P${index}` }));

const chronologyOf = (playerCount: number): SeriesChronology => ({
  startedOn: STARTED_ON,
  players: playersOf(playerCount),
  games: [],
});

const untouchableOf = (winner: number): Award => ({ name: AwardName.Untouchable, winners: [winner], games: GAMES });

const foolOf = (winner: number): Award => ({
  name: AwardName.FoolOfTheNight,
  winners: [winner],
  fools: GAMES,
  games: GAMES,
});

const honoursOf = (awards: readonly Award[], curse: TableCurse | null = null): Honours => ({
  awards,
  curse,
});

describe("the card's own left edges", () => {
  it("should leave the tick and a gutter before the rank", () => {
    expect(RANK_LEFT).toBe(PAD + TICK_WIDTH + COLUMN_GAP);
  });

  it("should leave the whole rank column before a row's text", () => {
    expect(TEXT_LEFT).toBe(RANK_LEFT + RANK_WIDTH + COLUMN_GAP);
  });

  it("should clear the rank gutter before the plate's text", () => {
    expect(PLATE_TEXT_LEFT).toBeGreaterThan(PAD + RANK_WIDTH);
  });

  it("should leave the cap and its gap before the plate's title", () => {
    expect(PLATE_TITLE_LEFT).toBe(PLATE_TEXT_LEFT + CAP_WIDTH + CAP_GAP);
  });
});

describe("baselineOf()", () => {
  const BOX_TOP = 100;

  const FONT = 50;

  it("should sit below the box's own top", () => {
    expect(baselineOf(BOX_TOP, FONT)).toBeGreaterThan(BOX_TOP);
  });

  it("should stay within the box's own font height", () => {
    expect(baselineOf(BOX_TOP, FONT)).toBeLessThan(BOX_TOP + FONT);
  });

  it("should move down as the font grows", () => {
    const BIGGER = 80;

    expect(baselineOf(BOX_TOP, BIGGER)).toBeGreaterThan(baselineOf(BOX_TOP, FONT));
  });

  it("should move down exactly as much as the box's own top moves", () => {
    const SHIFT = 20;

    expect(baselineOf(BOX_TOP + SHIFT, FONT) - baselineOf(BOX_TOP, FONT)).toBe(SHIFT);
  });

  it("should round to a whole pixel", () => {
    const ODD_FONT = 31;

    expect(baselineOf(BOX_TOP, ODD_FONT) % 1).toBe(0);
  });
});

describe("awardsLayoutOf()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    colourForSpy.mockImplementation((column: number) => `colour-${String(column)}`);
  });

  describe("ordering the rows", () => {
    it("should keep the rows in the order honours.awards gave them", () => {
      const honours = honoursOf([untouchableOf(0), untouchableOf(1), untouchableOf(2)]);

      const sheet = awardsLayoutOf(chronologyOf(3), honours);

      expect(sheet.rows.map((placed) => placed.award.winners[0])).toEqual([0, 1, 2]);
    });

    it("should pull foolOfTheNight out into sheet.fool", () => {
      const honours = honoursOf([untouchableOf(0), foolOf(1)]);

      const sheet = awardsLayoutOf(chronologyOf(2), honours);

      expect(sheet.fool?.award.name).toBe("foolOfTheNight");
    });

    it("should never leave foolOfTheNight among sheet.rows", () => {
      const honours = honoursOf([untouchableOf(0), foolOf(1)]);

      const sheet = awardsLayoutOf(chronologyOf(2), honours);

      expect(sheet.rows.some((placed) => placed.award.name === AwardName.FoolOfTheNight)).toBe(false);
    });
  });

  describe("telling an award that crowned everybody from one that did not", () => {
    const A_TABLE_OF_THREE = 3;

    const everyoneOf = (winners: readonly number[]) => ({
      name: AwardName.TheTruce,
      winners,
      draws: winners.length,
      games: A_TABLE_OF_THREE,
    });

    it("should mark an award whose winners are the whole table", () => {
      const honours = honoursOf([everyoneOf([0, 1, 2])]);

      const sheet = awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(sheet.rows[0]?.wholeTable).toBe(true);
    });

    it("should not mark one that left somebody out", () => {
      const honours = honoursOf([everyoneOf([0, 1])]);

      const sheet = awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(sheet.rows[0]?.wholeTable).toBe(false);
    });

    it("should not mark a single winner at a table of one as the whole table by accident", () => {
      const honours = honoursOf([untouchableOf(0)]);

      const sheet = awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(sheet.rows[0]?.wholeTable).toBe(false);
    });

    it("should colour it neutrally, so it cannot be read as the first winner's row", () => {
      const honours = honoursOf([everyoneOf([0, 1, 2])]);

      const sheet = awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(sheet.rows[0]?.colour).toBe(NEUTRAL_INK);
    });

    it("should never ask the palette for a seat colour it will not use", () => {
      const honours = honoursOf([everyoneOf([0, 1, 2])]);

      awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(colourForSpy).not.toHaveBeenCalled();
    });

    it("should still give an award with one winner that winner's own colour", () => {
      const honours = honoursOf([untouchableOf(0)]);

      const sheet = awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(sheet.rows[0]?.colour).not.toBe(NEUTRAL_INK);
    });

    it("should colour a shared award neutrally too, though it is not the whole table", () => {
      const honours = honoursOf([everyoneOf([0, 1])]);

      const sheet = awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(sheet.rows[0]?.wholeTable).toBe(false);
      expect(sheet.rows[0]?.colour).toBe(NEUTRAL_INK);
    });

    it("should not hand a shared award the first winner's colour, which the grid gives somebody else", () => {
      const honours = honoursOf([everyoneOf([0, 1])]);

      awardsLayoutOf(chronologyOf(A_TABLE_OF_THREE), honours);

      expect(colourForSpy).not.toHaveBeenCalled();
    });
  });

  describe("stacking the rows", () => {
    it("should start the first row at ROWS_TOP", () => {
      const honours = honoursOf([untouchableOf(0)]);

      const sheet = awardsLayoutOf(chronologyOf(1), honours);

      expect(sheet.rows[0]?.top).toBe(ROWS_TOP);
    });

    it("should stack each row directly beneath the one before it", () => {
      const honours = honoursOf([untouchableOf(0), untouchableOf(1), untouchableOf(2)]);

      const sheet = awardsLayoutOf(chronologyOf(3), honours);

      for (let at = 1; at < sheet.rows.length; at += 1) {
        const previous = sheet.rows[at - 1];
        const current = sheet.rows[at];

        expect(current?.top).toBe((previous?.top ?? 0) + (previous?.height ?? 0));
      }
    });
  });

  describe("ranking", () => {
    it("should count the rows' own rank from zero", () => {
      const honours = honoursOf([untouchableOf(0), untouchableOf(1), untouchableOf(2)]);

      const sheet = awardsLayoutOf(chronologyOf(3), honours);

      expect(sheet.rows.map((placed) => placed.rank)).toEqual([0, 1, 2]);
    });

    it("should give the fool the next rank after the rows", () => {
      const honours = honoursOf([untouchableOf(0), untouchableOf(1), foolOf(2)]);

      const sheet = awardsLayoutOf(chronologyOf(3), honours);

      expect(sheet.fool?.rank).toBe(sheet.rows.length);
    });

    it("should set the plate below the last row by the density's own margin", () => {
      const honours = honoursOf([untouchableOf(0), untouchableOf(1), foolOf(2)]);

      const sheet = awardsLayoutOf(chronologyOf(3), honours);
      const lastRow = sheet.rows.at(-1);

      expect(sheet.fool?.top).toBe(
        (lastRow?.top ?? 0) + (lastRow?.height ?? 0) + ROOMY.plateMargin
      );
    });

    it("should give the plate exactly the height its own box asks for", () => {
      const honours = honoursOf([untouchableOf(0), foolOf(1)]);

      const sheet = awardsLayoutOf(chronologyOf(2), honours);

      expect(sheet.fool?.height).toBe(plateBoxOf(ROOMY).height);
    });
  });

  describe("colouring a row", () => {
    it("should ask colourFor for the winner's own column, not the winner's id", () => {
      const honours = honoursOf([untouchableOf(2)]);

      awardsLayoutOf(chronologyOf(5), honours);

      expect(colourForSpy).toHaveBeenCalledWith(2);
    });

    it("should carry whatever colourFor returned", () => {
      const honours = honoursOf([untouchableOf(2)]);

      const sheet = awardsLayoutOf(chronologyOf(5), honours);

      expect(sheet.rows[0]?.colour).toBe("colour-2");
    });
  });

  describe("resolving names", () => {
    it("should resolve every winner id to a display name, in the award's own order", () => {
      const truce: Award = { name: AwardName.TheTruce, winners: [2, 0], draws: 1, games: 1 };
      const honours = honoursOf([truce]);

      const sheet = awardsLayoutOf(chronologyOf(3), honours);

      expect(sheet.rows[0]?.names).toEqual(["P2", "P0"]);
    });
  });

  describe("density", () => {
    it("should keep a card with five or fewer awards roomy", () => {
      const honours = honoursOf(
        Array.from({ length: CROWDED_ABOVE }, (_unused, index) => untouchableOf(index))
      );

      const sheet = awardsLayoutOf(chronologyOf(CROWDED_ABOVE), honours);
      const roomyHeight = sheet.rows[0]?.height ?? 0;

      const crowdedHonours = honoursOf(
        Array.from({ length: CROWDED_ABOVE + 1 }, (_unused, index) => untouchableOf(index))
      );
      const crowdedSheet = awardsLayoutOf(chronologyOf(CROWDED_ABOVE + 1), crowdedHonours);
      const crowdedHeight = crowdedSheet.rows[0]?.height ?? 0;

      expect(crowdedHeight).toBeLessThan(roomyHeight);
    });

    it("should give a row exactly the room its three lines and its padding need", () => {
      const honours = honoursOf(
        Array.from({ length: CROWDED_ABOVE + 1 }, (_unused, index) => untouchableOf(index))
      );

      const sheet = awardsLayoutOf(chronologyOf(CROWDED_ABOVE + 1), honours);

      expect(sheet.rows[0]?.height).toBe(
        CROWDED.rowPad +
          CROWDED.titleLine +
          CROWDED.titleGap +
          CROWDED.winnerLine +
          CROWDED.winnerGap +
          CROWDED.reasonLine +
          CROWDED.rowPad
      );
    });

    it("should give a roomy row the room the roomy density asks for", () => {
      const honours = honoursOf([untouchableOf(0)]);

      const sheet = awardsLayoutOf(chronologyOf(1), honours);

      expect(sheet.rows[0]?.height).toBe(
        ROOMY.rowPad +
          ROOMY.titleLine +
          ROOMY.titleGap +
          ROOMY.winnerLine +
          ROOMY.winnerGap +
          ROOMY.reasonLine +
          ROOMY.rowPad
      );
    });
  });

  describe("the table curse", () => {
    it("should place nothing when there is no curse", () => {
      const honours = honoursOf([untouchableOf(0)], null);

      const sheet = awardsLayoutOf(chronologyOf(1), honours);

      expect(sheet.curse).toBeNull();
    });

    it("should carry the curse's own fact where it placed it", () => {
      const FACT = { burns: 2, games: 8, predicted: 1 };
      const honours = honoursOf([untouchableOf(0)], FACT);

      const sheet = awardsLayoutOf(chronologyOf(1), honours);

      expect(sheet.curse?.fact).toBe(FACT);
    });

    it("should hang the curse below whatever the card ended with", () => {
      const honours = honoursOf([untouchableOf(0)], { burns: 2, games: 8, predicted: 1 });

      const sheet = awardsLayoutOf(chronologyOf(1), honours);
      const lastRow = sheet.rows.at(-1);

      expect(sheet.curse?.top).toBe((lastRow?.top ?? 0) + (lastRow?.height ?? 0) + CURSE_RULE_LIFT);
    });

    it("should hang the curse below the fool's plate when there is one", () => {
      const honours = honoursOf([untouchableOf(0), foolOf(1)], { burns: 2, games: 8, predicted: 1 });

      const sheet = awardsLayoutOf(chronologyOf(2), honours);

      expect(sheet.curse?.top).toBe(
        (sheet.fool?.top ?? 0) + (sheet.fool?.height ?? 0) + CURSE_RULE_LIFT
      );
    });

    it("should leave room under the curse for its own line and the card's margin", () => {
      const honours = honoursOf([untouchableOf(0)], { burns: 2, games: 8, predicted: 1 });

      const sheet = awardsLayoutOf(chronologyOf(1), honours);

      expect(sheet.height).toBe((sheet.curse?.top ?? 0) + CURSE_BASELINE_DROP + CARD_BOTTOM);
    });

    it("should make the sheet shorter with no curse than with one", () => {
      const withCurse = awardsLayoutOf(
        chronologyOf(1),
        honoursOf([untouchableOf(0)], { burns: 2, games: 8, predicted: 1 })
      );
      const withoutCurse = awardsLayoutOf(chronologyOf(1), honoursOf([untouchableOf(0)], null));

      expect(withoutCurse.height).toBeLessThan(withCurse.height);
    });
  });

  describe("the Telegram height budget", () => {
    it("should never exceed 2560 for a nine-award card with a curse", () => {
      const EIGHT = 8;
      const awards = [
        ...Array.from({ length: EIGHT }, (_unused, index) => untouchableOf(index)),
        foolOf(EIGHT),
      ];
      const honours = honoursOf(awards, { burns: 3, games: 9, predicted: 2 });

      const sheet = awardsLayoutOf(chronologyOf(EIGHT + 1), honours);

      expect(sheet.height).toBeLessThanOrEqual(TELEGRAM_LONG_SIDE_LIMIT);
    });
  });
});

describe("plateBoxOf()", () => {
  const DENSITY = {
    rowPad: 24,
    titleFont: 58,
    winnerFont: 42,
    reasonFont: 31,
    titleLine: 64,
    winnerLine: 50,
    reasonLine: 40,
    titleGap: 6,
    winnerGap: 8,
    rankLift: 36,
    plateFont: 74,
    plateWinnerFont: 50,
    plateGap: 16,
    plateTop: 36,
    plateBottom: 40,
    plateMargin: 40,
    plateRankLift: 96,
  };

  it("should start the head at the density's own plateTop", () => {
    expect(plateBoxOf(DENSITY).headTop).toBe(DENSITY.plateTop);
  });

  it("should set the winner's top below the title's own line and gap", () => {
    expect(plateBoxOf(DENSITY).winnerTop).toBe(
      DENSITY.plateTop + DENSITY.plateFont + DENSITY.plateGap
    );
  });

  it("should set the reason's top below the winner's own line and gap", () => {
    const box = plateBoxOf(DENSITY);

    expect(box.reasonTop).toBe(box.winnerTop + DENSITY.winnerLine + DENSITY.winnerGap);
  });

  it("should size the plate to fit the reason line plus the bottom margin", () => {
    const box = plateBoxOf(DENSITY);

    expect(box.height).toBe(box.reasonTop + DENSITY.reasonLine + DENSITY.plateBottom);
  });
});
