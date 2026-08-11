import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { PlayerAppearances, SessionAppearances } from "#scoresheet/domain/session-appearances.ts";


const A_FEW_DRAWS = 2;

const NONE = 0;

const drawsPlayed = (player: PlayerAppearances): readonly number[] =>
  player.appearances
    .filter((appearance) => appearance.finish === Finish.Drawn)
    .map((appearance) => appearance.round);

const drawnRounds = (evening: SessionAppearances): readonly number[] => [
  ...new Set(evening.players.flatMap(drawsPlayed)),
];

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
