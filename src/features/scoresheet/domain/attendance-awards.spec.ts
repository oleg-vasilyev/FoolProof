import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Appearance, Evening, PlayerEvening } from "#scoresheet/domain/evening.ts";
import type { Merit } from "#scoresheet/domain/pick-winner.ts";


const bestBySpy = vi.fn();

const soleBySpy = vi.fn();

vi.mock("#scoresheet/domain/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
  soleBy: (players: unknown, qualifies: unknown) => soleBySpy(players, qualifies),
}));

const foolByRoundSpy = vi.fn();

const lastRoundOfSpy = vi.fn();

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/evening.ts", () => ({
  foolByRound: (evening: unknown) => foolByRoundSpy(evening),
  lastRoundOf: (player: unknown) => lastRoundOfSpy(player),
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const { firstBlood, ironSeat, theIrishGoodbye, theTruce } = await import(
  "#scoresheet/domain/attendance-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const SEVEN = 7;

const EIGHT = 8;

const NINE = 9;

const TEN = 10;

const NINETEEN = 19;

const DIMA = 2;

const VERONIKA = 5;

const appearing = (
  playerId: number,
  ...appearances: readonly Appearance[]
): PlayerEvening => ({ playerId, share: NOTHING, appearances });

const eveningOf = (players: readonly PlayerEvening[], rounds = NINETEEN): Evening => ({
  rounds,
  players,
  starters: [],
});

const SOMEBODY = appearing(DIMA, { round: NOTHING, finish: "first" });

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  soleBySpy.mockReturnValue(null);
  foolByRoundSpy.mockReturnValue([]);
  lastRoundOfSpy.mockReturnValue(null);
  playedGamesSpy.mockReturnValue(NOTHING);
});

describe("ironSeat()", () => {
  it("should not even look for a winner in an evening shorter than ten games", () => {
    ironSeat(eveningOf([SOMEBODY], NINE));

    expect(soleBySpy).not.toHaveBeenCalled();
  });

  it("should award nothing when more than one player sat through everything", () => {
    expect(ironSeat(eveningOf([SOMEBODY], TEN))).toBeNull();
  });

  it("should report the whole evening as the games sat", () => {
    soleBySpy.mockReturnValue(SOMEBODY);
    const award = ironSeat(eveningOf([SOMEBODY], NINETEEN));

    expect(award?.name === "ironSeat" ? [award.winners, award.games] : []).toEqual([
      [DIMA],
      NINETEEN,
    ]);
  });

  describe("who qualifies", () => {
    const qualifierGiven = () =>
      soleBySpy.mock.calls[NOTHING]?.[ONCE] as (player: PlayerEvening) => boolean;

    it("should accept a player who played every game of the evening", () => {
      ironSeat(eveningOf([SOMEBODY], TEN));
      playedGamesSpy.mockReturnValue(TEN);

      expect(qualifierGiven()(SOMEBODY)).toBe(true);
    });

    it("should refuse a player who missed one", () => {
      ironSeat(eveningOf([SOMEBODY], TEN));
      playedGamesSpy.mockReturnValue(NINE);

      expect(qualifierGiven()(SOMEBODY)).toBe(false);
    });
  });
});

