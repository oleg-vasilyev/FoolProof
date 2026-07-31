import { describe, expect, it } from "vitest";
import { counted, humanDuration, humanSize } from "#diagnostics/render/human-units.ts";


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

describe("humanDuration()", () => {
  it("should give minutes for a fresh start, which is the case that matters", () => {
    expect(humanDuration(THREE * MINUTE_MS)).toBe("3m");
  });

  it("should round down rather than invent a minute", () => {
    expect(humanDuration(MINUTE_MS - SECOND_MS)).toBe("0m");
  });

  it("should give hours and minutes once it has run an hour", () => {
    expect(humanDuration(THREE * HOUR_MS + TWELVE * MINUTE_MS)).toBe("3h 12m");
  });

  it("should not repeat the hours inside the minutes", () => {
    expect(humanDuration(HOUR_MS)).toBe("1h 0m");
  });

  it("should give days and hours for a long-running bot", () => {
    expect(humanDuration(DAY_MS + THREE * HOUR_MS)).toBe("1d 3h");
  });

  it("should not repeat the days inside the hours", () => {
    expect(humanDuration(DAY_MS)).toBe("1d 0h");
  });

  it("should say zero minutes for a bot that has only just started", () => {
    expect(humanDuration(NOTHING)).toBe("0m");
  });
});

describe("counted()", () => {
  const ONE_THING = 1;

  const TWO_THINGS = 2;

  it("should use the singular for one", () => {
    expect(counted(ONE_THING, "warning", "warnings")).toBe("1 warning");
  });

  it("should use the plural for more than one", () => {
    expect(counted(TWO_THINGS, "warning", "warnings")).toBe("2 warnings");
  });

  it("should use the plural for none, as English does", () => {
    expect(counted(NOTHING, "warning", "warnings")).toBe("0 warnings");
  });
});

describe("humanSize()", () => {
  it("should give kilobytes for a database of an evening's games", () => {
    expect(humanSize(FORTY * KB)).toBe("40 KB");
  });

  it("should round to whole kilobytes, since the digits carry no meaning", () => {
    expect(humanSize(FORTY * KB + KB / THREE)).toBe("40 KB");
  });

  it("should give megabytes once it passes a thousand kilobytes", () => {
    expect(humanSize(THREE * MB)).toBe("3.0 MB");
  });

  it("should switch to megabytes exactly at the boundary, not a kilobyte later", () => {
    expect(humanSize(MB)).toBe("1.0 MB");
  });

  it("should still be kilobytes one byte below it", () => {
    expect(humanSize(MB - ONE_BYTE)).toBe("1024 KB");
  });

  it("should keep one decimal in megabytes, so growth is visible", () => {
    expect(humanSize(MB + MB / TWELVE)).toBe("1.1 MB");
  });

  it("should call an empty file zero, not something clever", () => {
    expect(humanSize(NOTHING)).toBe("0 KB");
  });
});
