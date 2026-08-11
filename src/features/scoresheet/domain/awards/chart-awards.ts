import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, LONG_ENOUGH, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  firstRoundOf,
  playedGames,
  type SessionAppearances,
  type PlayerAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { NEUTRAL } from "#scoresheet/domain/scoring.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";


const LED_ALL_EVENING = 10;

const CHART_EVENING = 8;

const BIG_SWING = 0.6;

const FLAT_BAND = 0.06;

const PERCENT = 100;

const HALVED = 2;

const SECOND_ROUND = 1;

const asPercent = (share: number): number => Math.round(share * PERCENT);

const curveOf = (player: PlayerAppearances): readonly number[] =>
  player.running.slice(firstRoundOf(player) ?? player.running.length);

const shareAt = (player: PlayerAppearances, round: number): number =>
  player.running[round] ?? NEUTRAL;

const ledEveryRound = (evening: SessionAppearances, player: PlayerAppearances): boolean =>
  player.running.every(
    (share, round) =>
      round < SECOND_ROUND ||
      evening.players.every(
        (other) => other.playerId === player.playerId || shareAt(other, round) <= share
      )
  );

const swingOf = (player: PlayerAppearances): number => {
  const curve = curveOf(player);

  return Math.max(...curve) - Math.min(...curve);
};

const bandOf = (player: PlayerAppearances): number =>
  Math.max(...curveOf(player).map((share) => Math.abs(share - NEUTRAL)));

const midpointOf = (evening: SessionAppearances): number => Math.floor(evening.rounds / HALVED);

const seatedBy = (player: PlayerAppearances, round: number): boolean => {
  const first = firstRoundOf(player);

  return first !== null && first <= round;
};

export const wireToWire = (evening: SessionAppearances): Award | null => {
  const winner =
    evening.rounds >= LED_ALL_EVENING
      ? bestBy(evening.players, (player) =>
          playedGames(player) >= LONG_ENOUGH && ledEveryRound(evening, player)
            ? playedGames(player)
            : null
        )
      : null;

  return winner === null
    ? null
    : { name: AwardName.WireToWire, winners: [winner.playerId], games: playedGames(winner) };
};

export const theRollercoaster = (evening: SessionAppearances): Award | null => {
  const winner =
    evening.rounds >= CHART_EVENING
      ? bestBy(evening.players, (player) =>
          playedGames(player) >= ENOUGH_GAMES && swingOf(player) >= BIG_SWING
            ? swingOf(player)
            : null
        )
      : null;

  return winner === null
    ? null
    : {
        name: AwardName.TheRollercoaster,
        winners: [winner.playerId],
        swing: asPercent(swingOf(winner)),
        games: playedGames(winner),
      };
};

export const theComeback = (evening: SessionAppearances): Award | null => {
  const midpoint = midpointOf(evening);
  const sankLowest = (player: PlayerAppearances): boolean =>
    evening.players.every(
      (other) =>
        other.playerId === player.playerId ||
        !seatedBy(other, midpoint) ||
        shareAt(other, midpoint) >= shareAt(player, midpoint)
    );

  const winner =
    evening.rounds >= CHART_EVENING
      ? bestBy(evening.players, (player) =>
          playedGames(player) >= ENOUGH_GAMES &&
          seatedBy(player, midpoint) &&
          sankLowest(player) &&
          player.share >= NEUTRAL
            ? player.share
            : null
        )
      : null;

  return winner === null
    ? null
    : {
        name: AwardName.TheComeback,
        winners: [winner.playerId],
        percent: asPercent(winner.share),
        sank: asPercent(shareAt(winner, midpoint)),
      };
};

export const falseDawn = (evening: SessionAppearances): Award | null => {
  const midpoint = midpointOf(evening);
  const ledThen = (player: PlayerAppearances): boolean =>
    evening.players.every(
      (other) =>
        other.playerId === player.playerId ||
        shareAt(other, midpoint) <= shareAt(player, midpoint)
    );

  const winner =
    evening.rounds >= CHART_EVENING
      ? bestBy(evening.players, (player) =>
          playedGames(player) >= ENOUGH_GAMES &&
          seatedBy(player, midpoint) &&
          ledThen(player) &&
          player.share < NEUTRAL
            ? NEUTRAL - player.share
            : null
        )
      : null;

  return winner === null
    ? null
    : {
        name: AwardName.FalseDawn,
        winners: [winner.playerId],
        ledAt: midpoint + SECOND_ROUND,
        percent: asPercent(winner.share),
      };
};

export const theFlatline = (evening: SessionAppearances): Award | null => {
  const winner =
    evening.rounds >= CHART_EVENING
      ? bestBy(evening.players, (player) =>
          playedGames(player) >= LONG_ENOUGH && bandOf(player) <= FLAT_BAND
            ? FLAT_BAND - bandOf(player)
            : null
        )
      : null;


  return winner === null
    ? null
    : {
        name: AwardName.TheFlatline,
        winners: [winner.playerId],
        band: asPercent(bandOf(winner)),
        games: playedGames(winner),
      };
};
