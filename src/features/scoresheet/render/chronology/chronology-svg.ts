import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { cellKey } from "#scoresheet/render/chronology/cell-key.ts";
import { chronologyGrid, columnNames } from "#scoresheet/render/chronology/chronology-grid.ts";
import { GRID_LABEL_BASELINE, layoutOf, type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
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

const DIVIDER_RISE = 64;

const DIVIDER_WIDTH = 1;

interface Section {
  readonly label: string;
  readonly hint: string;
  readonly baseline: number;
}

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

const sectionHead = (section: Section): readonly string[] => [
  line({
    x1: PAD,
    y1: section.baseline - DIVIDER_RISE,
    x2: GRID_RIGHT,
    y2: section.baseline - DIVIDER_RISE,
    stroke: palette.ruling,
    "stroke-width": DIVIDER_WIDTH,
  }),
  text(section.label, {
    x: PAD,
    y: section.baseline,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.sectionLabel,
    "letter-spacing": EYEBROW_TRACKING,
  }),
  text(section.hint, {
    x: GRID_RIGHT,
    y: section.baseline,
    fill: palette.inkHint,
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
    ...sectionHead({
      label: copy.sheetGridLabel,
      hint: copy.sheetGridHint,
      baseline: GRID_LABEL_BASELINE,
    }),
    ...columnNames(sheet),
    ...chronologyGrid(sheet),
    ...cellKey(copy, sheet),
    ...sectionHead({
      label: copy.sheetShareLabel,
      hint: copy.sheetShareHint,
      baseline: sheet.chartTop - LABEL_LIFT,
    }),
    ...shareChart(sheet),
    ...shareLegend(copy, sheet),
  ]);
};
