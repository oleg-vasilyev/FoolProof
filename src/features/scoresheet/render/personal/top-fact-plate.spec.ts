import { beforeEach, describe, expect, it, vi } from "vitest";
import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  PLATE_HEIGHT,
  PLATE_INDENT,
  PLATE_NAME_DROP,
  PLATE_REASON_DROP,
  PLATE_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { PlacedFact } from "#scoresheet/render/personal/personal-layout.ts";


const rectSpy = vi.fn();

const textSpy = vi.fn();

const factLinesSpy = vi.fn();

const isBadNewsSpy = vi.fn();

const factInkSpy = vi.fn();

const A_CHOSEN_INK = "chosen-ink";

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/personal/fact-lines.ts", () => ({
  factLines: (table: unknown, fact: unknown) => factLinesSpy(table, fact),
}));

vi.mock("#scoresheet/render/personal/fact-ink.ts", () => ({
  isBadNews: (fact: unknown) => isBadNewsSpy(fact),
  factInk: (fact: unknown, ink: string) => factInkSpy(fact, ink),
}));

const { topFactPlate } = await import("#scoresheet/render/personal/top-fact-plate.ts");

const ONCE = 1;

const PLATE_LINES = 4;

const TOP = 1800;

const LOWER = 2100;

const INK = "player-ink";

const TITLE_MARK = "the-title";

const HOLDER_MARK = "the-holder";

const REASON_MARK = "the-reason";

const PLATE_MARK = "<plate/>";

const LINES = { title: TITLE_MARK, holder: HOLDER_MARK, reason: REASON_MARK };

const FACT = { name: CareerFactName.TheJinx } as unknown as CareerFact;

const placedAt = (top = TOP): PlacedFact => ({ fact: FACT, top });

