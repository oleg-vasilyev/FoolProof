import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { cellKey } from "#scoresheet/render/chronology/cell-key.ts";
import { chronologyGrid, columnNames } from "#scoresheet/render/chronology/chronology-grid.ts";
import { layoutOf, type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
import {
  FONT_FAMILY,
  GRID_RIGHT,
  IMAGE_WIDTH,
  PAD,
  fontSize,
} from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { shareChart } from "#scoresheet/render/chronology/share-chart.ts";
import { shareLegend } from "#scoresheet/render/chronology/share-legend.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { EYEBROW_TRACKING, cardHeading } from "#scoresheet/render/card-heading.ts";
import { line, rect, svgOf, text } from "#scoresheet/render/svg-tags.ts";


const NONE = 0;

const OMITTED_BASELINE = 286;

const LABEL_LIFT = 40;

const DIVIDER_DROP = 92;

const DIVIDER_WIDTH = 1;

const background = (sheet: Sheet): string =>
  rect({ x: NONE, y: NONE, width: IMAGE_WIDTH, height: sheet.height, fill: palette.sheet });

const heading = (copy: Copy, sheet: Sheet): readonly string[] =>
  cardHeading(copy, {
    title: copy.sheetTitle,
    startedOn: sheet.startedOn,
    games: sheet.rounds,
    players: sheet.players.length,
  });

const omittedNote = (copy: Copy, sheet: Sheet): readonly string[] =>
  sheet.omitted === NONE
    ? []
    : [
        text(copy.sheetOmitted(sheet.omitted), {
          x: GRID_RIGHT,
          y: OMITTED_BASELINE,
          fill: palette.inkFaint,
          "font-family": FONT_FAMILY,
          "font-size": fontSize.sectionLabel,
          "text-anchor": "end",
        }),
      ];

const sectionDivider = (sheet: Sheet): string =>
  line({
    x1: PAD,
    y1: sheet.gridBottom + DIVIDER_DROP,
    x2: GRID_RIGHT,
    y2: sheet.gridBottom + DIVIDER_DROP,
    stroke: palette.ruling,
    "stroke-width": DIVIDER_WIDTH,
  });

const sectionHeading = (copy: Copy, sheet: Sheet): readonly string[] => [
  text(copy.sheetShareLabel, {
    x: PAD,
    y: sheet.chartTop - LABEL_LIFT,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.sectionLabel,
    "letter-spacing": EYEBROW_TRACKING,
  }),
  text(copy.sheetShareHint, {
    x: GRID_RIGHT,
    y: sheet.chartTop - LABEL_LIFT,
    fill: palette.inkFaint,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.hint,
    "text-anchor": "end",
  }),
];

export const renderScoresheet = (copy: Copy, chronology: SeriesChronology): string => {
  const sheet = layoutOf(chronology);

  return svgOf(IMAGE_WIDTH, sheet.height, [
    background(sheet),
    ...heading(copy, sheet),
    ...omittedNote(copy, sheet),
    ...columnNames(sheet),
    ...chronologyGrid(sheet),
    ...cellKey(copy, sheet),
    sectionDivider(sheet),
    ...sectionHeading(copy, sheet),
    ...shareChart(sheet),
    ...shareLegend(copy, sheet),
  ]);
};
