import {
  CHART_HEIGHT,
  FONT_FAMILY,
  GRID_LEFT,
  GRID_RIGHT,
  LEGEND_WIDTH,
  fontSize,
  type Sheet,
} from "#scoresheet/render/sheet-layout.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import { line, path, polyline, text } from "#scoresheet/render/svg-tags.ts";


const NONE = 0;

const SINGLE = 1;

const TICK_TARGET = 8;

const COARSEST_STEP = 200;

const TICK_STEPS: readonly number[] = [5, 10, 20, 25, 50, 100, COARSEST_STEP];

const LABEL_TARGET = 6;

const AXIS_GAP = 18;

const AXIS_LIFT = 7;

const AXIS_DROP = 34;

const LEGEND_GAP = 44;

const LEGEND_TOP = 24;

const LINE_WIDTH = 3;

const RULE_WIDTH = 1;

const PLOT_LEFT = GRID_LEFT;

const PLOT_RIGHT = GRID_RIGHT - LEGEND_WIDTH;

const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

const topOf = (sheet: Sheet): number =>
  Math.max(SINGLE, ...sheet.players.map((player) => player.total));

const stepFor = (top: number): number =>
  TICK_STEPS.find((step) => top / step <= TICK_TARGET) ?? COARSEST_STEP;

const ceilingOf = (sheet: Sheet): number => {
  const top = topOf(sheet);
  const step = stepFor(top);

  return Math.ceil(top / step) * step;
};

const xOf = (sheet: Sheet, point: number): number =>
  PLOT_LEFT + (point / Math.max(SINGLE, sheet.rounds)) * PLOT_WIDTH;

const yOf = (sheet: Sheet, score: number): number =>
  sheet.chartTop + CHART_HEIGHT - (score / ceilingOf(sheet)) * CHART_HEIGHT;

const scoreRules = (sheet: Sheet): readonly string[] => {
  const ceiling = ceilingOf(sheet);
  const step = stepFor(topOf(sheet));
  const ticks = Math.floor(ceiling / step);

  return Array.from({ length: ticks + SINGLE }, (_unused, index) => index * step).flatMap((tick) => [
    line({
      x1: PLOT_LEFT,
      y1: yOf(sheet, tick),
      x2: PLOT_RIGHT,
      y2: yOf(sheet, tick),
      stroke: palette.ruling,
      "stroke-width": RULE_WIDTH,
    }),
    text(String(tick), {
      x: PLOT_LEFT - AXIS_GAP,
      y: yOf(sheet, tick) + AXIS_LIFT,
      fill: palette.inkFaint,
      "font-family": FONT_FAMILY,
      "font-size": fontSize.axis,
      "text-anchor": "end",
    }),
  ]);
};

const roundLabels = (sheet: Sheet): readonly string[] => {
  const every = Math.max(SINGLE, Math.ceil(sheet.rounds / LABEL_TARGET));

  return Array.from({ length: sheet.rounds }, (_unused, round) => round + SINGLE)
    .filter((round) => round % every === NONE)
    .map((round) =>
      text(String(round), {
        x: xOf(sheet, round),
        y: sheet.chartTop + CHART_HEIGHT + AXIS_DROP,
        fill: palette.inkFaint,
        "font-family": FONT_FAMILY,
        "font-size": fontSize.axis,
        "text-anchor": "middle",
      })
    );
};

const scoreLines = (sheet: Sheet): readonly string[] =>
  sheet.players.map((player, column) =>
    path({
      d: polyline(
        [NONE, ...player.running].map((score, point) => [xOf(sheet, point), yOf(sheet, score)])
      ),
      fill: "none",
      stroke: colourFor(column),
      "stroke-width": LINE_WIDTH,
      "stroke-linejoin": "round",
    })
  );

const legend = (sheet: Sheet): readonly string[] =>
  sheet.players
    .map((player, column) => ({ player, column }))
    .sort((a, b) => b.player.total - a.player.total)
    .flatMap(({ player, column }, rank) => {
      const baseline = sheet.chartTop + LEGEND_TOP + rank * LEGEND_GAP;

      return [
        text(player.displayName, {
          x: PLOT_RIGHT + AXIS_GAP,
          y: baseline,
          fill: colourFor(column),
          "font-family": FONT_FAMILY,
          "font-weight": "bold",
          "font-size": fontSize.legend,
        }),
        text(String(player.total), {
          x: GRID_RIGHT,
          y: baseline,
          fill: palette.ink,
          "font-family": FONT_FAMILY,
          "font-weight": "bold",
          "font-size": fontSize.legend,
          "text-anchor": "end",
        }),
      ];
    });

export const scoreChart = (sheet: Sheet): readonly string[] => [
  ...scoreRules(sheet),
  ...roundLabels(sheet),
  ...scoreLines(sheet),
  ...legend(sheet),
];
