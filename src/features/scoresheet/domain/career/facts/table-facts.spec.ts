import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareerFactName } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";


const atLeastSpy = vi.fn();

const atMostSpy = vi.fn();

const notablePickSpy = vi.fn();

vi.mock("#scoresheet/domain/career/facts/binomial-tail.ts", () => ({
  atLeast: (wanted: number, trials: number, chance: number) => atLeastSpy(wanted, trials, chance),
  atMost: (wanted: number, trials: number, chance: number) => atMostSpy(wanted, trials, chance),
}));

vi.mock("#scoresheet/domain/career/facts/notable-pick.ts", () => ({
  notablePick: (field: unknown) => notablePickSpy(field),
}));

const { ENOUGH_AT_A_SIZE, bigTableCharm, bigTableCurse } = await import(
  "#scoresheet/domain/career/facts/table-facts.ts"
);

const NOTHING = 0;

const ONE_SHORT = 1;

const CERTAIN = 1;

const OLEG = 1;

const OLEGS_NAME = "Oleg";

const A_ROUND = 0;

const A_PLACE = 2;

const A_NIGHT = 7;

const A_DAY = "2026-05-01";

const OLEGS_SHARE = 0.61;

const A_TAIL = 0.07;

const ANOTHER_TAIL = 0.11;

const SOME_GAMES = 40;

const SOME_NIGHTS = 6;

const SOME_FOOLS = 9;

const SOME_DECIDED = 38;

const TWICE_THE_SEAT_FOOL_RATE = 0.5;

const SEAT_FOOL_RATE = 0.25;

const SOME_FIRSTS = 11;

const USUAL_FIRST_RATE = 0.28;

const SEAT_FIRST_RATE = 0.26;

const SOME_OPENS = 12;

const SOME_OPEN_RATE = 0.3;

const A_BIG_TABLE = 8;

const A_SMALL_TABLE = 4;

const A_TABLE_FOR_TWO = 2;

const EXPECTED_AT_A_BIG_TABLE = 0.25;

const EXPECTED_AT_A_SMALL_TABLE = 0.5;

const EVENLY_SKILLED_AT_A_BIG_TABLE = 0.125;

const BURNS_AT_A_BIG_TABLE = 5;

const BURNS_AT_A_SMALL_TABLE = 2;

const A_TALLY: CareerTally = {
  games: SOME_GAMES,
  evenings: SOME_NIGHTS,
  fools: SOME_FOOLS,
  decided: SOME_DECIDED,
  foolRate: TWICE_THE_SEAT_FOOL_RATE,
  expectedFoolRate: SEAT_FOOL_RATE,
  firsts: SOME_FIRSTS,
  firstRate: USUAL_FIRST_RATE,
  expectedFirstRate: SEAT_FIRST_RATE,
  opens: SOME_OPENS,
  openRate: SOME_OPEN_RATE,
};

const A_CHOSEN_FACT: CareerFact = { name: CareerFactName.NeverDealt, games: SOME_GAMES };

const appearanceAt = (seats: number, finish: Finish): CareerAppearance => ({
  round: A_ROUND,
  finish,
  position: A_PLACE,
  tableSize: seats,
  seriesNo: A_NIGHT,
  playedOn: A_DAY,
  opened: false,
});

const repeated = (
  appearance: CareerAppearance,
  times: number
): readonly CareerAppearance[] => Array.from({ length: times }, () => appearance);

const playedAt = (seats: number, burns: number, games: number): readonly CareerAppearance[] => [
  ...repeated(appearanceAt(seats, Finish.Fool), burns),
  ...repeated(appearanceAt(seats, Finish.Middle), games - burns),
];

const subjectOf = (
  appearances: readonly CareerAppearance[],
  tally: Partial<CareerTally> = {}
): CareerSubject => ({
  history: { players: [], games: [] },
  career: {
    playerId: OLEG,
    displayName: OLEGS_NAME,
    share: OLEGS_SHARE,
    appearances,
  },
  tally: { ...A_TALLY, ...tally },
  nights: [],
});

const AT_A_BIG_TABLE = playedAt(A_BIG_TABLE, BURNS_AT_A_BIG_TABLE, ENOUGH_AT_A_SIZE);

const AT_A_SMALL_TABLE = playedAt(A_SMALL_TABLE, BURNS_AT_A_SMALL_TABLE, ENOUGH_AT_A_SIZE);

const AT_BOTH_SIZES = [...AT_A_BIG_TABLE, ...AT_A_SMALL_TABLE];

const ONE_GAME_SHORT_AT_A_SMALL_TABLE = [
  ...AT_A_BIG_TABLE,
  ...playedAt(A_SMALL_TABLE, BURNS_AT_A_SMALL_TABLE, ENOUGH_AT_A_SIZE - ONE_SHORT),
];

const crowded = (name: CareerFactName, seats: number, burns: number, tail: number): unknown => ({
  fact: { name, seats, games: ENOUGH_AT_A_SIZE, burns },
  tail,
});

