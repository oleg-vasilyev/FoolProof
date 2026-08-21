import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareerFactName } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerGame } from "#shared/repository/repository-contract.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";


const atLeastSpy = vi.fn();

const notablePickSpy = vi.fn();

vi.mock("#scoresheet/domain/career/facts/binomial-tail.ts", () => ({
  atLeast: (wanted: number, trials: number, chance: number) => atLeastSpy(wanted, trials, chance),
}));

vi.mock("#scoresheet/domain/career/facts/notable-pick.ts", () => ({
  notablePick: (field: unknown) => notablePickSpy(field),
}));

const {
  ENOUGH_GAMES_TO_NOTICE,
  ENOUGH_OPENINGS,
  neverWentFirst,
  openersCurse,
  openersGift,
  theHeadStart,
} = await import("#scoresheet/domain/career/facts/opening-facts.ts");

const NOTHING = 0;

const ONE_SHORT = 1;

const OLEG = 1;

const SOMEBODY_ELSE = 2;

const OLEGS_NAME = "Oleg";

const A_ROUND = 0;

const A_PLACE = 2;

const A_TABLE = 5;

const A_NIGHT = 7;

const A_DAY = "2026-05-01";

const OLEGS_SHARE = 0.61;

const A_TAIL = 0.07;

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

const BURNED_OPENINGS = 3;

const WON_OPENINGS = 4;

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

const A_CHOSEN_FACT: CareerFact = {
  name: CareerFactName.TheNewcomer,
  evenings: SOME_NIGHTS,
  games: SOME_GAMES,
};

const appearanceOf = (finish: Finish, opened: boolean): CareerAppearance => ({
  round: A_ROUND,
  finish,
  position: A_PLACE,
  tableSize: A_TABLE,
  seriesNo: A_NIGHT,
  playedOn: A_DAY,
  opened,
});

const OPENED_AND_BURNED = appearanceOf(Finish.Fool, true);

const OPENED_AND_WON = appearanceOf(Finish.First, true);

const OPENED_AND_SURVIVED = appearanceOf(Finish.Middle, true);

const OPENED_AND_DRAWN = appearanceOf(Finish.Drawn, true);

const OPENED_BY_SOMEBODY_ELSE = appearanceOf(Finish.Middle, false);

const repeated = (
  appearance: CareerAppearance,
  times: number
): readonly CareerAppearance[] => Array.from({ length: times }, () => appearance);

const gameStartedBy = (starterId: number | null): CareerGame => ({
  seriesNo: A_NIGHT,
  playedOn: A_DAY,
  starterId,
  placements: [],
});

const gamesOpened = (times: number): readonly CareerGame[] =>
  Array.from({ length: times }, () => gameStartedBy(SOMEBODY_ELSE));

const gamesNobodyOpened = (times: number): readonly CareerGame[] =>
  Array.from({ length: times }, () => gameStartedBy(null));

const subjectOf = (
  appearances: readonly CareerAppearance[],
  games: readonly CareerGame[] = [],
  tally: Partial<CareerTally> = {}
): CareerSubject => ({
  history: { players: [], games },
  career: {
    playerId: OLEG,
    displayName: OLEGS_NAME,
    share: OLEGS_SHARE,
    appearances,
  },
  tally: { ...A_TALLY, ...tally },
  nights: [],
});

const ENOUGH_DECIDED_OPENINGS = [
  ...repeated(OPENED_AND_BURNED, BURNED_OPENINGS),
  ...repeated(OPENED_AND_WON, WON_OPENINGS),
  ...repeated(OPENED_AND_SURVIVED, ENOUGH_OPENINGS - BURNED_OPENINGS - WON_OPENINGS),
  ...repeated(OPENED_BY_SOMEBODY_ELSE, ENOUGH_OPENINGS),
];

