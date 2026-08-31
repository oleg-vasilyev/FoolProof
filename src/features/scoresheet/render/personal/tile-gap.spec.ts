import { describe, expect, it } from "vitest";
import { Standing } from "#scoresheet/render/personal/tile-standings.ts";
import { ENOUGH_TO_JUDGE, gapOf } from "#scoresheet/render/personal/tile-gap.ts";


const HIGHER_IS_BETTER = true;

const HIGHER_IS_WORSE = false;

const A_LONG_RECORD = 40;

const TOO_FEW = ENOUGH_TO_JUDGE - 1;

const AN_EVEN_SEAT = 0.2;

const WELL_ABOVE = 0.55;

const WELL_BELOW = 0.05;

const A_HAIR_ABOVE = 0.21;

describe("gapOf()", () => {
  it("should call a figure above its expectation better when higher is better", () => {
    expect(gapOf(WELL_ABOVE, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_BETTER).standing).toBe(
      Standing.Better
    );
  });

  it("should call the same figure worse when higher is worse", () => {
    expect(gapOf(WELL_ABOVE, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_WORSE).standing).toBe(
      Standing.Worse
    );
  });

  it("should call being the fool less often than the seat predicts better", () => {
    expect(gapOf(WELL_BELOW, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_WORSE).standing).toBe(
      Standing.Better
    );
  });

  it("should call falling short of an expectation worse when higher is better", () => {
    expect(gapOf(WELL_BELOW, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_BETTER).standing).toBe(
      Standing.Worse
    );
  });

  it("should call a figure sitting on its expectation level", () => {
    expect(gapOf(AN_EVEN_SEAT, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_BETTER).standing).toBe(
      Standing.Level
    );
  });

  it("should count a hair either way as level rather than as a verdict", () => {
    expect(gapOf(A_HAIR_ABOVE, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_BETTER).standing).toBe(
      Standing.Level
    );
  });

  it("should call a figure exactly on the level threshold a verdict, not level", () => {
    const A_SHADE_OVER = AN_EVEN_SEAT + 0.015;

    expect(gapOf(A_SHADE_OVER, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_BETTER).standing).toBe(
      Standing.Better
    );
  });

  it("should refuse to judge a record too short to mean anything", () => {
    expect(gapOf(WELL_ABOVE, AN_EVEN_SEAT, TOO_FEW, HIGHER_IS_BETTER).standing).toBe(
      Standing.Unproven
    );
  });

  it("should judge a record exactly long enough", () => {
    expect(gapOf(WELL_ABOVE, AN_EVEN_SEAT, ENOUGH_TO_JUDGE, HIGHER_IS_BETTER).standing).toBe(
      Standing.Better
    );
  });

  it("should span from the lower of the two figures to the higher, whichever is which", () => {
    expect(gapOf(WELL_BELOW, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_BETTER)).toEqual({
      standing: Standing.Worse,
      from: WELL_BELOW,
      to: AN_EVEN_SEAT,
    });
  });

  it("should span the same way round when the figure is the higher one", () => {
    expect(gapOf(WELL_ABOVE, AN_EVEN_SEAT, A_LONG_RECORD, HIGHER_IS_BETTER)).toEqual({
      standing: Standing.Better,
      from: AN_EVEN_SEAT,
      to: WELL_ABOVE,
    });
  });
});
