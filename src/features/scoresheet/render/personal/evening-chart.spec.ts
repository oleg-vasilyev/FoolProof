import { beforeEach, describe, expect, it, vi } from "vitest";
import { FONT_FAMILY, GRID_RIGHT } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  MARK_RADIUS,
  MARK_STROKE,
  PLOT_AXIS_DROP,
  PLOT_HEIGHT,
  PLOT_LEFT,
  PLOT_LINE_WIDTH,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";
import type { EveningPlot } from "#scoresheet/render/personal/evening-chart.ts";


const circleSpy = vi.fn();

const lineSpy = vi.fn();

const pathSpy = vi.fn();

const polylineSpy = vi.fn();

const textSpy = vi.fn();

const percentLabelSpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  circle: (attributes: Record<string, unknown>) => circleSpy(attributes),
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
  path: (attributes: Record<string, unknown>) => pathSpy(attributes),
  polyline: (points: readonly (readonly [number, number])[]) => polylineSpy(points),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/percent-label.ts", () => ({
  percentLabel: (share: number) => percentLabelSpy(share),
}));

const { eveningChart } = await import("#scoresheet/render/personal/evening-chart.ts");

const NEVER = 0;

const ONCE = 1;

const TWO_BACK = 2;

const GRIDLINES = 5;

const FLOOR = 0;

const QUARTER = 0.25;

const MIDDLE = 0.5;

const THREE_QUARTERS = 0.75;

const CEILING = 1;

const AXIS_EVERY = 4;

const NIGHTS = 8;

const A_NIGHT = 3;

const NO_FOOLS = 0;

const PLOT_TOP = 1000;

const INK = "player-ink";

const CURVE_MARK = "the-curve";

const BEST_AT = 2;

const WORST_AT = 5;

const UNPLAYED_SERIES = 99;

const shareAt = (index: number): number => (index + ONCE) / (NIGHTS + ONCE);

const eveningOf = (seriesNo: number): EveningShare => ({
  seriesNo,
  playedOn: "2026-07-24",
  games: A_NIGHT,
  fools: NO_FOOLS,
  share: shareAt(seriesNo),
});

const nightsOf = (count: number): readonly EveningShare[] =>
  Array.from({ length: count }, (_unused, index) => eveningOf(index));

const chartOf = (overrides: Partial<EveningPlot> = {}): EveningPlot => ({
  nights: nightsOf(NIGHTS),
  top: PLOT_TOP,
  best: null,
  worst: null,
  ink: INK,
  ...overrides,
});

const BOTTOM = PLOT_TOP + PLOT_HEIGHT;

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

const pct = (share: number): string => `pct(${String(share)})`;

const gridlineAt = (share: number): Record<string, unknown> =>
  (lineSpy.mock.calls.map((call) => call[0] as Record<string, unknown>).find(
    (attributes) => attributes.y1 === BOTTOM - share * PLOT_HEIGHT
  ) ?? {}) as Record<string, unknown>;

const points = (): readonly (readonly [number, number])[] =>
  (polylineSpy.mock.calls[0]?.[0] ?? []) as readonly (readonly [number, number])[];

