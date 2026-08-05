import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENOUGH_GAMES } from "#scoresheet/domain/award-catalogue.ts";
import type { Appearance, Evening, PlayerEvening } from "#scoresheet/domain/evening.ts";
import type { Merit } from "#scoresheet/domain/pick-winner.ts";


const bestBySpy = vi.fn();

vi.mock("#scoresheet/domain/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
}));

const playedGamesSpy = vi.fn();

const foolCountSpy = vi.fn();

vi.mock("#scoresheet/domain/evening.ts", () => ({
  playedGames: (player: unknown) => playedGamesSpy(player),
  foolCount: (player: unknown) => foolCountSpy(player),
}));

const { allOrNothing, theInvisible, untouchable } = await import(
  "#scoresheet/domain/position-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TEN = 10;

const AT_THE_EDGES = 8;

const IN_THE_MIDDLE = 8;

const EIGHT_IN_TEN = 0.8;

const ANYA = 4;

const appearing = (...finishes: readonly Appearance["finish"][]): PlayerEvening => ({
  playerId: ANYA,
  share: NOTHING,
  appearances: finishes.map((finish, round) => ({ round, finish })),
});

const LOPSIDED = appearing(
  "first",
  "fool",
  "first",
  "fool",
  "first",
  "fool",
  "middle",
  "middle",
  "first",
  "fool"
);

const MIDDLING = appearing(
  "middle",
  "middle",
  "middle",
  "middle",
  "middle",
  "middle",
  "first",
  "fool",
  "middle",
  "middle"
);

const eveningOf = (player: PlayerEvening): Evening => ({
  rounds: TEN,
  players: [player],
  starters: [],
});

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  playedGamesSpy.mockReturnValue(TEN);
  foolCountSpy.mockReturnValue(NOTHING);
});

describe("untouchable()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(untouchable(eveningOf(LOPSIDED))).toBeNull();
  });

  it("should report the games survived", () => {
    bestBySpy.mockReturnValue(LOPSIDED);
    const award = untouchable(eveningOf(LOPSIDED));

    expect(award?.name === "untouchable" ? award.games : NOTHING).toBe(TEN);
  });

  describe("who is eligible", () => {
    it("should rank a player who was never the fool by the games they sat", () => {
      untouchable(eveningOf(LOPSIDED));

      expect(meritGiven()(LOPSIDED)).toBe(TEN);
    });

    it("should refuse a player who was the fool even once", () => {
      untouchable(eveningOf(LOPSIDED));
      foolCountSpy.mockReturnValue(ONCE);

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });

    it("should refuse a player one game short", () => {
      untouchable(eveningOf(LOPSIDED));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });
  });
});

describe("allOrNothing()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(allOrNothing(eveningOf(LOPSIDED))).toBeNull();
  });

  it("should count going out first and being the fool as the two edges", () => {
    bestBySpy.mockReturnValue(LOPSIDED);
    const award = allOrNothing(eveningOf(LOPSIDED));

    expect(award?.name === "allOrNothing" ? [award.edges, award.games] : []).toEqual([
      AT_THE_EDGES,
      TEN,
    ]);
  });

  describe("who is eligible", () => {
    it("should rank a lopsided player by the rate rather than the count", () => {
      allOrNothing(eveningOf(LOPSIDED));

      expect(meritGiven()(LOPSIDED)).toBeCloseTo(EIGHT_IN_TEN);
    });

    it("should refuse a player who mostly finished in the middle", () => {
      allOrNothing(eveningOf(MIDDLING));

      expect(meritGiven()(MIDDLING)).toBeNull();
    });

    it("should refuse a player one game short", () => {
      allOrNothing(eveningOf(LOPSIDED));
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES - ONCE);

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });
  });
});

describe("theInvisible()", () => {
  it("should award nothing when the ranking found nobody", () => {
    expect(theInvisible(eveningOf(MIDDLING))).toBeNull();
  });

  it("should count only the games finished in the middle", () => {
    bestBySpy.mockReturnValue(MIDDLING);
    const award = theInvisible(eveningOf(MIDDLING));

    expect(award?.name === "theInvisible" ? [award.middles, award.games] : []).toEqual([
      IN_THE_MIDDLE,
      TEN,
    ]);
  });

  describe("who is eligible", () => {
    it("should rank a quiet player by the rate rather than the count", () => {
      theInvisible(eveningOf(MIDDLING));

      expect(meritGiven()(MIDDLING)).toBeCloseTo(EIGHT_IN_TEN);
    });

    it("should refuse a player who kept finishing at the edges", () => {
      theInvisible(eveningOf(LOPSIDED));

      expect(meritGiven()(LOPSIDED)).toBeNull();
    });
  });
});
