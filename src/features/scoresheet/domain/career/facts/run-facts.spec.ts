import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareerFactName } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


const atLeastSpy = vi.fn();

const atMostSpy = vi.fn();

const notableSpy = vi.fn();

vi.mock("#scoresheet/domain/career/facts/binomial-tail.ts", () => ({
  atLeast: (wanted: number, trials: number, chance: number) => atLeastSpy(wanted, trials, chance),
  atMost: (wanted: number, trials: number, chance: number) => atMostSpy(wanted, trials, chance),
}));

vi.mock("#scoresheet/domain/career/facts/noise-floor.ts", () => ({
  notable: (tail: number, candidates: number) => notableSpy(tail, candidates),
}));

const { ENOUGH_TO_BOAST, ENOUGH_TO_HURT, theBadPatch, theCleanRun } = await import(
  "#scoresheet/domain/career/facts/run-facts.ts"
);

const FIRST = 0;

const ONCE = 1;

const ONE_GAME = 1;

const NO_BURNS = 0;

const ONE_WINDOW = 1;

const THREE_WINDOWS = 3;

const FIVE_WINDOWS = 5;

const A_HIGH_TAIL = 0.0002;

const A_LOW_TAIL = 0.0003;

const A_ROUND = 0;

const A_PLACE = 2;

const FOUR_AT_THE_TABLE = 4;

const A_NIGHT = 7;

const SOME_BURNS = 9;

const SOME_FIRSTS = 4;

const SOME_OPENS = 6;

const SOME_EVENINGS = 5;

const SOME_DECIDED = 20;

const A_FOOL_RATE = 0.42;

const A_FIRST_RATE = 0.18;

const A_SEAT_IN_FOUR = 0.25;

const A_SEAT_IN_FIVE = 0.2;

const AN_OPEN_RATE = 0.31;

const A_SHARE = 0.61;

const OLEG = 1;

const OLEGS_NAME = "Oleg";

const FIRST_DAY = "2026-05-01";

const SECOND_DAY = "2026-05-02";

const THIRD_DAY = "2026-05-03";

const FOURTH_DAY = "2026-05-04";

const FIFTH_DAY = "2026-05-05";

const SIXTH_DAY = "2026-05-06";

const SEVENTH_DAY = "2026-05-07";

const EIGHTH_DAY = "2026-05-08";

const NINTH_DAY = "2026-05-09";

const IN_ORDER: readonly string[] = [
  FIRST_DAY,
  SECOND_DAY,
  THIRD_DAY,
  FOURTH_DAY,
  FIFTH_DAY,
  SIXTH_DAY,
  SEVENTH_DAY,
  EIGHTH_DAY,
  NINTH_DAY,
];

const A_TALLY: CareerTally = {
  games: SOME_DECIDED,
  evenings: SOME_EVENINGS,
  fools: SOME_BURNS,
  decided: SOME_DECIDED,
  foolRate: A_FOOL_RATE,
  expectedFoolRate: A_SEAT_IN_FOUR,
  firsts: SOME_FIRSTS,
  firstRate: A_FIRST_RATE,
  expectedFirstRate: A_SEAT_IN_FIVE,
  opens: SOME_OPENS,
  openRate: AN_OPEN_RATE,
};

const playedAs = (finish: Finish, playedOn: string): CareerAppearance => ({
  round: A_ROUND,
  finish,
  position: A_PLACE,
  tableSize: FOUR_AT_THE_TABLE,
  seriesNo: A_NIGHT,
  playedOn,
  opened: false,
});

const runningAs = (finish: Finish, games: number): readonly CareerAppearance[] =>
  IN_ORDER.slice(FIRST, games).map((day) => playedAs(finish, day));

const subjectOf = (appearances: readonly CareerAppearance[]): CareerSubject => ({
  history: { players: [], games: [] },
  career: { playerId: OLEG, displayName: OLEGS_NAME, share: A_SHARE, appearances },
  tally: A_TALLY,
  nights: [],
});

