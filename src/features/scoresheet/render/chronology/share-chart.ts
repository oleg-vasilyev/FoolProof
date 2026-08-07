import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { CHART_HEIGHT, PLOT_LEFT, PLOT_RIGHT, PLOT_WIDTH, chartBottomOf, type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
import { FONT_FAMILY, fontSize } from "#scoresheet/render/card-metrics.ts";
import { NEUTRAL, type ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import { circle, line, path, polyline, text } from "#scoresheet/render/svg-tags.ts";
import { percentLabel } from "#scoresheet/render/chronology/percent-label.ts";


type Point = readonly [number, number];

interface Stretch {
  readonly points: readonly Point[];
  readonly dashed: boolean;
}

const NONE = 0;

const MIN_ROUNDS = 1;

const MIN_LABEL_STEP = 1;

const FIRST_ROUND = 1;

const ORIGIN_TICK = 1;

const SKIP_ORIGIN = 1;

const OPEN_STRETCH = -1;

const ALL_BUT_LAST = -1;

const ONE_ROUND = 1;

const WHOLE_TABLE = 1;

const TICK_STEP = 0.25;

const TICKS = Math.round(WHOLE_TABLE / TICK_STEP);

const LABEL_TARGET = 6;

const AXIS_GAP = 18;

const AXIS_LIFT = 7;

const AXIS_DROP = 44;

const TICK_LENGTH = 12;

const END_DOT_RADIUS = 7;

const LAST_SHARE = -1;

const LINE_WIDTH = 3;

const RULE_WIDTH = 1;

const MIDLINE_WIDTH = 1;

const MIDLINE_DOTS = "2 8";

const SKIP_DASH = "14 10";

const NO_DASH = "none";

const xOf = (sheet: Sheet, point: number): number =>
  PLOT_LEFT + (point / Math.max(MIN_ROUNDS, sheet.rounds)) * PLOT_WIDTH;

const yOf = (sheet: Sheet, share: number): number => chartBottomOf(sheet) - share * CHART_HEIGHT;

export const shareRules = (sheet: Sheet): readonly string[] =>
  Array.from({ length: TICKS + ORIGIN_TICK }, (_unused, index) => index * TICK_STEP).flatMap(
    (tick) => [
      line({
        x1: PLOT_LEFT,
        y1: yOf(sheet, tick),
        x2: PLOT_RIGHT,
        y2: yOf(sheet, tick),
        stroke: palette.ruling,
        "stroke-width": RULE_WIDTH,
      }),
      text(percentLabel(tick), {
        x: PLOT_LEFT - AXIS_GAP,
        y: yOf(sheet, tick) + AXIS_LIFT,
        fill: palette.inkFigure,
        "font-family": FONT_FAMILY,
        "font-size": fontSize.axis,
        "text-anchor": "end",
      }),
    ]
  );

export const midline = (sheet: Sheet): string =>
  line({
    x1: PLOT_LEFT,
    y1: yOf(sheet, NEUTRAL),
    x2: PLOT_RIGHT,
    y2: yOf(sheet, NEUTRAL),
    stroke: palette.inkFaint,
    "stroke-width": MIDLINE_WIDTH,
    "stroke-dasharray": MIDLINE_DOTS,
  });

export const roundLabels = (sheet: Sheet): readonly string[] => {
  const every = Math.max(MIN_LABEL_STEP, Math.ceil(sheet.rounds / LABEL_TARGET));

  return Array.from({ length: sheet.rounds }, (_unused, round) => round + FIRST_ROUND)
    .filter((round) => round % every === NONE)
    .flatMap((round) => [
      line({
        x1: xOf(sheet, round),
        y1: chartBottomOf(sheet),
        x2: xOf(sheet, round),
        y2: chartBottomOf(sheet) + TICK_LENGTH,
        stroke: palette.inkFaint,
        "stroke-width": RULE_WIDTH,
      }),
      text(String(round), {
        x: xOf(sheet, round),
        y: chartBottomOf(sheet) + AXIS_DROP,
        fill: palette.inkFigure,
        "font-family": FONT_FAMILY,
        "font-size": fontSize.axis,
        "text-anchor": "middle",
      }),
    ]);
};

export const endDots = (sheet: Sheet): readonly string[] =>
  sheet.players.map((player, column) =>
    circle({
      cx: xOf(sheet, player.running.length),
      cy: yOf(sheet, player.running.at(LAST_SHARE) ?? NEUTRAL),
      r: END_DOT_RADIUS,
      fill: colourFor(column),
    })
  );

export const pointsOf = (sheet: Sheet, player: ScoredPlayer): readonly Point[] =>
  [NEUTRAL, ...player.running].map((share, point) => [xOf(sheet, point), yOf(sheet, share)]);

export const segmentOf = (points: readonly Point[], colour: string, dash: string): string =>
  path({
    d: polyline(points),
    fill: "none",
    stroke: colour,
    "stroke-width": LINE_WIDTH,
    "stroke-linejoin": "round",
    "stroke-dasharray": dash,
  });

export const absentIn = (player: ScoredPlayer, round: number): boolean =>
  player.cells[round - ONE_ROUND]?.kind === CellKind.Absent;

export const stretchesOf = (sheet: Sheet, player: ScoredPlayer): readonly Stretch[] => {
  const points = pointsOf(sheet, player);

  return points.slice(SKIP_ORIGIN).reduce<readonly Stretch[]>((stretches, point, index) => {
    const dashed = absentIn(player, index + ONE_ROUND);
    const open = stretches.at(OPEN_STRETCH);

    if (open === undefined || open.dashed !== dashed) {
      return [...stretches, { dashed, points: [points[index] ?? point, point] }];
    }

    return [...stretches.slice(NONE, ALL_BUT_LAST), { dashed, points: [...open.points, point] }];
  }, []);
};

export const shareLines = (sheet: Sheet): readonly string[] =>
  sheet.players.flatMap((player, column) =>
    stretchesOf(sheet, player).map((stretch) =>
      segmentOf(stretch.points, colourFor(column), stretch.dashed ? SKIP_DASH : NO_DASH)
    )
  );

export const shareChart = (sheet: Sheet): readonly string[] => [
  ...shareRules(sheet),
  midline(sheet),
  ...roundLabels(sheet),
  ...shareLines(sheet),
  ...endDots(sheet),
];
