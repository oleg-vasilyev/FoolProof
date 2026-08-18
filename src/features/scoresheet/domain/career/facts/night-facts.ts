import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { atLeast } from "#scoresheet/domain/career/facts/binomial-tail.ts";
import { notablePick } from "#scoresheet/domain/career/facts/notable-pick.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";
import type { Rare } from "#scoresheet/domain/career/facts/rarest-of.ts";


export const ENOUGH_GAMES_IN_A_NIGHT = 4;

const worthJudging = (
  nights: readonly EveningShare[],
  played: (night: EveningShare) => number
): readonly EveningShare[] => nights.filter((night) => played(night) >= ENOUGH_GAMES_IN_A_NIGHT);

const decidedIn = (night: EveningShare): number => night.decided;

const playedIn = (night: EveningShare): number => night.games;

export const theNightmare = (subject: CareerSubject): CareerFact | null =>
  notablePick(
    worthJudging(subject.nights, decidedIn).map<Rare<CareerFact>>((night) => ({
      fact: {
        name: CareerFactName.TheNightmare,
        playedOn: night.playedOn,
        games: night.decided,
        burns: night.fools,
      },
      tail: atLeast(night.fools, night.decided, subject.tally.foolRate),
    }))
  );

export const theBlinder = (subject: CareerSubject): CareerFact | null =>
  notablePick(
    worthJudging(subject.nights, playedIn).map<Rare<CareerFact>>((night) => ({
      fact: {
        name: CareerFactName.TheBlinder,
        playedOn: night.playedOn,
        games: night.games,
        firsts: night.firsts,
      },
      tail: atLeast(night.firsts, night.games, subject.tally.firstRate),
    }))
  );
