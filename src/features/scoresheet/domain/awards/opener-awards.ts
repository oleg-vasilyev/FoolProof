import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award, TableCurse } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  finishIn,
  foolByRound,
  playedGames,
  tableSizeIn,
  type SessionAppearances,
  type PlayerAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy, soleBy } from "#scoresheet/domain/awards/pick-winner.ts";


interface DecidedOpening {
  readonly starter: number;
  readonly round: number;
  readonly fool: number;
}

const ONE_SEAT = 1;

const BURNED_ENOUGH = 2;

const HELD_ENOUGH = 4;

const OPENED_MOST = 6;

const WON_ENOUGH = 3;

const A_FULL_EVENING = 10;

const NONE = 0;

const opensOf = (evening: SessionAppearances, player: PlayerAppearances): number =>
  evening.starters.filter((starter) => starter === player.playerId).length;

const burnsOf = (evening: SessionAppearances, player: PlayerAppearances): number => {
  const fools = foolByRound(evening);

  return evening.starters.filter(
    (starter, round) => starter === player.playerId && fools[round] === player.playerId
  ).length;
};

const winsAtHome = (evening: SessionAppearances, player: PlayerAppearances): number =>
  evening.starters.filter(
    (starter, round) => starter === player.playerId && finishIn(player, round) === Finish.First
  ).length;

export const openersCurse = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const burns = burnsOf(evening, player);

    return burns >= BURNED_ENOUGH ? burns : null;
  });

  return winner === null
    ? null
    : {
        name: AwardName.OpenersCurse,
        winners: [winner.playerId],
        opens: opensOf(evening, winner),
        burns: burnsOf(evening, winner),
      };
};

export const hotSeat = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const opens = opensOf(evening, player);

    return opens >= HELD_ENOUGH && burnsOf(evening, player) === NONE ? opens : null;
  });

  return winner === null
    ? null
    : { name: AwardName.HotSeat, winners: [winner.playerId], opens: opensOf(evening, winner) };
};

export const theDoorman = (evening: SessionAppearances): Award | null => {
  const most = Math.max(NONE, ...evening.players.map((player) => opensOf(evening, player)));
  const winner =
    most >= OPENED_MOST
      ? soleBy(evening.players, (player) => opensOf(evening, player) === most)
      : null;

  return winner === null
    ? null
    : {
        name: AwardName.TheDoorman,
        winners: [winner.playerId],
        opens: most,
        games: evening.rounds,
      };
};

export const homeAdvantage = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const wins = winsAtHome(evening, player);

    return wins >= WON_ENOUGH ? wins : null;
  });

  return winner === null
    ? null
    : {
        name: AwardName.HomeAdvantage,
        winners: [winner.playerId],
        wins: winsAtHome(evening, winner),
        opens: opensOf(evening, winner),
      };
};

export const neverAsked = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    playedGames(player) >= A_FULL_EVENING && opensOf(evening, player) === NONE
      ? playedGames(player)
      : null
  );

  return winner === null
    ? null
    : { name: AwardName.NeverAsked, winners: [winner.playerId], games: playedGames(winner) };
};

const decidedOpenings = (evening: SessionAppearances): readonly DecidedOpening[] => {
  const fools = foolByRound(evening);

  return evening.starters.flatMap((starter, round) => {
    const fool = fools[round] ?? null;

    return starter === null || fool === null ? [] : [{ starter, round, fool }];
  });
};

const seatsPredict = (evening: SessionAppearances, openings: readonly DecidedOpening[]): number =>
  openings.reduce(
    (chance, opening) => chance + ONE_SEAT / tableSizeIn(evening, opening.round),
    NONE
  );

export const tableCurse = (evening: SessionAppearances): TableCurse | null => {
  const openings = decidedOpenings(evening);
  const burns = openings.filter((opening) => opening.fool === opening.starter).length;
  const predicted = Math.round(seatsPredict(evening, openings));

  return burns <= predicted
    ? null
    : { burns, games: openings.length, predicted };
};
