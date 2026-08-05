import { describe, expect, it } from "vitest";
import { namePreview, namePreviews } from "#live-game/render/name-preview.ts";


const SHOWN = 20;

const ELLIPSIS = "…";

const AT_THE_EDGE = "N".repeat(SHOWN);

const ONE_OVER = "N".repeat(SHOWN + 1);

const HUGE = "N".repeat(4000);

describe("namePreview()", () => {
  it("should leave a name a button could hold alone", () => {
    expect(namePreview("Oleg")).toBe("Oleg");
  });

  it("should leave a name that is exactly as long as it may be", () => {
    expect(namePreview(AT_THE_EDGE)).toBe(AT_THE_EDGE);
  });

  it("should cut a name one character too long, and say it was cut", () => {
    expect(namePreview(ONE_OVER)).toBe(AT_THE_EDGE + ELLIPSIS);
  });

  it("should keep a refusal short enough to send, whatever was pasted in", () => {
    expect(namePreview(HUGE)).toHaveLength(SHOWN + ELLIPSIS.length);
  });

  it("should cut by characters, so an emoji is not split in half", () => {
    const cards = "🂡".repeat(SHOWN + 1);

    expect([...namePreview(cards)]).toHaveLength(SHOWN + ELLIPSIS.length);
  });
});

describe("namePreviews()", () => {
  it("should shorten every name it is given, in order", () => {
    expect(namePreviews(["Oleg", ONE_OVER])).toEqual(["Oleg", AT_THE_EDGE + ELLIPSIS]);
  });

  it("should give nothing back for nothing", () => {
    expect(namePreviews([])).toEqual([]);
  });
});
