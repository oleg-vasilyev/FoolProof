import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";


const LAST = -1;

const FIRST = 0;

export const ENOUGH_TO_BOAST = 4;

export interface CleanStreak {
  readonly games: number;
  readonly from: string;
  readonly until: string;
}

type CleanRun = readonly CareerAppearance[];

const cleanRuns = (appearances: readonly CareerAppearance[]): readonly CleanRun[] =>
  appearances.reduce<readonly CleanRun[]>((runs, appearance) => {
    if (appearance.finish === Finish.Fool) {
      return [...runs, []];
    }

    const open = runs.at(LAST) ?? [];

    return [...runs.slice(FIRST, LAST), [...open, appearance]];
  }, []);

const asStreak = (run: CleanRun): CleanStreak | null => {
  const opening = run[FIRST];
  const closing = run.at(LAST);

  return opening === undefined || closing === undefined
    ? null
    : { games: run.length, from: opening.playedOn, until: closing.playedOn };
};

export const longestCleanStreak = (
  appearances: readonly CareerAppearance[]
): CleanStreak | null => {
  const longest = cleanRuns(appearances).reduce<CleanRun>(
    (held, run) => (run.length > held.length ? run : held),
    []
  );

  return longest.length < ENOUGH_TO_BOAST ? null : asStreak(longest);
};
