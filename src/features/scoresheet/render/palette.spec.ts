import { describe, expect, it } from "vitest";
import { PLAYER_COLOURS, colourFor, palette } from "#scoresheet/render/palette.ts";


const HEX_COLOUR = /^#[0-9a-f]{6}$/;

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

  it("should give an absent cell a fill of its own", () => {
    expect(palette.cellAbsent).not.toBe(palette.cellPlaced);
  });

  it("should give a drawn cell a fill of its own", () => {
    expect(palette.cellDrawn).not.toBe(palette.cellPlaced);
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
