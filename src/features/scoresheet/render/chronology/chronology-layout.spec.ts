import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import {
  FONT_FAMILY,
  GRID_RIGHT,
  IMAGE_WIDTH,
  PAD,
  USUAL_FALLBACK,
  fontSize,
} from "#scoresheet/render/card-metrics.ts";


const scoreSeriesSpy = vi.fn();

vi.mock("#scoresheet/domain/scoring.ts", () => ({
  scoreSeries: (players: unknown, rounds: unknown) => scoreSeriesSpy(players, rounds),
}));

const {
  CELL_INSET,
  CELL_SHRINK,
  CHART_HEIGHT,

  GRID_LEFT,

  GRID_TOP,

  LEGEND_GUTTER,
  LEGEND_ROW_PITCH,
  LEGEND_SLOT_MAX,
  PLOT_INSET,
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_WIDTH,
  cellFontOf,
  chartBottomOf,
  columnCentre,
  indexFontOf,
  indexStrideOf,
  layoutOf,
  legendColumnsOf,
  legendRowsOf,
  legendSlotOf,
  maxGamesFor,
} = await import("#scoresheet/render/chronology/chronology-layout.ts");

const TELEGRAM_LONG_SIDE_LIMIT = 2560;

const NONE = 0;

const ONE = 1;

const SIX = 6;

const MAX_ROWS = maxGamesFor(SIX);

const startedOn = "2026-07-24";

const gamesOf = (count: number) =>
  Array.from({ length: count }, (_unused, index) => ({
    gameId: index,
    starterId: null,
    placements: [{ playerId: ONE, position: ONE }],
  }));

const playersOf = (count: number) =>
  Array.from({ length: count }, (_unused, index) => ({
    playerId: index,
    displayName: `P${index}`,
  }));

const chronologyOf = (games: number, players = SIX): SeriesChronology => ({
  startedOn,
  players: playersOf(players),
  games: gamesOf(games),
});

