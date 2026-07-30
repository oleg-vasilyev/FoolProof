import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sheet } from "./layout.ts";


const CHART_HEIGHT = 600;

const CHART_TOP = 1000;

const GRID_LEFT = 100;

const GRID_RIGHT = 1500;

const LEGEND_WIDTH = 300;

const PLOT_RIGHT = GRID_RIGHT - LEGEND_WIDTH;

const AXIS_LIFT = 7;

const lineSpy = vi.fn();

const pathSpy = vi.fn();

const polylineSpy = vi.fn();

const textSpy = vi.fn();

const colourForSpy = vi.fn();

vi.mock("./layout.ts", () => ({
  CHART_HEIGHT,
  FONT_FAMILY: "Test Sans",
  GRID_LEFT,
  GRID_RIGHT,
  LEGEND_WIDTH,
  fontSize: { axis: 22, legend: 30 },
}));

vi.mock("./palette.ts", () => ({
  palette: { ink: "ink", inkFaint: "faint", ruling: "ruling" },
  colourFor: (column: number) => colourForSpy(column),
}));

vi.mock("./svg.ts", () => ({
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  path: (attributes: Record<string, unknown>) => pathSpy(attributes),
  polyline: (points: readonly (readonly [number, number])[]) => polylineSpy(points),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { scoreChart } = await import("./scorechart.ts");

const NONE = 0;

const ONE = 1;

const sheetOf = (running: readonly (readonly number[])[], names?: readonly string[]): Sheet =>
  ({
    startedOn: "2026-07-24",
    players: running.map((own, index) => ({
      playerId: index,
      displayName: names?.[index] ?? `P${index}`,
      cells: [],
      running: own,
      total: own.at(-ONE) ?? NONE,
    })),
    rounds: running[0]?.length ?? NONE,
    omitted: NONE,
    rowHeight: NONE,
    columnWidth: NONE,
    gridHeight: NONE,
    chartTop: CHART_TOP,
    height: NONE,
  }) as Sheet;

const printed = (): readonly string[] => textSpy.mock.calls.map((call) => String(call[0]));

const pointsOf = (call: number): readonly (readonly [number, number])[] =>
  (polylineSpy.mock.calls[call]?.[0] ?? []) as readonly (readonly [number, number])[];

const rulingRows = (): readonly number[] =>
  lineSpy.mock.calls.map((call) => Number((call[0] as { y1: number }).y1));

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("scoreChart()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    lineSpy.mockImplementation(() => "<line/>");
    pathSpy.mockImplementation(() => "<path/>");
    polylineSpy.mockImplementation(() => "M0 0");
    textSpy.mockImplementation(() => "<text/>");
    colourForSpy.mockImplementation((column: number) => `colour-${String(column)}`);
  });

  describe("the lines", () => {
    it("should draw one line per player", () => {
      scoreChart(sheetOf([[ONE], [ONE]]));

      expect(pathSpy).toHaveBeenCalledTimes(2);
    });

    it("should start every line from zero, before any game was played", () => {
      scoreChart(sheetOf([[3, 5]]));

      expect(pointsOf(NONE)[0]?.[1]).toBe(CHART_TOP + CHART_HEIGHT);
    });

    it("should plot one point per game on top of that", () => {
      const running = [ONE, 2, 3];
      scoreChart(sheetOf([running]));

      expect(pointsOf(NONE)).toHaveLength(running.length + ONE);
    });

    it("should start at the left edge of the plot", () => {
      scoreChart(sheetOf([[ONE, 2]]));

      expect(pointsOf(NONE)[0]?.[0]).toBe(GRID_LEFT);
    });

    it("should reach the right edge of the plot on the last game", () => {
      scoreChart(sheetOf([[ONE, 2]]));

      expect(pointsOf(NONE).at(-ONE)?.[0]).toBe(PLOT_RIGHT);
    });

    it("should stop short of the legend", () => {
      scoreChart(sheetOf([[ONE]]));

      expect(pointsOf(NONE).at(-ONE)?.[0]).toBeLessThan(GRID_RIGHT);
    });

    it("should draw a higher score higher up the image", () => {
      scoreChart(sheetOf([[ONE, 10]]));
      const points = pointsOf(NONE);

      expect(points.at(-ONE)?.[1]).toBeLessThan(points[1]?.[1] ?? NONE);
    });

    it("should give each line the colour of its column", () => {
      scoreChart(sheetOf([[ONE], [ONE]]));

      expect(colourForSpy.mock.calls.map((call) => call[0])).toContain(ONE);
    });

    it("should leave the line unfilled, so it stays a line", () => {
      scoreChart(sheetOf([[ONE]]));

      expect((pathSpy.mock.calls[0]?.[0] as { fill: string }).fill).toBe("none");
    });

    it("should round the corners where a line changes slope", () => {
      scoreChart(sheetOf([[ONE, 5]]));
      const attributes = pathSpy.mock.calls[0]?.[0] as Record<string, unknown>;

      expect(attributes["stroke-linejoin"]).toBe("round");
    });
  });

  describe("the score axis", () => {
    it("should rule the plot at round numbers", () => {
      scoreChart(sheetOf([[24]]));

      expect(printed()).toContain("25");
    });

    it("should leave headroom above the leader rather than clipping the line", () => {
      const LEADER = 24;
      scoreChart(sheetOf([[LEADER]]));
      const top = Math.min(...pointsOf(NONE).map(([, y]) => y));

      expect(top).toBeGreaterThan(CHART_TOP);
    });

    it("should always start the axis at zero", () => {
      scoreChart(sheetOf([[7]]));

      expect(printed()).toContain("0");
    });

    it("should put zero on the chart's bottom edge", () => {
      scoreChart(sheetOf([[7]]));

      expect(Number(attributesOfText("0").y)).toBeGreaterThan(CHART_TOP + CHART_HEIGHT - ONE);
    });

    it("should widen the step rather than draw a rule per point", () => {
      const BIG = 200;
      scoreChart(sheetOf([[BIG]]));
      const TOLERABLE_RULES = 10;

      expect(rulingRows().length).toBeLessThanOrEqual(TOLERABLE_RULES);
    });

    it("should keep the rules inside the plot", () => {
      scoreChart(sheetOf([[30]]));

      expect(Math.min(...rulingRows())).toBeGreaterThanOrEqual(CHART_TOP);
    });

    it("should scale the plot to the ceiling, so the top rule sits on the top edge", () => {
      const LEADER = 25;
      scoreChart(sheetOf([[LEADER]]));

      expect(Number(attributesOfText("25").y)).toBeCloseTo(CHART_TOP + AXIS_LIFT);
    });

    it("should still use eight rules or fewer at the boundary of a step", () => {
      const EXACTLY_EIGHT_FIVES = 40;
      scoreChart(sheetOf([[EXACTLY_EIGHT_FIVES]]));
      const AT_MOST = 9;

      expect(rulingRows().length).toBeLessThanOrEqual(AT_MOST);
      expect(printed()).toContain("40");
    });

    it("should put the score labels left of the plot", () => {
      scoreChart(sheetOf([[7]]));

      expect(Number(attributesOfText("0").x)).toBeLessThan(GRID_LEFT);
    });

    it("should right-align the score labels against the axis", () => {
      scoreChart(sheetOf([[7]]));

      expect(attributesOfText("0")["text-anchor"]).toBe("end");
    });

    it("should survive a session where nobody has scored", () => {
      expect(() => scoreChart(sheetOf([[NONE]]))).not.toThrow();
    });

    it("should still rule sparsely for a score beyond any sane evening", () => {
      const ABSURD = 5000;
      scoreChart(sheetOf([[ABSURD]]));
      const TOLERABLE_RULES = 30;

      expect(rulingRows().length).toBeLessThanOrEqual(TOLERABLE_RULES);
    });
  });

  describe("the game axis", () => {
    it("should number the games along the bottom", () => {
      scoreChart(sheetOf([[ONE, 2, 3, 4, 5, 6]]));

      expect(printed()).toContain("6");
    });

    it("should label sparsely rather than once per game", () => {
      const MANY = 30;
      const running = Array.from({ length: MANY }, (_unused, index) => index);
      scoreChart(sheetOf([running]));
      const labels = printed().filter((value) => Number(value) > NONE);

      expect(labels.length).toBeLessThan(MANY);
    });

    it("should put the game labels below the plot", () => {
      scoreChart(sheetOf([[ONE, 2]]));

      expect(Number(attributesOfText("2").y)).toBeGreaterThan(CHART_TOP + CHART_HEIGHT);
    });

    it("should centre a game label on its own point", () => {
      scoreChart(sheetOf([[ONE, 2]]));

      expect(attributesOfText("2")["text-anchor"]).toBe("middle");
      expect(Number(attributesOfText("2").x)).toBeCloseTo(PLOT_RIGHT);
    });
  });

  describe("the legend", () => {
    it("should name every player", () => {
      scoreChart(sheetOf([[ONE], [2]], ["Oleg", "Anya"]));

      expect(printed()).toContain("Oleg");
      expect(printed()).toContain("Anya");
    });

    it("should put the leader at the top", () => {
      scoreChart(sheetOf([[ONE], [9]], ["Oleg", "Anya"]));

      expect(Number(attributesOfText("Anya").y)).toBeLessThan(
        Number(attributesOfText("Oleg").y)
      );
    });

    it("should keep a player's legend colour matched to their line", () => {
      scoreChart(sheetOf([[ONE], [9]], ["Oleg", "Anya"]));

      expect(attributesOfText("Oleg").fill).toBe("colour-0");
    });

    it("should print each total flush against the right edge", () => {
      scoreChart(sheetOf([[42]], ["Oleg"]));

      expect(attributesOfText("42").x).toBe(GRID_RIGHT);
      expect(attributesOfText("42")["text-anchor"]).toBe("end");
    });

    it("should place the legend clear of the plot", () => {
      scoreChart(sheetOf([[ONE]], ["Oleg"]));

      expect(Number(attributesOfText("Oleg").x)).toBeGreaterThan(PLOT_RIGHT);
    });

    it("should start the legend inside the chart, not above it", () => {
      scoreChart(sheetOf([[ONE]], ["Oleg"]));

      expect(Number(attributesOfText("Oleg").y)).toBeGreaterThan(CHART_TOP);
    });

    it("should space the rows evenly down the legend", () => {
      scoreChart(sheetOf([[9], [5], [ONE]], ["Oleg", "Anya", "Roma"]));
      const first = Number(attributesOfText("Oleg").y);
      const second = Number(attributesOfText("Anya").y);
      const third = Number(attributesOfText("Roma").y);

      expect(third - second).toBe(second - first);
    });

    it("should set both the name and the total in bold", () => {
      scoreChart(sheetOf([[42]], ["Oleg"]));

      expect(attributesOfText("Oleg")["font-weight"]).toBe("bold");
      expect(attributesOfText("42")["font-weight"]).toBe("bold");
    });
  });
});
