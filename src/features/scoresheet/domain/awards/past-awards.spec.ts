import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";
import type { EveningPast, PastEvening } from "#scoresheet/domain/awards/evening-past.ts";
import {
  appearanceOf,
  eveningOf,
  playerAppearing,
} from "#scoresheet/domain/session-appearances.stub.ts";


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

const pastOfSpy = vi.fn();

vi.mock("#scoresheet/domain/awards/evening-past.ts", () => ({
  pastOf: (past: unknown, playerId: unknown) => pastOfSpy(past, playerId),
}));

const { firstCleanNight, firstWin, newAtTheTable, personalBest } = await import(
  "#scoresheet/domain/awards/past-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const TWICE = 2;

const TOO_FEW = 2;

const ENOUGH_TO_QUALIFY = 9;

const A_LONG_EVENING = 12;

const PLAYER = 7;

const NEWCOMER = 8;

const TONIGHTS_SHARE = 0.72;

const TONIGHTS_PERCENT = 72;

const A_WORSE_NIGHT = 0.4;

const A_BETTER_NIGHT = 0.8;

const NO_HISTORY: EveningPast = { players: [] };

const nightOf = (share: number, fools: number, firsts: number): PastEvening => ({
  share,
  fools,
  firsts,
  games: ENOUGH_TO_QUALIFY,
});

const tonight = (playerId: number, finish: Finish = Finish.Middle): PlayerAppearances =>
  playerAppearing(playerId, [appearanceOf(NOTHING, finish)], TONIGHTS_SHARE);

const meritFrom = (): Merit => bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

describe("past awards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playedGamesSpy.mockReturnValue(ENOUGH_TO_QUALIFY);
    foolCountSpy.mockReturnValue(NOTHING);
    bestBySpy.mockReturnValue(null);
    pastOfSpy.mockReturnValue([]);
  });

  describe("personalBest", () => {
    it("should carry tonight's share and the evenings it beat", () => {
      const player = tonight(PLAYER);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, ONCE), nightOf(A_WORSE_NIGHT, ONCE, ONCE)]);
      bestBySpy.mockReturnValue(player);

      expect(personalBest(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY)).toEqual({
        name: AwardName.PersonalBest,
        winners: [PLAYER],
        percent: TONIGHTS_PERCENT,
        evenings: TWICE,
      });
    });

    it("should refuse a player whose best evening is still behind them", () => {
      const player = tonight(PLAYER);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, ONCE), nightOf(A_BETTER_NIGHT, ONCE, ONCE)]);
      personalBest(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });

    it("should refuse a player who only drew level with their own record", () => {
      const player = tonight(PLAYER);

      pastOfSpy.mockReturnValue([nightOf(TONIGHTS_SHARE, ONCE, ONCE)]);
      personalBest(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });

    it("should refuse a player with no evening behind them", () => {
      const player = tonight(PLAYER);

      personalBest(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });

    it("should refuse a player who played too few games tonight", () => {
      const player = tonight(PLAYER);

      playedGamesSpy.mockReturnValue(TOO_FEW);
      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, ONCE)]);
      personalBest(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });
  });

  describe("firstCleanNight", () => {
    it("should name a clean evening after evenings that were not", () => {
      const player = tonight(PLAYER);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, ONCE), nightOf(A_WORSE_NIGHT, TWICE, ONCE)]);
      bestBySpy.mockReturnValue(player);

      expect(firstCleanNight(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY)).toEqual({
        name: AwardName.FirstCleanNight,
        winners: [PLAYER],
        games: ENOUGH_TO_QUALIFY,
        evenings: TWICE,
      });
    });

    it("should refuse a player who was the fool tonight", () => {
      const player = tonight(PLAYER, Finish.Fool);

      foolCountSpy.mockReturnValue(ONCE);
      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, ONCE)]);
      firstCleanNight(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });

    it("should refuse a player who has had a clean evening before", () => {
      const player = tonight(PLAYER);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, NOTHING, ONCE), nightOf(A_WORSE_NIGHT, ONCE, ONCE)]);
      firstCleanNight(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });
  });

  describe("firstWin", () => {
    it("should count the evenings spent waiting for it", () => {
      const player = tonight(PLAYER, Finish.First);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, NOTHING), nightOf(A_WORSE_NIGHT, ONCE, NOTHING)]);
      bestBySpy.mockReturnValue(player);

      expect(firstWin(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY)).toEqual({
        name: AwardName.FirstWin,
        winners: [PLAYER],
        evenings: TWICE,
      });
    });

    it("should refuse a player who has gone out first before", () => {
      const player = tonight(PLAYER, Finish.First);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, ONCE)]);
      firstWin(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });

    it("should refuse a player who did not go out first tonight either", () => {
      const player = tonight(PLAYER);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, NOTHING)]);
      firstWin(eveningOf(A_LONG_EVENING, [player]), NO_HISTORY);

      expect(meritFrom()(player)).toBeNull();
    });
  });

  describe("newAtTheTable", () => {
    it("should name a first evening beside players who have a past", () => {
      const newcomer = tonight(NEWCOMER);
      const regular = tonight(PLAYER);

      pastOfSpy.mockImplementation((_past: unknown, playerId: number) =>
        playerId === PLAYER ? [nightOf(A_WORSE_NIGHT, ONCE, ONCE)] : []
      );
      bestBySpy.mockReturnValue(newcomer);

      expect(newAtTheTable(eveningOf(A_LONG_EVENING, [regular, newcomer]), NO_HISTORY)).toEqual({
        name: AwardName.NewAtTheTable,
        winners: [NEWCOMER],
        games: ENOUGH_TO_QUALIFY,
      });
    });

    it("should refuse every seat on a table where nobody has a past", () => {
      const newcomer = tonight(NEWCOMER);
      const evening = eveningOf(A_LONG_EVENING, [tonight(PLAYER), newcomer]);

      newAtTheTable(evening, NO_HISTORY);

      expect(bestBySpy).toHaveBeenCalledTimes(ONCE);
      expect(meritFrom()(newcomer)).toBeNull();
    });

    it("should refuse a player who has a past of their own", () => {
      const regular = tonight(PLAYER);

      pastOfSpy.mockReturnValue([nightOf(A_WORSE_NIGHT, ONCE, ONCE)]);
      newAtTheTable(eveningOf(A_LONG_EVENING, [regular]), NO_HISTORY);

      expect(meritFrom()(regular)).toBeNull();
    });
  });
});
