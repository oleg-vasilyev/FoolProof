import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, LONG_ENOUGH, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  firstRoundOf,
  foolByRound,
  lastRoundOf,
  playedGames,
  type SessionAppearances,
  type PlayerAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { NEUTRAL } from "#scoresheet/domain/scoring.ts";
import { bestBy, soleBy } from "#scoresheet/domain/awards/pick-winner.ts";


const LONG_EVENING = 10;

const OPENING_ROUND = 0;

const LATE_ARRIVAL = 3;

const A_REAL_GAP = 2;

const ONE_GAME = 1;

const PERCENT = 100;

const NONE = 0;

const AFTER = 1;

const LAST = -1;

const leftEarly = (player: PlayerAppearances, evening: SessionAppearances): number | null => {
  const last = lastRoundOf(player);
  const closing = player.appearances.at(LAST)?.finish;

  return last === null || last >= evening.rounds - AFTER || closing === Finish.Fool ? null : last;
};

const missedInside = (player: PlayerAppearances): number => {
  const first = firstRoundOf(player);
  const last = lastRoundOf(player);

  return first === null || last === null ? NONE : last - first + AFTER - playedGames(player);
};

const longestAbsence = (player: PlayerAppearances): number =>
  player.appearances.reduce((widest, appearance, at) => {
    const earlier = player.appearances[at - AFTER];

    return earlier === undefined
      ? widest
      : Math.max(widest, appearance.round - earlier.round - AFTER);
  }, NONE);

export const ironSeat = (evening: SessionAppearances): Award | null => {
  const winner =
    evening.rounds >= LONG_EVENING
      ? soleBy(evening.players, (player) => playedGames(player) === evening.rounds)
      : null;

  return winner === null
    ? null
    : { name: AwardName.IronSeat, winners: [winner.playerId], games: evening.rounds };
};

export const theIrishGoodbye = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const last = leftEarly(player, evening);

    return last === null ? null : -last;
  });

  if (winner === null) {
    return null;
  }

  return {
    name: AwardName.TheIrishGoodbye,
    winners: [winner.playerId],
    leftAfter: (leftEarly(winner, evening) ?? OPENING_ROUND) + AFTER,
    games: evening.rounds,
  };
};

export const revolvingDoor = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= ENOUGH_GAMES && longestAbsence(player) >= A_REAL_GAP
      ? longestAbsence(player)
      : null
  );

  return winner === null
    ? null
    : {
        name: AwardName.RevolvingDoor,
        winners: [winner.playerId],
        missed: missedInside(winner),
        games: playedGames(winner),
      };
};

export const theLatecomer = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const first = firstRoundOf(player);

    return first !== null &&
      first >= LATE_ARRIVAL &&
      playedGames(player) >= ENOUGH_GAMES &&
      player.share >= NEUTRAL
      ? player.share
      : null;
  });

  if (winner === null) {
    return null;
  }

  return {
    name: AwardName.TheLatecomer,
    winners: [winner.playerId],
    joinedAt: (firstRoundOf(winner) ?? OPENING_ROUND) + AFTER,
    percent: Math.round(winner.share * PERCENT),
  };
};

export const theCameo = (evening: SessionAppearances): Award | null => {
  const winner =
    evening.rounds >= LONG_ENOUGH
      ? soleBy(evening.players, (player) => playedGames(player) === ONE_GAME)
      : null;

  return winner === null
    ? null
    : { name: AwardName.TheCameo, winners: [winner.playerId], games: evening.rounds };
};

export const firstBlood = (evening: SessionAppearances): Award | null => {
  const opener = foolByRound(evening)[OPENING_ROUND] ?? null;

  return opener === null
    ? null
    : { name: AwardName.FirstBlood, winners: [opener] };
};
