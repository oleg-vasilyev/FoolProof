import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { Cell } from "#scoresheet/domain/scoring.ts";
import type { Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";


const CHART_HEIGHT = 600;

const CHART_TOP = 1000;

const GRID_LEFT = 100;

const GRID_RIGHT = 1500;

const PLOT_INSET = 24;

const PLOT_LEFT = GRID_LEFT;

const PLOT_RIGHT = GRID_RIGHT - PLOT_INSET;

const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

const LEGEND_SLOT_MAX = 284;

const SAMPLE_WIDTH = 46;

const SAMPLE_GAP = 14;

const SAMPLE_LIFT = 7;

const LEGEND_FONT = 30;

const TALLY_FONT = 22;

const LABEL_FONT = 24;

const lineSpy = vi.fn();

const textSpy = vi.fn();

const colourForSpy = vi.fn();

const percentLabelSpy = vi.fn();

const gameTallySpy = vi.fn();

const legendFontOfSpy = vi.fn();

const nameToFitSpy = vi.fn();

vi.mock("#scoresheet/render/chronology/chronology-layout.ts", () => ({
  FONT_FAMILY: "Test Sans",
  PLOT_LEFT,
  PLOT_WIDTH,
  chartBottomOf: (sheet: { chartTop: number }) => sheet.chartTop + CHART_HEIGHT,
  fontSize: { legend: LEGEND_FONT, legendLabel: LABEL_FONT, legendTally: TALLY_FONT },
  legendFontOf: (slotWidth: number) => legendFontOfSpy(slotWidth),
  nameToFit: (name: string, width: number, largest: number) => nameToFitSpy(name, width, largest),
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { ink: "ink", inkFigure: "figure", inkMuted: "muted" },
  colourFor: (column: number) => colourForSpy(column),
}));

vi.mock("#scoresheet/render/chronology/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

vi.mock("#scoresheet/render/session-tally.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { shareLegend } = await import("#scoresheet/render/chronology/share-legend.ts");

const NONE = 0;

const ONE = 1;

const PLACED_CELL: Cell = { kind: CellKind.Placed, position: ONE };

const ABSENT_CELL: Cell = { kind: CellKind.Absent };

interface PlayerFixture {
  readonly running: readonly number[];
  readonly share?: number;
  readonly games?: number;
  readonly cells?: readonly Cell[];
}

const cellsOf = (rounds: number): readonly Cell[] =>
  Array.from({ length: rounds }, () => PLACED_CELL);

const sheetOf = (players: readonly PlayerFixture[], names?: readonly string[]): Sheet =>
  ({
    startedOn: "2026-07-24",
    players: players.map((player, index) => ({
      playerId: index,
      displayName: names?.[index] ?? `P${index}`,
      cells: player.cells ?? cellsOf(player.running.length),
      running: player.running,
      share: player.share ?? player.running.at(-ONE) ?? 0.5,
      games: player.games ?? player.running.length,
    })),
    rounds: players[0]?.running.length ?? NONE,
    omitted: NONE,
    rowHeight: NONE,
    columnWidth: NONE,
    gridHeight: NONE,
    gridBottom: NONE,
    chartTop: CHART_TOP,
    height: NONE,
  }) satisfies Sheet;

const printed = (): readonly string[] => textSpy.mock.calls.map((call) => String(call[0]));

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("shareLegend()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    nameToFitSpy.mockImplementation((name: string, _width: number, largest: number) => ({
      text: name,
      size: largest,
    }));

    lineSpy.mockImplementation(() => "<line/>");
    textSpy.mockImplementation(() => "<text/>");
    colourForSpy.mockImplementation((column: number) => `colour-${String(column)}`);
    percentLabelSpy.mockImplementation((share: number) => `pct(${String(share)})`);
    gameTallySpy.mockImplementation((_table: unknown, games: number) => `tally(${String(games)})`);
    legendFontOfSpy.mockReturnValue(20);
  });

  describe("the legend", () => {
    it("should name every player", () => {
      shareLegend(copy, sheetOf([{ running: [0.1] }, { running: [0.9] }], ["Oleg", "Anya"]));

      expect(printed()).toContain("Oleg");
      expect(printed()).toContain("Anya");
    });

    it("should put the leader at the top, by share rather than by column order", () => {
      shareLegend(copy, sheetOf([{ running: [0.1] }, { running: [0.9] }], ["Oleg", "Anya"]));

      expect(Number(attributesOfText("Anya").x)).toBeLessThan(Number(attributesOfText("Oleg").x));
    });

    it("should keep a player's legend colour matched to their original column, not their rank", () => {
      shareLegend(copy, sheetOf([{ running: [0.1] }, { running: [0.9] }], ["Oleg", "Anya"]));

      expect(attributesOfText("Oleg").fill).toBe("colour-0");
      expect(attributesOfText("Anya").fill).toBe("colour-1");
    });

    it("should start the first block at the plot's own left edge", () => {
      shareLegend(copy, sheetOf([{ running: [0.1] }], ["Oleg"]));

      expect(Number(attributesOfText("Oleg").x)).toBe(PLOT_LEFT);
    });

    it("should sit the legend below the plot, not within it", () => {
      shareLegend(copy, sheetOf([{ running: [0.1] }], ["Oleg"]));

      expect(Number(attributesOfText("Oleg").y)).toBeGreaterThan(CHART_TOP + CHART_HEIGHT);
    });

    it("should set the percentage's own baseline LEGEND_DROP below the plot's own bottom edge", () => {
      const LEGEND_DROP = 180;
      const SHARE = 0.1;
      shareLegend(copy, sheetOf([{ running: [SHARE], share: SHARE }], ["Oleg"]));

      expect(Number(attributesOfText("pct(0.1)").y)).toBe(CHART_TOP + CHART_HEIGHT + LEGEND_DROP);
    });

    it("should head the legend, because the grid is in seating order and this is not", () => {
      shareLegend(copy, sheetOf([{ running: [0.1] }], ["Oleg"]));
      const label = attributesOfText(copy.sheetLegendLabel);

      expect(printed()).toContain(copy.sheetLegendLabel);
      expect(label.x).toBe(PLOT_LEFT);
      expect(label["font-size"]).toBe(LABEL_FONT);
    });

    it("should put that heading above the entries it heads", () => {
      shareLegend(copy, sheetOf([{ running: [0.1] }], ["Oleg"]));

      expect(Number(attributesOfText(copy.sheetLegendLabel).y)).toBeLessThan(
        Number(attributesOfText("Oleg").y)
      );
    });

    it("should rule each entry in its own player's colour", () => {
      shareLegend(copy, sheetOf([{ running: [0.9] }, { running: [0.1] }], ["Oleg", "Anya"]));
      const rules = lineSpy.mock.calls.map((call) => call[0] as Record<string, unknown>);

      expect(rules.map((rule) => rule.stroke)).toEqual(["colour-0", "colour-1"]);
    });

    it("should start each rule over its own entry and keep it above the percentage", () => {
      const SHARE = 0.1;
      shareLegend(copy, sheetOf([{ running: [SHARE], share: SHARE }], ["Oleg"]));
      const rule = lineSpy.mock.calls[NONE]?.[NONE] as Record<string, number>;

      expect(rule.x1).toBe(Number(attributesOfText("pct(0.1)").x));
      expect(rule.y1).toBeGreaterThan(CHART_TOP + CHART_HEIGHT);
      expect(rule.y2).toBe(rule.y1);
      expect(rule.y1).toBeLessThan(Number(attributesOfText("pct(0.1)").y));
      expect(Number(rule.x2) - Number(rule.x1)).toBe(SAMPLE_WIDTH);
    });

    it("should fit each name inside its own slot, with the gutter taken off", () => {
      shareLegend(copy, sheetOf([{ running: [0.9] }, { running: [0.1] }], ["Oleg", "Anya"]));
      const width = Number(nameToFitSpy.mock.calls[NONE]?.[ONE]);

      expect(width).toBeLessThan(LEGEND_SLOT_MAX);
    });

    it("should cap the slot at a fixed maximum when there is room to spare", () => {
      shareLegend(copy, sheetOf([{ running: [0.9] }, { running: [0.1] }], ["Oleg", "Anya"]));
      const first = Number(attributesOfText("Oleg").x);
      const second = Number(attributesOfText("Anya").x);

      expect(second - first).toBe(LEGEND_SLOT_MAX);
    });

    it("should shrink the slot only once there are too many players to fit it at the maximum", () => {
      const MANY_PLAYERS = 8;
      const names = Array.from({ length: MANY_PLAYERS }, (_unused, index) => `P${index}`);
      shareLegend(copy, 
        sheetOf(
          Array.from({ length: MANY_PLAYERS }, (_unused, index) => ({
            running: [1 - index / MANY_PLAYERS],
          })),
          names
        )
      );
      const first = Number(attributesOfText("P0").x);
      const second = Number(attributesOfText("P1").x);
      const expectedSlot = PLOT_WIDTH / MANY_PLAYERS;

      expect(second - first).toBeCloseTo(expectedSlot);
      expect(second - first).toBeLessThan(LEGEND_SLOT_MAX);
    });

    it("should print each player's game tally", () => {
      const GAMES = 4;
      shareLegend(copy, sheetOf([{ running: [0.5], games: GAMES }], ["Oleg"]));

      expect(gameTallySpy).toHaveBeenCalledWith(copy, GAMES);
      expect(printed()).toContain("tally(4)");
    });

    it("should print each player's share as a percentage", () => {
      const SHARE = 0.5;
      shareLegend(copy, sheetOf([{ running: [SHARE], share: SHARE }], ["Oleg"]));

      expect(percentLabelSpy).toHaveBeenCalledWith(SHARE);
      expect(printed()).toContain("pct(0.5)");
    });

    it("should set the name and the share in bold", () => {
      const SHARE = 0.42;
      shareLegend(copy, sheetOf([{ running: [SHARE], share: SHARE }], ["Oleg"]));

      expect(attributesOfText("Oleg")["font-weight"]).toBe("bold");
      expect(attributesOfText("pct(0.42)")["font-weight"]).toBe("bold");
    });

    it("should stack the percentage above the name above the tally, in that order", () => {
      const SHARE = 0.42;
      const GAMES = 4;
      shareLegend(copy, sheetOf([{ running: [SHARE], share: SHARE, games: GAMES }], ["Oleg"]));

      const percentY = Number(attributesOfText("pct(0.42)").y);
      const nameY = Number(attributesOfText("Oleg").y);
      const tallyY = Number(attributesOfText("tally(4)").y);

      expect(percentY).toBeLessThan(nameY);
      expect(nameY).toBeLessThan(tallyY);
    });

    it("should share the same left edge across the three lines of a block", () => {
      const SHARE = 0.42;
      const GAMES = 4;
      shareLegend(copy, sheetOf([{ running: [SHARE], share: SHARE, games: GAMES }], ["Oleg"]));

      expect(attributesOfText("pct(0.42)").x).toBe(attributesOfText("Oleg").x);
      expect(attributesOfText("Oleg").x).toBe(attributesOfText("tally(4)").x);
    });

    it("should print the tally in the ink kept for the numbers around the picture", () => {
      const GAMES = 4;
      shareLegend(copy, sheetOf([{ running: [0.5], games: GAMES }], ["Oleg"]));

      expect(attributesOfText("tally(4)").fill).toBe("figure");
    });

    it("should size the block's type from the slot width it was given", () => {
      shareLegend(copy, sheetOf([{ running: [0.5] }], ["Oleg"]));

      expect(legendFontOfSpy).toHaveBeenCalledWith(LEGEND_SLOT_MAX);
    });

    it("should never let the tally grow larger than the name above it", () => {
      const NARROW_BLOCK_SIZE = 19;
      legendFontOfSpy.mockReturnValue(NARROW_BLOCK_SIZE);
      shareLegend(copy, sheetOf([{ running: [0.5], games: 4 }], ["Oleg"]));

      const nameSize = Number(attributesOfText("Oleg")["font-size"]);
      const tallySize = Number(attributesOfText("tally(4)")["font-size"]);

      expect(tallySize).toBeLessThanOrEqual(nameSize);
    });

    it("should not grow the tally past the design's legend-tally size for the common case", () => {
      legendFontOfSpy.mockReturnValue(LEGEND_FONT);
      shareLegend(copy, sheetOf([{ running: [0.5], games: 4 }], ["Oleg"]));

      expect(Number(attributesOfText("tally(4)")["font-size"])).toBe(TALLY_FONT);
    });
  });

  describe("the note about rounds sat out", () => {
    const HALF = 0.5;

    it("should say nothing when nobody sat out any round", () => {
      shareLegend(copy, 
        sheetOf(
          [
            { running: [ONE, HALF], cells: [PLACED_CELL, PLACED_CELL] },
            { running: [HALF, ONE], cells: [PLACED_CELL, PLACED_CELL] },
          ],
          ["Oleg", "Anya"]
        )
      );

      expect(printed()).not.toContain(copy.sheetKeyAbsent);
    });

    it("should add nothing to the drawing beyond the legend entries when nobody sat out", () => {
      const THE_HEADING = 1;
      const PARTS_PER_PLAYER = 4;
      const TWO_PLAYERS = 2;

      const result = shareLegend(copy, 
        sheetOf(
          [
            { running: [ONE, HALF], cells: [PLACED_CELL, PLACED_CELL] },
            { running: [HALF, ONE], cells: [PLACED_CELL, PLACED_CELL] },
          ],
          ["Oleg", "Anya"]
        )
      );

      expect(result).toHaveLength(THE_HEADING + PARTS_PER_PLAYER * TWO_PLAYERS);
    });

    it("should appear when anybody sat out any round, not only a departure at the end", () => {
      shareLegend(copy, 
        sheetOf(
          [
            { running: [ONE, HALF, HALF], cells: [PLACED_CELL, ABSENT_CELL, PLACED_CELL] },
            { running: [HALF, ONE, ONE], cells: [PLACED_CELL, PLACED_CELL, PLACED_CELL] },
          ],
          ["Oleg", "Anya"]
        )
      );

      expect(printed()).toContain(copy.sheetKeyAbsent);
    });

    it("should draw a sample line dashed the same way as a skipped round", () => {
      const SKIP_DASH = "14 10";
      shareLegend(copy, 
        sheetOf([{ running: [ONE, HALF], cells: [PLACED_CELL, ABSENT_CELL] }], ["Oleg"])
      );
      const sample = lineSpy.mock.calls
        .map((call) => call[0] as Record<string, unknown>)
        .find((attributes) => attributes["stroke-dasharray"] === SKIP_DASH);

      expect(sample).toBeDefined();
    });

    it("should run the sample SAMPLE_WIDTH, the same length as a legend rule", () => {
      shareLegend(copy,
        sheetOf([{ running: [ONE, HALF], cells: [PLACED_CELL, ABSENT_CELL] }], ["Oleg"])
      );
      const sample = lineSpy.mock.calls
        .map((call) => call[0] as Record<string, unknown>)
        .find((attributes) => (attributes["stroke-dasharray"] as string | undefined) !== undefined);

      expect(Number(sample?.x2) - Number(sample?.x1)).toBe(SAMPLE_WIDTH);
    });

    it("should park the note at the far end of the heading's own line", () => {
      shareLegend(copy,
        sheetOf([{ running: [ONE, HALF], cells: [PLACED_CELL, ABSENT_CELL] }], ["Oleg"])
      );
      const note = Number(attributesOfText(copy.sheetKeyAbsent).x);

      expect(note).toBeGreaterThan(Number(attributesOfText(copy.sheetLegendLabel).x));
      expect(note).toBeLessThan(PLOT_LEFT + PLOT_WIDTH);
    });

    it("should lift the sample SAMPLE_LIFT above its label's baseline", () => {
      shareLegend(copy, 
        sheetOf([{ running: [ONE, HALF], cells: [PLACED_CELL, ABSENT_CELL] }], ["Oleg"])
      );
      const sample = lineSpy.mock.calls
        .map((call) => call[0] as Record<string, unknown>)
        .find((attributes) => (attributes["stroke-dasharray"] as string | undefined) !== undefined);
      const labelY = Number(attributesOfText(copy.sheetKeyAbsent).y);

      expect(Number(sample?.y1)).toBe(labelY - SAMPLE_LIFT);
      expect(Number(sample?.y2)).toBe(labelY - SAMPLE_LIFT);
    });

    it("should share the heading's baseline rather than claim a row of its own", () => {
      shareLegend(copy,
        sheetOf([{ running: [ONE, HALF], cells: [PLACED_CELL, ABSENT_CELL] }], ["Oleg"])
      );

      expect(attributesOfText(copy.sheetKeyAbsent).y).toBe(
        attributesOfText(copy.sheetLegendLabel).y
      );
    });

    it("should set the label SAMPLE_GAP past the sample's right end", () => {
      shareLegend(copy, 
        sheetOf([{ running: [ONE, HALF], cells: [PLACED_CELL, ABSENT_CELL] }], ["Oleg"])
      );
      const sample = lineSpy.mock.calls
        .map((call) => call[0] as Record<string, unknown>)
        .find((attributes) => (attributes["stroke-dasharray"] as string | undefined) !== undefined);
      const labelX = Number(attributesOfText(copy.sheetKeyAbsent).x);

      expect(labelX).toBe(Number(sample?.x2) + SAMPLE_GAP);
    });

    it("should sit above the first row of the legend, where the heading is", () => {
      shareLegend(copy, 
        sheetOf(
          [
            { running: [ONE, HALF], cells: [PLACED_CELL, ABSENT_CELL] },
            { running: [HALF, ONE], cells: [PLACED_CELL, PLACED_CELL] },
          ],
          ["Oleg", "Anya"]
        )
      );
      const tallyRows = textSpy.mock.calls
        .filter((call) => String(call[0]).startsWith("tally("))
        .map((call) => Number((call[1] as Record<string, unknown>).y));

      expect(Number(attributesOfText(copy.sheetKeyAbsent).y)).toBeLessThan(
        Math.min(...tallyRows)
      );
    });
  });
});
