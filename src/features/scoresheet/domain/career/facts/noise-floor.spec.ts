import { describe, expect, it } from "vitest";
import { NOISE_FLOOR, notable } from "#scoresheet/domain/career/facts/noise-floor.ts";


const ALONE = 1;

const A_PAIR = 2;

const A_WHOLE_CATALOGUE = 20;

const NOTHING = 0;

const A_HAIR = 1e-9;

const ON_THE_FLOOR = NOISE_FLOOR;

const JUST_UNDER_THE_FLOOR = NOISE_FLOOR - A_HAIR;

const JUST_OVER_THE_FLOOR = NOISE_FLOOR + A_HAIR;

const HALF_THE_FLOOR = NOISE_FLOOR / A_PAIR;

const A_CERTAINTY = 1;

describe("notable()", () => {
  it("should refuse a tail sitting exactly on the noise floor", () => {
    expect(notable(ON_THE_FLOOR, ALONE)).toBe(false);
  });

  it("should accept a tail a hair under the noise floor", () => {
    expect(notable(JUST_UNDER_THE_FLOOR, ALONE)).toBe(true);
  });

  it("should refuse a tail a hair over the noise floor", () => {
    expect(notable(JUST_OVER_THE_FLOOR, ALONE)).toBe(false);
  });

  it("should accept a tail of nothing at all, however many were looked at", () => {
    expect(notable(NOTHING, A_WHOLE_CATALOGUE)).toBe(true);
  });

  it("should refuse a certainty", () => {
    expect(notable(A_CERTAINTY, ALONE)).toBe(false);
  });

  it("should accept a tail that only one candidate was picked from", () => {
    expect(notable(HALF_THE_FLOOR, ALONE)).toBe(true);
  });

  it("should refuse that same tail once a second candidate puts it on the floor", () => {
    expect(notable(HALF_THE_FLOOR, A_PAIR)).toBe(false);
  });

  it("should refuse that same tail outright once a whole catalogue was looked through", () => {
    expect(notable(HALF_THE_FLOOR, A_WHOLE_CATALOGUE)).toBe(false);
  });
});
