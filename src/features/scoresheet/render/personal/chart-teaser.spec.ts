import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";


const eveningsShortOfChartSpy = vi.fn();

const eveningsOwedTallySpy = vi.fn();

vi.mock("#scoresheet/domain/career/career-evenings.ts", () => ({
  eveningsShortOfChart: (nights: number) => eveningsShortOfChartSpy(nights),
}));

vi.mock("#scoresheet/render/tally-phrases.ts", () => ({
  eveningsOwedTally: (table: unknown, evenings: number) => eveningsOwedTallySpy(table, evenings),
}));

const { chartTeaser } = await import("#scoresheet/render/personal/chart-teaser.ts");

const ONCE = 1;

const NIGHTS = 3;

const SHORT_BY = 2;

const NOTHING_SHORT = 0;

const TALLY_MARK = "the-tally";

beforeEach(() => {
  vi.clearAllMocks();

  eveningsShortOfChartSpy.mockReturnValue(SHORT_BY);
  eveningsOwedTallySpy.mockReturnValue(TALLY_MARK);
});

describe("chartTeaser()", () => {
  it("should ask the domain how far the career still is from its chart", () => {
    chartTeaser(copy, NIGHTS);

    expect(eveningsShortOfChartSpy).toHaveBeenCalledTimes(ONCE);
    expect(eveningsShortOfChartSpy).toHaveBeenCalledWith(NIGHTS);
  });

  it("should count the remainder in words rather than print a bare number", () => {
    chartTeaser(copy, NIGHTS);

    expect(eveningsOwedTallySpy).toHaveBeenCalledTimes(ONCE);
    expect(eveningsOwedTallySpy).toHaveBeenCalledWith(copy, SHORT_BY);
  });

  it("should hint at the chart with the finished tally in it", () => {
    expect(chartTeaser(copy, NIGHTS)).toBe(copy.personalChartArrives(TALLY_MARK));
  });

  it("should say nothing the section label already says", () => {
    expect(chartTeaser(copy, NIGHTS)).not.toContain(copy.personalChartLabel);
  });

  it("should speak even for a career that earned its chart, leaving the deciding to the layout", () => {
    eveningsShortOfChartSpy.mockReturnValue(NOTHING_SHORT);

    expect(chartTeaser(copy, NIGHTS)).toBe(copy.personalChartArrives(TALLY_MARK));
    expect(eveningsShortOfChartSpy).toHaveBeenCalledTimes(ONCE);
  });
});
