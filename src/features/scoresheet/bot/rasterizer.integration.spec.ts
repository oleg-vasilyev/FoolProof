import { describe, expect, it } from "vitest";
import { FONT_FAMILY } from "#scoresheet/render/card-metrics.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { rasterize, requireFonts } from "#scoresheet/bot/rasterizer.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import { svgOf, text } from "#scoresheet/render/svg-tags.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";


const PNG_MAGIC = "89504e47";

const MAGIC_START = 0;

const MAGIC_LENGTH = 4;

const OLEG_ID = 1;

const ANYA_ID = 2;

const GAME_ID = 7;

const FIRST_OUT = 1;

const LAST_OUT = 2;

const SAMPLE_WIDTH = 240;

const SAMPLE_HEIGHT = 80;

const SAMPLE_X = 10;

const SAMPLE_BASELINE = 56;

const SAMPLE_FONT = 40;

const A_LATIN_NAME = "Oleg";

const A_CYRILLIC_NAME = "Олег";

const NOTHING_AT_ALL = "";

const A_TEXT_ELEMENT = /<text[^>]*>[^<]*<\/text>/g;

const AN_EVENING: SeriesChronology = {
  startedOn: "2026-08-06",
  players: [
    { playerId: OLEG_ID, displayName: A_LATIN_NAME },
    { playerId: ANYA_ID, displayName: "Anya" },
  ],
  games: [
    {
      gameId: GAME_ID,
      starterId: OLEG_ID,
      placements: [
        { playerId: OLEG_ID, position: FIRST_OUT },
        { playerId: ANYA_ID, position: LAST_OUT },
      ],
    },
  ],
};

const wordOnItsOwn = (word: string): string =>
  svgOf(SAMPLE_WIDTH, SAMPLE_HEIGHT, [
    text(word, {
      x: SAMPLE_X,
      y: SAMPLE_BASELINE,
      "font-family": FONT_FAMILY,
      "font-size": SAMPLE_FONT,
    }),
  ]);

const magicOf = (png: Buffer): string =>
  png.subarray(MAGIC_START, MAGIC_START + MAGIC_LENGTH).toString("hex");

describe("the rasterizer against the fonts this repository ships", () => {
  it("should find every font the picture is drawn with", () => {
    expect(() => {
      requireFonts();
    }).not.toThrow();
  });

  it("should turn a rendered scoresheet into a PNG", () => {
    expect(magicOf(rasterize(renderScoresheet(copy, AN_EVENING)))).toBe(PNG_MAGIC);
  });

  it("should put ink where the sheet asked for words, not hand back a blank page", () => {
    const sheet = renderScoresheet(copy, AN_EVENING);

    const drawn = rasterize(sheet);
    const wordless = rasterize(sheet.replaceAll(A_TEXT_ELEMENT, NOTHING_AT_ALL));

    expect(drawn.equals(wordless)).toBe(false);
  });

  it("should draw a latin name rather than skip a glyph it has no font for", () => {
    const drawn = rasterize(wordOnItsOwn(A_LATIN_NAME));

    expect(drawn.equals(rasterize(wordOnItsOwn(NOTHING_AT_ALL)))).toBe(false);
  });

  it("should draw a cyrillic name too, which is half of what this bot writes", () => {
    const drawn = rasterize(wordOnItsOwn(A_CYRILLIC_NAME));

    expect(drawn.equals(rasterize(wordOnItsOwn(NOTHING_AT_ALL)))).toBe(false);
  });
});
