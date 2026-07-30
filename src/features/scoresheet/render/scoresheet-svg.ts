import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { chronologyGrid, columnNames } from "#scoresheet/render/chronology-grid.ts";
import {
  FONT_FAMILY,
  GRID_RIGHT,
  IMAGE_WIDTH,
  PAD,
  fontSize,
  layoutOf,
  type Sheet,
} from "#scoresheet/render/sheet-layout.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { scoreChart } from "#scoresheet/render/score-chart.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { rect, svgOf, text } from "#scoresheet/render/svg-tags.ts";


const NONE = 0;

const EYEBROW_BASELINE = 146;

const TITLE_BASELINE = 286;

const SUBTITLE_BASELINE = 227;

const OMITTED_BASELINE = 286;

const LABEL_LIFT = 62;

const EYEBROW_TRACKING = 3;

const background = (sheet: Sheet): string =>
  rect({ x: NONE, y: NONE, width: IMAGE_WIDTH, height: sheet.height, fill: palette.sheet });

const heading = (sheet: Sheet): readonly string[] => [
  text(copy.sheetEyebrow, {
    x: PAD,
    y: EYEBROW_BASELINE,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.eyebrow,
    "letter-spacing": EYEBROW_TRACKING,
  }),
  text(copy.sheetTitle, {
    x: PAD,
    y: TITLE_BASELINE,
    fill: palette.ink,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": fontSize.title,
  }),
  text(copy.sheetDate(sheet.startedOn), {
    x: GRID_RIGHT,
    y: EYEBROW_BASELINE,
    fill: palette.ink,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.date,
    "text-anchor": "end",
  }),
  text(copy.sheetSubtitle(sheet.rounds, sheet.players.length), {
    x: GRID_RIGHT,
    y: SUBTITLE_BASELINE,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.subtitle,
    "text-anchor": "end",
  }),
];

const omittedNote = (sheet: Sheet): readonly string[] =>
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

const scoreLabel = (sheet: Sheet): string =>
  text(copy.sheetScoreLabel, {
    x: PAD,
    y: sheet.chartTop - LABEL_LIFT,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.sectionLabel,
    "letter-spacing": EYEBROW_TRACKING,
  });

export const renderScoresheet = (chronology: SeriesChronology): string => {
  const sheet = layoutOf(chronology);

  return svgOf(IMAGE_WIDTH, sheet.height, [
    background(sheet),
    ...heading(sheet),
    ...omittedNote(sheet),
    ...columnNames(sheet),
    ...chronologyGrid(sheet),
    scoreLabel(sheet),
    ...scoreChart(sheet),
  ]);
};
