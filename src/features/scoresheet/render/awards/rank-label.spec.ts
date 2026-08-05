import { describe, expect, it } from "vitest";
import { rankLabel } from "#scoresheet/render/awards/rank-label.ts";


describe("rankLabel()", () => {
  it("should show the first rank as 01, since the card counts from one", () => {
    expect(rankLabel(0)).toBe("01");
  });

  it("should pad a single digit so the column stays straight", () => {
    expect(rankLabel(8)).toBe("09");
  });

  it("should leave a two-digit rank alone", () => {
    expect(rankLabel(9)).toBe("10");
  });

  it("should keep counting past the card's own limit rather than wrapping", () => {
    expect(rankLabel(99)).toBe("100");
  });
});
