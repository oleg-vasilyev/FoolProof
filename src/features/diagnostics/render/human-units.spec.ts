import { describe, expect, it } from "vitest";
import { humanDuration, humanSize, type UnitLabels } from "#diagnostics/render/human-units.ts";


const SECOND_MS = 1000;

const MINUTE_MS = 60 * SECOND_MS;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

const KB = 1024;

const MB = KB * KB;

const NOTHING = 0;

const ONE_BYTE = 1;

const THREE = 3;

const TWELVE = 12;

const FORTY = 40;

const UNITS: UnitLabels = {
  days: "<days>",
  hours: "<hours>",
  minutes: "<minutes>",
  kilobytes: "<kb>",
  megabytes: "<mb>",
};

describe("humanDuration()", () => {
  it("should give minutes for a fresh start, which is the case that matters", () => {
    expect(humanDuration(THREE * MINUTE_MS, UNITS)).toBe("3<minutes>");
  });

  it("should round down rather than invent a minute", () => {
    expect(humanDuration(MINUTE_MS - SECOND_MS, UNITS)).toBe("0<minutes>");
  });

  it("should give hours and minutes once it has run an hour", () => {
    expect(humanDuration(THREE * HOUR_MS + TWELVE * MINUTE_MS, UNITS)).toBe("3<hours> 12<minutes>");
  });

  it("should not repeat the hours inside the minutes", () => {
    expect(humanDuration(HOUR_MS, UNITS)).toBe("1<hours> 0<minutes>");
  });

  it("should give days and hours for a long-running bot", () => {
    expect(humanDuration(DAY_MS + THREE * HOUR_MS, UNITS)).toBe("1<days> 3<hours>");
  });

  it("should not repeat the days inside the hours", () => {
    expect(humanDuration(DAY_MS, UNITS)).toBe("1<days> 0<hours>");
  });

  it("should say zero minutes for a bot that has only just started", () => {
    expect(humanDuration(NOTHING, UNITS)).toBe("0<minutes>");
  });
});

describe("humanSize()", () => {
  it("should give kilobytes for a database of an evening's games", () => {
    expect(humanSize(FORTY * KB, UNITS)).toBe("40 <kb>");
  });

  it("should round to whole kilobytes, since the digits carry no meaning", () => {
    expect(humanSize(FORTY * KB + KB / THREE, UNITS)).toBe("40 <kb>");
  });

  it("should give megabytes once it passes a thousand kilobytes", () => {
    expect(humanSize(THREE * MB, UNITS)).toBe("3.0 <mb>");
  });

  it("should switch to megabytes exactly at the boundary, not a kilobyte later", () => {
    expect(humanSize(MB, UNITS)).toBe("1.0 <mb>");
  });

  it("should still be kilobytes one byte below it", () => {
    expect(humanSize(MB - ONE_BYTE, UNITS)).toBe("1024 <kb>");
  });

  it("should keep one decimal in megabytes, so growth is visible", () => {
    expect(humanSize(MB + MB / TWELVE, UNITS)).toBe("1.1 <mb>");
  });

  it("should call an empty file zero, not something clever", () => {
    expect(humanSize(NOTHING, UNITS)).toBe("0 <kb>");
  });
});
