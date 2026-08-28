import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";
import { FONT_FAMILY, GRID_RIGHT } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  MARK_RADIUS,
  POINT_RADIUS,
  MARK_STROKE,
  CHART_TOP_DROP,
  PLOT_AXIS_DROP,
  PLOT_HEIGHT,
  PLOT_LEFT,
  PLOT_LINE_WIDTH,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import {
  ENOUGH_TO_JUDGE_A_NIGHT,
  type EveningShare,
} from "#scoresheet/domain/career/career-evenings.ts";
import type { EveningPlot } from "#scoresheet/render/personal/evening-chart.ts";


const circleSpy = vi.fn();

const lineSpy = vi.fn();

const pathSpy = vi.fn();

const polylineSpy = vi.fn();

const textSpy = vi.fn();

const percentLabelSpy = vi.fn();

const gameTallySpy = vi.fn();

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

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  gameTally: (table: unknown, games: number) => gameTallySpy(table, games),
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

const A_SHORT_NIGHT = 1;

const LEAN = 16;

const A_TALLY = "the-games";

const NO_FOOLS = 0;

const ALL_DECIDED = A_NIGHT;

const NO_FIRSTS = 0;

const PLOT_TOP = 1000;

const CHART_LABEL = 940;

const INK = "player-ink";

const CURVE_MARK = "the-curve";

const FIRST_EVENING = 0;

const BEST_AT = 2;

const WORST_AT = 5;

const UNPLAYED_SERIES = 99;

const shareAt = (index: number): number => (index + ONCE) / (NIGHTS + ONCE);

const eveningOf = (seriesNo: number): EveningShare => ({
  seriesNo,
  playedOn: "2026-07-24",
  games: A_NIGHT,
  decided: ALL_DECIDED,
  fools: NO_FOOLS,
  firsts: NO_FIRSTS,
  share: shareAt(seriesNo),
});

const shortEveningOf = (seriesNo: number): EveningShare => ({
  ...eveningOf(seriesNo),
  games: A_SHORT_NIGHT,
});

const nightsOf = (count: number): readonly EveningShare[] =>
  Array.from({ length: count }, (_unused, index) => eveningOf(index));

