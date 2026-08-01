import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cell } from "#scoresheet/domain/scoring.ts";
import type { Sheet } from "#scoresheet/render/sheet-layout.ts";


const CHART_HEIGHT = 600;

const CHART_TOP = 1000;

const GRID_LEFT = 100;

const GRID_RIGHT = 1500;

const PLOT_INSET = 24;

const PLOT_LEFT = GRID_LEFT;

const PLOT_RIGHT = GRID_RIGHT - PLOT_INSET;

const NEUTRAL_MOCK = 0.5;

const SKIP_DASH = "14 10";

const NO_DASH = "none";

const AXIS_GAP = 18;

const AXIS_LIFT = 7;

const lineSpy = vi.fn();

const pathSpy = vi.fn();

const polylineSpy = vi.fn();

const textSpy = vi.fn();

const colourForSpy = vi.fn();

const percentLabelSpy = vi.fn();

vi.mock("#scoresheet/domain/scoring.ts", () => ({
  NEUTRAL: NEUTRAL_MOCK,
}));

vi.mock("#scoresheet/render/sheet-layout.ts", () => ({
  CHART_HEIGHT,
  FONT_FAMILY: "Test Sans",
  PLOT_LEFT,
  PLOT_RIGHT,
  PLOT_WIDTH: PLOT_RIGHT - PLOT_LEFT,
  chartBottomOf: (sheet: { chartTop: number }) => sheet.chartTop + CHART_HEIGHT,
  fontSize: { axis: 22 },
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { ink: "ink", inkFaint: "faint", ruling: "ruling" },
  colourFor: (column: number) => colourForSpy(column),
}));

