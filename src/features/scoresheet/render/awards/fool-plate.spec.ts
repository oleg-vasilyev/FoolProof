import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Density, Placed } from "#scoresheet/render/awards/awards-layout.ts";


const awardTitleSpy = vi.fn();

const awardWinnerSpy = vi.fn();

const awardReasonSpy = vi.fn();

const baselineOfSpy = vi.fn();

const rankLabelSpy = vi.fn();

const plateBoxOfSpy = vi.fn();

const rectSpy = vi.fn();

const textSpy = vi.fn();

const pathSpy = vi.fn();

const FONT_FAMILY = "Test Sans";

const GRID_RIGHT = 1560;

const PAD = 60;

const CAP_GAP = 24;

const CAP_HEIGHT = 44;

const CAP_WIDTH = 52;

const CAP_DRAWN_AT_REAL = 26;

const RANK_FONT = 26;

const RANK_WIDTH = 52;

const PLATE_TEXT_LEFT = 136;

const PLATE_TITLE_LEFT = PLATE_TEXT_LEFT + CAP_WIDTH + CAP_GAP;

const PLATE_TITLE_TRACKING = 2.8;

const WINNER_TRACKING = 0.8;

vi.mock("#scoresheet/render/awards/award-lines.ts", () => ({
  awardTitle: (award: unknown) => awardTitleSpy(award),
  awardWinner: (names: unknown) => awardWinnerSpy(names),
  awardReason: (award: unknown) => awardReasonSpy(award),
}));

vi.mock("#scoresheet/render/awards/awards-layout.ts", () => ({
  CAP_HEIGHT,
  CAP_WIDTH,
  PLATE_TEXT_LEFT,
  PLATE_TITLE_LEFT,
  PLATE_TITLE_TRACKING,
  RANK_FONT,
  RANK_WIDTH,
  WINNER_TRACKING,
  baselineOf: (boxTop: number, font: number) => baselineOfSpy(boxTop, font),
  plateBoxOf: (density: unknown) => plateBoxOfSpy(density),
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
  palette: {
    ink: "ink-light",
    plateCap: "cap-colour",
    plateSoft: "soft",
    plateInk: "ink-dark",
    cellFool: "fool-red",
  },
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
  path: (attributes: Record<string, unknown>) => pathSpy(attributes),
}));

const { foolPlate } = await import("#scoresheet/render/awards/fool-plate.ts");

const AWARD = { name: AwardName.FoolOfTheNight, winners: [1], fools: 3, games: 9 } as unknown as Award;

const TITLE_MARK = "TITLE_MARK";

const WINNER_MARK = "WINNER_MARK";

const REASON_MARK = "REASON_MARK";

const RANK_MARK = "03";

const COLOUR = "row-colour";

const TOP = 2000;

const HEIGHT = 264;

const RANK = 8;

const BASELINE_MARK = 12345;

const BOX = { headTop: 36, winnerTop: 126, reasonTop: 184, height: 264 };

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
  plateFont: 74,
  plateWinnerFont: 50,
  plateGap: 16,
  plateTop: 36,
  plateBottom: 40,
  plateMargin: 40,
  plateRankLift: 96,
} as unknown as Density;

