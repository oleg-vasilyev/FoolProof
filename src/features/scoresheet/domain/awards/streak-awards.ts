import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import { LONG_ENOUGH, type Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  foolCount,
  playedGames,
  type SessionAppearances,
  type PlayerAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";
import { longestRun } from "#scoresheet/domain/awards/appearance-runs.ts";


const CLEAN_RUN = 7;

const FOOL_RUN = 3;

const TWICE = 2;

const OPENING_GAMES = 3;

const NONE = 0;

const NEXT = 1;

const AFTER = 1;

const LAST = -1;

const comebacks = (player: PlayerAppearances): number =>
  player.appearances.filter(
    (appearance, at) =>
      appearance.finish === Finish.Fool && player.appearances[at + NEXT]?.finish === Finish.First
  ).length;

const cleanStreak = (player: PlayerAppearances): number =>
  longestRun(player, (appearance) => appearance.finish !== Finish.Fool);

const foolStreak = (player: PlayerAppearances): number =>
  longestRun(player, (appearance) => appearance.finish === Finish.Fool);

const settledAfter = (player: PlayerAppearances): number | null => {
  const burned = player.appearances
    .slice(NONE, OPENING_GAMES)
    .filter((appearance) => appearance.finish === Finish.Fool);
  const since = player.appearances.slice(OPENING_GAMES);
  const last = burned.at(LAST);

  return last !== undefined &&
    playedGames(player) >= LONG_ENOUGH &&
    since.every((appearance) => appearance.finish !== Finish.Fool)
    ? last.round + AFTER
    : null;
};

export const teflon = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = cleanStreak(player);

    return foolCount(player) > NONE && run >= CLEAN_RUN ? run : null;
  });

  return winner === null
    ? null
    : { name: AwardName.Teflon, winners: [winner.playerId], streak: cleanStreak(winner) };
};

export const sweetRevenge = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    comebacks(player) >= TWICE ? comebacks(player) : null
  );

  return winner === null
    ? null
    : {
        name: AwardName.SweetRevenge,
        winners: [winner.playerId],
        fools: foolCount(winner),
        comebacks: comebacks(winner),
      };
};

export const encore = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = foolStreak(player);

    return run >= FOOL_RUN ? run : null;
  });

  return winner === null
    ? null
    : { name: AwardName.Encore, winners: [winner.playerId], run: foolStreak(winner) };
};

export const secondWind = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const settled = settledAfter(player);

    return settled === null ? null : playedGames(player) - settled;
  });

  if (winner === null) {
    return null;
  }

  return {
    name: AwardName.SecondWind,
    winners: [winner.playerId],
    burnedBy: settledAfter(winner) ?? NONE,
    games: playedGames(winner),
  };
};