const marked = (value: string): string => `<text:${value}>`;

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("topFactPlate()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    factLinesSpy.mockReturnValue(LINES);
    factInkSpy.mockReturnValue(INK);
    isBadNewsSpy.mockReturnValue(false);
    rectSpy.mockImplementation(() => PLATE_MARK);
    textSpy.mockImplementation((value: string) => marked(value));
  });

  describe("where the plate's words come from", () => {
    it("should write up the very fact the layout placed, exactly once", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(factLinesSpy).toHaveBeenCalledTimes(ONCE);
      expect(factLinesSpy).toHaveBeenCalledWith(copy, FACT);
    });

    it("should write the three lines it was handed and nothing of its own", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(textSpy.mock.calls.map((call) => call[0])).toEqual([
        TITLE_MARK,
        HOLDER_MARK,
        REASON_MARK,
      ]);
    });

    it("should follow the lines it is given rather than fixing them", () => {
      const OTHER_TITLE = "another-title";

      factLinesSpy.mockReturnValue({ ...LINES, title: OTHER_TITLE });

      topFactPlate(copy, placedAt(), INK);

      expect(textSpy).toHaveBeenCalledWith(OTHER_TITLE, expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith(TITLE_MARK, expect.anything());
    });
  });

  describe("what the plate holds", () => {
    it("should lay the plate down before anything written on it", () => {
      expect(topFactPlate(copy, placedAt(), INK)[0]).toBe(PLATE_MARK);
    });

    it("should draw a plate and three lines and nothing else", () => {
      expect(topFactPlate(copy, placedAt(), INK)).toHaveLength(PLATE_LINES);
      expect(rectSpy).toHaveBeenCalledTimes(ONCE);
      expect(textSpy).toHaveBeenCalledTimes(PLATE_LINES - ONCE);
    });

    it("should keep the title, the holder and the reason on three lines of their own", () => {
      const drawn = topFactPlate(copy, placedAt(), INK);

      expect(drawn.indexOf(marked(TITLE_MARK))).toBeLessThan(drawn.indexOf(marked(HOLDER_MARK)));
      expect(drawn.indexOf(marked(HOLDER_MARK))).toBeLessThan(drawn.indexOf(marked(REASON_MARK)));
    });
  });

  describe("where the plate sits", () => {
    it("should start the plate at the top the layout gave it", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(rectSpy).toHaveBeenCalledWith(
        expect.objectContaining({ x: PAD, y: TOP, height: PLATE_HEIGHT })
      );
    });

    it("should run the plate from the left margin to the card's right edge", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(rectSpy).toHaveBeenCalledWith(expect.objectContaining({ width: GRID_RIGHT - PAD }));
    });

    it("should indent every line from the plate's own left edge", () => {
      topFactPlate(copy, placedAt(), INK);

      for (const value of [TITLE_MARK, HOLDER_MARK, REASON_MARK]) {
        expect(attributesOf(value).x).toBe(PAD + PLATE_INDENT);
      }
    });

    it("should stack the three lines down from the plate's own top", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(attributesOf(TITLE_MARK).y).toBe(TOP + PLATE_TITLE_DROP);
      expect(attributesOf(HOLDER_MARK).y).toBe(TOP + PLATE_NAME_DROP);
      expect(attributesOf(REASON_MARK).y).toBe(TOP + PLATE_REASON_DROP);
    });

    it("should keep all three lines inside the plate", () => {
      topFactPlate(copy, placedAt(), INK);

      for (const value of [TITLE_MARK, HOLDER_MARK, REASON_MARK]) {
        expect(attributesOf(value).y as number).toBeGreaterThan(TOP);
        expect(attributesOf(value).y as number).toBeLessThan(TOP + PLATE_HEIGHT);
      }
    });

    it("should move with the top it is handed", () => {
      topFactPlate(copy, placedAt(LOWER), INK);

      expect(attributesOf(HOLDER_MARK).y).toBe(LOWER + PLATE_NAME_DROP);
      expect(rectSpy).toHaveBeenCalledWith(expect.objectContaining({ y: LOWER }));
    });
  });

  describe("what colour the plate is painted", () => {
    it("should ask about the very fact it is drawing", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(isBadNewsSpy).toHaveBeenCalledWith(FACT);
    });

    it("should ask the ink helper about the very fact it is drawing", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(factInkSpy).toHaveBeenCalledWith(FACT, INK);
    });

    it("should paint the plate in whatever ink that helper handed back", () => {
      factInkSpy.mockReturnValue(A_CHOSEN_INK);

      topFactPlate(copy, placedAt(), INK);

      expect(rectSpy).toHaveBeenCalledWith(expect.objectContaining({ fill: A_CHOSEN_INK }));
    });

    it("should caption good news in the plate's own shade", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(attributesOf(REASON_MARK).fill).toBe(palette.plateShade);
    });

    it("should caption bad news in the plate's own cap ink", () => {
      isBadNewsSpy.mockReturnValue(true);

      topFactPlate(copy, placedAt(), INK);

      expect(attributesOf(REASON_MARK).fill).toBe(palette.plateCap);
      expect(attributesOf(REASON_MARK).fill).not.toBe(palette.plateShade);
    });
  });

  describe("how the plate is set", () => {
    it("should set the title and the holder in the plate's own ink, bold", () => {
      topFactPlate(copy, placedAt(), INK);

      for (const value of [TITLE_MARK, HOLDER_MARK]) {
        expect(attributesOf(value).fill).toBe(palette.plateInk);
        expect(attributesOf(value)["font-weight"]).toBe("bold");
        expect(attributesOf(value)["font-family"]).toBe(FONT_FAMILY);
      }
    });

    it("should set the title larger than the holder it introduces", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(attributesOf(TITLE_MARK)["font-size"]).toBe(personalFont.plateTitle);
      expect(attributesOf(HOLDER_MARK)["font-size"]).toBe(personalFont.plateName);
      expect(personalFont.plateTitle).toBeGreaterThan(personalFont.plateName);
    });

    it("should set the reason smallest of the three, unbolded", () => {
      topFactPlate(copy, placedAt(), INK);

      expect(attributesOf(REASON_MARK)["font-size"]).toBe(personalFont.plateReason);
      expect(attributesOf(REASON_MARK)["font-weight"]).toBeUndefined();
      expect(attributesOf(REASON_MARK)["font-family"]).toBe(FONT_FAMILY);
    });
  });
});
