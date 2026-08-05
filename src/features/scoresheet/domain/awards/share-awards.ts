import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import { foolCount, playedGames, type SessionAppearances } from "#scoresheet/domain/session-appearances.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";


const PERCENT = 100;

const NONE = 0;

export const kingOfTheTable = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES ? player.share : null
  );

  if (winner === null) {
    return null;
  }

  return {
    name: AwardName.King,
    winners: [winner.playerId],
    percent: Math.round(winner.share * PERCENT),
    games: playedGames(winner),
  };
};

export const foolOfTheNight = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES ? foolCount(player) / playedGames(player) : null
  );

  if (winner === null || foolCount(winner) === NONE) {
    return null;
  }

  return {
    name: AwardName.FoolOfTheNight,
    winners: [winner.playerId],
    fools: foolCount(winner),
    games: playedGames(winner),
  };
};
