import { describe, expect, it } from "vitest";
import { atLeast, atMost } from "#scoresheet/domain/career/facts/binomial-tail.ts";


const NEVER = 0;

const ALWAYS = 1;

const NO_TRIALS = 0;

const TEN_TOSSES = 10;

const ONE_TOSS_TOO_MANY = 11;

const A_THOUSAND_TOSSES = 1000;

const A_FAIR_COIN = 0.5;

const A_LONG_SHOT = 0.05;

const A_LOADED_COIN = 0.3;

const NO_CHANCE = 0;

const A_CERTAINTY = 1;

const NONE = 0;

const ONE = 1;

const TWO = 2;

const HALF_OF_TEN = 5;

const THE_TOSS_BELOW_THE_SPLIT = 7;

const THE_TOSS_THE_TAILS_SPLIT_AT = 8;

const ALL_BUT_ONE_OF_TEN = 9;

const A_THIRD_OF_TEN = 3;

const A_CLEAR_EDGE_IN_A_THOUSAND = 600;

const A_LANDSLIDE_IN_A_THOUSAND = 700;

const THE_SAME_EDGE_THE_OTHER_WAY = 400;

const EIGHT_OR_MORE_IN_TEN = 56 / 1024;

const HALF_OF_TEN_OR_MORE_IN_TEN = 638 / 1024;

const TEN_IN_TEN = 1 / 1024;

const AT_LEAST_ONE_LONG_SHOT = 0.4012630607616213;

const A_NEAR_CERTAINTY = 0.95;

const AT_MOST_ALL_BUT_ONE_OF_TEN_NEAR_CERTAINTIES = 0.4012630607616213;

const A_THIRD_OF_TEN_OR_MORE_LOADED = 0.6172172136;

const TO_FIFTEEN_PLACES = 15;

const TO_TEN_PLACES = 10;

const A_BILLIONTH = 1e-9;

const VANISHINGLY_SMALL = 1e-30;

describe("atLeast()", () => {
  it("should give the upper tail of a fair coin its textbook mass", () => {
    expect(atLeast(THE_TOSS_THE_TAILS_SPLIT_AT, TEN_TOSSES, A_FAIR_COIN)).toBeCloseTo(
      EIGHT_OR_MORE_IN_TEN,
      TO_FIFTEEN_PLACES
    );
  });

  it("should count the mode itself as part of the tail", () => {
    expect(atLeast(HALF_OF_TEN, TEN_TOSSES, A_FAIR_COIN)).toBeCloseTo(
      HALF_OF_TEN_OR_MORE_IN_TEN,
      TO_FIFTEEN_PLACES
    );
  });

  it("should walk a tail that sits below the mode of a loaded coin", () => {
    expect(atLeast(A_THIRD_OF_TEN, TEN_TOSSES, A_LOADED_COIN)).toBeCloseTo(
      A_THIRD_OF_TEN_OR_MORE_LOADED,
      TO_TEN_PLACES
    );
  });

  it("should walk upward from a mode of zero", () => {
    expect(atLeast(ONE, TEN_TOSSES, A_LONG_SHOT)).toBeCloseTo(
      AT_LEAST_ONE_LONG_SHOT,
      TO_FIFTEEN_PLACES
    );
  });

  it("should call wanting none of them certain", () => {
    expect(atLeast(NONE, TEN_TOSSES, A_FAIR_COIN)).toBe(ALWAYS);
  });

  it("should call wanting more than were tried impossible", () => {
    expect(atLeast(ONE_TOSS_TOO_MANY, TEN_TOSSES, A_FAIR_COIN)).toBe(NEVER);
  });

  it("should leave every trial happening the single mass it has", () => {
    expect(atLeast(TEN_TOSSES, TEN_TOSSES, A_FAIR_COIN)).toBeCloseTo(
      TEN_IN_TEN,
      TO_FIFTEEN_PLACES
    );
  });

  it("should leave nothing outside the two tails it splits at", () => {
    const upper = atLeast(THE_TOSS_THE_TAILS_SPLIT_AT, TEN_TOSSES, A_FAIR_COIN);
    const lower = atMost(THE_TOSS_BELOW_THE_SPLIT, TEN_TOSSES, A_FAIR_COIN);

    expect(upper + lower).toBeCloseTo(ALWAYS, TO_FIFTEEN_PLACES);
  });

  it("should call wanting one of nothing impossible, since nothing was tried", () => {
    expect(atLeast(ONE, NO_TRIALS, A_FAIR_COIN)).toBe(NEVER);
  });

  it("should call wanting none of nothing certain too", () => {
    expect(atLeast(NONE, NO_TRIALS, A_FAIR_COIN)).toBe(ALWAYS);
  });

  it("should call wanting one of something that never happens impossible", () => {
    expect(atLeast(ONE, TEN_TOSSES, NO_CHANCE)).toBe(NEVER);
  });

  it("should call wanting none of something that never happens certain", () => {
    expect(atLeast(NONE, TEN_TOSSES, NO_CHANCE)).toBe(ALWAYS);
  });

  it("should call wanting every trial of something that always happens certain", () => {
    expect(atLeast(TEN_TOSSES, TEN_TOSSES, A_CERTAINTY)).toBe(ALWAYS);
  });

  it("should call wanting more than were tried of something that always happens impossible", () => {
    expect(atLeast(ONE_TOSS_TOO_MANY, TEN_TOSSES, A_CERTAINTY)).toBe(NEVER);
  });

  it("should keep a far tail of a thousand trials a small positive number", () => {
    const tail = atLeast(A_CLEAR_EDGE_IN_A_THOUSAND, A_THOUSAND_TOSSES, A_FAIR_COIN);

    expect(Number.isFinite(tail)).toBe(true);
    expect(tail).toBeGreaterThan(NEVER);
    expect(tail).toBeLessThan(A_BILLIONTH);
  });

  it("should not underflow to nothing at the very edge of a thousand trials", () => {
    const tail = atLeast(A_LANDSLIDE_IN_A_THOUSAND, A_THOUSAND_TOSSES, A_FAIR_COIN);

    expect(Number.isFinite(tail)).toBe(true);
    expect(tail).toBeGreaterThan(NEVER);
    expect(tail).toBeLessThan(VANISHINGLY_SMALL);
  });
});