describe("theCleanRun()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    atLeastSpy.mockReturnValue(A_HIGH_TAIL);
    atMostSpy.mockReturnValue(A_LOW_TAIL);
    notableSpy.mockReturnValue(true);
  });

  it("should say nothing about a run shorter than ENOUGH_TO_BOAST", () => {
    const career = runningAs(Finish.Middle, ENOUGH_TO_BOAST - ONE_GAME);

    expect(theCleanRun(subjectOf(career))).toBeNull();
  });

  it("should not even weigh a run too short to boast about", () => {
    theCleanRun(subjectOf(runningAs(Finish.Middle, ENOUGH_TO_BOAST - ONE_GAME)));

    expect(notableSpy).not.toHaveBeenCalled();
  });

  it("should tell a run of exactly ENOUGH_TO_BOAST games without a burn", () => {
    const career = runningAs(Finish.Middle, ENOUGH_TO_BOAST);

    expect(theCleanRun(subjectOf(career))?.name).toBe(CareerFactName.TheCleanRun);
  });

  it("should say nothing for a career of no games at all", () => {
    expect(theCleanRun(subjectOf([]))).toBeNull();
    expect(notableSpy).not.toHaveBeenCalled();
  });

  it("should date the run by the games that opened and closed it", () => {
    const career = [
      playedAs(Finish.Middle, FIRST_DAY),
      playedAs(Finish.First, SECOND_DAY),
      playedAs(Finish.Middle, THIRD_DAY),
      playedAs(Finish.Middle, FOURTH_DAY),
      playedAs(Finish.First, FIFTH_DAY),
    ];

    expect(theCleanRun(subjectOf(career))).toEqual({
      name: CareerFactName.TheCleanRun,
      games: ENOUGH_TO_BOAST,
      from: FIRST_DAY,
      until: FIFTH_DAY,
    });
  });

  it("should leave a drawn game out of the run it counts", () => {
    const career = [
      playedAs(Finish.Middle, FIRST_DAY),
      playedAs(Finish.Middle, SECOND_DAY),
      playedAs(Finish.Drawn, THIRD_DAY),
      playedAs(Finish.Middle, FOURTH_DAY),
      playedAs(Finish.Middle, FIFTH_DAY),
      playedAs(Finish.Middle, SIXTH_DAY),
    ];

    expect(theCleanRun(subjectOf(career))).toEqual({
      name: CareerFactName.TheCleanRun,
      games: ENOUGH_TO_BOAST,
      from: FIRST_DAY,
      until: SIXTH_DAY,
    });
  });

  it("should hold the longest of the runs a burn broke apart", () => {
    const career = [
      playedAs(Finish.Middle, FIRST_DAY),
      playedAs(Finish.Middle, SECOND_DAY),
      playedAs(Finish.Middle, THIRD_DAY),
      playedAs(Finish.Middle, FOURTH_DAY),
      playedAs(Finish.Middle, FIFTH_DAY),
      playedAs(Finish.Fool, SIXTH_DAY),
      playedAs(Finish.Middle, SEVENTH_DAY),
      playedAs(Finish.Middle, EIGHTH_DAY),
      playedAs(Finish.Middle, NINTH_DAY),
    ];

    expect(theCleanRun(subjectOf(career))).toEqual({
      name: CareerFactName.TheCleanRun,
      games: ENOUGH_TO_BOAST,
      from: FIRST_DAY,
      until: FIFTH_DAY,
    });
  });

  it("should measure the chance of getting that far with no burn at all", () => {
    theCleanRun(subjectOf(runningAs(Finish.Middle, ENOUGH_TO_BOAST)));

    expect(atMostSpy).toHaveBeenCalledWith(NO_BURNS, ENOUGH_TO_BOAST, A_FOOL_RATE);
    expect(atMostSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should not measure the high tail as well", () => {
    theCleanRun(subjectOf(runningAs(Finish.Middle, ENOUGH_TO_BOAST)));

    expect(atLeastSpy).not.toHaveBeenCalled();
  });

  it("should count one window only when the run filled the whole career", () => {
    theCleanRun(subjectOf(runningAs(Finish.Middle, ENOUGH_TO_BOAST)));

    expect(notableSpy).toHaveBeenCalledWith(A_LOW_TAIL, ONE_WINDOW);
  });

  it("should correct the tail by every window the run could have sat in", () => {
    const career = [
      playedAs(Finish.Middle, FIRST_DAY),
      playedAs(Finish.Middle, SECOND_DAY),
      playedAs(Finish.Middle, THIRD_DAY),
      playedAs(Finish.Middle, FOURTH_DAY),
      playedAs(Finish.Middle, FIFTH_DAY),
      playedAs(Finish.Fool, SIXTH_DAY),
      playedAs(Finish.Middle, SEVENTH_DAY),
      playedAs(Finish.Middle, EIGHTH_DAY),
      playedAs(Finish.Middle, NINTH_DAY),
    ];

    theCleanRun(subjectOf(career));

    expect(notableSpy).toHaveBeenCalledWith(A_LOW_TAIL, FIVE_WINDOWS);
  });

  it("should leave a drawn game out of the windows it counts", () => {
    const career = [
      playedAs(Finish.Middle, FIRST_DAY),
      playedAs(Finish.Middle, SECOND_DAY),
      playedAs(Finish.Drawn, THIRD_DAY),
      playedAs(Finish.Middle, FOURTH_DAY),
      playedAs(Finish.Middle, FIFTH_DAY),
      playedAs(Finish.Middle, SIXTH_DAY),
    ];

    theCleanRun(subjectOf(career));

    expect(notableSpy).toHaveBeenCalledWith(A_LOW_TAIL, ONE_WINDOW);
  });

  it("should say nothing when the corrected tail is no rarer than noise", () => {
    notableSpy.mockReturnValue(false);

    expect(theCleanRun(subjectOf(runningAs(Finish.Middle, ENOUGH_TO_BOAST)))).toBeNull();
    expect(notableSpy).toHaveBeenCalledTimes(ONCE);
  });
});

