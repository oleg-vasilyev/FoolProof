import { describe, expect, it } from "vitest";
import {
  humanDuration,
  humanSeconds,
  humanSize,
  type UnitLabels,
} from "#diagnostics/render/human-units.ts";


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
  seconds: "<seconds>",
  kilobytes: "<kb>",
  megabytes: "<mb>",
  decimal: "<point>",
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

describe("humanSeconds()", () => {
  const TWO_AND_A_BIT_MS = 2400;

  const NEARLY_TWO_AND_A_HALF_MS = 2449;

  const HALF_A_SECOND_MS = 500;

  it("should give seconds with one decimal, since a poster takes about one", () => {
    expect(humanSeconds(TWO_AND_A_BIT_MS, UNITS)).toBe("2<point>4 <seconds>");
  });

  it("should spell the point with the label, because Russian writes a comma", () => {
    expect(humanSeconds(TWO_AND_A_BIT_MS, { ...UNITS, decimal: "," })).toBe("2,4 <seconds>");
  });

  it("should round to the nearest tenth rather than truncate", () => {
    expect(humanSeconds(NEARLY_TWO_AND_A_HALF_MS, UNITS)).toBe("2<point>4 <seconds>");
  });

  it("should keep the whole part when there is none, not start with the point", () => {
    expect(humanSeconds(HALF_A_SECOND_MS, UNITS)).toBe("0<point>5 <seconds>");
  });

  it("should give a whole second a zero decimal, so the width does not jump", () => {
    expect(humanSeconds(SECOND_MS, UNITS)).toBe("1<point>0 <seconds>");
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