describe("layoutOf()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    scoreSeriesSpy.mockImplementation(
      (players: readonly { playerId: number; displayName: string }[]): readonly ScoredPlayer[] =>
        players.map((player) => ({ ...player, cells: [], running: [], share: NONE, games: NONE }))
    );
  });

  describe("what it hands to the scorer", () => {
    it("should score the players it was given", () => {
      const chronology = chronologyOf(ONE);

      layoutOf(chronology);

      expect(scoreSeriesSpy).toHaveBeenCalledWith(chronology.players, chronology.games);
    });

    it("should score every game the evening had, not only the rows the grid will draw", () => {
      const OVER = MAX_ROWS + ONE;

      layoutOf(chronologyOf(OVER));

      expect(scoreSeriesSpy.mock.calls[0]?.[1]).toHaveLength(OVER);
    });

    it("should score from the first game, so the chart below opens where the evening did", () => {
      const OVER = MAX_ROWS + ONE;

      layoutOf(chronologyOf(OVER));
      const scored = scoreSeriesSpy.mock.calls[0]?.[1] as readonly { gameId: number }[];

      expect(scored[0]?.gameId).toBe(NONE);
    });
  });

  describe("the height budget", () => {
    it("should never exceed the long side Telegram keeps without downscaling", () => {
      const tallest = Array.from({ length: MAX_ROWS }, (_unused, index) => index + ONE).map(
        (games) => layoutOf(chronologyOf(games)).height
      );

      expect(Math.max(...tallest)).toBeLessThanOrEqual(TELEGRAM_LONG_SIDE_LIMIT);
    });

    it("should still fit at every table size, however many rows that table's legend needs", () => {
      const CROWDED = 12;

      const tallest = Array.from({ length: CROWDED }, (_unused, index) => index + ONE).map(
        (players) => layoutOf(chronologyOf(maxGamesFor(players), players)).height
      );

      expect(Math.max(...tallest)).toBeLessThanOrEqual(TELEGRAM_LONG_SIDE_LIMIT);
    });

    it("should spend the room a taller legend takes on the legend, not on the picture above it", () => {
      const ONE_ROW = 4;

      const TWO_ROWS = 8;

      const shallow = layoutOf(chronologyOf(ONE, ONE_ROW));
      const deep = layoutOf(chronologyOf(ONE, TWO_ROWS));

      expect(deep.height - shallow.height).toBe(LEGEND_ROW_PITCH);
      expect(deep.chartTop).toBe(shallow.chartTop);
    });

    it("should still fit when asked to draw more games than fit", () => {
      const OVERLONG = MAX_ROWS * 3;

      expect(layoutOf(chronologyOf(OVERLONG)).height).toBeLessThanOrEqual(
        TELEGRAM_LONG_SIDE_LIMIT
      );
    });

    it("should grow the image as games are added", () => {
      const FEW = 4;

      expect(layoutOf(chronologyOf(FEW + ONE)).height).toBeGreaterThan(
        layoutOf(chronologyOf(FEW)).height
      );
    });
  });

  describe("the rows", () => {
    it("should keep rows generous while the session is short", () => {
      const FEW = 3;

      expect(layoutOf(chronologyOf(FEW)).rowHeight).toBe(
        layoutOf(chronologyOf(FEW + ONE)).rowHeight
      );
    });

    it("should shrink rows once the session gets long", () => {
      const SHORT = 10;
      const LONG = 40;

      expect(layoutOf(chronologyOf(LONG)).rowHeight).toBeLessThan(
        layoutOf(chronologyOf(SHORT)).rowHeight
      );
    });

    it("should draw one row per game it kept", () => {
      const GAMES = 9;
      const sheet = layoutOf(chronologyOf(GAMES));

      expect(sheet.gridHeight).toBe(sheet.rounds * sheet.rowHeight);
    });

    it("should drop the earliest games when there are too many", () => {
      const OVER = MAX_ROWS + 5;

      expect(layoutOf(chronologyOf(OVER)).rounds).toBe(MAX_ROWS);
    });

    it("should report how many games it left out", () => {
      const OVER = MAX_ROWS + 5;

      expect(layoutOf(chronologyOf(OVER)).played - layoutOf(chronologyOf(OVER)).rounds).toBe(OVER - MAX_ROWS);
    });

    it("should report the whole evening alongside the rows it drew, so the two cannot be confused", () => {
      const OVER = MAX_ROWS + 5;
      const sheet = layoutOf(chronologyOf(OVER));

      expect(sheet.played).toBe(OVER);
      expect(sheet.rounds).toBeLessThan(sheet.played);
    });

    it("should count the whole evening as played when all of it fits", () => {
      const FEW = 4;

      expect(layoutOf(chronologyOf(FEW)).played).toBe(FEW);
    });

    it("should leave nothing out of a session that fits", () => {
      expect(layoutOf(chronologyOf(MAX_ROWS)).rounds).toBe(MAX_ROWS);
    });
  });

  describe("the columns", () => {
    it("should divide the grid evenly between the players", () => {
      const sheet = layoutOf(chronologyOf(ONE, SIX));

      expect(sheet.columnWidth * SIX).toBeCloseTo(GRID_RIGHT - GRID_LEFT);
    });

    it("should give a smaller table wider columns", () => {
      const PAIR = 2;

      expect(layoutOf(chronologyOf(ONE, PAIR)).columnWidth).toBeGreaterThan(
        layoutOf(chronologyOf(ONE, SIX)).columnWidth
      );
    });
  });

  describe("the chart", () => {
    it("should sit below the grid", () => {
      const sheet = layoutOf(chronologyOf(SIX));

      expect(sheet.chartTop).toBeGreaterThan(GRID_TOP + sheet.gridHeight);
    });

    it("should leave room under itself", () => {
      const sheet = layoutOf(chronologyOf(SIX));

      expect(sheet.height).toBeGreaterThan(sheet.chartTop);
    });

    it("should report the grid's own bottom edge, exactly where the grid's rows end", () => {
      const sheet = layoutOf(chronologyOf(SIX));

      expect(sheet.gridBottom).toBe(GRID_TOP + sheet.gridHeight);
    });

    it("should hang the chart a fixed gap below the grid's bottom edge, not below the grid's top", () => {
      const sheet = layoutOf(chronologyOf(SIX));

      expect(sheet.chartTop - sheet.gridBottom).toBe(
        layoutOf(chronologyOf(ONE)).chartTop - layoutOf(chronologyOf(ONE)).gridBottom
      );
    });
  });

  describe("chartBottomOf()", () => {
    it("should sit a whole chart's height below the chart's top", () => {
      const sheet = layoutOf(chronologyOf(SIX));

      expect(chartBottomOf(sheet) - sheet.chartTop).toBe(CHART_HEIGHT);
    });

    it("should leave the bottom margin between itself and the foot of the sheet", () => {
      const sheet = layoutOf(chronologyOf(SIX));

      expect(chartBottomOf(sheet)).toBeLessThan(sheet.height);
    });

    it("should move with the chart when more games push it down", () => {
      expect(chartBottomOf(layoutOf(chronologyOf(SIX)))).toBeGreaterThan(
        chartBottomOf(layoutOf(chronologyOf(ONE)))
      );
    });
  });

  describe("columnCentre()", () => {
    it("should put the first column half a column in from the left edge", () => {
      const sheet = layoutOf(chronologyOf(ONE, SIX));
      const HALF = 2;

      expect(columnCentre(sheet, NONE)).toBe(GRID_LEFT + sheet.columnWidth / HALF);
    });

    it("should step one column width per column", () => {
      const sheet = layoutOf(chronologyOf(ONE, SIX));

      expect(columnCentre(sheet, ONE) - columnCentre(sheet, NONE)).toBeCloseTo(sheet.columnWidth);
    });
  });

  it("should carry the session's date through untouched", () => {
    expect(layoutOf(chronologyOf(ONE)).startedOn).toBe(startedOn);
  });
});

