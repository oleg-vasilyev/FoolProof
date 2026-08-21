import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SessionAppearances, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";


const bestBySpy = vi.fn();

const soleBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
  soleBy: (players: unknown, qualifies: unknown) => soleBySpy(players, qualifies),
}));

const foolByRoundSpy = vi.fn();

const finishInSpy = vi.fn();

const playedGamesSpy = vi.fn();

const tableSizeInSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolByRound: (evening: unknown) => foolByRoundSpy(evening),
  finishIn: (player: unknown, round: unknown) => finishInSpy(player, round),
  playedGames: (player: unknown) => playedGamesSpy(player),
  tableSizeIn: (evening: unknown, round: unknown) => tableSizeInSpy(evening, round),
}));

const { homeAdvantage, hotSeat, neverAsked, openersCurse, tableCurse, theDoorman } = await import(
  "#scoresheet/domain/awards/opener-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const THRICE = 3;

const FIVE = 5;

const SIX = 6;

const A_FULL_EVENING = 10;

const ROMANI = 6;

const OLEG = 3;

const player: PlayerAppearances = { playerId: ROMANI, share: NOTHING, running: [], appearances: [] };

const sessionAppearances = (starters: readonly (number | null)[]): SessionAppearances => ({
  rounds: starters.length,
  players: [player],
  starters,
});

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  soleBySpy.mockReturnValue(null);
  foolByRoundSpy.mockReturnValue([]);
  finishInSpy.mockReturnValue(null);
  playedGamesSpy.mockReturnValue(A_FULL_EVENING);
});

describe("openersCurse()", () => {
  const OPENED_FIVE = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(openersCurse(OPENED_FIVE)).toBeNull();
  });

  it("should report how many games they opened, and how many of those burned them", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, ROMANI, OLEG, OLEG, OLEG, ROMANI]);
    bestBySpy.mockReturnValue(player);
    const award = openersCurse(OPENED_FIVE);

    expect(award?.name === AwardName.OpenersCurse ? [award.opens, award.burns] : []).toEqual([FIVE, TWICE]);
  });

  it("should name the opener the curse fell on", () => {
    bestBySpy.mockReturnValue(player);

    expect(openersCurse(OPENED_FIVE)?.winners).toEqual([ROMANI]);
  });

  describe("who is eligible", () => {
    it("should count only the games a player both opened and lost", () => {
      foolByRoundSpy.mockReturnValue([ROMANI, ROMANI, OLEG, OLEG, OLEG, ROMANI]);
      openersCurse(OPENED_FIVE);

      expect(meritGiven()(player)).toBe(TWICE);
    });

    it("should refuse an opener who was burned only once", () => {
      foolByRoundSpy.mockReturnValue([ROMANI, OLEG, OLEG, OLEG, OLEG, OLEG]);
      openersCurse(OPENED_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should not count a game somebody else opened and this player lost", () => {
      foolByRoundSpy.mockReturnValue([OLEG, OLEG, OLEG, OLEG, OLEG, ROMANI]);
      openersCurse(sessionAppearances([OLEG, OLEG, OLEG, OLEG, OLEG, OLEG]));

      expect(meritGiven()(player)).toBeNull();
    });
  });
});

describe("hotSeat()", () => {
  const OPENED_FIVE = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(hotSeat(OPENED_FIVE)).toBeNull();
  });

  it("should report the openings that cost them nothing", () => {
    bestBySpy.mockReturnValue(player);
    const award = hotSeat(OPENED_FIVE);

    expect(award?.name === AwardName.HotSeat ? award.opens : NOTHING).toBe(FIVE);
  });

  it("should name the opener who got away with it", () => {
    bestBySpy.mockReturnValue(player);

    expect(hotSeat(OPENED_FIVE)?.winners).toEqual([ROMANI]);
  });

  it("should accept an opener sitting exactly on the threshold", () => {
    hotSeat(sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, OLEG]));

    expect(meritGiven()(player)).toBe(THRICE + ONCE);
  });

  describe("who is eligible", () => {
    it("should rank an opener who was never burned by their own opening", () => {
      hotSeat(OPENED_FIVE);

      expect(meritGiven()(player)).toBe(FIVE);
    });

    it("should refuse an opener burned even once", () => {
      foolByRoundSpy.mockReturnValue([ROMANI, OLEG, OLEG, OLEG, OLEG, OLEG]);
      hotSeat(OPENED_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should refuse an opener one opening short", () => {
      hotSeat(sessionAppearances([ROMANI, ROMANI, ROMANI, OLEG]));

      expect(meritGiven()(player)).toBeNull();
    });
  });
});

describe("theDoorman()", () => {
  const OPENED_SIX = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, ROMANI]);

  it("should not even look for a winner when nobody opened six games", () => {
    theDoorman(sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]));

    expect(soleBySpy).not.toHaveBeenCalled();
  });

  it("should report the openings and how many games the evening had", () => {
    soleBySpy.mockReturnValue(player);
    const award = theDoorman(OPENED_SIX);

    expect(award?.name === AwardName.TheDoorman ? [award.opens, award.games] : []).toEqual([
      SIX,
      SIX,
    ]);
  });

  describe("who qualifies", () => {
    const qualifierGiven = () =>
      soleBySpy.mock.calls[NOTHING]?.[ONCE] as (player: PlayerAppearances) => boolean;

    it("should accept the player who opened the most", () => {
      theDoorman(OPENED_SIX);

      expect(qualifierGiven()(player)).toBe(true);
    });

    it("should refuse a player who opened fewer than the most", () => {
      theDoorman(OPENED_SIX);

      expect(qualifierGiven()({ ...player, playerId: OLEG })).toBe(false);
    });
  });
});

