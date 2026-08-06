import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SessionAppearances, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";


const bestBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
}));

const foolByRoundSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  foolByRound: (evening: unknown) => foolByRoundSpy(evening),
}));

const { openersCurse, tableCurse } = await import("#scoresheet/domain/awards/opener-awards.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const FIVE = 5;

const SIX = 6;

const ROMANI = 6;

const OLEG = 3;

const player: PlayerAppearances = { playerId: ROMANI, share: NOTHING, appearances: [] };

const sessionAppearances = (starters: readonly (number | null)[]): SessionAppearances => ({
  rounds: starters.length,
  players: [player],
  starters,
});

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  foolByRoundSpy.mockReturnValue([]);
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
