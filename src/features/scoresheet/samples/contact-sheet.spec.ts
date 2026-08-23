import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Drawing } from "#shared/drawings/drawings-contract.ts";


const rectSpy = vi.fn();

const textSpy = vi.fn();

const svgOfSpy = vi.fn();

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: unknown) => rectSpy(attributes) as string,
  text: (value: string, attributes: unknown) => textSpy(value, attributes) as string,
  svgOf: (width: number, height: number, body: readonly string[]) =>
    svgOfSpy(width, height, body) as string,
}));

const { contactSheet } = await import("#scoresheet/samples/contact-sheet.ts");

const A_TITLE = "every edge the gallery draws";

const A_POSTER_WIDTH = 600;

const A_POSTER_HEIGHT = 900;

const THUMB_WIDTH = 300;

const A_THUMB_HEIGHT = 450;

const COLUMNS = 7;

const GAP = 24;

const MARGIN = 40;

const SHEET_WIDTH = 2324;

const ONE_ROW_TALL = 594;

const TWO_ROWS_TALL = 1098;

const LABEL_SIZE = 17;

const FIRST_LABEL_BASELINE = 94;

const FIRST_THUMB_TOP = 104;

const SECOND_LABEL_BASELINE = 598;

const SECOND_THUMB_TOP = 608;

const LABEL_OF_THE_FIRST = 1;

const LABEL_OF_THE_EIGHTH = 8;

const ATTRIBUTES_GIVEN = 1;

const A_TOWER_WIDTH = 100;

const A_TOWER_HEIGHT = 2000;

const ONLY_CALL = 0;

const WIDTH_GIVEN = 0;

const HEIGHT_GIVEN = 1;

const BODY_GIVEN = 2;

const drawingOf = (
  file: string,
  width = A_POSTER_WIDTH,
  height = A_POSTER_HEIGHT
): Drawing => ({
  file,
  asks: "something worth a look",
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}"><rect/></svg>`,
});

const manyDrawings = (count: number): readonly Drawing[] =>
  Array.from({ length: count }, (_unused, index) => drawingOf(`edge-${String(index)}`));

const bodyOf = (): readonly string[] => svgOfSpy.mock.calls[ONLY_CALL]?.[BODY_GIVEN] as string[];

const placedThumbs = (): readonly string[] =>
  bodyOf().filter((piece) => typeof piece === "string" && piece.startsWith("<svg"));

describe("contactSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rectSpy.mockReturnValue("<rect/>");
    textSpy.mockImplementation((value: string) => `<text>${value}</text>`);
    svgOfSpy.mockReturnValue("<svg/>");
  });

  it("should draw one sheet as wide as seven thumbnails, whatever it is given", () => {
    contactSheet(A_TITLE, manyDrawings(COLUMNS + COLUMNS));

    expect(svgOfSpy).toHaveBeenCalledTimes(ONLY_CALL + 1);
    expect(svgOfSpy.mock.calls[ONLY_CALL]?.[WIDTH_GIVEN]).toBe(SHEET_WIDTH);
  });

  it("should stand exactly as tall as the one row it was given", () => {
    contactSheet(A_TITLE, manyDrawings(1));

    expect(svgOfSpy.mock.calls[ONLY_CALL]?.[HEIGHT_GIVEN]).toBe(ONE_ROW_TALL);
  });

  it("should scale every drawing to one width, keeping the shape it was drawn in", () => {
    contactSheet(A_TITLE, [drawingOf("one")]);

    expect(placedThumbs()[ONLY_CALL]).toContain(`width="${String(THUMB_WIDTH)}"`);
    expect(placedThumbs()[ONLY_CALL]).toContain(`height="${String(A_THUMB_HEIGHT)}"`);
  });

  it("should start a new row after the seventh drawing rather than running off the sheet", () => {
    contactSheet(A_TITLE, manyDrawings(COLUMNS + 1));

    const lastColumn = MARGIN + (COLUMNS - 1) * (THUMB_WIDTH + GAP);

    expect(placedThumbs()[COLUMNS - 1]).toContain(`x="${String(lastColumn)}"`);
    expect(placedThumbs()[COLUMNS]).toContain(`x="${String(MARGIN)}"`);
  });

  it("should label every thumbnail with the file it will be written to", () => {
    contactSheet(A_TITLE, manyDrawings(2));

    expect(textSpy.mock.calls.map((call) => call[WIDTH_GIVEN])).toEqual([
      A_TITLE,
      "edge-0",
      "edge-1",
    ]);
  });

  it("should write each label above its thumbnail, in the face the posters use", () => {
    contactSheet(A_TITLE, manyDrawings(1));

    expect(textSpy.mock.calls[LABEL_OF_THE_FIRST]?.[ATTRIBUTES_GIVEN]).toEqual({
      x: MARGIN,
      y: FIRST_LABEL_BASELINE,
      fill: expect.any(String) as string,
      "font-family": "Noto Sans",
      "font-size": LABEL_SIZE,
    });
  });

  it("should hang the first thumbnail under the title, clear of its own label", () => {
    contactSheet(A_TITLE, manyDrawings(1));

    expect(placedThumbs()[ONLY_CALL]).toContain(`y="${String(FIRST_THUMB_TOP)}"`);
  });

  it("should drop the second row below the tallest drawing in the first", () => {
    contactSheet(A_TITLE, manyDrawings(COLUMNS + 1));

    expect(textSpy.mock.calls[LABEL_OF_THE_EIGHTH]?.[ATTRIBUTES_GIVEN]).toMatchObject({
      y: SECOND_LABEL_BASELINE,
    });
    expect(placedThumbs()[COLUMNS]).toContain(`y="${String(SECOND_THUMB_TOP)}"`);
  });

  it("should stand as tall as both rows once there are two of them", () => {
    contactSheet(A_TITLE, manyDrawings(COLUMNS + 1));

    expect(svgOfSpy.mock.calls[ONLY_CALL]?.[HEIGHT_GIVEN]).toBe(TWO_ROWS_TALL);
  });

  it("should measure a row by its tallest drawing, not by its first", () => {
    contactSheet(A_TITLE, [
      drawingOf("short", A_POSTER_WIDTH, A_POSTER_WIDTH),
      ...manyDrawings(COLUMNS),
    ]);

    expect(svgOfSpy.mock.calls[ONLY_CALL]?.[HEIGHT_GIVEN]).toBe(TWO_ROWS_TALL);
  });

  it("should refuse a drawing whose root states no size, naming the file and the way out", () => {
    const sizeless = { file: "nameless", asks: "nothing", svg: "<svg><rect/></svg>" };

    expect(() => contactSheet(A_TITLE, [sizeless])).toThrow(/nameless.*height.*svgOf\(\)/s);
  });

  it("should say which of the two sizes is the one it could not read", () => {
    const halfSized = {
      file: "flat",
      asks: "nothing",
      svg: `<svg height="${String(A_POSTER_HEIGHT)}"><rect/></svg>`,
    };

    expect(() => contactSheet(A_TITLE, [halfSized])).toThrow(/flat: its root <svg> states no width/);
  });

  it("should refuse a sheet too tall to take in, rather than drawing one nobody can read", () => {
    expect(() =>
      contactSheet(A_TITLE, [drawingOf("tower", A_TOWER_WIDTH, A_TOWER_HEIGHT)])
    ).toThrow(/reads as nothing/);
  });
});
