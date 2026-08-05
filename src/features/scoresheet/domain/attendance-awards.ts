import type { Award } from "#scoresheet/domain/award-catalogue.ts";
import {
  foolByRound,
  lastRoundOf,
  playedGames,
  type Evening,
  type PlayerEvening,
} from "#scoresheet/domain/evening.ts";
import { bestBy, soleBy } from "#scoresheet/domain/pick-winner.ts";


const LONG_EVENING = 10;

const OPENING_ROUND = 0;

const NONE = 0;

const AFTER = 1;

const LAST = -1;

const drawnRounds = (evening: Evening): readonly number[] => [
  ...new Set(
    evening.players.flatMap((player) =>
      player.appearances
        .filter((appearance) => appearance.finish === "drawn")
        .map((appearance) => appearance.round)
    )
  ),
];

const leftEarly = (player: PlayerEvening, evening: Evening): number | null => {
  const last = lastRoundOf(player);
  const closing = player.appearances.at(LAST)?.finish;

  return last === null || last >= evening.rounds - AFTER || closing === "fool" ? null : last;
};

export const ironSeat = (evening: Evening): Award | null => {
  const winner =
    evening.rounds >= LONG_EVENING
      ? soleBy(evening.players, (player) => playedGames(player) === evening.rounds)
      : null;

  return winner === null
    ? null
    : { name: "ironSeat", winners: [winner.playerId], games: evening.rounds };
};

export const theTruce = (evening: Evening): Award | null => {
  const winners = evening.players
    .filter((player) => player.appearances.some((appearance) => appearance.finish === "drawn"))
    .map((player) => player.playerId);

  return winners.length === NONE
    ? null
    : { name: "theTruce", winners, draws: drawnRounds(evening).length, games: evening.rounds };
};

export const theIrishGoodbye = (evening: Evening): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const last = leftEarly(player, evening);

    return last === null ? null : -last;
  });

  if (winner === null) {
    return null;
  }

  return {
    name: "theIrishGoodbye",
    winners: [winner.playerId],
    leftAfter: (leftEarly(winner, evening) ?? OPENING_ROUND) + AFTER,
    games: evening.rounds,
  };
};

export const firstBlood = (evening: Evening): Award | null => {
  const opener = foolByRound(evening)[OPENING_ROUND] ?? null;

  return opener === null ? null : { name: "firstBlood", winners: [opener], games: evening.rounds };
};
