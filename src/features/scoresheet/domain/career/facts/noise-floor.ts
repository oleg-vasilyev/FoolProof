export const NOISE_FLOOR = 0.01;

export const notable = (tail: number, candidates: number): boolean =>
  tail * candidates < NOISE_FLOOR;
