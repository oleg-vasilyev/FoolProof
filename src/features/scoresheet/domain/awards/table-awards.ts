import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { LONG_ENOUGH, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  foolCount,
  playedGames,
  type SessionAppearances,
  type PlayerAppearances,
} from "#scoresheet/domain/session-appearances.ts";


const A_FEW_DRAWS = 2;

const ROTATION_EVENING = 6;

const NONE = 0;

const drawsPlayed = (player: PlayerAppearances): readonly number[] =>
  player.appearances
    .filter((appearance) => appearance.finish === Finish.Drawn)
    .map((appearance) => appearance.round);

const drawnRounds = (evening: SessionAppearances): readonly number[] => [
  ...new Set(evening.players.flatMap(drawsPlayed)),
];

const whoPlayed = (evening: SessionAppearances): readonly PlayerAppearances[] =>
  evening.players.filter((player) => playedGames(player) > NONE);

export const theTruce = (evening: SessionAppearances): Award | null => {
  const winners = evening.players
    .filter((player) => drawsPlayed(player).length > NONE)
    .map((player) => player.playerId);

  return winners.length === NONE
    ? null
    : {
        name: AwardName.TheTruce,
        winners,
        draws: drawnRounds(evening).length,
        games: evening.rounds,
      };
};

export const thePacifist = (evening: SessionAppearances): Award | null => {
  const draws = drawnRounds(evening).length;
  const winners = evening.players
    .filter((player) => drawsPlayed(player).length === draws)
    .map((player) => player.playerId);

  return draws < A_FEW_DRAWS || winners.length === NONE
    ? null
    : { name: AwardName.ThePacifist, winners, draws };
};

export const theRotation = (evening: SessionAppearances): Award | null => {
  const seated = whoPlayed(evening);
  const burned = seated.every((player) => foolCount(player) > NONE);

  return evening.rounds < ROTATION_EVENING || seated.length === NONE || !burned
    ? null
    : {
        name: AwardName.TheRotation,
        winners: seated.map((player) => player.playerId),
        players: seated.length,
        games: evening.rounds,
      };
};

export const fullHouse = (evening: SessionAppearances): Award | null => {
  const seated = whoPlayed(evening);
  const everyone = seated.every((player) => playedGames(player) === evening.rounds);

  return evening.rounds < LONG_ENOUGH || seated.length === NONE || !everyone
    ? null
    : {
        name: AwardName.FullHouse,
        winners: seated.map((player) => player.playerId),
        players: seated.length,
        games: evening.rounds,
      };
};
