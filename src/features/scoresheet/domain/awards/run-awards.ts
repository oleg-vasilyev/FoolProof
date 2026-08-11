import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { Award } from "#scoresheet/domain/awards/award-catalogue.ts";
import {
  inTopHalf,
  type SessionAppearances,
  type PlayerAppearances,
} from "#scoresheet/domain/session-appearances.ts";
import { bestBy } from "#scoresheet/domain/awards/pick-winner.ts";
import { longestChain, longestRun } from "#scoresheet/domain/awards/appearance-runs.ts";


const WINNING_RUN = 4;

const MOVING_RUN = 4;

const SWINGING_RUN = 6;

const SAME_SPOT_RUN = 5;

const NONE = 0;

const ALONE = 1;

const NEXT = 1;

const NOWHERE = 0;

interface Spot {
  readonly place: number;
  readonly run: number;
}

const winningStreak = (player: PlayerAppearances): number =>
  longestRun(player, (appearance) => appearance.finish === Finish.First);

const climbingStreak = (player: PlayerAppearances): number =>
  longestChain(
    player,
    (earlier, later) => later.position < earlier.position && later.finish !== Finish.Drawn
  );

const sinkingStreak = (player: PlayerAppearances): number =>
  longestChain(
    player,
    (earlier, later) => later.position > earlier.position && later.finish !== Finish.Drawn
  );

const swingingStreak = (player: PlayerAppearances): number =>
  longestChain(player, (earlier, later) => inTopHalf(earlier) !== inTopHalf(later));

const longestSpot = (player: PlayerAppearances): Spot =>
  player.appearances.reduce<{ readonly best: Spot; readonly current: Spot }>(
    (spot, appearance) => {
      const run = appearance.position === spot.current.place ? spot.current.run + NEXT : ALONE;
      const current = { place: appearance.position, run };

      return { best: current.run > spot.best.run ? current : spot.best, current };
    },
    { best: { place: NOWHERE, run: NONE }, current: { place: NOWHERE, run: NONE } }
  ).best;

export const hatTrick = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = winningStreak(player);

    return run >= WINNING_RUN ? run : null;
  });

  return winner === null
    ? null
    : { name: AwardName.HatTrick, winners: [winner.playerId], run: winningStreak(winner) };
};

export const theLadder = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = climbingStreak(player);

    return run >= MOVING_RUN ? run : null;
  });

  return winner === null
    ? null
    : { name: AwardName.TheLadder, winners: [winner.playerId], run: climbingStreak(winner) };
};

export const theSlide = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = sinkingStreak(player);

    return run >= MOVING_RUN ? run : null;
  });

  return winner === null
    ? null
    : { name: AwardName.TheSlide, winners: [winner.playerId], run: sinkingStreak(winner) };
};

export const thePendulum = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const run = swingingStreak(player);

    return run >= SWINGING_RUN ? run : null;
  });

  return winner === null
    ? null
    : { name: AwardName.ThePendulum, winners: [winner.playerId], run: swingingStreak(winner) };
};

export const groundhogDay = (evening: SessionAppearances): Award | null => {
  const winner = bestBy(evening.players, (player) => {
    const spot = longestSpot(player);

    return spot.run >= SAME_SPOT_RUN ? spot.run : null;
  });

  if (winner === null) {
    return null;
  }

  const spot = longestSpot(winner);

  return { name: AwardName.GroundhogDay, winners: [winner.playerId], place: spot.place, run: spot.run };
};
