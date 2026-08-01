import { MIN_PLAYERS } from "#live-game/domain/card-state.ts";


const COMMAND_PREFIX = /^\/[a-z_]+(@[\w]+)?\s*/i;

const NAME_SEPARATORS = /,|->|→|>|\r?\n/;

export type NamesResult =
  | { readonly ok: true; readonly names: readonly string[] }
  | { readonly ok: false; readonly problem: "empty" }
  | { readonly ok: false; readonly problem: "duplicates"; readonly names: readonly string[] };

export type LineupResult = NamesResult | { readonly ok: false; readonly problem: "too_few" };

export const stripCommand = (text: string): string => text.replace(COMMAND_PREFIX, "");

export const normalizeName = (name: string): string =>
  name.normalize("NFC").toLowerCase().replaceAll("ё", "е");

const duplicatesIn = (names: readonly string[]): readonly string[] => {
  const seen = new Set<string>();

  return names.filter((name) => {
    const key = normalizeName(name);
    const repeated = seen.has(key);
    seen.add(key);

    return repeated;
  });
};

export const parseNames = (rawText: string): NamesResult => {
  const names = stripCommand(rawText)
    .split(NAME_SEPARATORS)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  if (names.length === 0) {
    return { ok: false, problem: "empty" };
  }

  const repeated = duplicatesIn(names);
  if (repeated.length > 0) {
    return { ok: false, problem: "duplicates", names: repeated };
  }

  return { ok: true, names };
};

export const parseLineup = (rawText: string): LineupResult => {
  const parsed = parseNames(rawText);

  if (parsed.ok && parsed.names.length < MIN_PLAYERS) {
    return { ok: false, problem: "too_few" };
  }

  return parsed;
};

export const rotateToLowestId = <T extends { readonly playerId: number }>(
  seats: readonly T[]
): readonly T[] => {
  const pivot = seats.reduce(
    (lowest, seat, index) =>
      seat.playerId < lowest.playerId ? { playerId: seat.playerId, index } : lowest,
    { playerId: Number.POSITIVE_INFINITY, index: 0 }
  );

  return [...seats.slice(pivot.index), ...seats.slice(0, pivot.index)];
};
