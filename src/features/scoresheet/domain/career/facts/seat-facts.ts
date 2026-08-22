import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { atLeast, atMost } from "#scoresheet/domain/career/facts/binomial-tail.ts";
import { notablePick } from "#scoresheet/domain/career/facts/notable-pick.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


export const ENOUGH_DECIDED = 20;

const againstTheSeat = (
  subject: CareerSubject,
  name: typeof CareerFactName.LightningRod | typeof CareerFactName.TheSurvivor,
  tail: (burns: number, decided: number, expected: number) => number
): CareerFact | null =>
  subject.tally.decided < ENOUGH_DECIDED
    ? null
    : notablePick([
        {
          fact: {
            name,
            games: subject.tally.decided,
            burns: subject.tally.fools,
            expected: subject.tally.seatChanceInDecided,
            rate: subject.tally.foolRate,
          },
          tail: tail(subject.tally.fools, subject.tally.decided, subject.tally.seatChanceInDecided),
        },
      ]);

export const lightningRod = (subject: CareerSubject): CareerFact | null =>
  againstTheSeat(subject, CareerFactName.LightningRod, atLeast);

export const theSurvivor = (subject: CareerSubject): CareerFact | null =>
  againstTheSeat(subject, CareerFactName.TheSurvivor, atMost);
