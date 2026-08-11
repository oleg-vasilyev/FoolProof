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

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolByRound: (evening: unknown) => foolByRoundSpy(evening),
  finishIn: (player: unknown, round: unknown) => finishInSpy(player, round),
  playedGames: (player: unknown) => playedGamesSpy(player),
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
  const DEALT_FIVE = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(openersCurse(DEALT_FIVE)).toBeNull();
  });

  it("should report the deals as well as the deals that burned the dealer", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, ROMANI, OLEG, OLEG, OLEG, ROMANI]);
    bestBySpy.mockReturnValue(player);
    const award = openersCurse(DEALT_FIVE);

    expect(award?.name === AwardName.OpenersCurse ? [award.opens, award.burns] : []).toEqual([FIVE, TWICE]);
  });

  it("should name the dealer the curse fell on", () => {
    bestBySpy.mockReturnValue(player);

    expect(openersCurse(DEALT_FIVE)?.winners).toEqual([ROMANI]);
  });

  describe("who is eligible", () => {
    it("should count only the games a player both dealt and lost", () => {
      foolByRoundSpy.mockReturnValue([ROMANI, ROMANI, OLEG, OLEG, OLEG, ROMANI]);
      openersCurse(DEALT_FIVE);

      expect(meritGiven()(player)).toBe(TWICE);
    });

    it("should refuse a dealer who was burned only once", () => {
      foolByRoundSpy.mockReturnValue([ROMANI, OLEG, OLEG, OLEG, OLEG, OLEG]);
      openersCurse(DEALT_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should not count a game somebody else dealt and this player lost", () => {
      foolByRoundSpy.mockReturnValue([OLEG, OLEG, OLEG, OLEG, OLEG, ROMANI]);
      openersCurse(sessionAppearances([OLEG, OLEG, OLEG, OLEG, OLEG, OLEG]));

      expect(meritGiven()(player)).toBeNull();
    });
  });
});

describe("hotSeat()", () => {
  const DEALT_FIVE = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(hotSeat(DEALT_FIVE)).toBeNull();
  });

  it("should report the deals that cost them nothing", () => {
    bestBySpy.mockReturnValue(player);
    const award = hotSeat(DEALT_FIVE);

    expect(award?.name === AwardName.HotSeat ? award.opens : NOTHING).toBe(FIVE);
  });

  it("should name the dealer who got away with it", () => {
    bestBySpy.mockReturnValue(player);

    expect(hotSeat(DEALT_FIVE)?.winners).toEqual([ROMANI]);
  });

  it("should accept a dealer sitting exactly on the threshold", () => {
    hotSeat(sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, OLEG]));

    expect(meritGiven()(player)).toBe(THRICE + ONCE);
  });

  describe("who is eligible", () => {
    it("should rank a dealer who was never burned by their own deal", () => {
      hotSeat(DEALT_FIVE);

      expect(meritGiven()(player)).toBe(FIVE);
    });

    it("should refuse a dealer burned even once", () => {
      foolByRoundSpy.mockReturnValue([ROMANI, OLEG, OLEG, OLEG, OLEG, OLEG]);
      hotSeat(DEALT_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should refuse a dealer one deal short", () => {
      hotSeat(sessionAppearances([ROMANI, ROMANI, ROMANI, OLEG]));

      expect(meritGiven()(player)).toBeNull();
    });
  });
});

describe("theDoorman()", () => {
  const DEALT_SIX = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, ROMANI]);

  it("should not even look for a winner when nobody dealt six", () => {
    theDoorman(sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]));

    expect(soleBySpy).not.toHaveBeenCalled();
  });

  it("should report the deals and the evening they were dealt in", () => {
    soleBySpy.mockReturnValue(player);
    const award = theDoorman(DEALT_SIX);

    expect(award?.name === AwardName.TheDoorman ? [award.opens, award.games] : []).toEqual([
      SIX,
      SIX,
    ]);
  });

  describe("who qualifies", () => {
    const qualifierGiven = () =>
      soleBySpy.mock.calls[NOTHING]?.[ONCE] as (player: PlayerAppearances) => boolean;

    it("should accept the player who dealt the most", () => {
      theDoorman(DEALT_SIX);

      expect(qualifierGiven()(player)).toBe(true);
    });

    it("should refuse a player who dealt fewer than the most", () => {
      theDoorman(DEALT_SIX);

      expect(qualifierGiven()({ ...player, playerId: OLEG })).toBe(false);
    });
  });
});