vi.mock("#scoresheet/render/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  path: (attributes: Record<string, unknown>) => pathSpy(attributes),
  polyline: (points: readonly (readonly [number, number])[]) => polylineSpy(points),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { shareChart } = await import("#scoresheet/render/share-chart.ts");

const NONE = 0;

const ONE = 1;

const PLACED_CELL: Cell = { kind: "placed", position: ONE };

const ABSENT_CELL: Cell = { kind: "absent" };

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
      share: player.share ?? player.running.at(-ONE) ?? NEUTRAL_MOCK,
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

const pointsOf = (call: number): readonly (readonly [number, number])[] =>
  (polylineSpy.mock.calls[call]?.[0] ?? []) as readonly (readonly [number, number])[];

const dashOf = (call: number): unknown =>
  (pathSpy.mock.calls[call]?.[0] as Record<string, unknown> | undefined)?.["stroke-dasharray"];

const linesFor = (stroke: string): readonly Record<string, unknown>[] =>
  lineSpy.mock.calls
    .map((call) => call[0] as Record<string, unknown>)
    .filter((attributes) => attributes.stroke === stroke);

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("shareChart()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    lineSpy.mockImplementation(() => "<line/>");
    pathSpy.mockImplementation(() => "<path/>");
    polylineSpy.mockImplementation(() => "M0 0");
    textSpy.mockImplementation(() => "<text/>");
    colourForSpy.mockImplementation((column: number) => `colour-${String(column)}`);
    percentLabelSpy.mockImplementation((share: number) => `pct(${String(share)})`);
  });

  describe("the share axis", () => {
    it("should rule the plot at every quarter", () => {
      const TICKS_PLUS_ORIGIN = 5;
      shareChart(sheetOf([{ running: [ONE] }]));
      const axisCalls = percentLabelSpy.mock.calls
        .slice(0, TICKS_PLUS_ORIGIN)
        .map((call) => call[0]);

      expect(axisCalls).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });

    it("should print all five percent labels", () => {
      shareChart(sheetOf([{ running: [ONE] }]));

      expect(printed()).toEqual(
        expect.arrayContaining(["pct(0)", "pct(0.25)", "pct(0.5)", "pct(0.75)", "pct(1)"])
      );
    });

    it("should put the top rule on the top edge of the plot", () => {
      shareChart(sheetOf([{ running: [ONE] }]));
      const ruling = linesFor("ruling").map((attributes) => Number(attributes.y1));

      expect(Math.min(...ruling)).toBe(CHART_TOP);
    });

    it("should put the bottom rule on the bottom edge of the plot", () => {
      shareChart(sheetOf([{ running: [ONE] }]));
      const ruling = linesFor("ruling").map((attributes) => Number(attributes.y1));

      expect(Math.max(...ruling)).toBe(CHART_TOP + CHART_HEIGHT);
    });

    it("should anchor the axis labels left of the plot, right-aligned", () => {
      shareChart(sheetOf([{ running: [ONE] }]));
      const label = attributesOfText("pct(0.5)");

      expect(label["text-anchor"]).toBe("end");
      expect(Number(label.x)).toBe(PLOT_LEFT - AXIS_GAP);
    });

    it("should set each axis label's y to its rule plus the axis lift", () => {
      shareChart(sheetOf([{ running: [ONE] }]));
      const midRule = linesFor("ruling").find(
        (attributes) => Number(attributes.y1) === CHART_TOP + CHART_HEIGHT / 2
      );

      expect(Number(attributesOfText("pct(0.5)").y)).toBe(Number(midRule?.y1) + AXIS_LIFT);
    });

    it("should put the emphasised midline exactly halfway up the plot", () => {
      shareChart(sheetOf([{ running: [ONE] }]));
      const midline = linesFor("faint")[0];

      expect(Number(midline?.y1)).toBe(CHART_TOP + CHART_HEIGHT / 2);
    });

    it("should dash the midline, unlike an ordinary rule", () => {
      shareChart(sheetOf([{ running: [ONE] }]));
      const midline = linesFor("faint")[0];
      const rule = linesFor("ruling")[0];

      expect(midline?.["stroke-dasharray"]).toBeDefined();
      expect(rule?.["stroke-dasharray"]).toBeUndefined();
    });

    it("should give the midline a dash distinct from a skipped round, so the two cannot be confused", () => {
      shareChart(sheetOf([{ running: [ONE] }]));
      const midline = linesFor("faint")[0];

      expect(midline?.["stroke-dasharray"]).not.toBe(SKIP_DASH);
    });

    it("should dash the midline with the two-and-eight dotted pattern", () => {
      const MIDLINE_DOTS = "2 8";
      shareChart(sheetOf([{ running: [ONE] }]));
      const midline = linesFor("faint")[0];

      expect(midline?.["stroke-dasharray"]).toBe(MIDLINE_DOTS);
    });

    it("should not stretch the axis to whatever score was reached", () => {
      const DECIMAL = 0.13;
      shareChart(sheetOf([{ running: [DECIMAL] }]));
      const ruling = linesFor("ruling").map((attributes) => Number(attributes.y1));

      expect(ruling).toEqual([
        CHART_TOP + CHART_HEIGHT,
        CHART_TOP + CHART_HEIGHT * 0.75,
        CHART_TOP + CHART_HEIGHT * 0.5,
        CHART_TOP + CHART_HEIGHT * 0.25,
        CHART_TOP,
      ]);
    });
  });

  describe("the lines", () => {
    it("should draw one path per player", () => {
      shareChart(sheetOf([{ running: [ONE] }, { running: [ONE] }]));

      expect(pathSpy).toHaveBeenCalledTimes(2);
    });

    it("should start every line at NEUTRAL, before any game was played", () => {
      const HALF = 0.5;
      shareChart(sheetOf([{ running: [ONE, HALF] }]));

      expect(pointsOf(NONE)[0]?.[1]).toBe(CHART_TOP + CHART_HEIGHT / 2);
    });

    it("should start every line at NEUTRAL regardless of where the player ended up", () => {
      shareChart(sheetOf([{ running: [NONE, NONE] }, { running: [ONE, ONE] }]));

      expect(pointsOf(0)[0]).toEqual(pointsOf(1)[0]);
    });

    it("should plot one point per game on top of the origin", () => {
      const running = [ONE, 0.5, 0.75];
      shareChart(sheetOf([{ running }]));

      expect(pointsOf(NONE)).toHaveLength(running.length + ONE);
    });

    it("should start at the left edge of the plot", () => {
      shareChart(sheetOf([{ running: [ONE, 0.5] }]));

      expect(pointsOf(NONE)[0]?.[0]).toBe(PLOT_LEFT);
    });

    it("should reach the right edge of the plot on the last game", () => {
      shareChart(sheetOf([{ running: [ONE, 0.5] }]));

      expect(pointsOf(NONE).at(-ONE)?.[0]).toBe(PLOT_RIGHT);
    });

    it("should keep the plot inset from the grid's true right edge", () => {
      shareChart(sheetOf([{ running: [ONE] }]));

      expect(pointsOf(NONE).at(-ONE)?.[0]).toBeLessThan(GRID_RIGHT);
    });

    it("should draw a full share at the top of the plot and none at the bottom", () => {
      shareChart(sheetOf([{ running: [ONE, NONE] }]));
      const points = pointsOf(NONE);

      expect(points.at(-ONE)?.[1]).toBe(CHART_TOP + CHART_HEIGHT);
      expect(points[1]?.[1]).toBe(CHART_TOP);
    });

    it("should give each line the colour of its column", () => {
      shareChart(sheetOf([{ running: [ONE] }, { running: [ONE] }]));

      expect(colourForSpy.mock.calls.map((call) => call[0])).toContain(ONE);
    });

    it("should leave the line unfilled, so it stays a line", () => {
      shareChart(sheetOf([{ running: [ONE] }]));

      expect((pathSpy.mock.calls[0]?.[0] as { fill: string }).fill).toBe("none");
    });

    it("should round the corners where a line changes slope", () => {
      const HALF = 0.5;
      shareChart(sheetOf([{ running: [ONE, HALF] }]));
      const attributes = pathSpy.mock.calls[0]?.[0] as Record<string, unknown>;

      expect(attributes["stroke-linejoin"]).toBe("round");
    });
  });

  describe("the stretches of a line", () => {
    const HALF = 0.5;

    it("should draw exactly one solid path carrying the full point sequence for a player who played every round", () => {
      const running = [ONE, HALF, HALF];
      shareChart(sheetOf([{ running }]));

      expect(pathSpy).toHaveBeenCalledTimes(ONE);
      expect(dashOf(0)).toBe(NO_DASH);
      expect(pointsOf(0)).toHaveLength(running.length + ONE);
    });

    it("should split into solid, dashed, solid around a round missed in the middle", () => {
      const THREE = 3;
      shareChart(
        sheetOf([{ running: [ONE, HALF, HALF], cells: [PLACED_CELL, ABSENT_CELL, PLACED_CELL] }])
      );

      expect(pathSpy).toHaveBeenCalledTimes(THREE);
      expect([dashOf(0), dashOf(1), dashOf(2)]).toEqual([NO_DASH, SKIP_DASH, NO_DASH]);
    });

    it("should join neighbouring stretches on the same point, leaving no gap", () => {
      shareChart(
        sheetOf([{ running: [ONE, HALF, HALF], cells: [PLACED_CELL, ABSENT_CELL, PLACED_CELL] }])
      );

      expect(pointsOf(0).at(-ONE)).toEqual(pointsOf(1)[0]);
      expect(pointsOf(1).at(-ONE)).toEqual(pointsOf(2)[0]);
    });

    it("should draw a solid stretch followed by a dashed tail for a player who stopped early", () => {
      const TWO = 2;
      shareChart(
        sheetOf([{ running: [ONE, HALF, HALF], cells: [PLACED_CELL, ABSENT_CELL, ABSENT_CELL] }])
      );

      expect(pathSpy).toHaveBeenCalledTimes(TWO);
      expect([dashOf(0), dashOf(1)]).toEqual([NO_DASH, SKIP_DASH]);
    });

    it("should keep both stretches in the player's own colour", () => {
      shareChart(
        sheetOf([{ running: [ONE, HALF, HALF], cells: [PLACED_CELL, ABSENT_CELL, ABSENT_CELL] }])
      );
      const played = pathSpy.mock.calls[0]?.[0] as Record<string, unknown>;
      const tail = pathSpy.mock.calls[1]?.[0] as Record<string, unknown>;

      expect(played.stroke).toBe(tail.stroke);
    });

    it("should draw a single dashed line for a player who never played", () => {
      shareChart(
        sheetOf([
          {
            running: [NEUTRAL_MOCK, NEUTRAL_MOCK],
            cells: [ABSENT_CELL, ABSENT_CELL],
          },
        ])
      );
      const points = pointsOf(0);

      expect(pathSpy).toHaveBeenCalledTimes(ONE);
      expect(dashOf(0)).toBe(SKIP_DASH);
      expect(points.every((point) => point[1] === points[0]?.[1])).toBe(true);
    });
  });

  describe("the game axis", () => {
    it("should number the games along the bottom", () => {
      shareChart(sheetOf([{ running: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] }]));

      expect(printed()).toContain("6");
    });

    it("should label sparsely rather than once per game", () => {
      const MANY = 30;
      const running = Array.from({ length: MANY }, (_unused, index) => index / MANY);
      shareChart(sheetOf([{ running }]));
      const labels = printed().filter((value) => /^\d+$/.test(value));

      expect(labels.length).toBeLessThan(MANY);
    });

    it("should put the game labels below the plot", () => {
      shareChart(sheetOf([{ running: [0.1, 0.2] }]));

      expect(Number(attributesOfText("2").y)).toBeGreaterThan(CHART_TOP + CHART_HEIGHT);
    });

    it("should centre a game label on its own point", () => {
      shareChart(sheetOf([{ running: [0.1, 0.2] }]));

      expect(attributesOfText("2")["text-anchor"]).toBe("middle");
      expect(Number(attributesOfText("2").x)).toBeCloseTo(PLOT_RIGHT);
    });
  });
});
