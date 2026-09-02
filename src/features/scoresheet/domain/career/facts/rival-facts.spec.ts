import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareerFactName } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type {
  CareerGame,
  Finalist,
  PlayerColumn,
} from "#shared/repository/repository-contract.ts";
import type { Career } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";


const atLeastSpy = vi.fn();

const usualOverSpy = vi.fn();

const atMostSpy = vi.fn();

const notablePickSpy = vi.fn();

vi.mock("#scoresheet/domain/career/facts/binomial-tail.ts", () => ({
  atLeast: (wanted: number, trials: number, chance: number) => atLeastSpy(wanted, trials, chance),
  atMost: (wanted: number, trials: number, chance: number) => atMostSpy(wanted, trials, chance),
  usualOver: (chance: number, trials: number) => usualOverSpy(chance, trials),
}));

vi.mock("#scoresheet/domain/career/facts/notable-pick.ts", () => ({
  notablePick: (field: unknown) => notablePickSpy(field),
}));

const { ENOUGH_DUELS, ENOUGH_TOGETHER, theBogey, theCharm, theJinx, thePatsy } = await import(
  "#scoresheet/domain/career/facts/rival-facts.ts"
);

const ONE_SHORT = 1;

const ONE_MORE = 1;

const OLEG = 1;

const ANYA = 2;

const BORIS = 3;

const OLEGS_NAME = "Oleg";

const ANYAS_NAME = "Anya";

const BORISS_NAME = "Boris";

const FIRST_PLACE = 1;

const SECOND_PLACE = 2;

const LAST_PLACE = 3;

const A_NIGHT = 7;

const A_DAY = "2026-05-01";

const OLEGS_SHARE = 0.61;

const A_TAIL = 0.07;

const ANOTHER_TAIL = 0.11;

const SOME_GAMES = 40;

const SOME_NIGHTS = 6;

const SOME_FOOLS = 9;

const SOME_DECIDED = 38;

const USUAL_FOOL_RATE = 0.23;

const USUAL_BURNS_TOGETHER = 3;

const SEAT_FOOL_RATE = 0.25;

const SOME_FIRSTS = 11;

const USUAL_FIRST_RATE = 0.28;

const SEAT_FIRST_RATE = 0.26;

const SOME_OPENS = 12;

const SOME_OPEN_RATE = 0.3;

const LOST_TO_ANYA = 4;

const LOST_TO_BORIS = 2;

const TIED_LOSSES = 4;

const BURNS_ALONGSIDE = 3;

const AN_EVEN_SPLIT = 0.5;