const curveAttributes = (): Record<string, unknown> =>
  (pathSpy.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;

describe("eveningChart()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    percentLabelSpy.mockImplementation((share: number) => pct(share));
    polylineSpy.mockReturnValue(CURVE_MARK);
    circleSpy.mockImplementation(() => "<circle/>");
    lineSpy.mockImplementation(() => "<line/>");
    pathSpy.mockImplementation(() => "<path/>");
    textSpy.mockImplementation((value: string) => `<text:${value}>`);
  });

  describe("the grid behind the curve", () => {
    it("should rule exactly five lines across the plot", () => {
      eveningChart(chartOf());

      expect(lineSpy).toHaveBeenCalledTimes(GRIDLINES);
    });

    it("should rule from the plot's own left edge to the card's right edge", () => {
      eveningChart(chartOf());

      expect(gridlineAt(MIDDLE).x1).toBe(PLOT_LEFT);
      expect(gridlineAt(MIDDLE).x2).toBe(GRID_RIGHT);
    });

    it("should put the floor line at the bottom and the ceiling at the top", () => {
      eveningChart(chartOf());

      expect(gridlineAt(FLOOR).y1).toBe(BOTTOM);
      expect(gridlineAt(CEILING).y1).toBe(PLOT_TOP);
    });

    it("should keep every gridline flat", () => {
      eveningChart(chartOf());

      for (const share of [FLOOR, QUARTER, MIDDLE, THREE_QUARTERS, CEILING]) {
        expect(gridlineAt(share).y2).toBe(gridlineAt(share).y1);
      }
    });

    it("should dash the mid-table line so it reads as the reference", () => {
      eveningChart(chartOf());

      expect(gridlineAt(MIDDLE)["stroke-dasharray"]).toBeTruthy();
    });

    it("should leave every other line solid", () => {
      eveningChart(chartOf());

      for (const share of [FLOOR, QUARTER, THREE_QUARTERS, CEILING]) {
        expect(gridlineAt(share)["stroke-dasharray"]).toBeUndefined();
      }
    });

    it("should stroke the mid-table line differently from its neighbours", () => {
      eveningChart(chartOf());

      expect(gridlineAt(MIDDLE).stroke).toBe(palette.ruling);
      expect(gridlineAt(QUARTER).stroke).toBe(palette.cellAbsentEdge);
      expect(gridlineAt(MIDDLE).stroke).not.toBe(gridlineAt(QUARTER).stroke);
    });

    it("should number every gridline through the percent label", () => {
      eveningChart(chartOf());

      for (const share of [FLOOR, QUARTER, MIDDLE, THREE_QUARTERS, CEILING]) {
        expect(percentLabelSpy).toHaveBeenCalledWith(share);
        expect(textSpy).toHaveBeenCalledWith(pct(share), expect.anything());
      }
    });

    it("should hang the share numbers outside the plot, ending at its edge", () => {
      eveningChart(chartOf());

      expect(attributesOf(pct(MIDDLE)).x as number).toBeLessThan(PLOT_LEFT);
      expect(attributesOf(pct(MIDDLE))["text-anchor"]).toBe("end");
    });

    it("should sit a share number just under its own line, not above it", () => {
      eveningChart(chartOf());

      expect(attributesOf(pct(MIDDLE)).y as number).toBeGreaterThan(
        gridlineAt(MIDDLE).y1 as number
      );
    });

    it("should set the share numbers in the card's own axis type", () => {
      eveningChart(chartOf());

      expect(attributesOf(pct(MIDDLE))["font-size"]).toBe(personalFont.axis);
      expect(attributesOf(pct(MIDDLE))["font-family"]).toBe(FONT_FAMILY);
      expect(attributesOf(pct(MIDDLE)).fill).toBe(palette.inkFaint);
    });
  });

  describe("the curve through the evenings", () => {
    it("should plot one point per night", () => {
      eveningChart(chartOf());

      expect(points()).toHaveLength(NIGHTS);
    });

    it("should start at the plot's left edge and end at the card's right edge", () => {
      eveningChart(chartOf());

      expect(points()[0]?.[0]).toBe(PLOT_LEFT);
      expect(points().at(-ONCE)?.[0]).toBe(GRID_RIGHT);
    });

    it("should space the nights evenly across the plot", () => {
      eveningChart(chartOf());
      const step = (points()[1]?.[0] ?? NEVER) - (points()[0]?.[0] ?? NEVER);

      expect((points()[BEST_AT]?.[0] ?? NEVER) - (points()[1]?.[0] ?? NEVER)).toBe(step);
    });

    it("should lift a better evening higher up the plot", () => {
      eveningChart(chartOf());

      expect(points()[0]?.[1] as number).toBeGreaterThan(points().at(-ONCE)?.[1] as number);
    });

    it("should put a night's own share where its gridline would be", () => {
      const night = eveningOf(NEVER);

      eveningChart(chartOf({ nights: [night, eveningOf(ONCE)] }));

      expect(points()[0]?.[1]).toBe(BOTTOM - night.share * PLOT_HEIGHT);
    });

    it("should draw the curve as the polyline it just built", () => {
      eveningChart(chartOf());

      expect(curveAttributes().d).toBe(CURVE_MARK);
      expect(polylineSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should stroke the curve in the player's own colour and never fill it", () => {
      eveningChart(chartOf());

      expect(curveAttributes().stroke).toBe(INK);
      expect(curveAttributes().fill).toBe("none");
      expect(curveAttributes()["stroke-width"]).toBe(PLOT_LINE_WIDTH);
    });

    it("should place a single evening at the plot's left edge without dividing by nothing", () => {
      eveningChart(chartOf({ nights: [eveningOf(NEVER)] }));

      expect(points()).toHaveLength(ONCE);
      expect(points()[0]?.[0]).toBe(PLOT_LEFT);
      expect(Number.isFinite(points()[0]?.[0])).toBe(true);
      expect(Number.isFinite(points()[0]?.[1])).toBe(true);
    });
  });

  describe("marking the best and the worst evening", () => {
    it("should fill a mark on the best evening's own point", () => {
      eveningChart(chartOf({ best: eveningOf(BEST_AT) }));

      expect(circleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          cx: points()[BEST_AT]?.[0],
          cy: points()[BEST_AT]?.[1],
          r: MARK_RADIUS,
          fill: INK,
        })
      );
    });

    it("should ring the worst evening in red rather than filling it", () => {
      eveningChart(chartOf({ worst: eveningOf(WORST_AT) }));

      expect(circleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          cx: points()[WORST_AT]?.[0],
          cy: points()[WORST_AT]?.[1],
          r: MARK_RADIUS,
          fill: "none",
          stroke: palette.cellFool,
          "stroke-width": MARK_STROKE,
        })
      );
    });

    it("should mark both evenings when the card names both", () => {
      const TWO_MARKS = 2;

      eveningChart(chartOf({ best: eveningOf(BEST_AT), worst: eveningOf(WORST_AT) }));

      expect(circleSpy).toHaveBeenCalledTimes(TWO_MARKS);
    });

    it("should draw no filled mark when the card names no best evening", () => {
      eveningChart(chartOf({ best: null, worst: eveningOf(WORST_AT) }));

      expect(circleSpy).toHaveBeenCalledTimes(ONCE);
      expect(circleSpy).not.toHaveBeenCalledWith(expect.objectContaining({ fill: INK }));
    });

    it("should draw no ring when the card names no worst evening", () => {
      eveningChart(chartOf({ best: eveningOf(BEST_AT), worst: null }));

      expect(circleSpy).toHaveBeenCalledTimes(ONCE);
      expect(circleSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ stroke: palette.cellFool })
      );
    });

    it("should draw no mark at all when the card names neither", () => {
      eveningChart(chartOf());

      expect(circleSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should mark nothing for an evening that is not among the nights plotted", () => {
      eveningChart(chartOf({ best: eveningOf(UNPLAYED_SERIES) }));

      expect(circleSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("numbering the evenings along the bottom", () => {
    it("should number every fourth evening, counting from one", () => {
      eveningChart(chartOf());

      expect(textSpy).toHaveBeenCalledWith(String(AXIS_EVERY), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(String(NIGHTS), expect.anything());
    });

    it("should leave the evenings in between unnumbered", () => {
      eveningChart(chartOf());

      for (const skipped of [ONCE, BEST_AT, AXIS_EVERY + ONCE]) {
        expect(textSpy).not.toHaveBeenCalledWith(String(skipped), expect.anything());
      }
    });

    it("should still number the last evening on a chart shorter than the interval", () => {
      eveningChart(chartOf({ nights: nightsOf(AXIS_EVERY - ONCE) }));

      expect(textSpy).toHaveBeenCalledWith(String(AXIS_EVERY - ONCE), expect.anything());
    });

    it("should leave the evenings before it unnumbered on such a chart", () => {
      eveningChart(chartOf({ nights: nightsOf(AXIS_EVERY - ONCE) }));

      expect(textSpy).not.toHaveBeenCalledWith(String(AXIS_EVERY - TWO_BACK), expect.anything());
    });

    it("should hang a number under the plot on its own evening's column", () => {
      eveningChart(chartOf());
      const fourth = attributesOf(String(AXIS_EVERY));

      expect(fourth.y).toBe(BOTTOM + PLOT_AXIS_DROP);
      expect(fourth.x).toBe(points()[AXIS_EVERY - ONCE]?.[0]);
      expect(fourth["text-anchor"]).toBe("middle");
    });
  });

  describe("what the chart hands back", () => {
    const GRID_ELEMENTS = 10;

    const AXIS_NUMBERS = 2;

    const TWO_MARKS = 2;

    it("should hand back the grid, the curve, the marks and the numbers, in that order", () => {
      const drawn = eveningChart(
        chartOf({ best: eveningOf(BEST_AT), worst: eveningOf(WORST_AT) })
      );

      expect(drawn.indexOf("<path/>")).toBe(GRID_ELEMENTS);
      expect(drawn.indexOf("<circle/>")).toBeGreaterThan(drawn.indexOf("<path/>"));
      expect(drawn.at(-ONCE)).toBe(`<text:${String(NIGHTS)}>`);
    });

    it("should hand back the grid, the curve and the numbers when it marked nothing", () => {
      expect(eveningChart(chartOf())).toHaveLength(GRID_ELEMENTS + ONCE + AXIS_NUMBERS);
    });

    it("should add exactly one element for each mark it did draw", () => {
      const drawn = eveningChart(chartOf({ best: eveningOf(BEST_AT), worst: eveningOf(WORST_AT) }));

      expect(drawn).toHaveLength(GRID_ELEMENTS + ONCE + TWO_MARKS + AXIS_NUMBERS);
    });

    it("should add one number and no more when only the last evening earns one", () => {
      const drawn = eveningChart(chartOf({ nights: nightsOf(AXIS_EVERY - ONCE) }));

      expect(drawn).toHaveLength(GRID_ELEMENTS + ONCE + ONCE);
    });
  });
});
