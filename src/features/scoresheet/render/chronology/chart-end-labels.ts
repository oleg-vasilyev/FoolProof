import { NEUTRAL, type ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import { FONT_FAMILY, USUAL_FALLBACK, fontSize } from "#scoresheet/render/card-metrics.ts";
import {
  NAME_GAP,
  NAME_ROOM,
  PLOT_RIGHT,
  chartBottomOf,
  type Sheet,
} from "#scoresheet/render/chronology/chronology-layout.ts";
import { colourFor } from "#scoresheet/render/palette.ts";
import { nameToFit } from "#scoresheet/render/name-to-fit.ts";
import { line, text } from "#scoresheet/render/svg-tags.ts";


const NOTHING = 0;

const LAST_SHARE = -1;

const HELD = -1;

const NAME_LIFT = 10;

const NAME_PITCH = 46;

const LEADER_SLACK = 8;

const LEADER_WIDTH = 1;

const LEADER_GAP = 10;

interface Wanted {
  readonly at: number;
  readonly y: number;
}

const orderedByHeight = (wanted: readonly number[]): readonly Wanted[] =>
  wanted.map((y, at) => ({ at, y })).sort((one, other) => one.y - other.y);

const pushedApart = (ordered: readonly Wanted[], pitch: number): readonly Wanted[] =>
  ordered.reduce<readonly Wanted[]>((placed, next) => {
    const above = placed.at(HELD);

    return [
      ...placed,
      { at: next.at, y: above === undefined ? next.y : Math.max(next.y, above.y + pitch) },
    ];
  }, []);

const liftedWithin = (placed: readonly Wanted[], floor: number): readonly Wanted[] => {
  const lowest = placed.at(HELD)?.y ?? NOTHING;
  const overshoot = Math.max(NOTHING, lowest - floor);

  return placed.map((one) => ({ at: one.at, y: one.y - overshoot }));
};

export const spreadApart = (
  wanted: readonly number[],
  pitch: number,
  floor: number
): readonly number[] => {
  const placed = liftedWithin(pushedApart(orderedByHeight(wanted), pitch), floor);

  return wanted.map((_unused, at) => placed.find((one) => one.at === at)?.y ?? NOTHING);
};

const endShareOf = (player: ScoredPlayer): number => player.running.at(LAST_SHARE) ?? NEUTRAL;

const leaderTo = (from: number, to: number, colour: string): readonly string[] =>
  Math.abs(to - from) <= LEADER_SLACK
    ? []
    : [
        line({
          x1: PLOT_RIGHT,
          y1: from - NAME_LIFT,
          x2: PLOT_RIGHT + NAME_GAP - LEADER_GAP,
          y2: to - NAME_LIFT,
          stroke: colour,
          "stroke-width": LEADER_WIDTH,
        }),
      ];

export const endLabels = (
  sheet: Sheet,
  yOf: (sheet: Sheet, share: number) => number
): readonly string[] => {
  const wanted = sheet.players.map((player) => yOf(sheet, endShareOf(player)) + NAME_LIFT);
  const settled = spreadApart(wanted, NAME_PITCH, chartBottomOf(sheet));

  return sheet.players.flatMap((player, column) => {
    const colour = colourFor(column);
    const y = settled[column] ?? wanted[column] ?? NOTHING;

    return [
      ...leaderTo(wanted[column] ?? y, y, colour),
      text(nameToFit(player.displayName, NAME_ROOM - NAME_GAP, fontSize.legend, USUAL_FALLBACK), {
        x: PLOT_RIGHT + NAME_GAP,
        y,
        fill: colour,
        "font-family": FONT_FAMILY,
        "font-weight": "bold",
        "font-size": fontSize.legend,
      }),
    ];
  });
};
