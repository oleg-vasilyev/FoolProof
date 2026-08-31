import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  foolCount,
  playedGames,
  type PlayerAppearances,
  type SessionAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";
import { pastOf, type EveningPast, type PastEvening } from "#scoresheet/domain/awards/evening-past.ts";


const PERCENT = 100;

const NONE = 0;

export type PastRule = (evening: SessionAppearances, past: EveningPast) => Award | null;

const played = (player: PlayerAppearances): boolean => playedGames(player) >= ENOUGH_GAMES;

const firstPlaces = (player: PlayerAppearances): number =>
  player.appearances.filter((appearance) => appearance.finish === Finish.First).length;

const behind = (past: EveningPast, player: PlayerAppearances): readonly PastEvening[] =>
  pastOf(past, player.playerId);

const hasHistory = (past: EveningPast, player: PlayerAppearances): boolean =>
  behind(past, player).length > NONE;

const bestShareBefore = (evenings: readonly PastEvening[]): number =>
  Math.max(...evenings.map((evening) => evening.share));

export const personalBest: PastRule = (evening, past) => {
  const winner = bestBy(evening.players, (player) => {
    const earlier = behind(past, player);

    if (!played(player) || earlier.length === NONE) {
      return null;
    }

    const gained = player.share - bestShareBefore(earlier);

    return gained > NONE ? gained : null;
  });

  return winner === null
    ? null
    : {
        name: AwardName.PersonalBest,
        winners: [winner.playerId],
        percent: Math.round(winner.share * PERCENT),
        evenings: behind(past, winner).length,
      };
};

export const firstCleanNight: PastRule = (evening, past) => {
  const winner = bestBy(evening.players, (player) => {
    const earlier = behind(past, player);

    return played(player) &&
      earlier.length > NONE &&
      foolCount(player) === NONE &&
      earlier.every((night) => night.fools > NONE)
      ? earlier.length
      : null;
  });

  return winner === null
    ? null
    : {
        name: AwardName.FirstCleanNight,
        winners: [winner.playerId],
        games: playedGames(winner),
        evenings: behind(past, winner).length,
      };
};

export const firstWin: PastRule = (evening, past) => {
  const winner = bestBy(evening.players, (player) => {
    const earlier = behind(past, player);

    return played(player) &&
      earlier.length > NONE &&
      firstPlaces(player) > NONE &&
      earlier.every((night) => night.firsts === NONE)
      ? earlier.length
      : null;
  });

  return winner === null
    ? null
    : {
        name: AwardName.FirstWin,
        winners: [winner.playerId],
        evenings: behind(past, winner).length,
      };
};

export const newAtTheTable: PastRule = (evening, past) => {
  const settled = evening.players.some((player) => hasHistory(past, player));
  const winner = bestBy(evening.players, (player) =>
    settled && played(player) && !hasHistory(past, player) ? playedGames(player) : null
  );

  return winner === null
    ? null
    : { name: AwardName.NewAtTheTable, winners: [winner.playerId], games: playedGames(winner) };
};
