import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { ENOUGH_GAMES, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  playedGames,
  type Appearance,
  type PlayerAppearances,
  type SessionAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy, standoutBy } from "#scoresheet/domain/awards/pick-winner.ts";
import { foolOfTheNight, kingOfTheTable } from "#scoresheet/domain/awards/share-awards.ts";


const PERCENT = 100;

const NONE = 0;

const ENOUGH_UPSETS = 3;

const ENOUGH_DUELS = 3;

const MOST_OF_THE_EVENING = 2 / 3;

const LAST_PAIR = 1;

const seated = (evening: SessionAppearances): readonly PlayerAppearances[] =>
  evening.players.filter((player) => playedGames(player) >= ENOUGH_GAMES);

const wonBy = (award: Award | null, player: PlayerAppearances): boolean =>
  award !== null && award.winners.includes(player.playerId);

const byShare = (evening: SessionAppearances): readonly PlayerAppearances[] =>
  [...seated(evening)].sort((one, other) => other.share - one.share);

const inLastPair = (appearance: Appearance): boolean =>
  appearance.position >= appearance.tableSize - LAST_PAIR;

const stoodFast = (player: PlayerAppearances): number =>
  player.appearances.filter(
    (appearance) => inLastPair(appearance) && appearance.finish !== Finish.Fool
  ).length;

const meanShare = (evening: SessionAppearances): number =>
  evening.players.reduce((sum, player) => sum + player.share, NONE) / evening.players.length;

export const theViceroy = (evening: SessionAppearances): Award | null => {
  const fool = foolOfTheNight(evening);
  const king = kingOfTheTable(evening);
  const chasing = byShare(evening).filter(
    (player) => !wonBy(king, player) && !wonBy(fool, player)
  );
  const [second] = chasing;

  return king === null || second === undefined
    ? null
    : {
        name: AwardName.TheViceroy,
        winners: [second.playerId],
        percent: Math.round(second.share * PERCENT),
        games: playedGames(second),
      };
};

const finishedAbove = (player: PlayerAppearances, king: PlayerAppearances): number =>
  player.appearances.filter((appearance) => {
    const theirs = king.appearances.find((against) => against.round === appearance.round);

    return theirs !== undefined && appearance.position < theirs.position;
  }).length;

export const theKingslayer = (evening: SessionAppearances): Award | null => {
  const king = kingOfTheTable(evening);
  const crowned = evening.players.find((player) => wonBy(king, player));

  if (crowned === undefined) {
    return null;
  }

  const winner = standoutBy(seated(evening), (player) => {
    const over = finishedAbove(player, crowned);

    return player.playerId !== crowned.playerId && over >= ENOUGH_UPSETS ? over : null;
  });

  return winner === null
    ? null
    : {
        name: AwardName.TheKingslayer,
        winners: [winner.playerId],
        over: finishedAbove(winner, crowned),
        games: playedGames(winner),
      };
};

export const theLastStand = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(seated(evening), (player) =>
    stoodFast(player) >= ENOUGH_DUELS ? stoodFast(player) : null
  );

  return winner === null
    ? null
    : {
        name: AwardName.TheLastStand,
        winners: [winner.playerId],
        duels: stoodFast(winner),
        games: playedGames(winner),
      };
};

const firstPlaces = (player: PlayerAppearances): number =>
  player.appearances.filter((appearance) => appearance.finish === Finish.First).length;

export const theirHour = (evening: SessionAppearances): Award | null => {
  const average = meanShare(evening);
  const winner = bestBy(seated(evening), (player) =>
    player.share < average && firstPlaces(player) > NONE ? average - player.share : null
  );

  return winner === null
    ? null
    : {
        name: AwardName.TheirHour,
        winners: [winner.playerId],
        firsts: firstPlaces(winner),
        games: playedGames(winner),
      };
};

export const theHalfNight = (evening: SessionAppearances): Award | null => {
  const average = meanShare(evening);
  const winner = bestBy(seated(evening), (player) =>
    playedGames(player) < evening.rounds * MOST_OF_THE_EVENING && player.share > average
      ? player.share
      : null
  );

  return winner === null
    ? null
    : {
        name: AwardName.TheHalfNight,
        winners: [winner.playerId],
        games: playedGames(winner),
        rounds: evening.rounds,
      };
};
