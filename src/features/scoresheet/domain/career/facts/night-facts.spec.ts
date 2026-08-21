import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareerFactName } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";


const atLeastSpy = vi.fn();

const notablePickSpy = vi.fn();

vi.mock("#scoresheet/domain/career/facts/binomial-tail.ts", () => ({
  atLeast: (wanted: number, trials: number, chance: number) => atLeastSpy(wanted, trials, chance),
}));

vi.mock("#scoresheet/domain/career/facts/notable-pick.ts", () => ({
  notablePick: (field: unknown) => notablePickSpy(field),
}));

const { ENOUGH_GAMES_IN_A_NIGHT, theBlinder, theNightmare } = await import(
  "#scoresheet/domain/career/facts/night-facts.ts"
);

const ONE_SHORT = 1;

const OLEG = 1;

const OLEGS_NAME = "Oleg";

const OLEGS_SHARE = 0.61;

const A_NIGHT = 7;

const ANOTHER_NIGHT = 8;

const A_THIRD_NIGHT = 9;

const A_DAY = "2026-05-01";

const NEXT_DAY = "2026-05-08";

const A_LATER_DAY = "2026-05-15";

const A_TAIL = 0.07;

const A_SHARE = 0.8;

const ANOTHER_SHARE = 0.4;

const SOME_GAMES = 40;

const SOME_NIGHTS = 6;

const SOME_FOOLS = 9;

const SOME_DECIDED = 38;

const USUAL_FOOL_RATE = 0.23;

const SEAT_FOOL_RATE = 0.25;

const SOME_FIRSTS = 11;

const USUAL_FIRST_RATE = 0.28;

const SEAT_FIRST_RATE = 0.26;

const SOME_OPENS = 12;

const SOME_OPEN_RATE = 0.3;

const GAMES_IN_A_LONG_NIGHT = 6;

const DECIDED_IN_A_LONG_NIGHT = 5;

const BURNS_IN_A_LONG_NIGHT = 2;

const FIRSTS_IN_A_LONG_NIGHT = 3;

const BURNS_IN_A_SHORT_NIGHT = 1;

const FIRSTS_IN_A_SHORT_NIGHT = 2;

const A_TALLY: CareerTally = {
  games: SOME_GAMES,
  evenings: SOME_NIGHTS,
  fools: SOME_FOOLS,
  decided: SOME_DECIDED,
  foolRate: USUAL_FOOL_RATE,
  seatChanceInDecided: SEAT_FOOL_RATE,
  firsts: SOME_FIRSTS,
  firstRate: USUAL_FIRST_RATE,
  seatChance: SEAT_FIRST_RATE,
  opens: SOME_OPENS,
  openRate: SOME_OPEN_RATE,
};

const A_CHOSEN_FACT: CareerFact = { name: CareerFactName.NeverWentFirst, games: SOME_GAMES };

const A_LONG_NIGHT: EveningShare = {
  seriesNo: A_NIGHT,
  playedOn: A_DAY,
  games: GAMES_IN_A_LONG_NIGHT,
  decided: DECIDED_IN_A_LONG_NIGHT,
  fools: BURNS_IN_A_LONG_NIGHT,
  firsts: FIRSTS_IN_A_LONG_NIGHT,
  share: A_SHARE,
};

const A_NIGHT_OF_JUST_ENOUGH: EveningShare = {
  seriesNo: ANOTHER_NIGHT,
  playedOn: NEXT_DAY,
  games: ENOUGH_GAMES_IN_A_NIGHT,
  decided: ENOUGH_GAMES_IN_A_NIGHT,
  fools: BURNS_IN_A_SHORT_NIGHT,
  firsts: FIRSTS_IN_A_SHORT_NIGHT,
  share: ANOTHER_SHARE,
};

const A_NIGHT_CUT_SHORT: EveningShare = {
  seriesNo: A_THIRD_NIGHT,
  playedOn: A_LATER_DAY,
  games: ENOUGH_GAMES_IN_A_NIGHT - ONE_SHORT,
  decided: ENOUGH_GAMES_IN_A_NIGHT - ONE_SHORT,
  fools: BURNS_IN_A_SHORT_NIGHT,
  firsts: FIRSTS_IN_A_SHORT_NIGHT,
  share: ANOTHER_SHARE,
};

