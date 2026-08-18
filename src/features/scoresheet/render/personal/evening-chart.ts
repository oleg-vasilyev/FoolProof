import { FONT_FAMILY, GRID_RIGHT } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { percentLabel } from "#scoresheet/render/percent-label.ts";
import { circle, line, path, polyline, text } from "#scoresheet/render/svg-tags.ts";
import {
  MARK_RADIUS,
  MARK_STROKE,
  PLOT_AXIS_DROP,
  PLOT_HEIGHT,
  PLOT_LEFT,
  PLOT_LINE_WIDTH,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";


const NOTHING = 0;

const ALONE = 1;

const FULL = 1;

const AXIS_GAP = 24;

const AXIS_LIFT = 8;

const MIDDLE = 0.5;

const AXIS_EVERY = 4;

const GRID_LINES: readonly number[] = [0, 0.25, MIDDLE, 0.75, FULL];

const MIDLINE_DASH = "8 10";

const RULE_WIDTH = 1;

export interface EveningPlot {
  readonly nights: readonly EveningShare[];
  readonly top: number;
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

const indexOfNight = (plot: EveningPlot, wanted: EveningShare | null): number =>
  wanted === null ? -ALONE : plot.nights.findIndex((night) => night.seriesNo === wanted.seriesNo);

const highMark = (plot: EveningPlot): readonly string[] => {
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
      ];
};

const lowMark = (plot: EveningPlot): readonly string[] => {
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
      ];
};

const numbered = (plot: EveningPlot, index: number): boolean =>
  (index + ALONE) % AXIS_EVERY === NOTHING || index === plot.nights.length - ALONE;

const axisNumbers = (plot: EveningPlot): readonly string[] =>
  plot.nights.flatMap((night, index) =>
    numbered(plot, index)
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

export const eveningChart = (plot: EveningPlot): readonly string[] => [
  ...GRID_LINES.flatMap((share) => gridline(plot, share)),
  curve(plot),
  ...highMark(plot),
  ...lowMark(plot),
  ...axisNumbers(plot),
];
