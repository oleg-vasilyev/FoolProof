import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Density, Placed } from "#scoresheet/render/awards/awards-layout.ts";


const awardTitleSpy = vi.fn();

const awardWinnerSpy = vi.fn();

const awardReasonSpy = vi.fn();

const baselineOfSpy = vi.fn();

const rankLabelSpy = vi.fn();

const rectSpy = vi.fn();

const textSpy = vi.fn();

const lineSpy = vi.fn();

const FONT_FAMILY = "Test Sans";

const GRID_RIGHT = 1560;

const PAD = 60;

const RANK_FONT = 26;

const RANK_LEFT = 108;

const TEXT_LEFT = 200;

const TICK_WIDTH = 8;

const ROW_TITLE_TRACKING = 2.2;

const WINNER_TRACKING = 0.8;

vi.mock("#scoresheet/render/awards/award-lines.ts", () => ({
  awardTitle: (table: unknown, award: unknown) => awardTitleSpy(table, award),
  awardWinner: (table: unknown, names: unknown) => awardWinnerSpy(table, names),
  awardReason: (table: unknown, award: unknown) => awardReasonSpy(table, award),
}));

vi.mock("#scoresheet/render/awards/awards-layout.ts", () => ({
  RANK_FONT,
  RANK_LEFT,
  ROW_TITLE_TRACKING,
  TEXT_LEFT,
  TICK_WIDTH,
  WINNER_TRACKING,
  baselineOf: (boxTop: number, font: number) => baselineOfSpy(boxTop, font),
}));

vi.mock("#scoresheet/render/awards/rank-label.ts", () => ({
  rankLabel: (rank: number) => rankLabelSpy(rank),
}));

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY,
  GRID_RIGHT,
  PAD,
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { ink: "ink", inkMuted: "muted", inkFaint: "faint", ruling: "ruling" },
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
  line: (attributes: Record<string, unknown>) => lineSpy(attributes),
}));

const { awardRow } = await import("#scoresheet/render/awards/award-row.ts");

const AWARD = { name: AwardName.Untouchable, winners: [1], games: 6 } as unknown as Award;

const TITLE_MARK = "TITLE_MARK";

const WINNER_MARK = "WINNER_MARK";

const REASON_MARK = "REASON_MARK";

const RANK_MARK = "03";

const BASELINE_MARK = 12345;

const COLOUR = "row-colour";

const TOP = 500;

const HEIGHT = 216;

const RANK = 2;

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
} as unknown as Density;

const PLACED: Placed = {
  award: AWARD,
  names: ["Oleg"],
  colour: COLOUR,
  rank: RANK,
  top: TOP,
  height: HEIGHT,
};

const CONTENT_TOP = TOP + DENSITY.rowPad;

const WINNER_TOP = CONTENT_TOP + DENSITY.titleLine + DENSITY.titleGap;

const REASON_TOP = WINNER_TOP + DENSITY.winnerLine + DENSITY.winnerGap;

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("awardRow()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    awardTitleSpy.mockReturnValue(TITLE_MARK);
    awardWinnerSpy.mockReturnValue(WINNER_MARK);
    awardReasonSpy.mockReturnValue(REASON_MARK);
    rankLabelSpy.mockReturnValue(RANK_MARK);
    baselineOfSpy.mockReturnValue(BASELINE_MARK);
    rectSpy.mockImplementation(() => "<rect/>");
    textSpy.mockImplementation(() => "<text/>");
    lineSpy.mockImplementation(() => "<line/>");
  });

  it("should draw the tick in the row's own colour, spanning its full height", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(rectSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        x: PAD,
        y: TOP,
        width: TICK_WIDTH,
        height: HEIGHT,
        fill: COLOUR,
      })
    );
  });

  it("should ask award-lines for the title, the winner and the reason of this award", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(awardTitleSpy).toHaveBeenCalledWith(copy, PLACED.award);
    expect(awardWinnerSpy).toHaveBeenCalledWith(copy, PLACED.names);
    expect(awardReasonSpy).toHaveBeenCalledWith(copy, PLACED.award);
  });

  it("should print exactly what award-lines gave it, not a re-derived string", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(textSpy).toHaveBeenCalledWith(TITLE_MARK, expect.anything());
    expect(textSpy).toHaveBeenCalledWith(WINNER_MARK, expect.anything());
    expect(textSpy).toHaveBeenCalledWith(REASON_MARK, expect.anything());
  });

  it("should number the row with the label rank-label gave it", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(rankLabelSpy).toHaveBeenCalledWith(RANK);
    expect(textSpy).toHaveBeenCalledWith(RANK_MARK, expect.anything());
  });

  it("should fill the winner text in the row's own colour", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(attributesOf(WINNER_MARK).fill).toBe(COLOUR);
  });

  it("should set the rank in its own gutter and the three lines in the text column", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(attributesOf(RANK_MARK).x).toBe(RANK_LEFT);
    expect(attributesOf(TITLE_MARK).x).toBe(TEXT_LEFT);
    expect(attributesOf(WINNER_MARK).x).toBe(TEXT_LEFT);
    expect(attributesOf(REASON_MARK).x).toBe(TEXT_LEFT);
  });

  it("should set the title against the row's top plus its own padding", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(baselineOfSpy).toHaveBeenCalledWith(CONTENT_TOP, DENSITY.titleFont);
  });

  it("should drop the winner by the title's line and the gap under it", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(baselineOfSpy).toHaveBeenCalledWith(WINNER_TOP, DENSITY.winnerFont);
  });

  it("should drop the reason by the winner's line and the gap under it", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(baselineOfSpy).toHaveBeenCalledWith(REASON_TOP, DENSITY.reasonFont);
  });

  it("should lift the rank to sit level with the title it numbers", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(attributesOf(RANK_MARK).y).toBe(CONTENT_TOP + DENSITY.rankLift);
  });

  it("should set the title and the winner in bold, and the reason not", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(attributesOf(TITLE_MARK)["font-weight"]).toBe("bold");
    expect(attributesOf(WINNER_MARK)["font-weight"]).toBe("bold");
    expect(attributesOf(REASON_MARK)["font-weight"]).toBeUndefined();
  });

  it("should size each line from the density it was given", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(attributesOf(TITLE_MARK)["font-size"]).toBe(DENSITY.titleFont);
    expect(attributesOf(WINNER_MARK)["font-size"]).toBe(DENSITY.winnerFont);
    expect(attributesOf(REASON_MARK)["font-size"]).toBe(DENSITY.reasonFont);
    expect(attributesOf(RANK_MARK)["font-size"]).toBe(RANK_FONT);
  });

  it("should track the title wider than the winner, as the card's own scale says", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(attributesOf(TITLE_MARK)["letter-spacing"]).toBe(ROW_TITLE_TRACKING);
    expect(attributesOf(WINNER_MARK)["letter-spacing"]).toBe(WINNER_TRACKING);
  });

  it("should close the row with a rule at its own bottom edge", () => {
    awardRow(copy, PLACED, DENSITY);

    expect(lineSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        x1: PAD,
        x2: GRID_RIGHT,
        y1: TOP + HEIGHT,
        y2: TOP + HEIGHT,
      })
    );
  });
});
