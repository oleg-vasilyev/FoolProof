import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";


const NOTHING = 0;

const FIRST = 0;

const ONE_NIGHT = 1;

const NEVER_YET = -1;

export const ENOUGH_EVENINGS_BEHIND = 6;

export const STILL_NEW_AFTER = 2;

export const ENOUGH_GAMES_TO_COUNT = 3;

export const LONG_ENOUGH_AWAY = 4;

const eveningsHere = (subject: CareerSubject): readonly number[] =>
  [...new Set(subject.history.games.map((game) => game.seriesNo))].sort(
    (one, other) => one - other
  );

const missedBefore = (
  here: readonly number[],
  played: readonly number[],
  evening: number
): number => {
  const standing = here.indexOf(evening);
  const lastSeen = here
    .slice(FIRST, standing)
    .reduce((seen, other, at) => (played.includes(other) ? at : seen), NEVER_YET);

  return lastSeen === NEVER_YET ? NOTHING : standing - lastSeen - ONE_NIGHT;
};

const settledIn = (subject: CareerSubject): boolean =>
  eveningsHere(subject).length >= ENOUGH_EVENINGS_BEHIND;

export const everPresent = (subject: CareerSubject): CareerFact | null => {
  const here = eveningsHere(subject);

  return settledIn(subject) && subject.nights.length === here.length
    ? { name: CareerFactName.EverPresent, evenings: subject.nights.length }
    : null;
};

export const foundingMember = (subject: CareerSubject): CareerFact | null => {
  const here = eveningsHere(subject);
  const opening = subject.nights[FIRST];

  return settledIn(subject) && opening !== undefined && opening.seriesNo === here[FIRST]
    ? {
        name: CareerFactName.FoundingMember,
        playedOn: opening.playedOn,
        evenings: here.length,
      }
    : null;
};

export const theNewcomer = (subject: CareerSubject): CareerFact | null =>
  settledIn(subject) &&
  subject.nights.length <= STILL_NEW_AFTER &&
  subject.career.appearances.length >= ENOUGH_GAMES_TO_COUNT
    ? {
        name: CareerFactName.TheNewcomer,
        evenings: subject.nights.length,
        games: subject.career.appearances.length,
      }
    : null;

interface Comeback {
  readonly night: EveningShare;
  readonly missed: number;
}

const longestAbsence = (subject: CareerSubject): Comeback | null => {
  const here = eveningsHere(subject);
  const played = subject.nights.map((night) => night.seriesNo);

  return subject.nights
    .map((night) => ({ night, missed: missedBefore(here, played, night.seriesNo) }))
    .reduce<Comeback | null>(
      (held, coming) => (held === null || coming.missed > held.missed ? coming : held),
      null
    );
};

export const theHomecoming = (subject: CareerSubject): CareerFact | null => {
  const back = longestAbsence(subject);

  return back !== null && back.missed >= LONG_ENOUGH_AWAY
    ? {
        name: CareerFactName.TheHomecoming,
        missed: back.missed,
        playedOn: back.night.playedOn,
      }
    : null;
};
