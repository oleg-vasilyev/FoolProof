import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, LONG_ENOUGH, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  foolCount,
  inTopHalf,
  playedGames,
  type PlayerAppearances,
  type SessionAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";


const LOPSIDED = 0.75;

const HALF_THE_TIME = 0.5;

const RUNNER_UP = 2;

const ENOUGH_SECONDS = 4;

const NONE = 0;

const finishing = (player: PlayerAppearances, finishes: readonly Finish[]): number =>
  player.appearances.filter((appearance) => finishes.includes(appearance.finish)).length;

const lopsidedShare = (player: PlayerAppearances, finishes: readonly Finish[]): number | null => {
  const rate = finishing(player, finishes) / playedGames(player);

  return playedGames(player) >= ENOUGH_GAMES && rate >= LOPSIDED ? rate : null;
};

const runnerUps = (player: PlayerAppearances): number =>
  player.appearances.filter((appearance) => appearance.position === RUNNER_UP).length;

export const untouchable = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= LONG_ENOUGH && foolCount(player) === NONE ? playedGames(player) : null
  );

  return winner === null
    ? null
    : { name: AwardName.Untouchable, winners: [winner.playerId], games: playedGames(winner) };
};

export const theFavourite = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const rate = finishing(player, [Finish.First]) / playedGames(player);

    return playedGames(player) >= LONG_ENOUGH && rate >= HALF_THE_TIME ? rate : null;
  });

  return winner === null
    ? null
    : {
        name: AwardName.TheFavourite,
        winners: [winner.playerId],
        firsts: finishing(winner, [Finish.First]),
        games: playedGames(winner),
      };
};

export const theUnderstudy = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES &&
    finishing(player, [Finish.First]) === NONE &&
    runnerUps(player) >= ENOUGH_SECONDS
      ? runnerUps(player)
      : null
  );

  return winner === null
    ? null
    : {
        name: AwardName.TheUnderstudy,
        winners: [winner.playerId],
        seconds: runnerUps(winner),
        games: playedGames(winner),
      };
};

export const theAnchor = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES &&
    foolCount(player) === NONE &&
    player.appearances.every((appearance) => !inTopHalf(appearance))
      ? playedGames(player)
      : null
  );

  return winner === null
    ? null
    : { name: AwardName.TheAnchor, winners: [winner.playerId], games: playedGames(winner) };
};

export const allOrNothing = (evening: SessionAppearances): Award | null => {
  const edges: readonly Finish[] = [Finish.First, Finish.Fool];
  const winner = bestBy(evening.players, (player) => lopsidedShare(player, edges));

  return winner === null
    ? null
    : {
        name: AwardName.AllOrNothing,
        winners: [winner.playerId],
        edges: finishing(winner, edges),
        games: playedGames(winner),
      };
};

export const theInvisible = (evening: SessionAppearances): Award | null => {
  const middle: readonly Finish[] = [Finish.Middle];
  const winner = bestBy(evening.players, (player) => lopsidedShare(player, middle));

  return winner === null
    ? null
    : {
        name: AwardName.TheInvisible,
        winners: [winner.playerId],
        middles: finishing(winner, middle),
        games: playedGames(winner),
      };
};