describe("the page geometry", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    scoreSeriesSpy.mockImplementation(
      (players: readonly { playerId: number; displayName: string }[]): readonly ScoredPlayer[] =>
        players.map((player) => ({ ...player, cells: [], running: [], share: NONE, games: NONE }))
    );
  });

  it("should leave a margin on both sides of the grid", () => {
    expect(GRID_LEFT).toBeGreaterThan(NONE);
    expect(GRID_RIGHT).toBeLessThan(IMAGE_WIDTH);
  });

  it("should leave room left of the grid for the round numbers", () => {
    expect(GRID_LEFT).toBeGreaterThan(PAD);
  });

  it("should keep the grid inside the image", () => {
    expect(GRID_RIGHT).toBeGreaterThan(GRID_LEFT);
  });

  it("should leave a margin below the chart", () => {
    const sheet = layoutOf(chronologyOf(SIX));

    expect(sheet.height).toBeGreaterThan(sheet.chartTop + CHART_HEIGHT);
  });

  it("should shrink a cell by its inset on both sides", () => {
    expect(CELL_SHRINK).toBeGreaterThan(CELL_INSET);
  });

  it("should name a font the rasterizer can resolve", () => {
    expect(FONT_FAMILY).not.toBe("");
  });
});

describe("the plot geometry", () => {
  it("should keep the plot's right edge inside the grid's right edge by exactly PLOT_INSET", () => {
    expect(GRID_RIGHT - PLOT_RIGHT).toBe(PLOT_INSET);
  });

  it("should sit the plot's left edge on the grid's own left edge", () => {
    expect(PLOT_LEFT).toBe(GRID_LEFT);
  });

  it("should measure the plot's width as the distance between its own two edges", () => {
    expect(PLOT_WIDTH).toBe(PLOT_RIGHT - PLOT_LEFT);
  });
});

