import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SessionAppearances, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";


const standoutBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  standoutBy: (players: unknown, merit: unknown) => standoutBySpy(players, merit),
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

const ANNA = 8;

const OLEG_SHARE = 0.614;

const KING_PERCENT = 61;

const ANNA_SHARE = 0.386;

const RUNNER_UP_PERCENT = 39;

const EIGHTEEN = 18;

const TOO_FEW = ENOUGH_GAMES - ONCE;

const FIELD_RANKED = 0;

const MERIT_USED = 1;

const FOOL_RANKING = 0;

const KING_RANKING = 1;

const oleg: PlayerAppearances = { playerId: OLEG, share: OLEG_SHARE, running: [], appearances: [] };

const anna: PlayerAppearances = { playerId: ANNA, share: ANNA_SHARE, running: [], appearances: [] };

const EVENING: SessionAppearances = { rounds: EIGHTEEN, players: [oleg, anna], starters: [] };

const OLEG_ALONE: SessionAppearances = { rounds: EIGHTEEN, players: [oleg], starters: [] };

const rankingPicks = (fool: PlayerAppearances | null, king: PlayerAppearances | null): void => {
  standoutBySpy.mockReturnValueOnce(fool).mockReturnValueOnce(king);
};

const fieldRanked = (ranking: number): readonly PlayerAppearances[] =>
  standoutBySpy.mock.calls[ranking]?.[FIELD_RANKED] as readonly PlayerAppearances[];

const meritUsed = (ranking: number): Merit =>
  standoutBySpy.mock.calls[ranking]?.[MERIT_USED] as Merit;

beforeEach(() => {
  vi.clearAllMocks();

  standoutBySpy.mockReturnValue(null);
  playedGamesSpy.mockReturnValue(EIGHTEEN);
  foolCountSpy.mockReturnValue(ONCE);
});

describe("kingOfTheTable()", () => {
  it("should award nothing when nobody stood out", () => {
    expect(kingOfTheTable(EVENING)).toBeNull();
  });

  it("should rank every player the evening seated when nobody wore the fool's plate", () => {
    rankingPicks(null, oleg);

    kingOfTheTable(EVENING);

    expect(fieldRanked(KING_RANKING)).toEqual(EVENING.players);
  });

  it("should crown the player the ranking picked", () => {
    rankingPicks(null, oleg);

    expect(kingOfTheTable(EVENING)?.winners).toEqual([OLEG]);
  });

  it("should report the share as a whole percent", () => {
    rankingPicks(null, oleg);
    const award = kingOfTheTable(EVENING);

    expect(award?.name === AwardName.King ? award.percent : NOTHING).toBe(KING_PERCENT);
  });

  it("should report the games behind that share", () => {
    rankingPicks(null, oleg);
    const award = kingOfTheTable(EVENING);

    expect(award?.name === AwardName.King ? award.games : NOTHING).toBe(EIGHTEEN);
  });

  it("should not claim the crown was passed when no fool was crowned at all", () => {
    rankingPicks(null, oleg);
    const award = kingOfTheTable(EVENING);

    expect(award?.name === AwardName.King ? award.passed : true).toBe(false);
  });

  it("should not claim the crown was passed when the fool sat below the king", () => {
    rankingPicks(anna, oleg);
    const award = kingOfTheTable(EVENING);

    expect(award?.name === AwardName.King ? award.passed : true).toBe(false);
  });

  describe("when the fool also tops the shares", () => {
    it("should keep the fool out of the field the crown is ranked from", () => {
      rankingPicks(oleg, anna);

      kingOfTheTable(EVENING);

      expect(fieldRanked(KING_RANKING)).toEqual([anna]);
    });

    it("should pass the crown to whoever is left", () => {
      rankingPicks(oleg, anna);

      expect(kingOfTheTable(EVENING)?.winners).toEqual([ANNA]);
    });

    it("should say the crown was passed, so the card cannot claim nobody sat higher", () => {
      rankingPicks(oleg, anna);
      const award = kingOfTheTable(EVENING);

      expect(award?.name === AwardName.King ? award.passed : false).toBe(true);
    });

    it("should say so when the fool only drew level with the king rather than beating them", () => {
      const LEVEL = 0.5;

      const foolLevel: PlayerAppearances = {
        playerId: OLEG,
        share: LEVEL,
        running: [],
        appearances: [],
      };

      const kingLevel: PlayerAppearances = {
        playerId: ANNA,
        share: LEVEL,
        running: [],
        appearances: [],
      };

      rankingPicks(foolLevel, kingLevel);
      const award = kingOfTheTable({
        rounds: EIGHTEEN,
        players: [foolLevel, kingLevel],
        starters: [],
      });

      expect(award?.name === AwardName.King ? award.passed : false).toBe(true);
    });

    it("should report the share of the player it fell to", () => {
      rankingPicks(oleg, anna);
      const award = kingOfTheTable(EVENING);

      expect(award?.name === AwardName.King ? award.percent : NOTHING).toBe(RUNNER_UP_PERCENT);
    });

    it("should leave an empty field when the fool was the only player there", () => {
      rankingPicks(oleg, null);

      kingOfTheTable(OLEG_ALONE);

      expect(fieldRanked(KING_RANKING)).toEqual([]);
    });

    it("should award nothing when excluding the fool leaves nobody to crown", () => {
      rankingPicks(oleg, null);

      expect(kingOfTheTable(OLEG_ALONE)).toBeNull();
    });
  });

  it("should exclude nobody when the fool's award never fired", () => {
    foolCountSpy.mockReturnValue(NOTHING);
    rankingPicks(oleg, oleg);

    kingOfTheTable(EVENING);

    expect(fieldRanked(KING_RANKING)).toEqual(EVENING.players);
  });

  describe("who is eligible", () => {
    it("should rank an eligible player by their table share", () => {
      kingOfTheTable(EVENING);
      playedGamesSpy.mockReturnValue(ENOUGH_GAMES);

      expect(meritUsed(KING_RANKING)(oleg)).toBe(OLEG_SHARE);
    });

    it("should refuse to rank a player one game short", () => {
      kingOfTheTable(EVENING);
      playedGamesSpy.mockReturnValue(TOO_FEW);

      expect(meritUsed(KING_RANKING)(oleg)).toBeNull();
    });
  });
});

describe("foolOfTheNight()", () => {
  it("should award nothing when nobody stood out", () => {
    expect(foolOfTheNight(EVENING)).toBeNull();
  });

  it("should rank every player the evening seated", () => {
    foolOfTheNight(EVENING);

    expect(fieldRanked(FOOL_RANKING)).toEqual(EVENING.players);
  });

  it("should award nothing when the worst player was never the fool", () => {
    standoutBySpy.mockReturnValue(oleg);
    foolCountSpy.mockReturnValue(NOTHING);

    expect(foolOfTheNight(EVENING)).toBeNull();
  });

  it("should crown the player the ranking picked", () => {
    standoutBySpy.mockReturnValue(oleg);

    expect(foolOfTheNight(EVENING)?.winners).toEqual([OLEG]);
  });

  it("should report how many of how many were lost", () => {
    standoutBySpy.mockReturnValue(oleg);
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

      expect(meritUsed(FOOL_RANKING)(oleg)).toBe(ONCE / ENOUGH_GAMES);
    });

    it("should refuse to rank a player one game short", () => {
      foolOfTheNight(EVENING);
      playedGamesSpy.mockReturnValue(TOO_FEW);

      expect(meritUsed(FOOL_RANKING)(oleg)).toBeNull();
    });
  });
});