describe("table facts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    atLeastSpy.mockReturnValue(A_TAIL);
    atMostSpy.mockReturnValue(ANOTHER_TAIL);
    notablePickSpy.mockReturnValue(A_CHOSEN_FACT);
  });

  describe("bigTableCurse()", () => {
    it("should offer a record for every table size played exactly enough games at", () => {
      bigTableCurse(subjectOf(AT_BOTH_SIZES));

      expect(notablePickSpy).toHaveBeenCalledWith([
        crowded(CareerFactName.BigTableCurse, A_BIG_TABLE, BURNS_AT_A_BIG_TABLE, A_TAIL),
        crowded(CareerFactName.BigTableCurse, A_SMALL_TABLE, BURNS_AT_A_SMALL_TABLE, A_TAIL),
      ]);
    });

    it("should ignore a table size played one game short of enough", () => {
      bigTableCurse(subjectOf(ONE_GAME_SHORT_AT_A_SMALL_TABLE));

      expect(notablePickSpy).toHaveBeenCalledWith([
        crowded(CareerFactName.BigTableCurse, A_BIG_TABLE, BURNS_AT_A_BIG_TABLE, A_TAIL),
      ]);
    });

    it("should not count a game that ended in a draw at that size", () => {
      const drawnAsWell = [
        ...playedAt(A_BIG_TABLE, BURNS_AT_A_BIG_TABLE, ENOUGH_AT_A_SIZE - ONE_SHORT),
        appearanceAt(A_BIG_TABLE, Finish.Drawn),
      ];

      bigTableCurse(subjectOf(drawnAsWell));

      expect(notablePickSpy).toHaveBeenCalledWith([]);
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should weigh the burns at a size against that seat's share of the burning", () => {
      bigTableCurse(subjectOf(AT_BOTH_SIZES));

      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNS_AT_A_BIG_TABLE,
        ENOUGH_AT_A_SIZE,
        EXPECTED_AT_A_BIG_TABLE
      );
      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNS_AT_A_SMALL_TABLE,
        ENOUGH_AT_A_SIZE,
        EXPECTED_AT_A_SMALL_TABLE
      );
      expect(atMostSpy).not.toHaveBeenCalled();
    });

    it("should take a player with no expected fool rate as evenly skilled", () => {
      bigTableCurse(subjectOf(AT_A_BIG_TABLE, { expectedFoolRate: NOTHING }));

      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNS_AT_A_BIG_TABLE,
        ENOUGH_AT_A_SIZE,
        EVENLY_SKILLED_AT_A_BIG_TABLE
      );
    });

    it("should never expect a player to burn more often than always", () => {
      const headsUp = playedAt(A_TABLE_FOR_TWO, BURNS_AT_A_BIG_TABLE, ENOUGH_AT_A_SIZE);

      bigTableCurse(subjectOf(headsUp));

      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNS_AT_A_BIG_TABLE,
        ENOUGH_AT_A_SIZE,
        CERTAIN
      );
    });

    it("should report the fact the pick found notable", () => {
      expect(bigTableCurse(subjectOf(AT_BOTH_SIZES))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(bigTableCurse(subjectOf(AT_BOTH_SIZES))).toBeNull();
    });
  });

  describe("bigTableCharm()", () => {
    it("should offer a record for every table size played exactly enough games at", () => {
      bigTableCharm(subjectOf(AT_BOTH_SIZES));

      expect(notablePickSpy).toHaveBeenCalledWith([
        crowded(CareerFactName.BigTableCharm, A_BIG_TABLE, BURNS_AT_A_BIG_TABLE, ANOTHER_TAIL),
        crowded(
          CareerFactName.BigTableCharm,
          A_SMALL_TABLE,
          BURNS_AT_A_SMALL_TABLE,
          ANOTHER_TAIL
        ),
      ]);
    });

    it("should ignore a table size played one game short of enough", () => {
      bigTableCharm(subjectOf(ONE_GAME_SHORT_AT_A_SMALL_TABLE));

      expect(notablePickSpy).toHaveBeenCalledWith([
        crowded(CareerFactName.BigTableCharm, A_BIG_TABLE, BURNS_AT_A_BIG_TABLE, ANOTHER_TAIL),
      ]);
    });

    it("should weigh the burns at a size against that seat's share of the burning", () => {
      bigTableCharm(subjectOf(AT_BOTH_SIZES));

      expect(atMostSpy).toHaveBeenCalledWith(
        BURNS_AT_A_BIG_TABLE,
        ENOUGH_AT_A_SIZE,
        EXPECTED_AT_A_BIG_TABLE
      );
      expect(atMostSpy).toHaveBeenCalledWith(
        BURNS_AT_A_SMALL_TABLE,
        ENOUGH_AT_A_SIZE,
        EXPECTED_AT_A_SMALL_TABLE
      );
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should report the fact the pick found notable", () => {
      expect(bigTableCharm(subjectOf(AT_BOTH_SIZES))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(bigTableCharm(subjectOf(AT_BOTH_SIZES))).toBeNull();
    });
  });
});
