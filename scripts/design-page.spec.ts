import { describe, expect, it } from "vitest";
import { Locale } from "#shared/locale/locales.ts";
import { ENGLISH_SUFFIX, inSlotNames } from "./design-page.ts";


const A_DRAWING = "<svg>one</svg>";

const ANOTHER = "<svg>two</svg>";

describe("ENGLISH_SUFFIX", () => {
  it("should be the locale the site writes, not a second spelling of it", () => {
    expect(ENGLISH_SUFFIX).toBe(`-${Locale.En}`);
  });
});

describe("inSlotNames()", () => {
  it("should keep the English drawing and drop the same poster in another language", () => {
    expect(
      inSlotNames({ "chronology-en": A_DRAWING, "chronology-ru": ANOTHER })
    ).toEqual({ chronology: A_DRAWING });
  });

  it("should strip the suffix from the end, leaving a name a slot can carry", () => {
    expect(Object.keys(inSlotNames({ "personal-en": A_DRAWING }))).toEqual(["personal"]);
  });

  it("should keep every English poster, not just the first", () => {
    expect(
      Object.keys(inSlotNames({ "chronology-en": A_DRAWING, "awards-en": ANOTHER }))
    ).toEqual(["chronology", "awards"]);
  });

  it("should leave the drawing itself untouched", () => {
    expect(inSlotNames({ "awards-en": A_DRAWING })["awards"]).toBe(A_DRAWING);
  });

  it("should hand back nothing when no drawing is in English", () => {
    expect(inSlotNames({ "chronology-ru": A_DRAWING })).toEqual({});
  });

  it("should judge the end of a name, not the middle of it", () => {
    expect(inSlotNames({ "en-of-the-evening": A_DRAWING })).toEqual({});
  });
});
