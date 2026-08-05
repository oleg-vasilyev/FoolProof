import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  foolCount,
  type Appearance,
  type SessionAppearances,
  type PlayerAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";


const CLEAN_RUN = 5;

const TWICE = 2;

const NONE = 0;

const NEXT = 1;

interface Run {
  readonly best: number;
  readonly current: number;
}

const longestRun = (player: PlayerAppearances, holds: (appearance: Appearance) => boolean): number =>
  player.appearances.reduce<Run>(
    (run, appearance) => {
      const current = holds(appearance) ? run.current + NEXT : NONE;

      return { best: Math.max(run.best, current), current };
    },
    { best: NONE, current: NONE }
  ).best;

const comebacks = (player: PlayerAppearances): number =>
  player.appearances.filter(
    (appearance, at) =>
      appearance.finish === "fool" && player.appearances[at + NEXT]?.finish === "first"
  ).length;

const cleanStreak = (player: PlayerAppearances): number =>
  longestRun(player, (appearance) => appearance.finish !== "fool");

const foolStreak = (player: PlayerAppearances): number =>
  longestRun(player, (appearance) => appearance.finish === "fool");

export const teflon = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = cleanStreak(player);

    return run >= CLEAN_RUN ? run : null;
  });

  return winner === null
    ? null
    : { name: "teflon", winners: [winner.playerId], streak: cleanStreak(winner) };
};

export const sweetRevenge = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) =>
    comebacks(player) >= TWICE ? comebacks(player) : null
  );

  return winner === null
    ? null
    : {
        name: "sweetRevenge",
        winners: [winner.playerId],
        fools: foolCount(winner),
        comebacks: comebacks(winner),
      };
};

export const encore = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = foolStreak(player);

    return run >= TWICE ? run : null;
  });

  return winner === null
    ? null
    : { name: "encore", winners: [winner.playerId], run: foolStreak(winner) };
};