describe("type sizes", () => {
  const TALL_ROW = 56;

  const SHORT_ROW = 26;

  it("should fit the cell digit inside its row", () => {
    expect(cellFontOf(TALL_ROW)).toBeLessThan(TALL_ROW);
  });

  it("should shrink the cell digit with the row", () => {
    expect(cellFontOf(SHORT_ROW)).toBeLessThan(cellFontOf(TALL_ROW));
  });

  it("should keep the round number smaller than the cell digit", () => {
    expect(indexFontOf(TALL_ROW)).toBeLessThan(cellFontOf(TALL_ROW));
  });

  it("should keep the round number legible when the rows go to their floor", () => {
    expect(indexFontOf(SHORT_ROW)).toBe(indexFontOf(TALL_ROW));
  });

  it("should never set the round number larger than a full row would carry", () => {
    const A_ROOMY_SHEET = 200;

    expect(indexFontOf(A_ROOMY_SHEET)).toBe(indexFontOf(TALL_ROW));
  });

  it("should return whole pixels, so glyphs land on the grid", () => {
    expect(cellFontOf(SHORT_ROW) % ONE).toBe(NONE);
    expect(indexFontOf(SHORT_ROW) % ONE).toBe(NONE);
  });
});

describe("indexStrideOf()", () => {
  const TALL_ROW = 56;

  const SHORT_ROW = 26;

  const EVERY_ROW = 1;

  const EVERY_FIFTH = 5;

  it("should number every row while a row has the height to carry a number", () => {
    expect(indexStrideOf(TALL_ROW)).toBe(EVERY_ROW);
  });

  it("should skip rows once they are too short to number one by one", () => {
    expect(indexStrideOf(SHORT_ROW)).toBe(EVERY_FIFTH);
  });

  it("should step in round numbers, so the ones printed read as a scale", () => {
    const ROUND_STEPS = [1, 5, 10];

    expect(ROUND_STEPS).toContain(indexStrideOf(SHORT_ROW));
  });

  it("should number every row at exactly the height a number needs, not one pixel above it", () => {
    const JUST_ENOUGH = 31;

    expect(indexStrideOf(JUST_ENOUGH)).toBe(EVERY_ROW);
    expect(indexStrideOf(JUST_ENOUGH - ONE)).toBeGreaterThan(EVERY_ROW);
  });

  it("should set the number from its own row once that row is the tighter of the two limits", () => {
    const JUST_ENOUGH = 31;

    expect(indexFontOf(JUST_ENOUGH)).toBeLessThan(indexFontOf(TALL_ROW));
  });
});

describe("legendRowsOf(), legendColumnsOf() and legendSlotOf()", () => {
  const A_SMALL_TABLE = 4;

  const A_FULL_ROW = 5;

  const A_CROWDED_TABLE = 10;

  const AN_ODD_TABLE = 7;

  const TABLE_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  it("should keep a table that fits on one row on one row", () => {
    expect(legendRowsOf(A_SMALL_TABLE)).toBe(ONE);
    expect(legendRowsOf(A_FULL_ROW)).toBe(ONE);
  });

  it("should wrap rather than squeeze once a row is full", () => {
    const TWO_ROWS = 2;

    expect(legendRowsOf(A_FULL_ROW + ONE)).toBe(TWO_ROWS);
    expect(legendRowsOf(A_CROWDED_TABLE)).toBe(TWO_ROWS);
  });

  it("should balance the rows rather than strand the last few entries alone", () => {
    const EVENLY = 4;

    expect(legendColumnsOf(AN_ODD_TABLE)).toBe(EVENLY);
  });

  it("should never leave a row wider than the entries it holds", () => {
    for (const players of TABLE_SIZES) {
      expect(legendColumnsOf(players), String(players)).toBeLessThanOrEqual(players);
    }
  });

  it("should fit every entry of every row inside the plot", () => {
    for (const players of TABLE_SIZES) {
      const filled = legendColumnsOf(players) * legendSlotOf(players);

      expect(filled, String(players)).toBeLessThanOrEqual(PLOT_WIDTH);
    }
  });

  it("should seat everybody somewhere in the grid it chose", () => {
    for (const players of TABLE_SIZES) {
      const seats = legendRowsOf(players) * legendColumnsOf(players);

      expect(seats, String(players)).toBeGreaterThanOrEqual(players);
    }
  });

  it("should leave a name the same room whatever the table size, which is the point of wrapping", () => {
    const ROOM_FOR_A_NAME = 14;

    for (const players of TABLE_SIZES) {
      const room = (legendSlotOf(players) - LEGEND_GUTTER) / (fontSize.legend * USUAL_FALLBACK);

      expect(Math.floor(room), String(players)).toBeGreaterThanOrEqual(ROOM_FOR_A_NAME);
    }
  });

  it("should cap the slot so a small table does not spread its legend across the sheet", () => {
    expect(legendSlotOf(ONE)).toBe(LEGEND_SLOT_MAX);
    expect(legendSlotOf(A_SMALL_TABLE)).toBe(LEGEND_SLOT_MAX);
  });
});

