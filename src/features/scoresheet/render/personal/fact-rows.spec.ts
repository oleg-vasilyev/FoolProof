import { beforeEach, describe, expect, it, vi } from "vitest";
import { FONT_FAMILY, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import {
  FACT_HEIGHT,
  FACT_HOLDER_DROP,
  FACT_INDEX_INDENT,
  FACT_REASON_DROP,
  FACT_SPINE_INSET,
  FACT_SPINE_WIDTH,
  FACT_TEXT_INDENT,
  FACT_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { PlacedFact } from "#scoresheet/render/personal/personal-layout.ts";


const rectSpy = vi.fn();

const textSpy = vi.fn();

const factLinesSpy = vi.fn();

const factInkSpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

vi.mock("#scoresheet/render/personal/fact-lines.ts", () => ({
  factLines: (table: unknown, fact: unknown) => factLinesSpy(table, fact),
}));

vi.mock("#scoresheet/render/personal/fact-ink.ts", () => ({
  factInk: (fact: unknown, ink: unknown) => factInkSpy(fact, ink),
}));

const { factRows } = await import("#scoresheet/render/personal/fact-rows.ts");

const NEVER = 0;

const ONCE = 1;

const TWICE = 2;

const LINES_IN_A_ROW = 4;

const PARTS_IN_A_ROW = LINES_IN_A_ROW + ONCE;

const TOP = 1000;

const NEXT_TOP = 2000;

const TENTH_PLACE = 10;

const INK = "player-ink";

const TONE = "row-tone";

const SPINE_MARK = "<spine/>";

const TITLE_MARK = "the-title";

const HOLDER_MARK = "the-holder";

const REASON_MARK = "the-reason";

const OTHER_TITLE = "another-title";

const OTHER_HOLDER = "another-holder";

const OTHER_REASON = "another-reason";

const LINES = { title: TITLE_MARK, holder: HOLDER_MARK, reason: REASON_MARK };

const OTHER_LINES = { title: OTHER_TITLE, holder: OTHER_HOLDER, reason: OTHER_REASON };

const FIRST_FACT = { name: CareerFactName.TheBlinder } as unknown as CareerFact;

const SECOND_FACT = { name: CareerFactName.TheNightmare } as unknown as CareerFact;

const placed = (fact: CareerFact, top = TOP): PlacedFact => ({ fact, top });

const TWO_ROWS: readonly PlacedFact[] = [placed(FIRST_FACT), placed(SECOND_FACT, NEXT_TOP)];

const marked = (value: string): string => `<text:${value}>`;

const attributesOf = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

const spines = (): readonly Record<string, unknown>[] =>
  rectSpy.mock.calls.map((call) => call[0] as Record<string, unknown>);

describe("factRows()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    factLinesSpy.mockReturnValue(LINES);
    factInkSpy.mockReturnValue(TONE);
    rectSpy.mockImplementation(() => SPINE_MARK);
    textSpy.mockImplementation((value: string) => marked(value));
  });

  describe("how much it draws", () => {
    it("should draw nothing at all when the sheet placed no facts", () => {
      expect(factRows(copy, [], INK)).toEqual([]);
      expect(rectSpy).toHaveBeenCalledTimes(NEVER);
      expect(factLinesSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should draw a spine and four lines for the one fact it was given", () => {
      expect(factRows(copy, [placed(FIRST_FACT)], INK)).toHaveLength(PARTS_IN_A_ROW);
      expect(textSpy).toHaveBeenCalledTimes(LINES_IN_A_ROW);
    });

    it("should draw one row for every fact placed, flattened into one list", () => {
      factLinesSpy.mockReturnValueOnce(LINES).mockReturnValueOnce(OTHER_LINES);

      expect(factRows(copy, TWO_ROWS, INK)).toHaveLength(PARTS_IN_A_ROW * TWICE);
      expect(rectSpy).toHaveBeenCalledTimes(TWICE);
    });
  });

  describe("where a row's words come from", () => {
    it("should write up each fact the layout placed, in the order it placed them", () => {
      factRows(copy, TWO_ROWS, INK);

      expect(factLinesSpy.mock.calls).toEqual([
        [copy, FIRST_FACT],
        [copy, SECOND_FACT],
      ]);
    });

    it("should write the title, the holder and the reason it was handed", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(textSpy.mock.calls.map((call) => call[0])).toEqual([
        "01",
        TITLE_MARK,
        HOLDER_MARK,
        REASON_MARK,
      ]);
    });

    it("should follow the lines it is given rather than fixing them", () => {
      factLinesSpy.mockReturnValue(OTHER_LINES);

      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(textSpy).toHaveBeenCalledWith(OTHER_TITLE, expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith(TITLE_MARK, expect.anything());
    });

    it("should give each row the lines written for its own fact", () => {
      factLinesSpy.mockReturnValueOnce(LINES).mockReturnValueOnce(OTHER_LINES);

      factRows(copy, TWO_ROWS, INK);

      expect(attributesOf(TITLE_MARK).y).toBe(TOP + FACT_TITLE_DROP);
      expect(attributesOf(OTHER_TITLE).y).toBe(NEXT_TOP + FACT_TITLE_DROP);
    });
  });

  describe("the ink a row is drawn in", () => {
    it("should ask for each fact's own tone, offering the ink it was handed", () => {
      factRows(copy, TWO_ROWS, INK);

      expect(factInkSpy.mock.calls).toEqual([
        [FIRST_FACT, INK],
        [SECOND_FACT, INK],
      ]);
    });

    it("should spine the row in the tone it was given back, not in the raw ink", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(spines()[0]).toEqual(expect.objectContaining({ fill: TONE }));
      expect(spines()[0]?.fill).not.toBe(INK);
    });

    it("should set the holder in that same tone", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf(HOLDER_MARK).fill).toBe(TONE);
    });

    it("should leave the title, the place and the reason out of the tone", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf(TITLE_MARK).fill).toBe(palette.ink);
      expect(attributesOf("01").fill).toBe(palette.inkFigure);
      expect(attributesOf(REASON_MARK).fill).toBe(palette.inkMuted);
    });
  });

  describe("numbering the rows", () => {
    it("should count the rows from one, not from zero", () => {
      factRows(copy, TWO_ROWS, INK);

      expect(textSpy).toHaveBeenCalledWith("01", expect.anything());
      expect(textSpy).toHaveBeenCalledWith("02", expect.anything());
    });

    it("should pad a single digit to two places", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(textSpy).toHaveBeenCalledWith("01", expect.anything());
      expect(textSpy).not.toHaveBeenCalledWith("1", expect.anything());
    });

    it("should leave a two-digit place unpadded", () => {
      const many = Array.from({ length: TENTH_PLACE }, () => placed(FIRST_FACT));

      factRows(copy, many, INK);

      expect(textSpy).toHaveBeenCalledWith(String(TENTH_PLACE), expect.anything());
    });
  });

  describe("where a row's four lines sit", () => {
    it("should stand the spine at the left margin, inset from both ends of the row", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(spines()[0]).toEqual(
        expect.objectContaining({
          x: PAD,
          y: TOP + FACT_SPINE_INSET,
          width: FACT_SPINE_WIDTH,
          height: FACT_HEIGHT - FACT_SPINE_INSET - FACT_SPINE_INSET,
        })
      );
    });

    it("should set the place between the spine and the title", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf("01").x).toBe(PAD + FACT_INDEX_INDENT);
      expect(attributesOf("01").x as number).toBeLessThan(attributesOf(TITLE_MARK).x as number);
    });

    it("should share one baseline between the place and the title", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf(TITLE_MARK).y).toBe(TOP + FACT_TITLE_DROP);
      expect(attributesOf("01").y).toBe(TOP + FACT_TITLE_DROP);
    });

    it("should stack the holder and the reason under the title", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf(HOLDER_MARK).y).toBe(TOP + FACT_HOLDER_DROP);
      expect(attributesOf(REASON_MARK).y).toBe(TOP + FACT_REASON_DROP);
    });

    it("should indent the title, the holder and the reason to the same text edge", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      for (const value of [TITLE_MARK, HOLDER_MARK, REASON_MARK]) {
        expect(attributesOf(value).x).toBe(PAD + FACT_TEXT_INDENT);
      }
    });

    it("should draw a second row against its own top, not the first one's", () => {
      factLinesSpy.mockReturnValueOnce(LINES).mockReturnValueOnce(OTHER_LINES);

      factRows(copy, TWO_ROWS, INK);

      expect(spines()[ONCE]).toEqual(
        expect.objectContaining({ y: NEXT_TOP + FACT_SPINE_INSET })
      );
      expect(attributesOf(OTHER_HOLDER).y).toBe(NEXT_TOP + FACT_HOLDER_DROP);
    });

    it("should hand back the spine first and then the four lines in order", () => {
      const drawn = factRows(copy, [placed(FIRST_FACT)], INK);

      expect(drawn[0]).toBe(SPINE_MARK);
      expect(drawn.slice(ONCE)).toEqual([
        marked("01"),
        marked(TITLE_MARK),
        marked(HOLDER_MARK),
        marked(REASON_MARK),
      ]);
    });
  });

  describe("how a row is set", () => {
    it("should set the title bold, largest, in the card's plain ink", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf(TITLE_MARK)["font-weight"]).toBe("bold");
      expect(attributesOf(TITLE_MARK)["font-size"]).toBe(personalFont.factTitle);
      expect(attributesOf(TITLE_MARK)["font-family"]).toBe(FONT_FAMILY);
    });

    it("should set the holder bold and smaller than the title", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf(HOLDER_MARK)["font-weight"]).toBe("bold");
      expect(attributesOf(HOLDER_MARK)["font-size"]).toBe(personalFont.factHolder);
      expect(personalFont.factTitle).toBeGreaterThan(personalFont.factHolder);
    });

    it("should set the reason muted and unbolded", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf(REASON_MARK)["font-size"]).toBe(personalFont.factReason);
      expect(attributesOf(REASON_MARK)["font-weight"]).toBeUndefined();
    });

    it("should set the place in the figure ink, apart from the title beside it", () => {
      factRows(copy, [placed(FIRST_FACT)], INK);

      expect(attributesOf("01")["font-size"]).toBe(personalFont.factIndex);
      expect(attributesOf("01")["font-weight"]).toBeUndefined();
    });
  });
});
