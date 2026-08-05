import { ENOUGH_GAMES, type Award } from "#scoresheet/domain/award-catalogue.ts";
import { foolCount, playedGames, type Evening } from "#scoresheet/domain/evening.ts";
import { bestBy } from "#scoresheet/domain/pick-winner.ts";


const PERCENT = 100;

const NONE = 0;

export const kingOfTheTable = (evening: Evening): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES ? player.share : null
  );

  if (winner === null) {
    return null;
  }

  return {
    name: "king",
    winners: [winner.playerId],
    percent: Math.round(winner.share * PERCENT),
    games: playedGames(winner),
  };
};

export const foolOfTheNight = (evening: Evening): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES ? foolCount(player) / playedGames(player) : null
  );

  if (winner === null || foolCount(winner) === NONE) {
    return null;
  }

  return {
    name: "foolOfTheNight",
    winners: [winner.playerId],
    fools: foolCount(winner),
    games: playedGames(winner),
  };
};
