import { ENOUGH_GAMES, type Award } from "#scoresheet/domain/award-catalogue.ts";
import {
  foolCount,
  playedGames,
  type Evening,
  type Finish,
  type PlayerEvening,
} from "#scoresheet/domain/evening.ts";
import { bestBy } from "#scoresheet/domain/pick-winner.ts";


const LOPSIDED = 0.6;

const NONE = 0;

const finishing = (player: PlayerEvening, finishes: readonly Finish[]): number =>
  player.appearances.filter((appearance) => finishes.includes(appearance.finish)).length;

const lopsidedShare = (player: PlayerEvening, finishes: readonly Finish[]): number | null => {
  const rate = finishing(player, finishes) / playedGames(player);

  return playedGames(player) >= ENOUGH_GAMES && rate >= LOPSIDED ? rate : null;
};

export const untouchable = (evening: Evening): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES && foolCount(player) === NONE ? playedGames(player) : null
  );

  return winner === null
    ? null
    : { name: "untouchable", winners: [winner.playerId], games: playedGames(winner) };
};

export const allOrNothing = (evening: Evening): Award | null => {
  const edges: readonly Finish[] = ["first", "fool"];
  const winner = bestBy(evening.players, (player) => lopsidedShare(player, edges));

  return winner === null
    ? null
    : {
        name: "allOrNothing",
        winners: [winner.playerId],
        edges: finishing(winner, edges),
        games: playedGames(winner),
      };
};

export const theInvisible = (evening: Evening): Award | null => {
  const middle: readonly Finish[] = ["middle"];
  const winner = bestBy(evening.players, (player) => lopsidedShare(player, middle));

  return winner === null
    ? null
    : {
        name: "theInvisible",
        winners: [winner.playerId],
        middles: finishing(winner, middle),
        games: playedGames(winner),
      };
};