const subjectOf = (nights: readonly EveningShare[]): CareerSubject => ({
  history: { players: [], games: [] },
  career: {
    playerId: OLEG,
    displayName: OLEGS_NAME,
    share: OLEGS_SHARE,
    appearances: [],
  },
  tally: A_TALLY,
  nights,
});

const EVERY_NIGHT = [A_LONG_NIGHT, A_NIGHT_OF_JUST_ENOUGH, A_NIGHT_CUT_SHORT];

describe("night facts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    atLeastSpy.mockReturnValue(A_TAIL);
    notablePickSpy.mockReturnValue(A_CHOSEN_FACT);
  });

  describe("theNightmare()", () => {
    it("should offer the burns of every night long enough to judge", () => {
      theNightmare(subjectOf(EVERY_NIGHT));

      expect(notablePickSpy).toHaveBeenCalledWith([
        {
          fact: {
            name: CareerFactName.TheNightmare,
            playedOn: A_DAY,
            games: DECIDED_IN_A_LONG_NIGHT,
            burns: BURNS_IN_A_LONG_NIGHT,
          },
          tail: A_TAIL,
        },
        {
          fact: {
            name: CareerFactName.TheNightmare,
            playedOn: NEXT_DAY,
            games: ENOUGH_GAMES_IN_A_NIGHT,
            burns: BURNS_IN_A_SHORT_NIGHT,
          },
          tail: A_TAIL,
        },
      ]);
    });

    it("should weigh a night's burns over its decided games against the career fool rate", () => {
      theNightmare(subjectOf([A_LONG_NIGHT]));

      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNS_IN_A_LONG_NIGHT,
        DECIDED_IN_A_LONG_NIGHT,
        USUAL_FOOL_RATE
      );
    });

    it("should offer nothing about a night one game short of enough", () => {
      theNightmare(subjectOf([A_NIGHT_CUT_SHORT]));

      expect(notablePickSpy).toHaveBeenCalledWith([]);
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should report the fact the pick found notable", () => {
      expect(theNightmare(subjectOf(EVERY_NIGHT))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(theNightmare(subjectOf(EVERY_NIGHT))).toBeNull();
    });
  });

  describe("theBlinder()", () => {
    it("should offer the firsts of every night long enough to judge", () => {
      theBlinder(subjectOf(EVERY_NIGHT));

      expect(notablePickSpy).toHaveBeenCalledWith([
        {
          fact: {
            name: CareerFactName.TheBlinder,
            playedOn: A_DAY,
            games: GAMES_IN_A_LONG_NIGHT,
            firsts: FIRSTS_IN_A_LONG_NIGHT,
          },
          tail: A_TAIL,
        },
        {
          fact: {
            name: CareerFactName.TheBlinder,
            playedOn: NEXT_DAY,
            games: ENOUGH_GAMES_IN_A_NIGHT,
            firsts: FIRSTS_IN_A_SHORT_NIGHT,
          },
          tail: A_TAIL,
        },
      ]);
    });

    it("should weigh a night's firsts over all its games against the career first rate", () => {
      theBlinder(subjectOf([A_LONG_NIGHT]));

      expect(atLeastSpy).toHaveBeenCalledWith(
        FIRSTS_IN_A_LONG_NIGHT,
        GAMES_IN_A_LONG_NIGHT,
        USUAL_FIRST_RATE
      );
    });

    it("should offer nothing about a night one game short of enough", () => {
      theBlinder(subjectOf([A_NIGHT_CUT_SHORT]));

      expect(notablePickSpy).toHaveBeenCalledWith([]);
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should report the fact the pick found notable", () => {
      expect(theBlinder(subjectOf(EVERY_NIGHT))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(theBlinder(subjectOf(EVERY_NIGHT))).toBeNull();
    });
  });
});
