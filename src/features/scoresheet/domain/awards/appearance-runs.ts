import type { Appearance, PlayerAppearances } from "#scoresheet/domain/session-appearances.ts";


const NONE = 0;

const NEXT = 1;

const ALONE = 1;

interface Run {
  readonly best: number;
  readonly current: number;
}

export const longestRun = (
  player: PlayerAppearances,
  holds: (appearance: Appearance) => boolean
): number =>
  player.appearances.reduce<Run>(
    (run, appearance) => {
      const current = holds(appearance) ? run.current + NEXT : NONE;

      return { best: Math.max(run.best, current), current };
    },
    { best: NONE, current: NONE }
  ).best;

export const longestChain = (
  player: PlayerAppearances,
  links: (earlier: Appearance, later: Appearance) => boolean
): number =>
  player.appearances.reduce<Run>(
    (run, appearance, at) => {
      const earlier = player.appearances[at - NEXT];
      const current =
        earlier !== undefined && links(earlier, appearance) ? run.current + NEXT : ALONE;

      return { best: Math.max(run.best, current), current };
    },
    { best: NONE, current: NONE }
  ).best;
