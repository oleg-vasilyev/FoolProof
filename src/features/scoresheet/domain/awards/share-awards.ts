import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  foolCount,
  playedGames,
  type PlayerAppearances,
  type SessionAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { standoutBy } from "#scoresheet/domain/awards/pick-winner.ts";


const PERCENT = 100;

const NONE = 0;

const shareOfTheTable = (player: PlayerAppearances): number | null =>
  playedGames(player) >= ENOUGH_GAMES ? player.share : null;

const foolRate = (player: PlayerAppearances): number | null =>
  playedGames(player) >= ENOUGH_GAMES ? foolCount(player) / playedGames(player) : null;

const wearsThePlate = (fool: Award | null, player: PlayerAppearances): boolean =>
  fool !== null && fool.winners.includes(player.playerId);

export const foolOfTheNight = (evening: SessionAppearances): Award | null => {
  const winner = standoutBy(evening.players, foolRate);

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

const outshoneBy = (
  evening: SessionAppearances,
  fool: Award | null,
  winner: PlayerAppearances
): boolean =>
  evening.players.some(
    (player) => wearsThePlate(fool, player) && player.share >= winner.share
  );

export const kingOfTheTable = (evening: SessionAppearances): Award | null => {
  const fool = foolOfTheNight(evening);
  const contenders = evening.players.filter((player) => !wearsThePlate(fool, player));
  const winner = standoutBy(contenders, shareOfTheTable);

  if (winner === null) {
    return null;
  }

  return {
    name: AwardName.King,
    winners: [winner.playerId],
    percent: Math.round(winner.share * PERCENT),
    games: playedGames(winner),
    passed: outshoneBy(evening, fool, winner),
  };
};
