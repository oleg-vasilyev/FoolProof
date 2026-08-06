import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { PLOT_LEFT, PLOT_WIDTH, chartBottomOf, legendFontOf, nameToFit, type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
import { FONT_FAMILY, fontSize } from "#scoresheet/render/card-metrics.ts";
import { type ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { gameTally } from "#scoresheet/render/session-tally.ts";
import { line, text } from "#scoresheet/render/svg-tags.ts";
import { percentLabel } from "#scoresheet/render/chronology/percent-label.ts";


const LEGEND_DROP = 96;

const LEGEND_NAME_DROP = 132;

const LEGEND_TALLY_DROP = 162;

const NOTE_DROP = 208;

const LINE_WIDTH = 3;

const SKIP_DASH = "14 10";

const SAMPLE_WIDTH = 46;

const SAMPLE_GAP = 14;

const SAMPLE_LIFT = 7;

const LEGEND_SLOT_MAX = 284;

const LEGEND_GUTTER = 24;

const TALLY_FONT_RATIO = fontSize.legendTally / fontSize.legend;

const slotWidthOf = (sheet: Sheet): number =>
  Math.min(LEGEND_SLOT_MAX, PLOT_WIDTH / sheet.players.length);

const tallyFontOf = (blockSize: number): number =>
  Math.min(fontSize.legendTally, Math.round(blockSize * TALLY_FONT_RATIO));

const entryOf = (
  copy: Copy,
  sheet: Sheet,
  player: ScoredPlayer,
  column: number,
  rank: number
): readonly string[] => {
  const slotWidth = slotWidthOf(sheet);
  const left = PLOT_LEFT + rank * slotWidth;
  const baseline = chartBottomOf(sheet) + LEGEND_DROP;
  const size = legendFontOf(slotWidth);
  const fitted = nameToFit(player.displayName, slotWidth - LEGEND_GUTTER, size);

  return [
    text(percentLabel(player.share), {
      x: left,
      y: baseline,
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": size,
    }),
    text(fitted.text, {
      x: left,
      y: chartBottomOf(sheet) + LEGEND_NAME_DROP,
      fill: colourFor(column),
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": fitted.size,
    }),
    text(gameTally(copy, player.games), {
      x: left,
      y: chartBottomOf(sheet) + LEGEND_TALLY_DROP,
      fill: palette.inkFaint,
      "font-family": FONT_FAMILY,
      "font-size": tallyFontOf(size),
    }),
  ];
};

const legend = (copy: Copy, sheet: Sheet): readonly string[] =>
  sheet.players
    .map((player, column) => ({ player, column }))
    .sort((a, b) => b.player.share - a.player.share)
    .flatMap(({ player, column }, rank) => entryOf(copy, sheet, player, column, rank));

const anybodySatOut = (sheet: Sheet): boolean =>
  sheet.players.some((player) => player.cells.some((cell) => cell.kind === CellKind.Absent));

const skipNote = (copy: Copy, sheet: Sheet): readonly string[] => {
  if (!anybodySatOut(sheet)) {
    return [];
  }

  const baseline = chartBottomOf(sheet) + NOTE_DROP;

  return [
    line({
      x1: PLOT_LEFT,
      y1: baseline - SAMPLE_LIFT,
      x2: PLOT_LEFT + SAMPLE_WIDTH,
      y2: baseline - SAMPLE_LIFT,
      stroke: palette.inkFaint,
      "stroke-width": LINE_WIDTH,
      "stroke-dasharray": SKIP_DASH,
    }),
    text(copy.sheetKeyAbsent, {
      x: PLOT_LEFT + SAMPLE_WIDTH + SAMPLE_GAP,
      y: baseline,
      fill: palette.inkFaint,
      "font-family": FONT_FAMILY,
      "font-size": fontSize.legendTally,
    }),
  ];
};

export const shareLegend = (copy: Copy, sheet: Sheet): readonly string[] => [
  ...legend(copy, sheet),
  ...skipNote(copy, sheet),
];
