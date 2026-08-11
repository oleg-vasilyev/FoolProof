import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { LEGEND_GUTTER, LEGEND_LABEL_DROP, LEGEND_NAME_DROP, LEGEND_ROW_PITCH, LEGEND_RULE_DROP, LEGEND_SHARE_DROP, LEGEND_TALLY_DROP, PLOT_LEFT, PLOT_WIDTH, chartBottomOf, legendColumnsOf, legendSlotOf, nameToFit, type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
import { FONT_FAMILY, fontSize } from "#scoresheet/render/card-metrics.ts";
import { type ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { gameTally } from "#scoresheet/render/session-tally.ts";
import { line, text } from "#scoresheet/render/svg-tags.ts";
import { percentLabel } from "#scoresheet/render/chronology/percent-label.ts";


const LABEL_TRACKING = 2;

const LINE_WIDTH = 3;

const SKIP_DASH = "14 10";

const SAMPLE_WIDTH = 46;

const SAMPLE_GAP = 14;

const SAMPLE_LIFT = 7;

const NOTE_ROOM = 230;

const legendLabel = (copy: Copy, sheet: Sheet): string =>
  text(copy.sheetLegendLabel, {
    x: PLOT_LEFT,
    y: chartBottomOf(sheet) + LEGEND_LABEL_DROP,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.legendLabel,
    "letter-spacing": LABEL_TRACKING,
  });

const entryOf = (
  copy: Copy,
  sheet: Sheet,
  player: ScoredPlayer,
  column: number,
  rank: number
): readonly string[] => {
  const seated = sheet.players.length;
  const columns = legendColumnsOf(seated);
  const slotWidth = legendSlotOf(seated);
  const left = PLOT_LEFT + (rank % columns) * slotWidth;
  const rowTop = chartBottomOf(sheet) + Math.floor(rank / columns) * LEGEND_ROW_PITCH;
  const fitted = nameToFit(player.displayName, slotWidth - LEGEND_GUTTER, fontSize.legend);

  return [
    line({
      x1: left,
      y1: rowTop + LEGEND_RULE_DROP,
      x2: left + SAMPLE_WIDTH,
      y2: rowTop + LEGEND_RULE_DROP,
      stroke: colourFor(column),
      "stroke-width": LINE_WIDTH,
    }),
    text(percentLabel(player.share), {
      x: left,
      y: rowTop + LEGEND_SHARE_DROP,
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": fontSize.legend,
    }),
    text(fitted, {
      x: left,
      y: rowTop + LEGEND_NAME_DROP,
      fill: colourFor(column),
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": fontSize.legend,
    }),
    text(gameTally(copy, player.games), {
      x: left,
      y: rowTop + LEGEND_TALLY_DROP,
      fill: palette.inkFigure,
      "font-family": FONT_FAMILY,
      "font-size": fontSize.legendTally,
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

  const baseline = chartBottomOf(sheet) + LEGEND_LABEL_DROP;
  const left = PLOT_LEFT + PLOT_WIDTH - NOTE_ROOM;

  return [
    line({
      x1: left,
      y1: baseline - SAMPLE_LIFT,
      x2: left + SAMPLE_WIDTH,
      y2: baseline - SAMPLE_LIFT,
      stroke: palette.inkFigure,
      "stroke-width": LINE_WIDTH,
      "stroke-dasharray": SKIP_DASH,
    }),
    text(copy.sheetKeyAbsent, {
      x: left + SAMPLE_WIDTH + SAMPLE_GAP,
      y: baseline,
      fill: palette.inkFigure,
      "font-family": FONT_FAMILY,
      "font-size": fontSize.legendTally,
    }),
  ];
};

export const shareLegend = (copy: Copy, sheet: Sheet): readonly string[] => [
  legendLabel(copy, sheet),
  ...legend(copy, sheet),
  ...skipNote(copy, sheet),
];
