import { describe, expect, it } from "vitest";
import { nameToFit, widthOf } from "#scoresheet/render/name-to-fit.ts";


const DESIGN_SIZE = 32;

const COLUMN = 200;

const ADVANCE = 0.58;

const ELLIPSIS = "…";

const NAMES_THAT_FIT = 10;

const fitted = (name: string, width = COLUMN): string =>
  nameToFit(name, width, DESIGN_SIZE, ADVANCE);

describe("widthOf()", () => {
  it("should measure a name glyph by glyph against the face it will be drawn in", () => {
    expect(widthOf("Щ", DESIGN_SIZE, ADVANCE)).toBeGreaterThan(widthOf("я", DESIGN_SIZE, ADVANCE));
  });

  it("should ignore the advance it was given wherever it has measured the glyph itself", () => {
    const WIDEST = 0.8;

    expect(widthOf("Oleg", DESIGN_SIZE, WIDEST)).toBe(widthOf("Oleg", DESIGN_SIZE, ADVANCE));
  });

  it("should charge a glyph the face was never measured for the advance it was given", () => {
    const UNMEASURED = "☃";

    expect(widthOf(UNMEASURED, DESIGN_SIZE, ADVANCE)).toBe(DESIGN_SIZE * ADVANCE);
  });

  it("should measure nothing as no width at all", () => {
    const NO_WIDTH = 0;

    expect(widthOf("", DESIGN_SIZE, ADVANCE)).toBe(NO_WIDTH);
  });
});

describe("nameToFit()", () => {
  it("should leave a short name alone", () => {
    expect(fitted("Al")).toBe("Al");
  });

  it("should leave a name that fills the width exactly alone", () => {
    const exact = "x".repeat(NAMES_THAT_FIT);

    expect(fitted(exact)).toBe(exact);
  });

  it("should cut a name one character too long rather than let it overflow", () => {
    const over = "x".repeat(NAMES_THAT_FIT + 1);

    expect(fitted(over)).not.toBe(over);
  });

  it("should mark a cut name with an ellipsis, so nobody reads it as the whole name", () => {
    const absurd = "x".repeat(COLUMN);

    expect(fitted(absurd).endsWith(ELLIPSIS)).toBe(true);
  });

  it("should keep a cut name inside the width it was given", () => {
    const absurd = "x".repeat(COLUMN);

    expect(widthOf(fitted(absurd), DESIGN_SIZE, ADVANCE)).toBeLessThanOrEqual(COLUMN);
  });

  it("should count the ellipsis against the width rather than hang it off the end", () => {
    const absurd = "x".repeat(COLUMN);

    expect(fitted(absurd)).toHaveLength(NAMES_THAT_FIT);
  });

  it("should fit the longest name a player may have into the narrowest legend slot", () => {
    const LONGEST_NAME = 32;

    const NARROWEST_SLOT = 120;

    const cut = fitted("x".repeat(LONGEST_NAME), NARROWEST_SLOT);

    expect(widthOf(cut, DESIGN_SIZE, ADVANCE)).toBeLessThanOrEqual(NARROWEST_SLOT);
  });

  it("should keep fewer of the widest letters than of the narrowest", () => {
    const LONGEST_NAME = 32;

    expect(fitted("Щ".repeat(LONGEST_NAME)).length).toBeLessThan(
      fitted("l".repeat(LONGEST_NAME)).length
    );
  });

  it("should not leave a space hanging in front of the ellipsis", () => {
    const NARROW = 150;

    expect(fitted("Oleg Konstantinovich", NARROW)).not.toContain(` ${ELLIPSIS}`);
  });

  it("should cut to nothing but the ellipsis when the slot fits no letters at all", () => {
    const NO_ROOM = 1;

    expect(fitted("Konstantinovna", NO_ROOM)).toBe(ELLIPSIS);
  });

  it("should cope with a name of no length at all", () => {
    expect(fitted("")).toBe("");
  });
});
