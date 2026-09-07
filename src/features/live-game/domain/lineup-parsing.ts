import { Problem } from "#live-game/domain/refusals.ts";
import { parseNameList, type NamesResult } from "#shared/table/name-list.ts";
import { MIN_PLAYERS, MOST_PLAYERS } from "#shared/table/table-limits.ts";


export { normalizeName, visibleName, type NamesResult } from "#shared/table/name-list.ts";
export { rotateToLowestId } from "#shared/table/seat-rotation.ts";

const COMMAND_PREFIX = /^\/[a-z_]+(@[\w]+)?\s*/i;

export type LineupResult =
  | NamesResult
  | { readonly ok: false; readonly problem: typeof Problem.TooFew }
  | { readonly ok: false; readonly problem: typeof Problem.TooMany };

export const stripCommand = (text: string): string => text.replace(COMMAND_PREFIX, "");

export const parseNames = (rawText: string): NamesResult => parseNameList(stripCommand(rawText));

export const parseLineup = (rawText: string): LineupResult => {
  const parsed = parseNames(rawText);

  if (!parsed.ok) {
    return parsed;
  }

  if (parsed.names.length < MIN_PLAYERS) {
    return { ok: false, problem: Problem.TooFew };
  }

  return parsed.names.length > MOST_PLAYERS ? { ok: false, problem: Problem.TooMany } : parsed;
};
