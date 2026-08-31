import { describe, expect, it } from "vitest";
import { MOST_PLAYERS } from "#shared/table/table-limits.ts";
import { PLAYER_COLOURS, colourFor, palette } from "#scoresheet/render/palette.ts";


const HEX_COLOUR = /^#[0-9a-f]{6}$/;

const HEX_PAIRS = [1, 3, 5];

const A_HEX_PAIR = 2;

const NEXT = 1;

const HEX_BASE = 16;

const FULL_BYTE = 255;

const LOW_CUTOFF = 0.04045;

const LOW_SLOPE = 12.92;

const CURVE_OFFSET = 0.055;

const CURVE_SCALE = 1.055;

const CURVE_POWER = 2.4;

const LIGHTNESS_WEIGHT = 2;

const TOO_ALIKE_ON_A_CHART = 0.12;

const channelsOf = (colour: string): readonly number[] =>
  HEX_PAIRS.map((at) => parseInt(colour.slice(at, at + A_HEX_PAIR), HEX_BASE) / FULL_BYTE);

const straightened = (channel: number): number =>
  channel <= LOW_CUTOFF
    ? channel / LOW_SLOPE
    : ((channel + CURVE_OFFSET) / CURVE_SCALE) ** CURVE_POWER;

const perceivedAs = (colour: string): readonly number[] => {
  const [red = 0, green = 0, blue = 0] = channelsOf(colour).map(straightened);
  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const middle = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);

  return [
    0.2104542553 * long + 0.793617785 * middle - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * middle + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * middle - 0.808675766 * short,
  ];
};

const apartness = (one: string, other: string): number => {
  const [lightness = 0, green = 0, blue = 0] = perceivedAs(one);
  const [theirLightness = 0, theirGreen = 0, theirBlue = 0] = perceivedAs(other);

  return Math.hypot(
    (lightness - theirLightness) * LIGHTNESS_WEIGHT,
    green - theirGreen,
    blue - theirBlue
  );
};

describe("palette", () => {
  it("should give every entry a colour a renderer can use", () => {
    for (const [name, colour] of Object.entries(palette)) {
      expect(colour, name).toMatch(HEX_COLOUR);
    }
  });

  it("should give every player colour a colour a renderer can use", () => {
    for (const colour of PLAYER_COLOURS) {
      expect(colour).toMatch(HEX_COLOUR);
    }
  });

  it("should give a fool cell and a placed cell different fills", () => {
    expect(palette.cellFool).not.toBe(palette.cellPlaced);
  });

  it("should give an absent cell an edge that shows against the sheet it is filled with", () => {
    expect(palette.cellAbsentEdge).not.toBe(palette.sheet);
  });

  it("should give a drawn cell a fill of its own", () => {
    expect(palette.cellDrawn).not.toBe(palette.cellPlaced);
  });

  it("should give a drawn cell an edge that shows against its own fill", () => {
    expect(palette.cellDrawnEdge).not.toBe(palette.cellDrawn);
  });

  it("should keep every player colour out of the grid's own states", () => {
    const states: readonly string[] = [
      palette.sheet,
      palette.cellPlaced,
      palette.cellDrawn,
      palette.cellFool,
    ];

    for (const colour of PLAYER_COLOURS) {
      expect(states, colour).not.toContain(colour);
    }
  });
});

describe("telling one player from another", () => {
  it("should hold a colour for every seat the table may sit, so nobody shares one", () => {
    expect(PLAYER_COLOURS.length).toBeGreaterThanOrEqual(MOST_PLAYERS);
  });

  it("should keep every pair far enough apart to be told apart on a chart line", () => {
    const tooAlike = PLAYER_COLOURS.flatMap((colour, at) =>
      PLAYER_COLOURS.slice(at + NEXT)
        .map((other) => ({ colour, other, apart: apartness(colour, other) }))
        .filter((pair) => pair.apart < TOO_ALIKE_ON_A_CHART)
    );

    expect(tooAlike).toEqual([]);
  });

  it("should keep the seats a five-handed table uses apart by more than the whole palette", () => {
    const AT_A_USUAL_TABLE = 5;

    const nearest = PLAYER_COLOURS.slice(0, AT_A_USUAL_TABLE).flatMap((colour, at) =>
      PLAYER_COLOURS.slice(0, AT_A_USUAL_TABLE)
        .slice(at + NEXT)
        .map((other) => apartness(colour, other))
    );

    const across = PLAYER_COLOURS.flatMap((colour, at) =>
      PLAYER_COLOURS.slice(at + NEXT).map((other) => apartness(colour, other))
    );

    expect(Math.min(...nearest)).toBeGreaterThan(Math.min(...across));
  });
});

describe("colourFor()", () => {
  it("should give each of the first columns a colour of its own", () => {
    const used = PLAYER_COLOURS.map((_unused, column) => colourFor(column));

    expect(new Set(used).size).toBe(PLAYER_COLOURS.length);
  });

  it("should start from the first colour", () => {
    expect(colourFor(0)).toBe(PLAYER_COLOURS[0]);
  });

  it("should wrap around rather than run out", () => {
    expect(colourFor(PLAYER_COLOURS.length)).toBe(PLAYER_COLOURS[0]);
  });

  it("should keep wrapping for a table nobody will ever seat", () => {
    const ABSURD = 999;

    expect(PLAYER_COLOURS).toContain(colourFor(ABSURD));
  });
});
