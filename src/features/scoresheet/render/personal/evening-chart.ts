import { FONT_FAMILY, GRID_RIGHT } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { percentLabel } from "#scoresheet/render/percent-label.ts";
import { gameTally } from "#scoresheet/render/tally-phrases.ts";
import { circle, line, path, polyline, text } from "#scoresheet/render/svg-tags.ts";
import {
  MARK_RADIUS,
  MARK_STROKE,
  PLOT_AXIS_DROP,
  PLOT_HEIGHT,
  PLOT_LEFT,
  PLOT_LINE_WIDTH,
  POINT_RADIUS,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import {
  ENOUGH_TO_JUDGE_A_NIGHT,
  type EveningShare,
} from "#scoresheet/domain/career/career-evenings.ts";
import type { Copy } from "#scoresheet/copy.ts";


const NOTHING = 0;

const ALONE = 1;

const FULL = 1;

const AXIS_GAP = 24;

const AXIS_LIFT = 8;

const MIDDLE = 0.5;

const AXIS_EVERY = 4;

const AXIS_LABEL_ROOM = 56;

const GRID_LINES: readonly number[] = [0, 0.25, MIDDLE, 0.75, FULL];

const MIDLINE_DASH = "8 10";

const RULE_WIDTH = 1;

const LABEL_LIFT = 26;

const LABEL_DROP = 44;

const LABEL_LEAN = 16;

const NO_LEAN = 0;

const TOWARDS_THE_HIGHER = true;

const TOWARDS_THE_LOWER = false;

export interface EveningPlot {
  readonly nights: readonly EveningShare[];
  readonly top: number;
  readonly label: number;
  readonly best: EveningShare | null;
  readonly worst: EveningShare | null;
  readonly ink: string;
}

const bottomOf = (plot: EveningPlot): number => plot.top + PLOT_HEIGHT;

const xAt = (plot: EveningPlot, index: number): number =>
  plot.nights.length <= ALONE
    ? PLOT_LEFT
    : PLOT_LEFT + (index * (GRID_RIGHT - PLOT_LEFT)) / (plot.nights.length - ALONE);

const yAt = (plot: EveningPlot, share: number): number => bottomOf(plot) - share * PLOT_HEIGHT;

const gridline = (plot: EveningPlot, share: number): readonly string[] => [
  line({
    x1: PLOT_LEFT,
    y1: yAt(plot, share),
    x2: GRID_RIGHT,
    y2: yAt(plot, share),
    stroke: share === MIDDLE ? palette.ruling : palette.cellAbsentEdge,
    "stroke-width": RULE_WIDTH,
    ...(share === MIDDLE ? { "stroke-dasharray": MIDLINE_DASH } : {}),
  }),
  text(percentLabel(share), {
    x: PLOT_LEFT - AXIS_GAP,
    y: yAt(plot, share) + AXIS_LIFT,
    fill: palette.inkFaint,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.axis,
    "text-anchor": "end",
  }),
];

const curve = (plot: EveningPlot): string =>
  path({
    d: polyline(plot.nights.map((night, index) => [xAt(plot, index), yAt(plot, night.share)])),
    fill: "none",
    stroke: plot.ink,
    "stroke-width": PLOT_LINE_WIDTH,
  });

const tooShortToJudge = (night: EveningShare): boolean =>
  night.games < ENOUGH_TO_JUDGE_A_NIGHT;

const eveningPoints = (plot: EveningPlot): readonly string[] =>
  plot.nights.map((night, index) =>
    circle({
      cx: xAt(plot, index),
      cy: yAt(plot, night.share),
      r: POINT_RADIUS,
      fill: tooShortToJudge(night) ? palette.inkFaint : plot.ink,
    })
  );

const shortNightHint = (copy: Copy, plot: EveningPlot): readonly string[] =>
  plot.nights.some(tooShortToJudge)
    ? [
        text(copy.personalShortNight(gameTally(copy, ENOUGH_TO_JUDGE_A_NIGHT)), {
          x: GRID_RIGHT,
          y: plot.label,
          fill: palette.inkKey,
          "font-family": FONT_FAMILY,
          "font-size": personalFont.axis,
          "text-anchor": "end",
        }),
      ]
    : [];

const indexOfNight = (plot: EveningPlot, wanted: EveningShare | null): number =>
  wanted === null ? -ALONE : plot.nights.findIndex((night) => night.seriesNo === wanted.seriesNo);

const aboveMark = (plot: EveningPlot, share: number): number => yAt(plot, share) - LABEL_LIFT;

const belowMark = (plot: EveningPlot, share: number): number =>
  Math.min(yAt(plot, share) + LABEL_DROP, bottomOf(plot) - LABEL_LIFT);

const leansTowards = (plot: EveningPlot, at: number, higher: boolean): number => {
  const before = plot.nights[at - ALONE]?.share;
  const after = plot.nights[at + ALONE]?.share;

  if (before === undefined || after === undefined) {
    return NO_LEAN;
  }

  return before > after === higher ? -LABEL_LEAN : LABEL_LEAN;
};

const anchorAt = (plot: EveningPlot, at: number, lean: number): string => {
  if (at === NOTHING) {
    return "start";
  }

  if (at === plot.nights.length - ALONE) {
    return "end";
  }

  return lean < NO_LEAN ? "end" : "start";
};

const markLabel = (
  plot: EveningPlot,
  at: number,
  said: string,
  y: number,
  lean: number
): string =>
  text(said, {
    x: xAt(plot, at) + lean,
    y,
    fill: palette.inkFaint,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.axis,
    "text-anchor": anchorAt(plot, at, lean),
  });

const highMark = (copy: Copy, plot: EveningPlot): readonly string[] => {
  const at = indexOfNight(plot, plot.best);
  const night = plot.nights[at];

  return night === undefined
    ? []
    : [
        circle({
          cx: xAt(plot, at),
          cy: yAt(plot, night.share),
          r: MARK_RADIUS,
          fill: plot.ink,
        }),
        markLabel(
          plot,
          at,
          copy.personalBestEvening,
          aboveMark(plot, night.share),
          leansTowards(plot, at, TOWARDS_THE_LOWER)
        ),
      ];
};

const lowMark = (copy: Copy, plot: EveningPlot): readonly string[] => {
  const at = indexOfNight(plot, plot.worst);
  const night = plot.nights[at];

  return night === undefined
    ? []
    : [
        circle({
          cx: xAt(plot, at),
          cy: yAt(plot, night.share),
          r: MARK_RADIUS,
          fill: "none",
          stroke: palette.cellFool,
          "stroke-width": MARK_STROKE,
        }),
        markLabel(
          plot,
          at,
          copy.personalWorstEvening,
          belowMark(plot, night.share),
          leansTowards(plot, at, TOWARDS_THE_HIGHER)
        ),
      ];
};

const lastOf = (plot: EveningPlot): number => plot.nights.length - ALONE;

const axisStep = (plot: EveningPlot): number =>
  Math.max(AXIS_EVERY, Math.ceil(AXIS_LABEL_ROOM / (xAt(plot, ALONE) - xAt(plot, NOTHING))));

const numbered = (plot: EveningPlot, index: number, step: number): boolean => {
  if (index === lastOf(plot)) {
    return true;
  }

  const clearOfTheLast = xAt(plot, lastOf(plot)) - xAt(plot, index) >= AXIS_LABEL_ROOM;

  return (index + ALONE) % step === NOTHING && clearOfTheLast;
};

const axisNumbers = (plot: EveningPlot): readonly string[] => {
  const step = axisStep(plot);

  return plot.nights.flatMap((night, index) =>
    numbered(plot, index, step)
      ? [
          text(String(index + ALONE), {
            x: xAt(plot, index),
            y: bottomOf(plot) + PLOT_AXIS_DROP,
            fill: palette.inkFaint,
            "font-family": FONT_FAMILY,
            "font-size": personalFont.axis,
            "text-anchor": "middle",
          }),
        ]
      : []
  );
};

export const eveningChart = (copy: Copy, plot: EveningPlot): readonly string[] => [
  ...GRID_LINES.flatMap((share) => gridline(plot, share)),
  curve(plot),
  ...eveningPoints(plot),
  ...highMark(copy, plot),
  ...lowMark(copy, plot),
  ...shortNightHint(copy, plot),
  ...axisNumbers(plot),
];