const ONE_OPENING_SHORT = [
  ...repeated(OPENED_AND_BURNED, BURNED_OPENINGS),
  ...repeated(OPENED_AND_WON, WON_OPENINGS),
  ...repeated(
    OPENED_AND_SURVIVED,
    ENOUGH_OPENINGS - BURNED_OPENINGS - WON_OPENINGS - ONE_SHORT
  ),
  ...repeated(OPENED_BY_SOMEBODY_ELSE, ENOUGH_OPENINGS),
];

describe("opening facts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    atLeastSpy.mockReturnValue(A_TAIL);
    notablePickSpy.mockReturnValue(A_CHOSEN_FACT);
  });

  describe("openersCurse()", () => {
    it("should offer the burns among exactly enough decided openings", () => {
      openersCurse(subjectOf(ENOUGH_DECIDED_OPENINGS));

      expect(notablePickSpy).toHaveBeenCalledWith([
        {
          fact: {
            name: CareerFactName.OpenersCurse,
            opens: ENOUGH_OPENINGS,
            burns: BURNED_OPENINGS,
          },
          tail: A_TAIL,
        },
      ]);
    });

    it("should weigh those burns against the career fool rate", () => {
      openersCurse(subjectOf(ENOUGH_DECIDED_OPENINGS));

      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNED_OPENINGS,
        ENOUGH_OPENINGS,
        USUAL_FOOL_RATE
      );
    });

    it("should report nothing one opening short of enough", () => {
      expect(openersCurse(subjectOf(ONE_OPENING_SHORT))).toBeNull();
      expect(notablePickSpy).not.toHaveBeenCalled();
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should not count an opening that ended in a draw", () => {
      expect(openersCurse(subjectOf([...ONE_OPENING_SHORT, OPENED_AND_DRAWN]))).toBeNull();
      expect(notablePickSpy).not.toHaveBeenCalled();
    });

    it("should report the fact the pick found notable", () => {
      expect(openersCurse(subjectOf(ENOUGH_DECIDED_OPENINGS))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(openersCurse(subjectOf(ENOUGH_DECIDED_OPENINGS))).toBeNull();
    });
  });

  describe("openersGift()", () => {
    it("should offer the firsts among exactly enough openings", () => {
      openersGift(subjectOf(ENOUGH_DECIDED_OPENINGS));

      expect(notablePickSpy).toHaveBeenCalledWith([
        {
          fact: {
            name: CareerFactName.OpenersGift,
            opens: ENOUGH_OPENINGS,
            firsts: WON_OPENINGS,
          },
          tail: A_TAIL,
        },
      ]);
    });

    it("should weigh those firsts against the career first rate", () => {
      openersGift(subjectOf(ENOUGH_DECIDED_OPENINGS));

      expect(atLeastSpy).toHaveBeenCalledWith(WON_OPENINGS, ENOUGH_OPENINGS, USUAL_FIRST_RATE);
    });

    it("should count an opening that ended in a draw as an opening", () => {
      openersGift(subjectOf([...ONE_OPENING_SHORT, OPENED_AND_DRAWN]));

      expect(notablePickSpy).toHaveBeenCalledWith([
        {
          fact: {
            name: CareerFactName.OpenersGift,
            opens: ENOUGH_OPENINGS,
            firsts: WON_OPENINGS,
          },
          tail: A_TAIL,
        },
      ]);
    });

    it("should report nothing one opening short of enough", () => {
      expect(openersGift(subjectOf(ONE_OPENING_SHORT))).toBeNull();
      expect(notablePickSpy).not.toHaveBeenCalled();
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should report the fact the pick found notable", () => {
      expect(openersGift(subjectOf(ENOUGH_DECIDED_OPENINGS))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(openersGift(subjectOf(ENOUGH_DECIDED_OPENINGS))).toBeNull();
    });
  });

  describe("theHeadStart()", () => {
    const ENOUGH_TO_NOTICE = repeated(OPENED_BY_SOMEBODY_ELSE, ENOUGH_GAMES_TO_NOTICE);

    it("should offer the openings the tally counted over exactly enough games", () => {
      theHeadStart(subjectOf(ENOUGH_TO_NOTICE));

      expect(notablePickSpy).toHaveBeenCalledWith([
        {
          fact: {
            name: CareerFactName.TheHeadStart,
            games: ENOUGH_GAMES_TO_NOTICE,
            opens: SOME_OPENS,
          },
          tail: A_TAIL,
        },
      ]);
    });

    it("should weigh those openings against the seat's own share of the openings", () => {
      theHeadStart(subjectOf(ENOUGH_TO_NOTICE));

      expect(atLeastSpy).toHaveBeenCalledWith(
        SOME_OPENS,
        ENOUGH_GAMES_TO_NOTICE,
        SEAT_FIRST_RATE
      );
    });

    it("should report nothing one game short of enough to notice", () => {
      const tooFew = repeated(OPENED_BY_SOMEBODY_ELSE, ENOUGH_GAMES_TO_NOTICE - ONE_SHORT);

      expect(theHeadStart(subjectOf(tooFew))).toBeNull();
      expect(notablePickSpy).not.toHaveBeenCalled();
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should report the fact the pick found notable", () => {
      expect(theHeadStart(subjectOf(ENOUGH_TO_NOTICE))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(theHeadStart(subjectOf(ENOUGH_TO_NOTICE))).toBeNull();
    });
  });

  describe("neverWentFirst()", () => {
    const NEVER_OPENED = repeated(OPENED_BY_SOMEBODY_ELSE, ENOUGH_GAMES_TO_NOTICE);

    const OPENED_ROUND_THE_TABLE = gamesOpened(ENOUGH_GAMES_TO_NOTICE);

    const NEVER_OPENED_AT_ALL = { opens: NOTHING };

    it("should report the fact when a player never opened over exactly enough games", () => {
      expect(
        neverWentFirst(subjectOf(NEVER_OPENED, OPENED_ROUND_THE_TABLE, NEVER_OPENED_AT_ALL))
      ).toEqual({
        name: CareerFactName.NeverWentFirst,
        games: ENOUGH_GAMES_TO_NOTICE,
      });
    });

    it("should report nothing when the player has opened at all", () => {
      expect(neverWentFirst(subjectOf(NEVER_OPENED, OPENED_ROUND_THE_TABLE))).toBeNull();
    });

    it("should report nothing one game short of enough to notice", () => {
      const tooFew = repeated(OPENED_BY_SOMEBODY_ELSE, ENOUGH_GAMES_TO_NOTICE - ONE_SHORT);

      expect(neverWentFirst(subjectOf(tooFew, OPENED_ROUND_THE_TABLE, NEVER_OPENED_AT_ALL))).toBeNull();
    });

    it("should report nothing when one game short was opened by anybody at all", () => {
      const rarelyOpened = gamesOpened(ENOUGH_GAMES_TO_NOTICE - ONE_SHORT);

      expect(neverWentFirst(subjectOf(NEVER_OPENED, rarelyOpened, NEVER_OPENED_AT_ALL))).toBeNull();
    });

    it("should not count a game nobody was recorded opening", () => {
      const unopened = [
        ...gamesOpened(ENOUGH_GAMES_TO_NOTICE - ONE_SHORT),
        ...gamesNobodyOpened(ENOUGH_GAMES_TO_NOTICE),
      ];

      expect(neverWentFirst(subjectOf(NEVER_OPENED, unopened, NEVER_OPENED_AT_ALL))).toBeNull();
    });

    it("should read the fact off the record without asking how unlikely it was", () => {
      neverWentFirst(subjectOf(NEVER_OPENED, OPENED_ROUND_THE_TABLE, NEVER_OPENED_AT_ALL));

      expect(atLeastSpy).not.toHaveBeenCalled();
      expect(notablePickSpy).not.toHaveBeenCalled();
    });
  });
});
