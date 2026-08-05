import { MIN_PLAYERS, MOST_PLAYERS, type Seat } from "#live-game/domain/card-state.ts";
import { normalizeName } from "#live-game/domain/lineup-parsing.ts";


export type TableChange =
  | { readonly ok: true; readonly seats: readonly Seat[] }
  | { readonly ok: false; readonly problem: "unknown_names"; readonly names: readonly string[] }
  | { readonly ok: false; readonly problem: "too_few" }
  | { readonly ok: false; readonly problem: "too_many" };

const keysOf = (seats: readonly Seat[]): ReadonlySet<string> =>
  new Set(seats.map((seat) => normalizeName(seat.displayName)));

export const alreadySeated = (
  seats: readonly Seat[],
  names: readonly string[]
): readonly string[] => {
  const seated = keysOf(seats);

  return names.filter((name) => seated.has(normalizeName(name)));
};

export const tableWith = (
  seats: readonly Seat[],
  joining: readonly Seat[]
): TableChange => {
  const seated = [...seats, ...joining];

  return seated.length > MOST_PLAYERS
    ? { ok: false, problem: "too_many" }
    : { ok: true, seats: seated };
};

export const tableWithout = (
  seats: readonly Seat[],
  names: readonly string[]
): TableChange => {
  const seated = keysOf(seats);
  const unknown = names.filter((name) => !seated.has(normalizeName(name)));

  if (unknown.length > 0) {
    return { ok: false, problem: "unknown_names", names: unknown };
  }

  const leaving = new Set(names.map(normalizeName));
  const staying = seats.filter((seat) => !leaving.has(normalizeName(seat.displayName)));

  if (staying.length < MIN_PLAYERS) {
    return { ok: false, problem: "too_few" };
  }

  return { ok: true, seats: staying };
};