const chartOf = (overrides: Partial<EveningPlot> = {}): EveningPlot => ({
  nights: nightsOf(NIGHTS),
  top: PLOT_TOP,
  label: CHART_LABEL,
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

const circlesOf = (radius: number): readonly Record<string, unknown>[] =>
  circleSpy.mock.calls
    .map((call) => call[0] as Record<string, unknown>)
    .filter((attributes) => attributes.r === radius);

const marks = (): readonly Record<string, unknown>[] => circlesOf(MARK_RADIUS);

const dots = (): readonly Record<string, unknown>[] => circlesOf(POINT_RADIUS);

const curveAttributes = (): Record<string, unknown> =>
  (pathSpy.mock.calls[0]?.[0] ?? {}) as Record<string, unknown>;

const A_CAREER_OF_YEARS = 111;

const NARROWEST_GAP = 56;

const LAST = -1;

describe("eveningChart()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    percentLabelSpy.mockImplementation((share: number) => pct(share));
    polylineSpy.mockReturnValue(CURVE_MARK);
    circleSpy.mockImplementation(() => "<circle/>");
    gameTallySpy.mockReturnValue(A_TALLY);
    lineSpy.mockImplementation(() => "<line/>");
    pathSpy.mockImplementation(() => "<path/>");
    textSpy.mockImplementation((value: string) => `<text:${value}>`);
  });

  describe("the grid behind the curve", () => {
    it("should rule exactly five lines across the plot", () => {
      eveningChart(copy, chartOf());

      expect(lineSpy).toHaveBeenCalledTimes(GRIDLINES);
    });

    it("should rule from the plot's own left edge to the card's right edge", () => {
      eveningChart(copy, chartOf());

      expect(gridlineAt(MIDDLE).x1).toBe(PLOT_LEFT);
      expect(gridlineAt(MIDDLE).x2).toBe(GRID_RIGHT);
    });

    it("should put the floor line at the bottom and the ceiling at the top", () => {
      eveningChart(copy, chartOf());

      expect(gridlineAt(FLOOR).y1).toBe(BOTTOM);
      expect(gridlineAt(CEILING).y1).toBe(PLOT_TOP);
    });

    it("should keep every gridline flat", () => {
      eveningChart(copy, chartOf());

      for (const share of [FLOOR, QUARTER, MIDDLE, THREE_QUARTERS, CEILING]) {
        expect(gridlineAt(share).y2).toBe(gridlineAt(share).y1);
      }
    });

    it("should dash the mid-table line so it reads as the reference", () => {
      eveningChart(copy, chartOf());

      expect(gridlineAt(MIDDLE)["stroke-dasharray"]).toBeTruthy();
    });

    it("should leave every other line solid", () => {
      eveningChart(copy, chartOf());

      for (const share of [FLOOR, QUARTER, THREE_QUARTERS, CEILING]) {
        expect(gridlineAt(share)["stroke-dasharray"]).toBeUndefined();
      }
    });

    it("should stroke the mid-table line differently from its neighbours", () => {
      eveningChart(copy, chartOf());

      expect(gridlineAt(MIDDLE).stroke).toBe(palette.ruling);
      expect(gridlineAt(QUARTER).stroke).toBe(palette.cellAbsentEdge);
      expect(gridlineAt(MIDDLE).stroke).not.toBe(gridlineAt(QUARTER).stroke);
    });

    it("should number every gridline through the percent label", () => {
      eveningChart(copy, chartOf());

      for (const share of [FLOOR, QUARTER, MIDDLE, THREE_QUARTERS, CEILING]) {
        expect(percentLabelSpy).toHaveBeenCalledWith(share);
        expect(textSpy).toHaveBeenCalledWith(pct(share), expect.anything());
      }
    });

    it("should hang the share numbers outside the plot, ending at its edge", () => {
      eveningChart(copy, chartOf());

      expect(attributesOf(pct(MIDDLE)).x as number).toBeLessThan(PLOT_LEFT);
      expect(attributesOf(pct(MIDDLE))["text-anchor"]).toBe("end");
    });

    it("should sit a share number just under its own line, not above it", () => {
      eveningChart(copy, chartOf());

      expect(attributesOf(pct(MIDDLE)).y as number).toBeGreaterThan(
        gridlineAt(MIDDLE).y1 as number
      );
    });

    it("should set the share numbers in the card's own axis type", () => {
      eveningChart(copy, chartOf());

      expect(attributesOf(pct(MIDDLE))["font-size"]).toBe(personalFont.axis);
      expect(attributesOf(pct(MIDDLE))["font-family"]).toBe(FONT_FAMILY);
      expect(attributesOf(pct(MIDDLE)).fill).toBe(palette.inkFaint);
    });
  });

  describe("the curve through the evenings", () => {
    it("should plot one point per night", () => {
      eveningChart(copy, chartOf());

      expect(points()).toHaveLength(NIGHTS);
    });

    it("should start at the plot's left edge and end at the card's right edge", () => {
      eveningChart(copy, chartOf());

      expect(points()[0]?.[0]).toBe(PLOT_LEFT);
      expect(points().at(-ONCE)?.[0]).toBe(GRID_RIGHT);
    });

    it("should space the nights evenly across the plot", () => {
      eveningChart(copy, chartOf());
      const step = (points()[1]?.[0] ?? NEVER) - (points()[0]?.[0] ?? NEVER);

      expect((points()[BEST_AT]?.[0] ?? NEVER) - (points()[1]?.[0] ?? NEVER)).toBe(step);
    });

    it("should lift a better evening higher up the plot", () => {
      eveningChart(copy, chartOf());

      expect(points()[0]?.[1] as number).toBeGreaterThan(points().at(-ONCE)?.[1] as number);
    });

    it("should put a night's own share where its gridline would be", () => {
      const night = eveningOf(NEVER);

      eveningChart(copy, chartOf({ nights: [night, eveningOf(ONCE)] }));

      expect(points()[0]?.[1]).toBe(BOTTOM - night.share * PLOT_HEIGHT);
    });

    it("should draw the curve as the polyline it just built", () => {
      eveningChart(copy, chartOf());

      expect(curveAttributes().d).toBe(CURVE_MARK);
      expect(polylineSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should stroke the curve in the player's own colour and never fill it", () => {
      eveningChart(copy, chartOf());

      expect(curveAttributes().stroke).toBe(INK);
      expect(curveAttributes().fill).toBe("none");
      expect(curveAttributes()["stroke-width"]).toBe(PLOT_LINE_WIDTH);
    });

    it("should place a single evening at the plot's left edge without dividing by nothing", () => {
      eveningChart(copy, chartOf({ nights: [eveningOf(NEVER)] }));

      expect(points()).toHaveLength(ONCE);
      expect(points()[0]?.[0]).toBe(PLOT_LEFT);
      expect(Number.isFinite(points()[0]?.[0])).toBe(true);
      expect(Number.isFinite(points()[0]?.[1])).toBe(true);
    });
  });

  describe("a point for every evening", () => {
    it("should draw one point per evening, so the hint that says so is true", () => {
      eveningChart(copy, chartOf());

      expect(dots()).toHaveLength(NIGHTS);
    });

    it("should sit each point exactly on the curve's own vertex", () => {
      eveningChart(copy, chartOf());

      expect(dots().map((dot) => [dot.cx, dot.cy])).toEqual(
        points().map((point) => [point[0], point[1]])
      );
    });

    it("should draw the points in the player's own ink", () => {
      eveningChart(copy, chartOf());

      expect(dots().every((dot) => dot.fill === INK)).toBe(true);
    });

    it("should keep a point smaller than the marks that single an evening out", () => {
      expect(POINT_RADIUS).toBeLessThan(MARK_RADIUS);
    });
  });

  describe("marking the best and the worst evening", () => {
    it("should fill a mark on the best evening's own point", () => {
      eveningChart(copy, chartOf({ best: eveningOf(BEST_AT) }));

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
      eveningChart(copy, chartOf({ worst: eveningOf(WORST_AT) }));

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

      eveningChart(copy, chartOf({ best: eveningOf(BEST_AT), worst: eveningOf(WORST_AT) }));

      expect(marks()).toHaveLength(TWO_MARKS);
    });

    it("should draw no filled mark when the card names no best evening", () => {
      eveningChart(copy, chartOf({ best: null, worst: eveningOf(WORST_AT) }));

      expect(marks()).toHaveLength(ONCE);
      expect(marks()).not.toContainEqual(expect.objectContaining({ fill: INK }));
    });

    it("should draw no ring when the card names no worst evening", () => {
      eveningChart(copy, chartOf({ best: eveningOf(BEST_AT), worst: null }));

      expect(marks()).toHaveLength(ONCE);
      expect(marks()).not.toContainEqual(
        expect.objectContaining({ stroke: palette.cellFool })
      );
    });

    it("should draw no mark at all when the card names neither", () => {
      eveningChart(copy, chartOf());

      expect(marks()).toHaveLength(NEVER);
    });

    it("should mark nothing for an evening that is not among the nights plotted", () => {
      eveningChart(copy, chartOf({ best: eveningOf(UNPLAYED_SERIES) }));

      expect(marks()).toHaveLength(NEVER);
    });
  });

  describe("saying what the two marks mean", () => {
    it("should lean the best evening's name towards whichever neighbour stands lower", () => {
      eveningChart(copy, chartOf({ best: eveningOf(BEST_AT) }));

      expect(attributesOf(copy.personalBestEvening).x).toBe((points()[BEST_AT]?.[0] ?? NEVER) - LEAN);
      expect(attributesOf(copy.personalBestEvening)["text-anchor"]).toBe("end");
    });

    it("should lean the worst evening's name the other way, so a falling curve misses it", () => {
      eveningChart(copy, chartOf({ worst: eveningOf(WORST_AT) }));

      expect(attributesOf(copy.personalWorstEvening).x).toBe(
        (points()[WORST_AT]?.[0] ?? NEVER) + LEAN
      );
      expect(attributesOf(copy.personalWorstEvening)["text-anchor"]).toBe("start");
    });

    it("should lift the best evening's name above its mark, where nothing can be drawn", () => {
      eveningChart(copy, chartOf({ best: eveningOf(BEST_AT) }));

      expect(attributesOf(copy.personalBestEvening).y as number).toBeLessThan(
        points()[BEST_AT]?.[1] ?? NEVER
      );
    });

    it("should drop the worst evening's name below its mark, off the curve", () => {
      eveningChart(copy, chartOf({ worst: eveningOf(WORST_AT) }));

      expect(attributesOf(copy.personalWorstEvening).y as number).toBeGreaterThan(
        points()[WORST_AT]?.[1] ?? NEVER
      );
    });

    it("should keep the worst evening's name inside the plot when its mark sits on the floor", () => {
      const onTheFloor = { ...eveningOf(WORST_AT), share: FLOOR };

      const nights = nightsOf(NIGHTS).map((night) =>
        night.seriesNo === WORST_AT ? onTheFloor : night
      );

      eveningChart(copy, chartOf({ nights, worst: onTheFloor }));

      expect(attributesOf(copy.personalWorstEvening).y as number).toBeLessThan(BOTTOM);
    });

    it("should say nothing about a mark it did not draw", () => {
      eveningChart(copy, chartOf());

      expect(textSpy).not.toHaveBeenCalledWith(copy.personalBestEvening, expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith(copy.personalWorstEvening, expect.anything());
    });

    it("should lean a name at neither edge, where there is no neighbour to lean from", () => {
      const LAST = NIGHTS - ONCE;

      eveningChart(copy, chartOf({ best: eveningOf(FIRST_EVENING), worst: eveningOf(LAST) }));

      expect(attributesOf(copy.personalBestEvening).x).toBe(points()[FIRST_EVENING]?.[0]);
      expect(attributesOf(copy.personalWorstEvening).x).toBe(points()[LAST]?.[0]);
    });

    it("should hold a name inside the plot when its mark sits at either edge", () => {
      const LAST = NIGHTS - ONCE;

      eveningChart(copy, chartOf({ best: eveningOf(FIRST_EVENING), worst: eveningOf(LAST) }));

      expect(attributesOf(copy.personalBestEvening)["text-anchor"]).toBe("start");
      expect(attributesOf(copy.personalWorstEvening)["text-anchor"]).toBe("end");
    });

    it("should keep the best evening's name clear of the label above the plot", () => {
      const atTheCeiling = { ...eveningOf(BEST_AT), share: CEILING };

      const nights = nightsOf(NIGHTS).map((night) =>
        night.seriesNo === BEST_AT ? atTheCeiling : night
      );

      eveningChart(copy, chartOf({ nights, best: atTheCeiling }));

      expect(attributesOf(copy.personalBestEvening).y as number).toBeGreaterThan(
        PLOT_TOP - CHART_TOP_DROP
      );
    });
  });

  describe("numbering the evenings along the bottom", () => {
    it("should number every fourth evening, counting from one", () => {
      eveningChart(copy, chartOf());

      expect(textSpy).toHaveBeenCalledWith(String(AXIS_EVERY), expect.anything());
      expect(textSpy).toHaveBeenCalledWith(String(NIGHTS), expect.anything());
    });

    it("should leave the evenings in between unnumbered", () => {
      eveningChart(copy, chartOf());

      for (const skipped of [ONCE, BEST_AT, AXIS_EVERY + ONCE]) {
        expect(textSpy).not.toHaveBeenCalledWith(String(skipped), expect.anything());
      }
    });

    it("should still number the last evening on a chart shorter than the interval", () => {
      eveningChart(copy, chartOf({ nights: nightsOf(AXIS_EVERY - ONCE) }));

      expect(textSpy).toHaveBeenCalledWith(String(AXIS_EVERY - ONCE), expect.anything());
    });

    it("should leave the evenings before it unnumbered on such a chart", () => {
      eveningChart(copy, chartOf({ nights: nightsOf(AXIS_EVERY - ONCE) }));

      expect(textSpy).not.toHaveBeenCalledWith(String(AXIS_EVERY - TWO_BACK), expect.anything());
    });

    it("should widen the interval when the evenings crowd their own numbers", () => {
      eveningChart(copy, chartOf({ nights: nightsOf(A_CAREER_OF_YEARS) }));

      const numbered = textSpy.mock.calls
        .filter(([value]) => /^\d+$/.test(String(value)))
        .map(([value]) => Number(value))
        .sort((first, second) => first - second);

      const gaps = numbered
        .slice(ONCE)
        .map((evening, index) => evening - (numbered[index] ?? evening));

      for (const gap of gaps) {
        expect(gap).toBeGreaterThan(AXIS_EVERY);
      }

      expect(numbered.at(LAST)).toBe(A_CAREER_OF_YEARS);
    });

    it("should never set two numbers closer together than one of them is wide", () => {
      eveningChart(copy, chartOf({ nights: nightsOf(A_CAREER_OF_YEARS) }));

      const drawn = textSpy.mock.calls
        .filter(([value]) => /^\d+$/.test(String(value)))
        .map(([, attributes]) => (attributes as Record<string, unknown>).x as number)
        .sort((first, second) => first - second);

      for (const [index, x] of drawn.entries()) {
        const before = drawn[index - ONCE];

        if (before !== undefined) {
          expect(x - before, `numbers ${String(before)} and ${String(x)}`).toBeGreaterThanOrEqual(
            NARROWEST_GAP
          );
        }
      }
    });

    it("should hang a number under the plot on its own evening's column", () => {
      eveningChart(copy, chartOf());
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

    const A_MARK_AND_ITS_LABEL = 2;

    it("should hand back the grid, the curve, the marks and the numbers, in that order", () => {
      const drawn = eveningChart(
        copy,
        chartOf({ best: eveningOf(BEST_AT), worst: eveningOf(WORST_AT) })
      );

      expect(drawn.indexOf("<path/>")).toBe(GRID_ELEMENTS);
      expect(drawn.indexOf("<circle/>")).toBeGreaterThan(drawn.indexOf("<path/>"));
      expect(drawn.at(-ONCE)).toBe(`<text:${String(NIGHTS)}>`);
    });

    it("should hand back the grid, the curve and the numbers when it marked nothing", () => {
      expect(eveningChart(copy, chartOf())).toHaveLength(
        GRID_ELEMENTS + ONCE + NIGHTS + AXIS_NUMBERS
      );
    });

    it("should add a circle and a name for each mark it did draw", () => {
      const drawn = eveningChart(copy, chartOf({ best: eveningOf(BEST_AT), worst: eveningOf(WORST_AT) }));

      expect(drawn).toHaveLength(
        GRID_ELEMENTS + ONCE + NIGHTS + TWO_MARKS * A_MARK_AND_ITS_LABEL + AXIS_NUMBERS
      );
    });

    it("should add one number and no more when only the last evening earns one", () => {
      const SHORT = AXIS_EVERY - ONCE;

      const drawn = eveningChart(copy, chartOf({ nights: nightsOf(SHORT) }));

      expect(drawn).toHaveLength(GRID_ELEMENTS + ONCE + SHORT + ONCE);
    });
  });
  describe("an evening too short to be judged", () => {
    const SHORT_AT = 4;

    const withAShortNight = (): readonly EveningShare[] =>
      nightsOf(NIGHTS).map((night, index) => (index === SHORT_AT ? shortEveningOf(index) : night));

    const hint = (): string => copy.personalShortNight(A_TALLY);

    it("should draw its dot faint, so the eye can see why a title passed it over", () => {
      eveningChart(copy, chartOf({ nights: withAShortNight() }));

      expect(dots()[SHORT_AT]?.fill).toBe(palette.inkFaint);
    });

    it("should leave every night long enough to judge in the player's own ink", () => {
      eveningChart(copy, chartOf({ nights: withAShortNight() }));

      expect(dots().filter((dot) => dot.fill === INK)).toHaveLength(NIGHTS - ONCE);
    });

    it("should keep it the same size as the rest, since only the ink says anything", () => {
      eveningChart(copy, chartOf({ nights: withAShortNight() }));

      expect(dots()).toHaveLength(NIGHTS);
    });

    it("should say what a faint dot means, on the section label's own line", () => {
      eveningChart(copy, chartOf({ nights: withAShortNight() }));

      expect(attributesOf(hint())).toMatchObject({
        x: GRID_RIGHT,
        y: CHART_LABEL,
        "text-anchor": "end",
      });
    });

    it("should ask for the threshold as a finished tally rather than printing the number", () => {
      eveningChart(copy, chartOf({ nights: withAShortNight() }));

      expect(gameTallySpy).toHaveBeenCalledWith(copy, ENOUGH_TO_JUDGE_A_NIGHT);
    });

    it("should say nothing at all when every night was long enough", () => {
      eveningChart(copy, chartOf());

      expect(attributesOf(hint())).toEqual({});
      expect(dots().filter((dot) => dot.fill === palette.inkFaint)).toHaveLength(NEVER);
    });
  });
});