const PLACED: Placed = {
  award: AWARD,
  names: ["Oleg"],
  colour: COLOUR,
  rank: RANK,
  top: TOP,
  height: HEIGHT,
};

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("foolPlate()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    awardTitleSpy.mockReturnValue(TITLE_MARK);
    awardWinnerSpy.mockReturnValue(WINNER_MARK);
    awardReasonSpy.mockReturnValue(REASON_MARK);
    rankLabelSpy.mockReturnValue(RANK_MARK);
    baselineOfSpy.mockReturnValue(BASELINE_MARK);
    plateBoxOfSpy.mockReturnValue(BOX);
    rectSpy.mockImplementation(() => "<rect/>");
    textSpy.mockImplementation(() => "<text/>");
    pathSpy.mockImplementation(() => "<path/>");
  });

  it("should fill a rect spanning the whole plate", () => {
    foolPlate(PLACED, DENSITY);

    expect(rectSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        x: PAD,
        y: TOP,
        width: GRID_RIGHT - PAD,
        height: HEIGHT,
        fill: "fool-red",
      })
    );
  });

  it("should draw the jester cap through path(), scaled to CAP_WIDTH", () => {
    foolPlate(PLACED, DENSITY);

    const expectedScale = CAP_WIDTH / CAP_DRAWN_AT_REAL;

    expect(pathSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        fill: "cap-colour",
        transform: expect.stringContaining(`scale(${String(expectedScale)})`),
      })
    );
  });

  it("should print the title in the plate's dark ink", () => {
    foolPlate(PLACED, DENSITY);

    expect(attributesOf(TITLE_MARK).fill).toBe("ink-dark");
  });

  it("should print the winner in the plate's light ink, not the row's own colour", () => {
    foolPlate(PLACED, DENSITY);

    expect(attributesOf(WINNER_MARK).fill).toBe("ink-light");
    expect(attributesOf(WINNER_MARK).fill).not.toBe(COLOUR);
  });

  it("should print the reason in the plate's light ink", () => {
    foolPlate(PLACED, DENSITY);

    expect(attributesOf(REASON_MARK).fill).toBe("ink-light");
  });

  it("should centre the rank", () => {
    foolPlate(PLACED, DENSITY);

    expect(attributesOf(RANK_MARK)["text-anchor"]).toBe("middle");
  });

  it("should ask award-row for the rank label of this placement's own rank", () => {
    foolPlate(PLACED, DENSITY);

    expect(rankLabelSpy).toHaveBeenCalledWith(RANK);
  });

  it("should ask awards-layout for the plate box of this density", () => {
    foolPlate(PLACED, DENSITY);

    expect(plateBoxOfSpy).toHaveBeenCalledWith(DENSITY);
  });

  describe("where each line sits", () => {
    const capTransform = (): string =>
      String((pathSpy.mock.calls[0]?.[0] as Record<string, unknown>).transform);

    const capOrigin = (): readonly number[] =>
      (/translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(capTransform())?.slice(1) ?? []).map(Number);

    it("should set the title against the plate box's own head", () => {
      foolPlate(PLACED, DENSITY);

      expect(baselineOfSpy).toHaveBeenCalledWith(TOP + BOX.headTop, DENSITY.plateFont);
    });

    it("should set the winner against the plate box's own winner line", () => {
      foolPlate(PLACED, DENSITY);

      expect(baselineOfSpy).toHaveBeenCalledWith(TOP + BOX.winnerTop, DENSITY.plateWinnerFont);
    });

    it("should set the reason against the plate box's own reason line", () => {
      foolPlate(PLACED, DENSITY);

      expect(baselineOfSpy).toHaveBeenCalledWith(TOP + BOX.reasonTop, DENSITY.reasonFont);
    });

    it("should centre the rank across its own gutter", () => {
      const HALF = 2;
      foolPlate(PLACED, DENSITY);

      expect(attributesOf(RANK_MARK).x).toBe(PAD + RANK_WIDTH / HALF);
    });

    it("should drop the rank to the title it numbers", () => {
      foolPlate(PLACED, DENSITY);

      expect(attributesOf(RANK_MARK).y).toBe(TOP + DENSITY.plateRankLift);
    });

    it("should start the cap at the plate's own text edge", () => {
      foolPlate(PLACED, DENSITY);

      expect(capOrigin()[0]).toBe(PLATE_TEXT_LEFT);
    });

    it("should centre the cap against the title beside it", () => {
      const HALF = 2;
      foolPlate(PLACED, DENSITY);

      expect(capOrigin()[1]).toBe(TOP + BOX.headTop + (DENSITY.plateFont - CAP_HEIGHT) / HALF);
    });

    it("should set the title clear of the cap, at the plate's own title edge", () => {
      foolPlate(PLACED, DENSITY);

      expect(attributesOf(TITLE_MARK).x).toBe(PLATE_TITLE_LEFT);
    });

    it("should hang the winner and the reason off the same left edge as the cap", () => {
      foolPlate(PLACED, DENSITY);

      expect(attributesOf(WINNER_MARK).x).toBe(PLATE_TEXT_LEFT);
      expect(attributesOf(REASON_MARK).x).toBe(PLATE_TEXT_LEFT);
    });

    it("should track the plate's title wider than its winner", () => {
      foolPlate(PLACED, DENSITY);

      expect(attributesOf(TITLE_MARK)["letter-spacing"]).toBe(PLATE_TITLE_TRACKING);
      expect(attributesOf(WINNER_MARK)["letter-spacing"]).toBe(WINNER_TRACKING);
    });

    it("should give the cap an outline to draw", () => {
      foolPlate(PLACED, DENSITY);

      expect(String((pathSpy.mock.calls[0]?.[0] as Record<string, unknown>).d)).toMatch(/^M\S/);
    });

    it("should set the title and the winner in bold, and the reason not", () => {
      foolPlate(PLACED, DENSITY);

      expect(attributesOf(TITLE_MARK)["font-weight"]).toBe("bold");
      expect(attributesOf(WINNER_MARK)["font-weight"]).toBe("bold");
      expect(attributesOf(REASON_MARK)["font-weight"]).toBeUndefined();
    });
  });
});
