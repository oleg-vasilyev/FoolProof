import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SessionAppearances, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";


const bestBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
}));

const playedGamesSpy = vi.fn();

const foolCountSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  playedGames: (player: unknown) => playedGamesSpy(player),
  foolCount: (player: unknown) => foolCountSpy(player),
}));

const { foolOfTheNight, kingOfTheTable } = await import("#scoresheet/domain/awards/share-awards.ts");

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const OLEG = 3;

const SHARE = 0.614;

const KING_PERCENT = 61;

const EIGHTEEN = 18;

const TOO_FEW = ENOUGH_GAMES - ONCE;

const winner: PlayerAppearances = { playerId: OLEG, share: SHARE, appearances: [] };

const EVENING: SessionAppearances = { rounds: EIGHTEEN, players: [winner], starters: [] };

const meritGiven = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  bestBySpy.mockReturnValue(null);
  playedGamesSpy.mockReturnValue(EIGHTEEN);
  foolCountSpy.mockReturnValue(ONCE);
});

describe("kingOfTheTable()", () => {
  it("should award nothing when nobody has played enough", () => {
    expect(kingOfTheTable(EVENING)).toBeNull();
  });

  it("should rank the evening's own players", () => {
    kingOfTheTable(EVENING);

    expect(bestBySpy).toHaveBeenCalledWith(EVENING.players, expect.any(Function));
  });

  it("should crown the player the ranking picked", () => {
    bestBySpy.mockReturnValue(winner);

    expect(kingOfTheTable(EVENING)?.winners).toEqual([OLEG]);
  });

  it("should report the share as a whole percent", () => {
    bestBySpy.mockReturnValue(winner);
    const award = kingOfTheTable(EVENING);

    expect(award?.name === AwardName.King ? award.percent : NOTHING).toBe(KING_PERCENT);
  });

  it("should report the games behind that share", () => {
    bestBySpy.mockReturnValue(winner);
    const award = kingOfTheTable(EVENING);

    expect(award?.name === AwardName.King ? award.games : NOTHING).toBe(EIGHTEEN);
  });

  describe("who is eligible", () => {
    it("should rank an eligible player by their table share", () => {
      kingOfTheTable(EVENING);
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

      expect(meritGiven()(winner)).toBe(SHARE);
    });

    it("should refuse to rank a player one game short", () => {
      kingOfTheTable(EVENING);
      playedGamesSpy.mockReturnValue(TOO_FEW);

      expect(meritGiven()(winner)).toBeNull();
    });
  });
});

describe("foolOfTheNight()", () => {
  it("should award nothing when nobody has played enough", () => {
    expect(foolOfTheNight(EVENING)).toBeNull();
  });

  it("should award nothing when the worst player was never the fool", () => {
    bestBySpy.mockReturnValue(winner);
    foolCountSpy.mockReturnValue(NOTHING);

    expect(foolOfTheNight(EVENING)).toBeNull();
  });

  it("should crown the player the ranking picked", () => {
    bestBySpy.mockReturnValue(winner);

    expect(foolOfTheNight(EVENING)?.winners).toEqual([OLEG]);
  });

  it("should report how many of how many were lost", () => {
    bestBySpy.mockReturnValue(winner);
    foolCountSpy.mockReturnValue(TWICE);
    const award = foolOfTheNight(EVENING);

    expect(award?.name === AwardName.FoolOfTheNight ? [award.fools, award.games] : []).toEqual([
      TWICE,
      EIGHTEEN,
    ]);
  });

  describe("who is eligible", () => {
    it("should rank an eligible player by the share of games they lost", () => {
      foolOfTheNight(EVENING);
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);
      foolCountSpy.mockReturnValue(ONCE);

      expect(meritGiven()(winner)).toBe(ONCE / ENOUGH_GAMES);
    });

    it("should refuse to rank a player one game short", () => {
      foolOfTheNight(EVENING);
      playedGamesSpy.mockReturnValue(TOO_FEW);

      expect(meritGiven()(winner)).toBeNull();
    });
  });
});
