import { fromBase62, toBase62 } from "#live-game/render/callback-data-codec.ts";


const PADDING = "0";

const ALL_BASE_62 = /^[0-9A-Za-z]+$/;

const NO_SEATS = 0;

const NARROWEST = 0;

const A_WIDTH_DIGIT = 1;

const FIRST = 0;

const NOT_AT_THE_TABLE = -1;

export const toBase62Row = (ids: readonly number[]): string => {
  const written = ids.map(toBase62);
  const width = written.reduce((widest, one) => Math.max(widest, one.length), NARROWEST);

  return [toBase62(width), ...written.map((one) => one.padStart(width, PADDING))].join("");
};

export const fromBase62Row = (row: string): readonly number[] | null => {
  const width = fromBase62(row.slice(FIRST, A_WIDTH_DIGIT));
  const ids = row.slice(A_WIDTH_DIGIT);
  const seats = ids.length / width;

  if (!ALL_BASE_62.test(row) || !Number.isInteger(seats) || seats === NO_SEATS) {
    return null;
  }

  return Array.from({ length: seats }, (_unused, at) =>
    fromBase62(ids.slice(at * width, at * width + width))
  );
};

export const marksOf = (order: readonly number[], marked: readonly number[]): string =>
  marked
    .map((playerId) => order.indexOf(playerId))
    .filter((seat) => seat !== NOT_AT_THE_TABLE)
    .map(toBase62)
    .join("");

export const seatsOf = (order: readonly number[], marks: string): readonly number[] | null => {
  const seats = [...marks].map((digit) => order[fromBase62(digit)]);
  const known = seats.every((playerId) => playerId !== undefined);

  return known && new Set(seats).size === seats.length ? seats : null;
};
