import { describe, expect, it } from "vitest";
import { percentLabel } from "#scoresheet/render/percent-label.ts";


describe("percentLabel()", () => {
  it("should render a whole share as a whole percent", () => {
    const FULL = 1;

    expect(percentLabel(FULL)).toBe("100%");
  });

  it("should render no share as zero percent", () => {
    const NONE = 0;

    expect(percentLabel(NONE)).toBe("0%");
  });

  it("should round to the nearest whole percent", () => {
    const SHARE = 0.667;

    expect(percentLabel(SHARE)).toBe("67%");
  });

  it("should round a half percent up", () => {
    const SHARE = 0.505;

    expect(percentLabel(SHARE)).toBe("51%");
  });

  it("should append a percent sign", () => {
    const HALF = 0.5;

    expect(percentLabel(HALF)).toMatch(/%$/);
  });
});