describe("homeAdvantage()", () => {
  const OPENED_FIVE = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(homeAdvantage(OPENED_FIVE)).toBeNull();
  });

  it("should report the games won at home as well as the games opened", () => {
    finishInSpy.mockReturnValue(Finish.First);
    bestBySpy.mockReturnValue(player);
    const award = homeAdvantage(OPENED_FIVE);

    expect(award?.name === AwardName.HomeAdvantage ? [award.wins, award.opens] : []).toEqual([
      FIVE,
      FIVE,
    ]);
  });

  it("should name the opener who kept winning their own game", () => {
    finishInSpy.mockReturnValue(Finish.First);
    bestBySpy.mockReturnValue(player);

    expect(homeAdvantage(OPENED_FIVE)?.winners).toEqual([ROMANI]);
  });

  describe("who is eligible", () => {
    it("should count only the games they both opened and finished first in", () => {
      finishInSpy.mockReturnValue(Finish.First);
      homeAdvantage(OPENED_FIVE);

      expect(meritGiven()(player)).toBe(FIVE);
    });

    it("should refuse an opener who kept opening and losing", () => {
      finishInSpy.mockReturnValue(Finish.Middle);
      homeAdvantage(OPENED_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should refuse a player with only two wins from opening", () => {
      finishInSpy.mockReturnValueOnce(Finish.First).mockReturnValueOnce(Finish.First);
      homeAdvantage(OPENED_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should accept a player with exactly three wins from opening", () => {
      finishInSpy
        .mockReturnValueOnce(Finish.First)
        .mockReturnValueOnce(Finish.First)
        .mockReturnValueOnce(Finish.First);
      homeAdvantage(OPENED_FIVE);

      expect(meritGiven()(player)).toBe(THRICE);
    });
  });
});

describe("neverAsked()", () => {
  const NEVER_OPENED_ONE = sessionAppearances([OLEG, OLEG, OLEG, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(neverAsked(NEVER_OPENED_ONE)).toBeNull();
  });

  it("should report the games they sat through without ever opening", () => {
    bestBySpy.mockReturnValue(player);
    const award = neverAsked(NEVER_OPENED_ONE);

    expect(award?.name === AwardName.NeverAsked ? award.games : NOTHING).toBe(A_FULL_EVENING);
  });

  it("should name the player nobody ever handed the opening to", () => {
    bestBySpy.mockReturnValue(player);

    expect(neverAsked(NEVER_OPENED_ONE)?.winners).toEqual([ROMANI]);
  });

  describe("who is eligible", () => {
    it("should rank a player who never opened by the games they sat", () => {
      neverAsked(NEVER_OPENED_ONE);

      expect(meritGiven()(player)).toBe(A_FULL_EVENING);
    });

    it("should refuse a player who opened even once", () => {
      neverAsked(sessionAppearances([OLEG, OLEG, OLEG, ROMANI]));

      expect(meritGiven()(player)).toBeNull();
    });

    it("should refuse a player one game short of a full evening", () => {
      neverAsked(NEVER_OPENED_ONE);
      playedGamesSpy.mockReturnValue(A_FULL_EVENING - ONCE);

      expect(meritGiven()(player)).toBeNull();
    });
  });
});

describe("tableCurse()", () => {
  const A_TABLE_OF_FOUR = 4;

  const A_TABLE_OF_TWO = 2;

  const A_TABLE_OF_EIGHT = 8;

  beforeEach(() => {
    tableSizeInSpy.mockReturnValue(A_TABLE_OF_FOUR);
  });

  it("should report nothing when no opener was ever left the fool", () => {
    foolByRoundSpy.mockReturnValue([OLEG, OLEG]);

    expect(tableCurse(sessionAppearances([ROMANI, ROMANI]))).toBeNull();
  });

  it("should count every game whose opener lost it, whoever they were", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, OLEG, ROMANI]);

    expect(tableCurse(sessionAppearances([ROMANI, OLEG, OLEG]))).toEqual({
      burns: TWICE,
      games: THRICE,
      predicted: ONCE,
    });
  });

  it("should stay silent when the openers burned exactly as often as the seats predict", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, OLEG, ROMANI, ROMANI]);

    expect(tableCurse(sessionAppearances([ROMANI, ROMANI, OLEG, OLEG]))).toBeNull();
  });

  it("should read the prediction off the table each game was played at", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, OLEG, ROMANI]);
    tableSizeInSpy.mockReturnValue(A_TABLE_OF_TWO);

    expect(tableCurse(sessionAppearances([ROMANI, OLEG, OLEG]))).toBeNull();
  });

  it("should call the same two burns a curse once the table is wide enough", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, OLEG, ROMANI]);
    tableSizeInSpy.mockReturnValue(A_TABLE_OF_EIGHT);

    expect(tableCurse(sessionAppearances([ROMANI, OLEG, OLEG]))?.predicted).toBe(NOTHING);
  });

  it("should not count a game nobody opened as the opener's fault", () => {
    foolByRoundSpy.mockReturnValue([null, null]);

    expect(tableCurse(sessionAppearances([null, null]))).toBeNull();
  });

  it("should leave a game that ended in a draw out of the games it looked at", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, null, ROMANI, null, null, null]);

    expect(tableCurse(sessionAppearances([ROMANI, OLEG, ROMANI, OLEG, OLEG, OLEG]))?.games).toBe(
      TWICE
    );
  });
});