describe("theTruce()", () => {
  const DREW = appearing(
    DIMA,
    { round: NOTHING, finish: "fool" },
    { round: TWICE, finish: "drawn" }
  );

  const ALSO_DREW = appearing(
    VERONIKA,
    { round: NOTHING, finish: "first" },
    { round: TWICE, finish: "drawn" }
  );

  const NEVER_DREW = appearing(SEVEN, { round: NOTHING, finish: "fool" });

  it("should award nothing when the evening had no draw", () => {
    expect(theTruce(eveningOf([NEVER_DREW]))).toBeNull();
  });

  it("should name everybody who was in a draw", () => {
    expect(theTruce(eveningOf([DREW, NEVER_DREW, ALSO_DREW]))?.winners).toEqual([DIMA, VERONIKA]);
  });

  it("should count one draw when two players shared the same last place", () => {
    const award = theTruce(eveningOf([DREW, ALSO_DREW]));

    expect(award?.name === "theTruce" ? [award.draws, award.games] : []).toEqual([ONCE, NINETEEN]);
  });

  it("should count two draws played in different games", () => {
    const twice = appearing(
      DIMA,
      { round: NOTHING, finish: "drawn" },
      { round: ONCE, finish: "first" },
      { round: TWICE, finish: "drawn" }
    );
    const award = theTruce(eveningOf([twice]));

    expect(award?.name === "theTruce" ? award.draws : NOTHING).toBe(TWICE);
  });

  it("should count only the games that were actually drawn", () => {
    const mixed = appearing(
      DIMA,
      { round: NOTHING, finish: "fool" },
      { round: ONCE, finish: "first" },
      { round: TWICE, finish: "drawn" }
    );
    const award = theTruce(eveningOf([mixed]));

    expect(award?.name === "theTruce" ? award.draws : NOTHING).toBe(ONCE);
  });
});

describe("theIrishGoodbye()", () => {
  const SLIPPED_AWAY = appearing(
    VERONIKA,
    { round: NOTHING, finish: "first" },
    { round: ONCE, finish: "fool" },
    { round: SEVEN, finish: "middle" }
  );

  const LEFT_BEATEN = appearing(
    VERONIKA,
    { round: NOTHING, finish: "first" },
    { round: ONCE, finish: "middle" },
    { round: SEVEN, finish: "fool" }
  );

  const NEVER_SAT_DOWN = appearing(DIMA);

  const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

  it("should award nothing when the ranking found nobody", () => {
    expect(theIrishGoodbye(eveningOf([SLIPPED_AWAY]))).toBeNull();
  });

  it("should report the game they left after, counted from one", () => {
    bestBySpy.mockReturnValue(SLIPPED_AWAY);
    lastRoundOfSpy.mockReturnValue(SEVEN);
    const award = theIrishGoodbye(eveningOf([SLIPPED_AWAY]));

    expect(award?.name === "theIrishGoodbye" ? [award.leftAfter, award.games] : []).toEqual([
      EIGHT,
      NINETEEN,
    ]);
  });

  describe("who is eligible", () => {
    it("should prefer whoever left earliest", () => {
      theIrishGoodbye(eveningOf([SLIPPED_AWAY]));
      lastRoundOfSpy.mockReturnValue(SEVEN);

      expect(meritGiven()(SLIPPED_AWAY)).toBe(-SEVEN);
    });

    it("should refuse somebody who was still there for the last game", () => {
      theIrishGoodbye(eveningOf([SLIPPED_AWAY]));
      lastRoundOfSpy.mockReturnValue(NINETEEN - ONCE);

      expect(meritGiven()(SLIPPED_AWAY)).toBeNull();
    });

    it("should refuse somebody whose last game left them the fool", () => {
      theIrishGoodbye(eveningOf([LEFT_BEATEN]));
      lastRoundOfSpy.mockReturnValue(SEVEN);

      expect(meritGiven()(LEFT_BEATEN)).toBeNull();
    });

    it("should refuse somebody who never played at all", () => {
      theIrishGoodbye(eveningOf([NEVER_SAT_DOWN]));
      lastRoundOfSpy.mockReturnValue(null);

      expect(meritGiven()(NEVER_SAT_DOWN)).toBeNull();
    });
  });
});

describe("firstBlood()", () => {
  it("should award nothing when the first game was drawn", () => {
    foolByRoundSpy.mockReturnValue([null, DIMA]);

    expect(firstBlood(eveningOf([SOMEBODY]))).toBeNull();
  });

  it("should name the fool of the very first game, not of a later one", () => {
    foolByRoundSpy.mockReturnValue([VERONIKA, DIMA]);
    const award = firstBlood(eveningOf([SOMEBODY]));

    expect(award?.name === "firstBlood" ? [award.winners, award.games] : []).toEqual([
      [VERONIKA],
      NINETEEN,
    ]);
  });
});
