import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { ScoredPlayer } from "#scoresheet/domain/scoring.ts";


const scoreSeriesSpy = vi.fn();

vi.mock("#scoresheet/domain/scoring.ts", () => ({
  scoreSeries: (players: unknown, rounds: unknown) => scoreSeriesSpy(players, rounds),
}));

const {
  CELL_INSET,
  CELL_SHRINK,
  CHART_HEIGHT,
  FONT_FAMILY,
  GRID_LEFT,
  GRID_RIGHT,
  GRID_TOP,
  IMAGE_WIDTH,
  MAX_ROWS,
  PAD,
  PLOT_INSET,
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_WIDTH,
  cellFontOf,
  chartBottomOf,
  columnCentre,
  indexFontOf,
  layoutOf,
  legendFontOf,
} = await import("#scoresheet/render/sheet-layout.ts");

const TELEGRAM_LONG_SIDE_LIMIT = 2560;

const NONE = 0;

const ONE = 1;

const SIX = 6;

const startedOn = "2026-07-24";

const gamesOf = (count: number) =>
  Array.from({ length: count }, (_unused, index) => ({
    gameId: index,
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

    it("should score only the games it is going to draw", () => {
      layoutOf(chronologyOf(MAX_ROWS + ONE));

      expect(scoreSeriesSpy.mock.calls[0]?.[1]).toHaveLength(MAX_ROWS);
    });
  });

  describe("the height budget", () => {
    it("should never exceed the long side Telegram keeps without downscaling", () => {
      const tallest = Array.from({ length: MAX_ROWS }, (_unused, index) => index + ONE).map(
        (games) => layoutOf(chronologyOf(games)).height
      );

      expect(Math.max(...tallest)).toBeLessThanOrEqual(TELEGRAM_LONG_SIDE_LIMIT);
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

      expect(layoutOf(chronologyOf(OVER)).omitted).toBe(OVER - MAX_ROWS);
    });

    it("should keep the most recent games, not the earliest", () => {
      const OVER = MAX_ROWS + ONE;

      layoutOf(chronologyOf(OVER));
      const scored = scoreSeriesSpy.mock.calls[0]?.[1] as readonly { gameId: number }[];

      expect(scored[0]?.gameId).toBe(ONE);
    });

    it("should leave nothing out of a session that fits", () => {
      expect(layoutOf(chronologyOf(MAX_ROWS)).omitted).toBe(NONE);
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

  it("should shrink the round number with the row", () => {
    expect(indexFontOf(SHORT_ROW)).toBeLessThan(indexFontOf(TALL_ROW));
  });

  it("should return whole pixels, so glyphs land on the grid", () => {
    expect(cellFontOf(SHORT_ROW) % ONE).toBe(NONE);
    expect(indexFontOf(SHORT_ROW) % ONE).toBe(NONE);
  });
});

describe("legendFontOf()", () => {
  const NARROW_SLOT = 120;

  const WIDE_SLOT = 2000;

  it("should shrink with a narrower slot", () => {
    expect(legendFontOf(NARROW_SLOT)).toBeLessThan(legendFontOf(WIDE_SLOT));
  });

  it("should never grow past the design's legend size, however wide the slot gets", () => {
    const DESIGN_SIZE = 30;

    expect(legendFontOf(WIDE_SLOT)).toBe(DESIGN_SIZE);
  });
});