const A_TALLY: CareerTally = {
  games: SOME_GAMES,
  evenings: SOME_NIGHTS,
  shareChance: AN_EVEN_SPLIT,
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

const CAREER: Career = {
  playerId: OLEG,
  displayName: OLEGS_NAME,
  share: OLEGS_SHARE,
  appearances: [],
};

const A_CHOSEN_FACT: CareerFact = { name: CareerFactName.NeverWentFirst, games: SOME_GAMES };

const OLEG_FIRST: readonly PlayerColumn[] = [
  { playerId: OLEG, displayName: OLEGS_NAME },
  { playerId: ANYA, displayName: ANYAS_NAME },
  { playerId: BORIS, displayName: BORISS_NAME },
];

const BORIS_BEFORE_ANYA: readonly PlayerColumn[] = [
  { playerId: OLEG, displayName: OLEGS_NAME },
  { playerId: BORIS, displayName: BORISS_NAME },
  { playerId: ANYA, displayName: ANYAS_NAME },
];

const gameAmong = (placements: readonly Finalist[]): CareerGame => ({
  seriesNo: A_NIGHT,
  playedOn: A_DAY,
  starterId: null,
  placements,
});

const gameOf = (oleg: number, anya: number, boris: number): CareerGame =>
  gameAmong([
    { playerId: OLEG, position: oleg },
    { playerId: ANYA, position: anya },
    { playerId: BORIS, position: boris },
  ]);

const OLEG_BURNED_BY_ANYA = gameOf(LAST_PLACE, SECOND_PLACE, FIRST_PLACE);

const ANYA_BURNED_BY_OLEG = gameOf(SECOND_PLACE, LAST_PLACE, FIRST_PLACE);

const OLEG_BURNED_BY_BORIS = gameOf(LAST_PLACE, FIRST_PLACE, SECOND_PLACE);

const BORIS_BURNED_BY_OLEG = gameOf(SECOND_PLACE, FIRST_PLACE, LAST_PLACE);

const OLEG_WON_OUTRIGHT = gameOf(FIRST_PLACE, SECOND_PLACE, LAST_PLACE);

const THE_LAST_PLACE_WAS_DRAWN = gameOf(LAST_PLACE, LAST_PLACE, FIRST_PLACE);

const OLEG_DID_NOT_PLAY = gameAmong([
  { playerId: ANYA, position: FIRST_PLACE },
  { playerId: BORIS, position: SECOND_PLACE },
]);

const FOURTH_PLACE = 4;

const DASHA = 4;

const ANYA_SAT_OUT = gameAmong([
  { playerId: OLEG, position: LAST_PLACE },
  { playerId: BORIS, position: FIRST_PLACE },
]);

const OLEG_CLEAR_OF_THE_BOTTOM_TWO = gameAmong([
  { playerId: OLEG, position: FIRST_PLACE },
  { playerId: DASHA, position: SECOND_PLACE },
  { playerId: ANYA, position: LAST_PLACE },
  { playerId: BORIS, position: FOURTH_PLACE },
]);

const ANYA_CLEAR_OF_THE_BOTTOM_TWO = gameAmong([
  { playerId: ANYA, position: FIRST_PLACE },
  { playerId: DASHA, position: SECOND_PLACE },
  { playerId: BORIS, position: LAST_PLACE },
  { playerId: OLEG, position: FOURTH_PLACE },
]);

const repeated = (game: CareerGame, times: number): readonly CareerGame[] =>
  Array.from({ length: times }, () => game);

const subjectOf = (
  games: readonly CareerGame[],
  players: readonly PlayerColumn[] = OLEG_FIRST
): CareerSubject => ({
  history: { players, games },
  career: CAREER,
  tally: A_TALLY,
  nights: [],
});

const BOTH_FACED_ENOUGH = [
  ...repeated(OLEG_BURNED_BY_ANYA, LOST_TO_ANYA),
  ...repeated(ANYA_BURNED_BY_OLEG, ENOUGH_DUELS - LOST_TO_ANYA),
  ...repeated(OLEG_BURNED_BY_BORIS, LOST_TO_BORIS),
  ...repeated(BORIS_BURNED_BY_OLEG, ENOUGH_DUELS - LOST_TO_BORIS),
];

const BORIS_FACED_MORE_OFTEN = [
  ...repeated(OLEG_BURNED_BY_ANYA, TIED_LOSSES),
  ...repeated(ANYA_BURNED_BY_OLEG, ENOUGH_DUELS - TIED_LOSSES),
  ...repeated(OLEG_BURNED_BY_BORIS, TIED_LOSSES),
  ...repeated(BORIS_BURNED_BY_OLEG, ENOUGH_DUELS + ONE_MORE - TIED_LOSSES),
];

const ANYA_TOOK_THEM_ALL = {
  name: CareerFactName.TheBogey,
  rivalId: ANYA,
  rival: ANYAS_NAME,
  duels: ENOUGH_DUELS,
  lost: ENOUGH_DUELS,
};

const A_FEW_MORE_DUELS = 2;

const BORIS_FACED_MORE_BUT_WON_MORE = [
  ...BOTH_FACED_ENOUGH,
  ...repeated(BORIS_BURNED_BY_OLEG, A_FEW_MORE_DUELS),
];

const EVENLY_MATCHED = [
  ...repeated(OLEG_BURNED_BY_ANYA, TIED_LOSSES),
  ...repeated(ANYA_BURNED_BY_OLEG, ENOUGH_DUELS - TIED_LOSSES),
  ...repeated(OLEG_BURNED_BY_BORIS, TIED_LOSSES),
  ...repeated(BORIS_BURNED_BY_OLEG, ENOUGH_DUELS - TIED_LOSSES),
];

const BORIS_ONE_DUEL_SHORT = [
  ...repeated(OLEG_BURNED_BY_ANYA, TIED_LOSSES),
  ...repeated(ANYA_BURNED_BY_OLEG, ENOUGH_DUELS - TIED_LOSSES),
  ...repeated(OLEG_BURNED_BY_BORIS, ENOUGH_DUELS - ONE_SHORT),
];

const BORIS_ONE_DUEL_SHORT_OF_WINS = [
  ...repeated(ANYA_BURNED_BY_OLEG, TIED_LOSSES),
  ...repeated(OLEG_BURNED_BY_ANYA, ENOUGH_DUELS - TIED_LOSSES),
  ...repeated(BORIS_BURNED_BY_OLEG, ENOUGH_DUELS - ONE_SHORT),
];

const BORIS_WON_AGAINST_MORE_OFTEN = [
  ...repeated(ANYA_BURNED_BY_OLEG, TIED_LOSSES),
  ...repeated(OLEG_BURNED_BY_ANYA, ENOUGH_DUELS - TIED_LOSSES),
  ...repeated(BORIS_BURNED_BY_OLEG, TIED_LOSSES),
  ...repeated(OLEG_BURNED_BY_BORIS, ENOUGH_DUELS + ONE_MORE - TIED_LOSSES),
];

const ANYA_ALWAYS_WON = repeated(OLEG_BURNED_BY_ANYA, ENOUGH_DUELS);

const ANYA_ALWAYS_LOST = repeated(ANYA_BURNED_BY_OLEG, ENOUGH_DUELS);

const ENOUGH_ALONGSIDE = [
  ...repeated(OLEG_BURNED_BY_ANYA, BURNS_ALONGSIDE),
  ...repeated(OLEG_WON_OUTRIGHT, ENOUGH_TOGETHER - BURNS_ALONGSIDE),
];

const ONE_NIGHT_SHORT_ALONGSIDE = [
  ...repeated(OLEG_BURNED_BY_ANYA, BURNS_ALONGSIDE),
  ...repeated(OLEG_WON_OUTRIGHT, ENOUGH_TOGETHER - BURNS_ALONGSIDE - ONE_SHORT),
];

const alongside = (
  name: CareerFactName,
  rivalId: number,
  rival: string,
  tail: number
): unknown => ({
  fact: {
    name,
    rivalId,
    rival,
    games: ENOUGH_TOGETHER,
    burns: BURNS_ALONGSIDE,
    usualBurns: USUAL_BURNS_TOGETHER,
  },
  tail,
});

describe("rival facts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    usualOverSpy.mockReturnValue(USUAL_BURNS_TOGETHER);
    atLeastSpy.mockReturnValue(A_TAIL);
    atMostSpy.mockReturnValue(ANOTHER_TAIL);
    notablePickSpy.mockReturnValue(A_CHOSEN_FACT);
  });

  describe("which games count as a duel at all", () => {
    it("should not count a game the rival sat out, however it ended", () => {
      const history = [...ANYA_ALWAYS_WON, ...repeated(ANYA_SAT_OUT, ONE_MORE)];

      expect(theBogey(subjectOf(history))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        lost: ENOUGH_DUELS,
      });
    });

    it("should not count a game the player finished clear of the bottom two", () => {
      const history = [...ANYA_ALWAYS_WON, ...repeated(OLEG_CLEAR_OF_THE_BOTTOM_TWO, ONE_MORE)];

      expect(theBogey(subjectOf(history))).toEqual(ANYA_TOOK_THEM_ALL);
    });

    it("should not count a game the rival finished clear of the bottom two", () => {
      const history = [...ANYA_ALWAYS_WON, ...repeated(ANYA_CLEAR_OF_THE_BOTTOM_TWO, ONE_MORE)];

      expect(theBogey(subjectOf(history))).toEqual(ANYA_TOOK_THEM_ALL);
    });

    it("should still count the games alongside a rival who was there", () => {
      const history = [...ENOUGH_ALONGSIDE, ...repeated(ANYA_SAT_OUT, ONE_MORE)];

      theJinx(subjectOf(history));

      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNS_ALONGSIDE,
        ENOUGH_TOGETHER,
        USUAL_FOOL_RATE
      );
    });

    it("should keep the rival already holding the title when a later one only draws level", () => {
      expect(theBogey(subjectOf(EVENLY_MATCHED))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        lost: TIED_LOSSES,
      });
    });

    it("should rank on losses before duels, so facing somebody more often is not enough", () => {
      expect(theBogey(subjectOf(BORIS_FACED_MORE_BUT_WON_MORE))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        lost: LOST_TO_ANYA,
      });
    });
  });

  describe("theBogey()", () => {
    it("should name the rival the player lost the most duels to", () => {
      expect(theBogey(subjectOf(BOTH_FACED_ENOUGH))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        lost: LOST_TO_ANYA,
      });
    });

    it("should describe the rivalry without asking how unlikely it was", () => {
      theBogey(subjectOf(BOTH_FACED_ENOUGH));

      expect(atLeastSpy).not.toHaveBeenCalled();
      expect(atMostSpy).not.toHaveBeenCalled();
      expect(notablePickSpy).not.toHaveBeenCalled();
    });

    it("should judge a rival faced exactly enough duels", () => {
      expect(theBogey(subjectOf(ANYA_ALWAYS_WON))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        lost: ENOUGH_DUELS,
      });
    });

    it("should ignore a rival faced one duel short of enough", () => {
      expect(theBogey(subjectOf(BORIS_ONE_DUEL_SHORT))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        lost: TIED_LOSSES,
      });
    });

    it("should report nothing when no rival was faced enough times", () => {
      const tooFew = repeated(OLEG_BURNED_BY_ANYA, ENOUGH_DUELS - ONE_SHORT);

      expect(theBogey(subjectOf(tooFew))).toBeNull();
    });

    it("should report nothing when the leading rival took no duel off the player", () => {
      expect(theBogey(subjectOf(ANYA_ALWAYS_LOST))).toBeNull();
    });

    it("should break a tie on losses by the rival faced more often", () => {
      expect(theBogey(subjectOf(BORIS_FACED_MORE_OFTEN))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: BORIS,
        rival: BORISS_NAME,
        duels: ENOUGH_DUELS + ONE_MORE,
        lost: TIED_LOSSES,
      });
    });

    it("should break a tie on losses and duels by the rival whose name comes first", () => {
      expect(theBogey(subjectOf(EVENLY_MATCHED, BORIS_BEFORE_ANYA))).toEqual({
        name: CareerFactName.TheBogey,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        lost: TIED_LOSSES,
      });
    });

    it("should not count a game whose last place was drawn as a duel", () => {
      const drawnAtTheEnd = [
        ...repeated(OLEG_BURNED_BY_ANYA, ENOUGH_DUELS - ONE_SHORT),
        THE_LAST_PLACE_WAS_DRAWN,
      ];

      expect(theBogey(subjectOf(drawnAtTheEnd))).toBeNull();
    });
  });

  describe("thePatsy()", () => {
    it("should name the rival the player won the most duels against", () => {
      expect(thePatsy(subjectOf(BOTH_FACED_ENOUGH))).toEqual({
        name: CareerFactName.ThePatsy,
        rivalId: BORIS,
        rival: BORISS_NAME,
        duels: ENOUGH_DUELS,
        won: ENOUGH_DUELS - LOST_TO_BORIS,
      });
    });

    it("should describe the rivalry without asking how unlikely it was", () => {
      thePatsy(subjectOf(BOTH_FACED_ENOUGH));

      expect(atLeastSpy).not.toHaveBeenCalled();
      expect(atMostSpy).not.toHaveBeenCalled();
      expect(notablePickSpy).not.toHaveBeenCalled();
    });

    it("should judge a rival faced exactly enough duels", () => {
      expect(thePatsy(subjectOf(ANYA_ALWAYS_LOST))).toEqual({
        name: CareerFactName.ThePatsy,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        won: ENOUGH_DUELS,
      });
    });

    it("should ignore a rival faced one duel short of enough", () => {
      expect(thePatsy(subjectOf(BORIS_ONE_DUEL_SHORT_OF_WINS))).toEqual({
        name: CareerFactName.ThePatsy,
        rivalId: ANYA,
        rival: ANYAS_NAME,
        duels: ENOUGH_DUELS,
        won: TIED_LOSSES,
      });
    });

    it("should report nothing when no rival was faced enough times", () => {
      const tooFew = repeated(ANYA_BURNED_BY_OLEG, ENOUGH_DUELS - ONE_SHORT);

      expect(thePatsy(subjectOf(tooFew))).toBeNull();
    });

    it("should report nothing when the leading rival lost no duel to the player", () => {
      expect(thePatsy(subjectOf(ANYA_ALWAYS_WON))).toBeNull();
    });

    it("should not call one rival easy prey and a hard opponent on the same card", () => {
      const A_COUPLE_BACK = 2;

      const theOnlyRivalThereWas = [
        ...repeated(ANYA_BURNED_BY_OLEG, ENOUGH_DUELS),
        ...repeated(OLEG_BURNED_BY_ANYA, A_COUPLE_BACK),
      ];

      const subject = subjectOf(theOnlyRivalThereWas);

      expect(thePatsy(subject)).toEqual(expect.objectContaining({ rival: ANYAS_NAME }));
      expect(theBogey(subject)).toBeNull();
    });

    it("should break a tie on wins by the rival faced more often", () => {
      expect(thePatsy(subjectOf(BORIS_WON_AGAINST_MORE_OFTEN))).toEqual({
        name: CareerFactName.ThePatsy,
        rivalId: BORIS,
        rival: BORISS_NAME,
        duels: ENOUGH_DUELS + ONE_MORE,
        won: TIED_LOSSES,
      });
    });
  });

  describe("theJinx()", () => {
    it("should offer a record for every rival played alongside enough times", () => {
      theJinx(subjectOf(ENOUGH_ALONGSIDE));

      expect(notablePickSpy).toHaveBeenCalledWith([
        alongside(CareerFactName.TheJinx, ANYA, ANYAS_NAME, A_TAIL),
        alongside(CareerFactName.TheJinx, BORIS, BORISS_NAME, A_TAIL),
      ]);
    });

    it("should weigh the burns alongside a rival against the career fool rate", () => {
      theJinx(subjectOf(ENOUGH_ALONGSIDE));

      expect(atLeastSpy).toHaveBeenCalledWith(
        BURNS_ALONGSIDE,
        ENOUGH_TOGETHER,
        USUAL_FOOL_RATE
      );
      expect(atMostSpy).not.toHaveBeenCalled();
    });

    it("should offer nothing about a rival played alongside one game short of enough", () => {
      theJinx(subjectOf(ONE_NIGHT_SHORT_ALONGSIDE));

      expect(notablePickSpy).toHaveBeenCalledWith([]);
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should not count a game whose last place was drawn as a game played alongside", () => {
      theJinx(subjectOf([...ONE_NIGHT_SHORT_ALONGSIDE, THE_LAST_PLACE_WAS_DRAWN]));

      expect(notablePickSpy).toHaveBeenCalledWith([]);
    });

    it("should not count a game the player sat out as a game played alongside", () => {
      theJinx(subjectOf([...ONE_NIGHT_SHORT_ALONGSIDE, OLEG_DID_NOT_PLAY]));

      expect(notablePickSpy).toHaveBeenCalledWith([]);
    });

    it("should report the fact the pick found notable", () => {
      expect(theJinx(subjectOf(ENOUGH_ALONGSIDE))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(theJinx(subjectOf(ENOUGH_ALONGSIDE))).toBeNull();
    });
  });

  describe("theCharm()", () => {
    it("should offer a record for every rival played alongside enough times", () => {
      theCharm(subjectOf(ENOUGH_ALONGSIDE));

      expect(notablePickSpy).toHaveBeenCalledWith([
        alongside(CareerFactName.TheCharm, ANYA, ANYAS_NAME, ANOTHER_TAIL),
        alongside(CareerFactName.TheCharm, BORIS, BORISS_NAME, ANOTHER_TAIL),
      ]);
    });

    it("should weigh the burns alongside a rival against the career fool rate", () => {
      theCharm(subjectOf(ENOUGH_ALONGSIDE));

      expect(atMostSpy).toHaveBeenCalledWith(BURNS_ALONGSIDE, ENOUGH_TOGETHER, USUAL_FOOL_RATE);
      expect(atLeastSpy).not.toHaveBeenCalled();
    });

    it("should offer nothing about a rival played alongside one game short of enough", () => {
      theCharm(subjectOf(ONE_NIGHT_SHORT_ALONGSIDE));

      expect(notablePickSpy).toHaveBeenCalledWith([]);
      expect(atMostSpy).not.toHaveBeenCalled();
    });

    it("should report the fact the pick found notable", () => {
      expect(theCharm(subjectOf(ENOUGH_ALONGSIDE))).toBe(A_CHOSEN_FACT);
    });

    it("should report nothing when the pick found nothing notable", () => {
      notablePickSpy.mockReturnValue(null);

      expect(theCharm(subjectOf(ENOUGH_ALONGSIDE))).toBeNull();
    });
  });
});
