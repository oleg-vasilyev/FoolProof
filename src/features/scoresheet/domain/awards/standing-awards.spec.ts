import { beforeEach, describe, expect, it, vi } from "vitest";
import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { Merit } from "#scoresheet/domain/awards/pick-winner.ts";
import {
  appearanceOf,
  eveningOf,
  playerAppearing,
} from "#scoresheet/domain/session-appearances.stub.ts";


const bestBySpy = vi.fn();

const standoutBySpy = vi.fn();

vi.mock("#scoresheet/domain/awards/pick-winner.ts", () => ({
  bestBy: (players: unknown, merit: unknown) => bestBySpy(players, merit),
  standoutBy: (players: unknown, merit: unknown) => standoutBySpy(players, merit),
}));

const playedGamesSpy = vi.fn();

vi.mock("#scoresheet/domain/session-appearances.ts", () => ({
  playedGames: (player: unknown) => playedGamesSpy(player),
}));

const kingOfTheTableSpy = vi.fn();

const foolOfTheNightSpy = vi.fn();

vi.mock("#scoresheet/domain/awards/share-awards.ts", () => ({
  kingOfTheTable: (evening: unknown) => kingOfTheTableSpy(evening),
  foolOfTheNight: (evening: unknown) => foolOfTheNightSpy(evening),
}));

const { theHalfNight, theKingslayer, theLastStand, theViceroy, theirHour } = await import(
  "#scoresheet/domain/awards/standing-awards.ts"
);

const NOTHING = 0;

const ONCE = 1;

const A_LONG_EVENING = 12;

const ENOUGH_TO_QUALIFY = 8;

const TOO_FEW = 2;

const KING = 1;

const SECOND = 2;

const THIRD = 3;

const FOOL = 4;

const KINGS_SHARE = 0.9;

const SECONDS_SHARE = 0.62;

const THIRDS_SHARE = 0.4;

const FOOLS_SHARE = 0.7;

const SECONDS_PERCENT = 62;

const FULL_TABLE = 4;

const kingAward: Award = {
  name: AwardName.King,
  winners: [KING],
  percent: 90,
  games: ENOUGH_TO_QUALIFY,
};

const foolAward: Award = {
  name: AwardName.FoolOfTheNight,
  winners: [FOOL],
  fools: 3,
  games: ENOUGH_TO_QUALIFY,
};

const seatOf = (playerId: number, share: number): PlayerAppearances =>
  playerAppearing(playerId, [appearanceOf(NOTHING, Finish.Middle)], share);

const tableOf = (...players: readonly PlayerAppearances[]) =>
  eveningOf(A_LONG_EVENING, players);