describe("maxGamesFor()", () => {
  const A_FULL_ROW = 5;

  it("should hold the four ceilings the specification names, so the document cannot drift", () => {
    const ON_ONE_ROW = 34;

    const ON_TWO_ROWS = 28;

    const ON_THREE_ROWS = 22;

    const ON_FOUR_ROWS = 17;

    const ELEVEN = 11;

    const SIXTEEN = 16;

    expect(maxGamesFor(A_FULL_ROW)).toBe(ON_ONE_ROW);
    expect(maxGamesFor(A_FULL_ROW + ONE)).toBe(ON_TWO_ROWS);
    expect(maxGamesFor(ELEVEN)).toBe(ON_THREE_ROWS);
    expect(maxGamesFor(SIXTEEN)).toBe(ON_FOUR_ROWS);
  });

  it("should give every table that shares one legend row the same ceiling", () => {
    expect(maxGamesFor(ONE)).toBe(maxGamesFor(A_FULL_ROW));
  });

  it("should charge a crowded table the games its second legend row costs", () => {
    expect(maxGamesFor(A_FULL_ROW + ONE)).toBeLessThan(maxGamesFor(A_FULL_ROW));
  });

  it("should keep the ceiling falling as the legend grows, never rising", () => {
    const CROWDED = 12;

    const ceilings = Array.from({ length: CROWDED }, (_unused, index) =>
      maxGamesFor(index + ONE)
    );

    expect(ceilings).toEqual([...ceilings].sort((one, other) => other - one));
  });
});

describe("the biggest table the evening seated", () => {
  const A_SMALL_GAME = 3;

  const A_BIG_GAME = 9;

  const seatedIn = (sizes: readonly number[]): SeriesChronology => ({
    startedOn,
    players: playersOf(SIX),
    games: sizes.map((size, index) => ({
      gameId: index,
      starterId: null,
      placements: Array.from({ length: size }, (_unused, seat) => ({
        playerId: seat,
        position: seat + ONE,
      })),
    })),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    scoreSeriesSpy.mockImplementation(
      (players: readonly { playerId: number; displayName: string }[]): readonly ScoredPlayer[] =>
        players.map((player) => ({ ...player, cells: [], running: [], share: NONE, games: NONE }))
    );
  });

  it("should take the biggest game, not the smallest", () => {
    expect(layoutOf(seatedIn([A_SMALL_GAME, A_BIG_GAME])).biggestTable).toBe(A_BIG_GAME);
  });

  it("should find it wherever in the evening it sits", () => {
    expect(layoutOf(seatedIn([A_BIG_GAME, A_SMALL_GAME])).biggestTable).toBe(A_BIG_GAME);
  });

  it("should read the seats of a game rather than the roster of the evening", () => {
    const sheet = layoutOf(seatedIn([A_SMALL_GAME, A_SMALL_GAME]));

    expect(sheet.biggestTable).toBe(A_SMALL_GAME);
    expect(sheet.players).toHaveLength(SIX);
  });
});
