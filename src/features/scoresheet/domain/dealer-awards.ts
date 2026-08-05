import type { Award, TableCurse } from "#scoresheet/domain/award-catalogue.ts";
import { foolByRound, type Evening, type PlayerEvening } from "#scoresheet/domain/evening.ts";
import { bestBy } from "#scoresheet/domain/pick-winner.ts";


const BURNED_ENOUGH = 2;

const NONE = 0;

const dealsOf = (evening: Evening, player: PlayerEvening): number =>
  evening.starters.filter((starter) => starter === player.playerId).length;

const burnsOf = (evening: Evening, player: PlayerEvening): number => {
  const fools = foolByRound(evening);

  return evening.starters.filter(
    (starter, round) => starter === player.playerId && fools[round] === player.playerId
  ).length;
};

export const dealersCurse = (evening: Evening): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const burns = burnsOf(evening, player);

    return burns >= BURNED_ENOUGH ? burns : null;
  });

  return winner === null
    ? null
    : {
        name: "dealersCurse",
        winners: [winner.playerId],
        deals: dealsOf(evening, winner),
        burns: burnsOf(evening, winner),
      };
};

export const tableCurse = (evening: Evening): TableCurse | null => {
  const fools = foolByRound(evening);
  const burns = evening.starters.filter(
    (starter, round) => starter !== null && fools[round] === starter
  ).length;

  return burns === NONE ? null : { burns, games: evening.rounds };
};
