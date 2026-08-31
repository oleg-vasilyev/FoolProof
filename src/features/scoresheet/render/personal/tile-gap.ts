import { Standing } from "#scoresheet/render/personal/tile-standings.ts";


const LEVEL_ENOUGH = 0.015;

export const ENOUGH_TO_JUDGE = 10;

export interface Gap {
  readonly standing: Standing;
  readonly from: number;
  readonly to: number;
}

const standingOf = (value: number, expected: number, favours: boolean): Standing => {
  if (Math.abs(value - expected) < LEVEL_ENOUGH) {
    return Standing.Level;
  }

  return value > expected === favours ? Standing.Better : Standing.Worse;
};

export const gapOf = (
  value: number,
  expected: number,
  decided: number,
  favours: boolean
): Gap => ({
  standing:
    decided < ENOUGH_TO_JUDGE ? Standing.Unproven : standingOf(value, expected, favours),
  from: Math.min(value, expected),
  to: Math.max(value, expected),
});