describe("standing awards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playedGamesSpy.mockReturnValue(ENOUGH_TO_QUALIFY);
    kingOfTheTableSpy.mockReturnValue(kingAward);
    foolOfTheNightSpy.mockReturnValue(null);
    bestBySpy.mockReturnValue(null);
    standoutBySpy.mockReturnValue(null);
  });

  describe("theViceroy", () => {
    it("should name the highest share behind the king", () => {
      const evening = tableOf(
        seatOf(KING, KINGS_SHARE),
        seatOf(THIRD, THIRDS_SHARE),
        seatOf(SECOND, SECONDS_SHARE)
      );

      expect(theViceroy(evening)).toEqual({
        name: AwardName.TheViceroy,
        winners: [SECOND],
        percent: SECONDS_PERCENT,
        games: ENOUGH_TO_QUALIFY,
      });
    });

    it("should pass over the fool of the night, however high their share", () => {
      foolOfTheNightSpy.mockReturnValue(foolAward);

      const evening = tableOf(
        seatOf(KING, KINGS_SHARE),
        seatOf(FOOL, FOOLS_SHARE),
        seatOf(SECOND, SECONDS_SHARE)
      );

      expect(theViceroy(evening)).toEqual({
        name: AwardName.TheViceroy,
        winners: [SECOND],
        percent: SECONDS_PERCENT,
        games: ENOUGH_TO_QUALIFY,
      });
    });

    it("should say nothing when no king was crowned", () => {
      kingOfTheTableSpy.mockReturnValue(null);

      expect(theViceroy(tableOf(seatOf(KING, KINGS_SHARE), seatOf(SECOND, SECONDS_SHARE)))).toBeNull();
    });

    it("should say nothing when nobody but the king played enough", () => {
      playedGamesSpy.mockImplementation((player: PlayerAppearances) =>
        player.playerId === KING ? ENOUGH_TO_QUALIFY : TOO_FEW
      );

      expect(theViceroy(tableOf(seatOf(KING, KINGS_SHARE), seatOf(SECOND, SECONDS_SHARE)))).toBeNull();
    });
  });

  describe("theKingslayer", () => {
    const above = (rounds: readonly number[], playerId: number): PlayerAppearances =>
      playerAppearing(
        playerId,
        rounds.map((round) => appearanceOf(round, Finish.Middle, ONCE, FULL_TABLE))
      );

    const below = (rounds: readonly number[], playerId: number): PlayerAppearances =>
      playerAppearing(
        playerId,
        rounds.map((round) => appearanceOf(round, Finish.Middle, FULL_TABLE, FULL_TABLE))
      );

    it("should count the games finished above the king", () => {
      const challenger = above([NOTHING, ONCE, TOO_FEW], SECOND);
      const evening = tableOf(below([NOTHING, ONCE, TOO_FEW], KING), challenger);

      standoutBySpy.mockReturnValue(challenger);

      expect(theKingslayer(evening)).toEqual({
        name: AwardName.TheKingslayer,
        winners: [SECOND],
        over: THIRD,
        games: ENOUGH_TO_QUALIFY,
      });
    });

    it("should not count rounds the king sat out", () => {
      const challenger = above([NOTHING, ONCE, TOO_FEW], SECOND);
      const evening = tableOf(below([NOTHING], KING), challenger);

      standoutBySpy.mockReturnValue(challenger);

      expect(theKingslayer(evening)).toEqual({
        name: AwardName.TheKingslayer,
        winners: [SECOND],
        over: ONCE,
        games: ENOUGH_TO_QUALIFY,
      });
    });

    it("should refuse the king their own award", () => {
      const evening = tableOf(below([NOTHING], KING), above([NOTHING], SECOND));

      theKingslayer(evening);

      const merit = standoutBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[NOTHING] as PlayerAppearances)).toBeNull();
    });

    it("should say nothing when nobody was crowned", () => {
      kingOfTheTableSpy.mockReturnValue(null);

      expect(theKingslayer(tableOf(seatOf(KING, KINGS_SHARE)))).toBeNull();
    });
  });

  describe("theLastStand", () => {
    const duelling = (playerId: number, duels: number): PlayerAppearances =>
      playerAppearing(
        playerId,
        Array.from({ length: duels }, (_unused, round) =>
          appearanceOf(round, Finish.Middle, FULL_TABLE - ONCE, FULL_TABLE)
        )
      );

    const losing = (playerId: number, duels: number): PlayerAppearances =>
      playerAppearing(
        playerId,
        Array.from({ length: duels }, (_unused, round) =>
          appearanceOf(round, Finish.Fool, FULL_TABLE, FULL_TABLE)
        )
      );

    it("should count only the pairs somebody else lost", () => {
      const evening = tableOf(losing(SECOND, ENOUGH_TO_QUALIFY));

      theLastStand(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[NOTHING] as PlayerAppearances)).toBeNull();
    });

    it("should count every last pair the player came out of", () => {
      const winner = duelling(SECOND, ENOUGH_TO_QUALIFY);

      bestBySpy.mockReturnValue(winner);

      expect(theLastStand(tableOf(winner))).toEqual({
        name: AwardName.TheLastStand,
        winners: [SECOND],
        duels: ENOUGH_TO_QUALIFY,
        games: ENOUGH_TO_QUALIFY,
      });
    });

    it("should hold out for three of them", () => {
      const evening = tableOf(duelling(SECOND, TOO_FEW));

      theLastStand(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[NOTHING] as PlayerAppearances)).toBeNull();
    });
  });

  describe("theirHour", () => {
    const A_WINNER = 0.9;

    const winning = (playerId: number, share: number, firsts: number): PlayerAppearances =>
      playerAppearing(
        playerId,
        Array.from({ length: firsts }, (_unused, round) => appearanceOf(round, Finish.First)),
        share
      );

    it("should name a first place taken from below the table's average", () => {
      const trailing = winning(SECOND, THIRDS_SHARE, ONCE);

      bestBySpy.mockReturnValue(trailing);

      expect(theirHour(tableOf(seatOf(KING, KINGS_SHARE), trailing))).toEqual({
        name: AwardName.TheirHour,
        winners: [SECOND],
        firsts: ONCE,
        games: ENOUGH_TO_QUALIFY,
      });
    });

    it("should refuse a player sitting above the table's average", () => {
      const evening = tableOf(winning(KING, A_WINNER, ONCE), seatOf(SECOND, THIRDS_SHARE));

      theirHour(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[NOTHING] as PlayerAppearances)).toBeNull();
    });

    it("should refuse a player who never went out first at all", () => {
      const evening = tableOf(seatOf(KING, KINGS_SHARE), seatOf(SECOND, THIRDS_SHARE));

      theirHour(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[ONCE] as PlayerAppearances)).toBeNull();
    });

    it("should rank the player furthest below the average, not the one nearest it", () => {
      const nearer = winning(SECOND, SECONDS_SHARE, ONCE);
      const further = winning(THIRD, THIRDS_SHARE, ONCE);
      const evening = tableOf(winning(KING, A_WINNER, ONCE), nearer, further);

      theirHour(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(further)).toBeGreaterThan(merit(nearer) ?? NOTHING);
    });
  });

  describe("theHalfNight", () => {
    it("should name a player who missed most of the evening and still beat the average", () => {
      const visitor = seatOf(SECOND, SECONDS_SHARE);

      bestBySpy.mockReturnValue(visitor);
      playedGamesSpy.mockReturnValue(ENOUGH_TO_QUALIFY);

      expect(theHalfNight(tableOf(seatOf(KING, THIRDS_SHARE), visitor))).toEqual({
        name: AwardName.TheHalfNight,
        winners: [SECOND],
        games: ENOUGH_TO_QUALIFY,
        rounds: A_LONG_EVENING,
      });
    });

    it("should refuse a player who sat exactly two thirds of the evening", () => {
      const TWO_THIRDS = 8;

      playedGamesSpy.mockReturnValue(TWO_THIRDS);

      const evening = tableOf(seatOf(KING, THIRDS_SHARE), seatOf(SECOND, SECONDS_SHARE));

      theHalfNight(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[ONCE] as PlayerAppearances)).toBeNull();
    });

    it("should refuse a player who sat through more than half the evening", () => {
      const evening = tableOf(seatOf(KING, THIRDS_SHARE), seatOf(SECOND, SECONDS_SHARE));

      theHalfNight(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[ONCE] as PlayerAppearances)).toBeNull();
    });

    it("should refuse a player below the table's average", () => {
      playedGamesSpy.mockReturnValue(ONCE);

      const evening = tableOf(seatOf(KING, KINGS_SHARE), seatOf(SECOND, THIRDS_SHARE));

      theHalfNight(evening);

      const merit = bestBySpy.mock.calls[NOTHING]?.[ONCE] as Merit;

      expect(merit(evening.players[ONCE] as PlayerAppearances)).toBeNull();
    });
  });
});
