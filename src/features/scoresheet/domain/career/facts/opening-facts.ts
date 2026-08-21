import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { atLeast } from "#scoresheet/domain/career/facts/binomial-tail.ts";
import { notablePick } from "#scoresheet/domain/career/facts/notable-pick.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


const NOTHING = 0;

export const ENOUGH_OPENINGS = 10;

export const ENOUGH_GAMES_TO_NOTICE = 15;

const opened = (appearances: readonly CareerAppearance[]): readonly CareerAppearance[] =>
  appearances.filter((appearance) => appearance.opened);

const decidedOf = (appearances: readonly CareerAppearance[]): readonly CareerAppearance[] =>
  appearances.filter((appearance) => appearance.finish !== Finish.Drawn);

const finishing = (
  appearances: readonly CareerAppearance[],
  finish: Finish
): number => appearances.filter((appearance) => appearance.finish === finish).length;

export const openersCurse = (subject: CareerSubject): CareerFact | null => {
  const opens = decidedOf(opened(subject.career.appearances));

  if (opens.length < ENOUGH_OPENINGS) {
    return null;
  }

  const burns = finishing(opens, Finish.Fool);

  return notablePick([
    {
      fact: { name: CareerFactName.OpenersCurse, opens: opens.length, burns },
      tail: atLeast(burns, opens.length, subject.tally.foolRate),
    },
  ]);
};

export const openersGift = (subject: CareerSubject): CareerFact | null => {
  const opens = opened(subject.career.appearances);

  if (opens.length < ENOUGH_OPENINGS) {
    return null;
  }

  const firsts = finishing(opens, Finish.First);

  return notablePick([
    {
      fact: { name: CareerFactName.OpenersGift, opens: opens.length, firsts },
      tail: atLeast(firsts, opens.length, subject.tally.firstRate),
    },
  ]);
};

export const theHeadStart = (subject: CareerSubject): CareerFact | null => {
  const games = subject.career.appearances.length;

  if (games < ENOUGH_GAMES_TO_NOTICE) {
    return null;
  }

  return notablePick([
    {
      fact: { name: CareerFactName.TheHeadStart, games, opens: subject.tally.opens },
      tail: atLeast(subject.tally.opens, games, subject.tally.seatChance),
    },
  ]);
};

export const neverWentFirst = (subject: CareerSubject): CareerFact | null => {
  const games = subject.career.appearances.length;
  const openedBySomebody = subject.history.games.filter(
    (game) => game.starterId !== null
  ).length;

  return subject.tally.opens === NOTHING &&
    games >= ENOUGH_GAMES_TO_NOTICE &&
    openedBySomebody >= ENOUGH_GAMES_TO_NOTICE
    ? { name: CareerFactName.NeverWentFirst, games }
    : null;
};
