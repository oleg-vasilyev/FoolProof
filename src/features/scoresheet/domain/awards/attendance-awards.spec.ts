import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Appearance, SessionAppearances, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";


const bestBySpy = vi.fn();

const soleBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
  soleBy: (players: unknown, qualifies: unknown) => soleBySpy(players, qualifies),
}));

const foolByRoundSpy = vi.fn();

const lastRoundOfSpy = vi.fn();

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolByRound: (evening: unknown) => foolByRoundSpy(evening),
  lastRoundOf: (player: unknown) => lastRoundOfSpy(player),
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const { firstBlood, ironSeat, theIrishGoodbye, theTruce } = await import(
  "#scoresheet/domain/awards/attendance-awards.ts"
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
): PlayerAppearances => ({ playerId, share: NOTHING, appearances });

const sessionAppearances = (players: readonly PlayerAppearances[], rounds = NINETEEN): SessionAppearances => ({
  rounds,
  players,
  starters: [],
});

const SOMEBODY = appearing(DIMA, { round: NOTHING, finish: Finish.First });

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
    ironSeat(sessionAppearances([SOMEBODY], NINE));

    expect(soleBySpy).not.toHaveBeenCalled();
  });

  it("should award nothing when more than one player sat through everything", () => {
    expect(ironSeat(sessionAppearances([SOMEBODY], TEN))).toBeNull();
  });

  it("should report the whole evening as the games sat", () => {
    soleBySpy.mockReturnValue(SOMEBODY);
    const award = ironSeat(sessionAppearances([SOMEBODY], NINETEEN));

    expect(award?.name === AwardName.IronSeat ? [award.winners, award.games] : []).toEqual([
      [DIMA],
      NINETEEN,
    ]);
  });

  describe("who qualifies", () => {
    const qualifierGiven = () =>
      soleBySpy.mock.calls[NOTHING]?.[ONCE] as (player: PlayerAppearances) => boolean;

    it("should accept a player who played every game of the evening", () => {
      ironSeat(sessionAppearances([SOMEBODY], TEN));
      playedGamesSpy.mockReturnValue(TEN);

      expect(qualifierGiven()(SOMEBODY)).toBe(true);
    });

    it("should refuse a player who missed one", () => {
      ironSeat(sessionAppearances([SOMEBODY], TEN));
      playedGamesSpy.mockReturnValue(NINE);

      expect(qualifierGiven()(SOMEBODY)).toBe(false);
    });
  });
});

describe("theTruce()", () => {
  const DREW = appearing(
    DIMA,
    { round: NOTHING, finish: Finish.Fool },
    { round: TWICE, finish: Finish.Drawn }
  );

  const ALSO_DREW = appearing(
    VERONIKA,
    { round: NOTHING, finish: Finish.First },
    { round: TWICE, finish: Finish.Drawn }
  );

  const NEVER_DREW = appearing(SEVEN, { round: NOTHING, finish: Finish.Fool });

  it("should award nothing when the evening had no draw", () => {
    expect(theTruce(sessionAppearances([NEVER_DREW]))).toBeNull();
  });

  it("should name everybody who was in a draw", () => {
    expect(theTruce(sessionAppearances([DREW, NEVER_DREW, ALSO_DREW]))?.winners).toEqual([DIMA, VERONIKA]);
  });

  it("should count one draw when two players shared the same last place", () => {
    const award = theTruce(sessionAppearances([DREW, ALSO_DREW]));

    expect(award?.name === AwardName.TheTruce ? [award.draws, award.games] : []).toEqual([ONCE, NINETEEN]);
  });

  it("should count two draws played in different games", () => {
    const twice = appearing(
      DIMA,
      { round: NOTHING, finish: Finish.Drawn },
      { round: ONCE, finish: Finish.First },
      { round: TWICE, finish: Finish.Drawn }
    );
    const award = theTruce(sessionAppearances([twice]));

    expect(award?.name === AwardName.TheTruce ? award.draws : NOTHING).toBe(TWICE);
  });

  it("should count only the games that were actually drawn", () => {
    const mixed = appearing(
      DIMA,
      { round: NOTHING, finish: Finish.Fool },
      { round: ONCE, finish: Finish.First },
      { round: TWICE, finish: Finish.Drawn }
    );
    const award = theTruce(sessionAppearances([mixed]));

    expect(award?.name === AwardName.TheTruce ? award.draws : NOTHING).toBe(ONCE);
  });
});

describe("theIrishGoodbye()", () => {
  const SLIPPED_AWAY = appearing(
    VERONIKA,
    { round: NOTHING, finish: Finish.First },
    { round: ONCE, finish: Finish.Fool },
    { round: SEVEN, finish: Finish.Middle }
  );

  const LEFT_BEATEN = appearing(
    VERONIKA,
    { round: NOTHING, finish: Finish.First },
    { round: ONCE, finish: Finish.Middle },
    { round: SEVEN, finish: Finish.Fool }
  );

  const NEVER_SAT_DOWN = appearing(DIMA);

  const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

  it("should award nothing when the ranking found nobody", () => {
    expect(theIrishGoodbye(sessionAppearances([SLIPPED_AWAY]))).toBeNull();
  });

  it("should report the game they left after, counted from one", () => {
    bestBySpy.mockReturnValue(SLIPPED_AWAY);
    lastRoundOfSpy.mockReturnValue(SEVEN);
    const award = theIrishGoodbye(sessionAppearances([SLIPPED_AWAY]));

    expect(award?.name === AwardName.TheIrishGoodbye ? [award.leftAfter, award.games] : []).toEqual([
      EIGHT,
      NINETEEN,
    ]);
  });

  describe("who is eligible", () => {
    it("should prefer whoever left earliest", () => {
      theIrishGoodbye(sessionAppearances([SLIPPED_AWAY]));
      lastRoundOfSpy.mockReturnValue(SEVEN);

      expect(meritGiven()(SLIPPED_AWAY)).toBe(-SEVEN);
    });

    it("should refuse somebody who was still there for the last game", () => {
      theIrishGoodbye(sessionAppearances([SLIPPED_AWAY]));
      lastRoundOfSpy.mockReturnValue(NINETEEN - ONCE);

      expect(meritGiven()(SLIPPED_AWAY)).toBeNull();
    });

    it("should refuse somebody whose last game left them the fool", () => {
      theIrishGoodbye(sessionAppearances([LEFT_BEATEN]));
      lastRoundOfSpy.mockReturnValue(SEVEN);

      expect(meritGiven()(LEFT_BEATEN)).toBeNull();
    });

    it("should refuse somebody who never played at all", () => {
      theIrishGoodbye(sessionAppearances([NEVER_SAT_DOWN]));
      lastRoundOfSpy.mockReturnValue(null);

      expect(meritGiven()(NEVER_SAT_DOWN)).toBeNull();
    });
  });
});

describe("firstBlood()", () => {
  it("should award nothing when the first game was drawn", () => {
    foolByRoundSpy.mockReturnValue([null, DIMA]);

    expect(firstBlood(sessionAppearances([SOMEBODY]))).toBeNull();
  });

  it("should name the fool of the very first game, not of a later one", () => {
    foolByRoundSpy.mockReturnValue([VERONIKA, DIMA]);
    const award = firstBlood(sessionAppearances([SOMEBODY]));

    expect(award?.name === AwardName.FirstBlood ? [award.winners, award.games] : []).toEqual([
      [VERONIKA],
      NINETEEN,
    ]);
  });
});
