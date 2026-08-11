import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { Cell } from "#scoresheet/domain/scoring.ts";
import type { Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";


const CHART_TOP = 1000;

const CHART_BOTTOM = 1600;

const GRID_LEFT = 100;

const GRID_RIGHT = 1500;

const PLOT_INSET = 24;

const PLOT_LEFT = GRID_LEFT;

const PLOT_RIGHT = GRID_RIGHT - PLOT_INSET;

const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

const LEGEND_SLOT_MAX = 284;

const LEGEND_GUTTER = 26;

const LEGEND_ROW_PITCH = 150;

const LEGEND_LABEL_DROP = 90;

const LEGEND_RULE_DROP = 130;

const LEGEND_SHARE_DROP = 170;

const LEGEND_NAME_DROP = 210;

const LEGEND_TALLY_DROP = 250;

const SAMPLE_WIDTH = 46;

const SAMPLE_GAP = 14;

const SAMPLE_LIFT = 7;

const LEGEND_FONT = 33;

const TALLY_FONT = 17;

const LABEL_FONT = 19;

const lineSpy = vi.fn();

const textSpy = vi.fn();

const colourForSpy = vi.fn();

const percentLabelSpy = vi.fn();

const gameTallySpy = vi.fn();

const legendColumnsOfSpy = vi.fn();

const legendSlotOfSpy = vi.fn();

const nameToFitSpy = vi.fn();

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY: "Test Sans",
  fontSize: { legend: LEGEND_FONT, legendLabel: LABEL_FONT, legendTally: TALLY_FONT },
}));

vi.mock("#scoresheet/render/chronology/chronology-layout.ts", () => ({
  LEGEND_GUTTER,
  LEGEND_LABEL_DROP,
  LEGEND_NAME_DROP,
  LEGEND_ROW_PITCH,
  LEGEND_RULE_DROP,
  LEGEND_SHARE_DROP,
  LEGEND_TALLY_DROP,
  PLOT_LEFT,
  PLOT_WIDTH,
  chartBottomOf: () => CHART_BOTTOM,
  legendColumnsOf: (players: number) => legendColumnsOfSpy(players),
  legendSlotOf: (players: number) => legendSlotOfSpy(players),
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

const A_FULL_ROW = 5;

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

    nameToFitSpy.mockImplementation((name: string) => name);

    lineSpy.mockImplementation(() => "<line/>");
    textSpy.mockImplementation(() => "<text/>");
    colourForSpy.mockImplementation((column: number) => `colour-${String(column)}`);
    percentLabelSpy.mockImplementation((share: number) => `pct(${String(share)})`);
    gameTallySpy.mockImplementation((_table: unknown, games: number) => `tally(${String(games)})`);
    legendColumnsOfSpy.mockReturnValue(A_FULL_ROW);
    legendSlotOfSpy.mockReturnValue(LEGEND_SLOT_MAX);
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

      expect(Number(attributesOfText("Oleg").y)).toBeGreaterThan(CHART_BOTTOM);
    });

    it("should set the percentage on its own baseline below the plot, from the layout drop", () => {
      const SHARE = 0.1;
      shareLegend(copy, sheetOf([{ running: [SHARE], share: SHARE }], ["Oleg"]));

      expect(Number(attributesOfText("pct(0.1)").y)).toBe(CHART_BOTTOM + LEGEND_SHARE_DROP);
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
      expect(rule.y1).toBeGreaterThan(CHART_BOTTOM);
      expect(rule.y2).toBe(rule.y1);
      expect(rule.y1).toBeLessThan(Number(attributesOfText("pct(0.1)").y));
      expect(Number(rule.x2) - Number(rule.x1)).toBe(SAMPLE_WIDTH);
    });

    it("should fit each name to its own slot, less the gutter, at the size it will be set in", () => {
      shareLegend(copy, sheetOf([{ running: [0.9] }, { running: [0.1] }], ["Oleg", "Anya"]));
      const [, width, size] = nameToFitSpy.mock.calls[NONE] ?? [];

      expect(width).toBe(LEGEND_SLOT_MAX - LEGEND_GUTTER);
      expect(size).toBe(LEGEND_FONT);
    });

    it("should ask the layout for the grid its own table size calls for", () => {
      shareLegend(copy, sheetOf([{ running: [0.9] }, { running: [0.1] }], ["Oleg", "Anya"]));
      const TWO_PLAYERS = 2;

      expect(legendSlotOfSpy).toHaveBeenCalledWith(TWO_PLAYERS);
      expect(legendColumnsOfSpy).toHaveBeenCalledWith(TWO_PLAYERS);
    });

    it("should step one slot per entry across a row", () => {
      shareLegend(copy, sheetOf([{ running: [0.9] }, { running: [0.1] }], ["Oleg", "Anya"]));
      const first = Number(attributesOfText("Oleg").x);
      const second = Number(attributesOfText("Anya").x);

      expect(second - first).toBe(LEGEND_SLOT_MAX);
    });

    it("should start a new row once the entries fill the one before it", () => {
      const PAIRS_PER_ROW = 2;
      legendColumnsOfSpy.mockReturnValue(PAIRS_PER_ROW);
      shareLegend(copy,
        sheetOf(
          [{ running: [0.9] }, { running: [0.7] }, { running: [0.5] }],
          ["Oleg", "Anya", "Roma"]
        )
      );

      expect(Number(attributesOfText("Roma").x)).toBe(Number(attributesOfText("Oleg").x));
      expect(Number(attributesOfText("Roma").y) - Number(attributesOfText("Oleg").y)).toBe(
        LEGEND_ROW_PITCH
      );
    });

    it("should drop a whole block down a row, not only the line the name sits on", () => {
      const PAIRS_PER_ROW = 2;
      const SHARE = 0.5;
      legendColumnsOfSpy.mockReturnValue(PAIRS_PER_ROW);
      shareLegend(copy,
        sheetOf(
          [
            { running: [0.9], share: 0.9, games: 1 },
            { running: [0.7], share: 0.7, games: 2 },
            { running: [SHARE], share: SHARE, games: 3 },
          ],
          ["Oleg", "Anya", "Roma"]
        )
      );
      const rules = lineSpy.mock.calls.map((call) => call[0] as Record<string, number>);

      expect(Number(attributesOfText("pct(0.5)").y) - Number(attributesOfText("pct(0.9)").y)).toBe(
        LEGEND_ROW_PITCH
      );
      expect(Number(attributesOfText("tally(3)").y) - Number(attributesOfText("tally(1)").y)).toBe(
        LEGEND_ROW_PITCH
      );
      expect(Number(rules[2]?.y1) - Number(rules[NONE]?.y1)).toBe(LEGEND_ROW_PITCH);
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

    it("should set every entry at the design's legend size, however crowded the table", () => {
      const CROWDED = 10;
      const names = Array.from({ length: CROWDED }, (_unused, index) => `P${index}`);
      shareLegend(copy,
        sheetOf(
          Array.from({ length: CROWDED }, (_unused, index) => ({
            running: [ONE - index / CROWDED],
          })),
          names
        )
      );

      for (const name of names) {
        expect(attributesOfText(name)["font-size"], name).toBe(LEGEND_FONT);
      }
    });

    it("should set the tally at the design's tally size, which is smaller than the name above it", () => {
      const GAMES = 4;
      shareLegend(copy, sheetOf([{ running: [0.5], games: GAMES }], ["Oleg"]));

      expect(Number(attributesOfText("tally(4)")["font-size"])).toBe(TALLY_FONT);
      expect(TALLY_FONT).toBeLessThan(LEGEND_FONT);
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