describe("atMost()", () => {
  it("should give the lower tail of a fair coin the mass its mirror has", () => {
    expect(atMost(TWO, TEN_TOSSES, A_FAIR_COIN)).toBeCloseTo(
      EIGHT_OR_MORE_IN_TEN,
      TO_FIFTEEN_PLACES
    );
  });

  it("should walk downward from a mode sitting on the last trial", () => {
    expect(atMost(ALL_BUT_ONE_OF_TEN, TEN_TOSSES, A_NEAR_CERTAINTY)).toBeCloseTo(
      AT_MOST_ALL_BUT_ONE_OF_TEN_NEAR_CERTAINTIES,
      TO_FIFTEEN_PLACES
    );
  });

  it("should call allowing every trial certain", () => {
    expect(atMost(TEN_TOSSES, TEN_TOSSES, A_FAIR_COIN)).toBe(ALWAYS);
  });

  it("should call allowing anything certain when nothing was tried", () => {
    expect(atMost(NONE, NO_TRIALS, A_FAIR_COIN)).toBe(ALWAYS);
  });

  it("should call allowing none of something that never happens certain", () => {
    expect(atMost(NONE, TEN_TOSSES, NO_CHANCE)).toBe(ALWAYS);
  });

  it("should call allowing every trial of something that always happens certain", () => {
    expect(atMost(TEN_TOSSES, TEN_TOSSES, A_CERTAINTY)).toBe(ALWAYS);
  });

  it("should call allowing one short of every trial of a certainty impossible", () => {
    expect(atMost(ALL_BUT_ONE_OF_TEN, TEN_TOSSES, A_CERTAINTY)).toBe(NEVER);
  });

  it("should keep the far lower tail of a thousand trials a small positive number", () => {
    const tail = atMost(THE_SAME_EDGE_THE_OTHER_WAY, A_THOUSAND_TOSSES, A_FAIR_COIN);

    expect(Number.isFinite(tail)).toBe(true);
    expect(tail).toBeGreaterThan(NEVER);
    expect(tail).toBeLessThan(A_BILLIONTH);
  });

  it("should not underflow to nothing where the naive product would overflow", () => {
    const tail = atMost(TWO, A_THOUSAND_TOSSES, A_FAIR_COIN);

    expect(Number.isFinite(tail)).toBe(true);
    expect(tail).toBeGreaterThan(NEVER);
    expect(tail).toBeLessThan(VANISHINGLY_SMALL);
  });
});
