import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareerFactName, type CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import type { CareerSubject } from "#scoresheet/domain/career/facts/career-subject.ts";


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

const { ENOUGH_DECIDED, lightningRod, theSurvivor } = await import(
  "#scoresheet/domain/career/facts/seat-facts.ts"
);

const ONCE = 1;

const ONE_GAME = 1;

const A_HIGH_TAIL = 0.0002;

const A_LOW_TAIL = 0.0003;

const SOME_BURNS = 9;

const SOME_FIRSTS = 4;

const SOME_OPENS = 6;

const SOME_EVENINGS = 5;

const A_SEAT_IN_FOUR = 0.25;

const A_SEAT_IN_FIVE = 0.2;

const A_FOOL_RATE = 0.42;

const AN_EVEN_SPLIT = 0.5;

const A_FIRST_RATE = 0.18;

const AN_OPEN_RATE = 0.31;

const A_SHARE = 0.61;

const OLEG = 1;

const OLEGS_NAME = "Oleg";

const tallyOf = (decided: number): CareerTally => ({
  games: decided,
  evenings: SOME_EVENINGS,
  shareChance: AN_EVEN_SPLIT,
  fools: SOME_BURNS,
  decided,
  foolRate: A_FOOL_RATE,
  seatChanceInDecided: A_SEAT_IN_FOUR,
  firsts: SOME_FIRSTS,
  firstRate: A_FIRST_RATE,
  seatChance: A_SEAT_IN_FIVE,
  opens: SOME_OPENS,
  openRate: AN_OPEN_RATE,
});

const subjectOf = (decided: number): CareerSubject => ({
  history: { players: [], games: [] },
  career: { playerId: OLEG, displayName: OLEGS_NAME, share: A_SHARE, appearances: [] },
  tally: tallyOf(decided),
  nights: [],
});

const seatedFor = (
  name: typeof CareerFactName.LightningRod | typeof CareerFactName.TheSurvivor,
  decided: number
): CareerFact => ({
  name,
  games: decided,
  burns: SOME_BURNS,
  expected: A_SEAT_IN_FOUR,
  rate: A_FOOL_RATE,
});

const THE_ROD = seatedFor(CareerFactName.LightningRod, ENOUGH_DECIDED);

const THE_SURVIVOR = seatedFor(CareerFactName.TheSurvivor, ENOUGH_DECIDED);

describe("lightningRod()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    atLeastSpy.mockReturnValue(A_HIGH_TAIL);
    atMostSpy.mockReturnValue(A_LOW_TAIL);
    notablePickSpy.mockReturnValue(THE_ROD);
  });

  it("should say nothing about a career of fewer decided games than ENOUGH_DECIDED", () => {
    expect(lightningRod(subjectOf(ENOUGH_DECIDED - ONE_GAME))).toBeNull();
  });

  it("should not even weigh a career too short to judge", () => {
    lightningRod(subjectOf(ENOUGH_DECIDED - ONE_GAME));

    expect(atLeastSpy).not.toHaveBeenCalled();
    expect(notablePickSpy).not.toHaveBeenCalled();
  });

  it("should judge a career of exactly ENOUGH_DECIDED decided games", () => {
    lightningRod(subjectOf(ENOUGH_DECIDED));

    expect(notablePickSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should weigh the burns as the high tail over the decided games", () => {
    lightningRod(subjectOf(ENOUGH_DECIDED));

    expect(atLeastSpy).toHaveBeenCalledWith(SOME_BURNS, ENOUGH_DECIDED, A_SEAT_IN_FOUR);
    expect(atLeastSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should not weigh the low tail as well", () => {
    lightningRod(subjectOf(ENOUGH_DECIDED));

    expect(atMostSpy).not.toHaveBeenCalled();
  });

  it("should offer the pick one candidate, told under its own name", () => {
    lightningRod(subjectOf(ENOUGH_DECIDED));

    expect(notablePickSpy).toHaveBeenCalledWith([
      { fact: seatedFor(CareerFactName.LightningRod, ENOUGH_DECIDED), tail: A_HIGH_TAIL },
    ]);
  });

  it("should count the decided games it judged into the fact it tells", () => {
    const decided = ENOUGH_DECIDED + ONE_GAME;

    lightningRod(subjectOf(decided));

    expect(notablePickSpy).toHaveBeenCalledWith([
      { fact: seatedFor(CareerFactName.LightningRod, decided), tail: A_HIGH_TAIL },
    ]);
  });

  it("should hand back whatever the pick chose", () => {
    expect(lightningRod(subjectOf(ENOUGH_DECIDED))).toBe(THE_ROD);
  });

  it("should say nothing when the pick found the seat unremarkable", () => {
    notablePickSpy.mockReturnValue(null);

    expect(lightningRod(subjectOf(ENOUGH_DECIDED))).toBeNull();
    expect(notablePickSpy).toHaveBeenCalledTimes(ONCE);
  });
});

describe("theSurvivor()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    atLeastSpy.mockReturnValue(A_HIGH_TAIL);
    atMostSpy.mockReturnValue(A_LOW_TAIL);
    notablePickSpy.mockReturnValue(THE_SURVIVOR);
  });

  it("should say nothing about a career of fewer decided games than ENOUGH_DECIDED", () => {
    expect(theSurvivor(subjectOf(ENOUGH_DECIDED - ONE_GAME))).toBeNull();
  });

  it("should not even weigh a career too short to judge", () => {
    theSurvivor(subjectOf(ENOUGH_DECIDED - ONE_GAME));

    expect(atMostSpy).not.toHaveBeenCalled();
    expect(notablePickSpy).not.toHaveBeenCalled();
  });

  it("should judge a career of exactly ENOUGH_DECIDED decided games", () => {
    theSurvivor(subjectOf(ENOUGH_DECIDED));

    expect(notablePickSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should weigh the burns as the low tail over the decided games", () => {
    theSurvivor(subjectOf(ENOUGH_DECIDED));

    expect(atMostSpy).toHaveBeenCalledWith(SOME_BURNS, ENOUGH_DECIDED, A_SEAT_IN_FOUR);
    expect(atMostSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should not weigh the high tail as well", () => {
    theSurvivor(subjectOf(ENOUGH_DECIDED));

    expect(atLeastSpy).not.toHaveBeenCalled();
  });

  it("should offer the pick one candidate, told under its own name", () => {
    theSurvivor(subjectOf(ENOUGH_DECIDED));

    expect(notablePickSpy).toHaveBeenCalledWith([
      { fact: seatedFor(CareerFactName.TheSurvivor, ENOUGH_DECIDED), tail: A_LOW_TAIL },
    ]);
  });

  it("should hand back whatever the pick chose", () => {
    expect(theSurvivor(subjectOf(ENOUGH_DECIDED))).toBe(THE_SURVIVOR);
  });

  it("should say nothing when the pick found the seat unremarkable", () => {
    notablePickSpy.mockReturnValue(null);

    expect(theSurvivor(subjectOf(ENOUGH_DECIDED))).toBeNull();
    expect(notablePickSpy).toHaveBeenCalledTimes(ONCE);
  });
});
