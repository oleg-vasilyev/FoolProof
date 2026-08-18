import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { atLeast, atMost } from "#scoresheet/domain/career/facts/binomial-tail.ts";
import { notablePick } from "#scoresheet/domain/career/facts/notable-pick.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { Rare } from "#scoresheet/domain/career/facts/rarest-of.ts";


const NOTHING = 0;

const ONE_SEAT = 1;

const EVEN_SKILL = 1;

const CERTAIN = 1;

export const ENOUGH_AT_A_SIZE = 12;

interface AtSize {
  readonly seats: number;
  readonly games: number;
  readonly burns: number;
}

const skillOf = (subject: CareerSubject): number =>
  subject.tally.expectedFoolRate === NOTHING
    ? EVEN_SKILL
    : subject.tally.foolRate / subject.tally.expectedFoolRate;

const expectedAt = (seats: number, skill: number): number =>
  Math.min(CERTAIN, (skill * ONE_SEAT) / seats);

const bySize = (appearances: readonly CareerAppearance[]): readonly AtSize[] => {
  const decided = appearances.filter((appearance) => appearance.finish !== Finish.Drawn);
  const seatings = [...new Set(decided.map((appearance) => appearance.tableSize))];

  return seatings
    .map((seats) => {
      const played = decided.filter((appearance) => appearance.tableSize === seats);

      return {
        seats,
        games: played.length,
        burns: played.filter((appearance) => appearance.finish === Finish.Fool).length,
      };
    })
    .filter((size) => size.games >= ENOUGH_AT_A_SIZE);
};

const atSizeField = (
  subject: CareerSubject,
  name: typeof CareerFactName.BigTableCurse | typeof CareerFactName.BigTableCharm,
  tailOf: (size: AtSize, expected: number) => number
): readonly Rare<CareerFact>[] => {
  const skill = skillOf(subject);

  return bySize(subject.career.appearances).map<Rare<CareerFact>>((size) => ({
    fact: { name, seats: size.seats, games: size.games, burns: size.burns },
    tail: tailOf(size, expectedAt(size.seats, skill)),
  }));
};

export const bigTableCurse = (subject: CareerSubject): CareerFact | null =>
  notablePick(
    atSizeField(subject, CareerFactName.BigTableCurse, (size, expected) =>
      atLeast(size.burns, size.games, expected)
    )
  );

export const bigTableCharm = (subject: CareerSubject): CareerFact | null =>
  notablePick(
    atSizeField(subject, CareerFactName.BigTableCharm, (size, expected) =>
      atMost(size.burns, size.games, expected)
    )
  );
