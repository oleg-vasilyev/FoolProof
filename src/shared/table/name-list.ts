import { NameProblem } from "#shared/table/name-problems.ts";
import { LONGEST_NAME } from "#shared/table/table-limits.ts";


const NAME_SEPARATORS = /,|->|→|>|\r?\n/;

const INVISIBLE = /[\p{Cf}\p{Cc}]/gu;

const NOTHING = 0;

export type NamesResult =
  | { readonly ok: true; readonly names: readonly string[] }
  | { readonly ok: false; readonly problem: typeof NameProblem.Empty }
  | {
      readonly ok: false;
      readonly problem: typeof NameProblem.Duplicates;
      readonly names: readonly string[];
    }
  | { readonly ok: false; readonly problem: typeof NameProblem.TooLong; readonly names: readonly string[] };

export const visibleName = (name: string): string => name.replaceAll(INVISIBLE, "").trim();

export const normalizeName = (name: string): string =>
  name.normalize("NFC").toLowerCase().replaceAll("ё", "е");

const overLong = (names: readonly string[]): readonly string[] =>
  names.filter((name) => [...name].length > LONGEST_NAME);

const duplicatesIn = (names: readonly string[]): readonly string[] => {
  const seen = new Set<string>();

  return names.filter((name) => {
    const key = normalizeName(name);
    const repeated = seen.has(key);
    seen.add(key);

    return repeated;
  });
};

export const parseNameList = (text: string): NamesResult => {
  const names = text
    .split(NAME_SEPARATORS)
    .map(visibleName)
    .filter((name) => name.length > NOTHING);

  if (names.length === NOTHING) {
    return { ok: false, problem: NameProblem.Empty };
  }

  const tooLong = overLong(names);
  if (tooLong.length > NOTHING) {
    return { ok: false, problem: NameProblem.TooLong, names: tooLong };
  }

  const repeated = duplicatesIn(names);
  if (repeated.length > NOTHING) {
    return { ok: false, problem: NameProblem.Duplicates, names: repeated };
  }

  return { ok: true, names };
};