describe("homeAdvantage()", () => {
  const DEALT_FIVE = sessionAppearances([ROMANI, ROMANI, ROMANI, ROMANI, ROMANI, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(homeAdvantage(DEALT_FIVE)).toBeNull();
  });

  it("should report the deals won as well as the deals taken", () => {
    finishInSpy.mockReturnValue(Finish.First);
    bestBySpy.mockReturnValue(player);
    const award = homeAdvantage(DEALT_FIVE);

    expect(award?.name === AwardName.HomeAdvantage ? [award.wins, award.opens] : []).toEqual([
      FIVE,
      FIVE,
    ]);
  });

  it("should name the dealer who kept winning their own game", () => {
    finishInSpy.mockReturnValue(Finish.First);
    bestBySpy.mockReturnValue(player);

    expect(homeAdvantage(DEALT_FIVE)?.winners).toEqual([ROMANI]);
  });

  describe("who is eligible", () => {
    it("should count only the games they both dealt and went out of first", () => {
      finishInSpy.mockReturnValue(Finish.First);
      homeAdvantage(DEALT_FIVE);

      expect(meritGiven()(player)).toBe(FIVE);
    });

    it("should refuse a dealer who kept dealing and losing", () => {
      finishInSpy.mockReturnValue(Finish.Middle);
      homeAdvantage(DEALT_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should refuse two wins from the deal", () => {
      finishInSpy.mockReturnValueOnce(Finish.First).mockReturnValueOnce(Finish.First);
      homeAdvantage(DEALT_FIVE);

      expect(meritGiven()(player)).toBeNull();
    });

    it("should accept exactly three wins from the deal", () => {
      finishInSpy
        .mockReturnValueOnce(Finish.First)
        .mockReturnValueOnce(Finish.First)
        .mockReturnValueOnce(Finish.First);
      homeAdvantage(DEALT_FIVE);

      expect(meritGiven()(player)).toBe(THRICE);
    });
  });
});

describe("neverAsked()", () => {
  const NEVER_DEALT = sessionAppearances([OLEG, OLEG, OLEG, OLEG]);

  it("should award nothing when the ranking found nobody", () => {
    expect(neverAsked(NEVER_DEALT)).toBeNull();
  });

  it("should report the games they sat through without ever dealing", () => {
    bestBySpy.mockReturnValue(player);
    const award = neverAsked(NEVER_DEALT);

    expect(award?.name === AwardName.NeverAsked ? award.games : NOTHING).toBe(A_FULL_EVENING);
  });

  it("should name the player nobody ever handed the deal to", () => {
    bestBySpy.mockReturnValue(player);

    expect(neverAsked(NEVER_DEALT)?.winners).toEqual([ROMANI]);
  });

  describe("who is eligible", () => {
    it("should rank a player who never dealt by the games they sat", () => {
      neverAsked(NEVER_DEALT);

      expect(meritGiven()(player)).toBe(A_FULL_EVENING);
    });

    it("should refuse a player who dealt even once", () => {
      neverAsked(sessionAppearances([OLEG, OLEG, OLEG, ROMANI]));

      expect(meritGiven()(player)).toBeNull();
    });

    it("should refuse a player one game short of a full evening", () => {
      neverAsked(NEVER_DEALT);
      playedGamesSpy.mockReturnValue(A_FULL_EVENING - ONCE);

      expect(meritGiven()(player)).toBeNull();
    });
  });
});

describe("tableCurse()", () => {
  it("should report nothing when no dealer was ever left the fool", () => {
    foolByRoundSpy.mockReturnValue([OLEG, OLEG]);

    expect(tableCurse(sessionAppearances([ROMANI, ROMANI]))).toBeNull();
  });

  it("should count every game whose dealer lost it, whoever they were", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, OLEG, ROMANI]);

    expect(tableCurse(sessionAppearances([ROMANI, OLEG, OLEG]))).toEqual({
      burns: TWICE,
      games: TWICE + ONCE,
    });
  });

  it("should not count a game nobody dealt as the dealer's fault", () => {
    foolByRoundSpy.mockReturnValue([null, null]);

    expect(tableCurse(sessionAppearances([null, null]))).toBeNull();
  });

  it("should report the whole evening as the games it looked at", () => {
    foolByRoundSpy.mockReturnValue([ROMANI, OLEG, OLEG, ROMANI, OLEG, OLEG]);

    expect(tableCurse(sessionAppearances([ROMANI, OLEG, OLEG, OLEG, OLEG, OLEG]))?.games).toBe(SIX);
  });
});
