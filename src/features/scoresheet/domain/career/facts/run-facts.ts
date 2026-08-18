import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { notable } from "#scoresheet/domain/career/facts/noise-floor.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { atLeast, atMost } from "#scoresheet/domain/career/facts/binomial-tail.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


const NOTHING = 0;

const LAST = -1;

const FIRST = 0;

const ONE_WINDOW = 1;

export const ENOUGH_TO_BOAST = 5;

export const ENOUGH_TO_HURT = 3;

type Run = readonly CareerAppearance[];

const runsOf = (
  appearances: readonly CareerAppearance[],
  belongs: (appearance: CareerAppearance) => boolean
): readonly Run[] =>
  appearances.reduce<readonly Run[]>((runs, appearance) => {
    if (!belongs(appearance)) {
      return [...runs, []];
    }

    const open = runs.at(LAST) ?? [];

    return [...runs.slice(FIRST, LAST), [...open, appearance]];
  }, []);

const longestOf = (runs: readonly Run[]): Run =>
  runs.reduce<Run>((held, run) => (run.length > held.length ? run : held), []);

const told = (
  name: typeof CareerFactName.TheCleanRun | typeof CareerFactName.TheBadPatch,
  run: Run
): CareerFact | null => {
  const opening = run[FIRST];
  const closing = run.at(LAST);

  return opening === undefined || closing === undefined
    ? null
    : { name, games: run.length, from: opening.playedOn, until: closing.playedOn };
};

const windowsFor = (played: number, run: number): number => played - run + ONE_WINDOW;

const streak = (
  subject: CareerSubject,
  name: typeof CareerFactName.TheCleanRun | typeof CareerFactName.TheBadPatch,
  least: number,
  belongs: (appearance: CareerAppearance) => boolean,
  tailOf: (length: number, rate: number) => number
): CareerFact | null => {
  const decided = subject.career.appearances.filter(
    (appearance) => appearance.finish !== Finish.Drawn
  );
  const longest = longestOf(runsOf(decided, belongs));
  const fact = longest.length < least ? null : told(name, longest);
  const windows = windowsFor(decided.length, longest.length);

  return fact !== null && notable(tailOf(longest.length, subject.tally.foolRate), windows)
    ? fact
    : null;
};

export const theCleanRun = (subject: CareerSubject): CareerFact | null =>
  streak(
    subject,
    CareerFactName.TheCleanRun,
    ENOUGH_TO_BOAST,
    (appearance) => appearance.finish !== Finish.Fool,
    (length, rate) => atMost(NOTHING, length, rate)
  );

export const theBadPatch = (subject: CareerSubject): CareerFact | null =>
  streak(
    subject,
    CareerFactName.TheBadPatch,
    ENOUGH_TO_HURT,
    (appearance) => appearance.finish === Finish.Fool,
    (length, rate) => atLeast(length, length, rate)
  );