describe("theBadPatch()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    atLeastSpy.mockReturnValue(A_HIGH_TAIL);
    atMostSpy.mockReturnValue(A_LOW_TAIL);
    notableSpy.mockReturnValue(true);
  });

  it("should say nothing about a patch shorter than ENOUGH_TO_HURT", () => {
    const career = runningAs(Finish.Fool, ENOUGH_TO_HURT - ONE_GAME);

    expect(theBadPatch(subjectOf(career))).toBeNull();
  });

  it("should not even weigh a patch too short to hurt", () => {
    theBadPatch(subjectOf(runningAs(Finish.Fool, ENOUGH_TO_HURT - ONE_GAME)));

    expect(notableSpy).not.toHaveBeenCalled();
  });

  it("should tell a patch of exactly ENOUGH_TO_HURT burns in a row", () => {
    const career = runningAs(Finish.Fool, ENOUGH_TO_HURT);

    expect(theBadPatch(subjectOf(career))?.name).toBe(CareerFactName.TheBadPatch);
  });

  it("should date the patch by the burns that opened and closed it", () => {
    const career = [
      playedAs(Finish.Middle, FIRST_DAY),
      playedAs(Finish.Fool, SECOND_DAY),
      playedAs(Finish.Fool, THIRD_DAY),
      playedAs(Finish.Fool, FOURTH_DAY),
      playedAs(Finish.Middle, FIFTH_DAY),
    ];

    expect(theBadPatch(subjectOf(career))).toEqual({
      name: CareerFactName.TheBadPatch,
      games: ENOUGH_TO_HURT,
      from: SECOND_DAY,
      until: FOURTH_DAY,
    });
  });

  it("should not let a drawn game break a patch of burns", () => {
    const career = [
      playedAs(Finish.Fool, FIRST_DAY),
      playedAs(Finish.Fool, SECOND_DAY),
      playedAs(Finish.Drawn, THIRD_DAY),
      playedAs(Finish.Fool, FOURTH_DAY),
    ];

    expect(theBadPatch(subjectOf(career))).toEqual({
      name: CareerFactName.TheBadPatch,
      games: ENOUGH_TO_HURT,
      from: FIRST_DAY,
      until: FOURTH_DAY,
    });
  });

  it("should measure the chance of burning every game of the patch", () => {
    theBadPatch(subjectOf(runningAs(Finish.Fool, ENOUGH_TO_HURT)));

    expect(atLeastSpy).toHaveBeenCalledWith(ENOUGH_TO_HURT, ENOUGH_TO_HURT, A_FOOL_RATE);
    expect(atLeastSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should not measure the low tail as well", () => {
    theBadPatch(subjectOf(runningAs(Finish.Fool, ENOUGH_TO_HURT)));

    expect(atMostSpy).not.toHaveBeenCalled();
  });

  it("should count one window only when the patch filled the whole career", () => {
    theBadPatch(subjectOf(runningAs(Finish.Fool, ENOUGH_TO_HURT)));

    expect(notableSpy).toHaveBeenCalledWith(A_HIGH_TAIL, ONE_WINDOW);
  });

  it("should correct the tail by every window the patch could have sat in", () => {
    const career = [
      playedAs(Finish.Middle, FIRST_DAY),
      playedAs(Finish.Fool, SECOND_DAY),
      playedAs(Finish.Fool, THIRD_DAY),
      playedAs(Finish.Fool, FOURTH_DAY),
      playedAs(Finish.Middle, FIFTH_DAY),
    ];

    theBadPatch(subjectOf(career));

    expect(notableSpy).toHaveBeenCalledWith(A_HIGH_TAIL, THREE_WINDOWS);
  });

  it("should say nothing when the corrected tail is no rarer than noise", () => {
    notableSpy.mockReturnValue(false);

    expect(theBadPatch(subjectOf(runningAs(Finish.Fool, ENOUGH_TO_HURT)))).toBeNull();
    expect(notableSpy).toHaveBeenCalledTimes(ONCE);
  });
});
