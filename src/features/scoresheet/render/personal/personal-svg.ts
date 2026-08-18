import { FONT_FAMILY, GRID_RIGHT, IMAGE_WIDTH, PAD, fontSize } from "#scoresheet/render/card-metrics.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import { EYEBROW_TRACKING } from "#scoresheet/render/card-heading.ts";
import { eveningTally, gameTally } from "#scoresheet/render/tally-phrases.ts";
import { sessionDate } from "#scoresheet/render/session-date.ts";
import { line, rect, svgOf, text } from "#scoresheet/render/svg-tags.ts";
import { personalLayoutOf } from "#scoresheet/render/personal/personal-layout.ts";
import {
  HEADING_RULE,
  SECTION_LABEL_DROP,
  TILE_TRACKING,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { careerTiles } from "#scoresheet/render/personal/career-tiles.ts";
import { eveningChart } from "#scoresheet/render/personal/evening-chart.ts";
import { factRows } from "#scoresheet/render/personal/fact-rows.ts";
import { topFactPlate } from "#scoresheet/render/personal/top-fact-plate.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { Copy } from "#scoresheet/copy.ts";


const NOTHING = 0;

const RULE_WIDTH = 1;

const EYEBROW_BASELINE = 146;

const TITLE_BASELINE = 286;

const SUBTITLE_BASELINE = 227;

const heading = (copy: Copy, card: CareerCard, ink: string): readonly string[] => [
  text(copy.personalEyebrow, {
    x: PAD,
    y: EYEBROW_BASELINE,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.eyebrow,
    "letter-spacing": EYEBROW_TRACKING,
  }),
  text(card.displayName, {
    x: PAD,
    y: TITLE_BASELINE,
    fill: ink,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": fontSize.title,
  }),
  text(copy.personalSince(sessionDate(copy, card.since)), {
    x: GRID_RIGHT,
    y: EYEBROW_BASELINE,
    fill: palette.ink,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.date,
    "text-anchor": "end",
  }),
  text(
    copy.personalSubtitle(
      gameTally(copy, card.tally.games),
      eveningTally(copy, card.tally.evenings)
    ),
    {
      x: GRID_RIGHT,
      y: SUBTITLE_BASELINE,
      fill: palette.inkMuted,
      "font-family": FONT_FAMILY,
      "font-size": fontSize.subtitle,
      "text-anchor": "end",
    }
  ),
  line({
    x1: PAD,
    y1: HEADING_RULE,
    x2: GRID_RIGHT,
    y2: HEADING_RULE,
    stroke: palette.ruling,
    "stroke-width": RULE_WIDTH,
  }),
];

const sectionLabel = (label: string, hint: string | null, baseline: number): readonly string[] => [
  line({
    x1: PAD,
    y1: baseline - SECTION_LABEL_DROP,
    x2: GRID_RIGHT,
    y2: baseline - SECTION_LABEL_DROP,
    stroke: palette.ruling,
    "stroke-width": RULE_WIDTH,
  }),
  text(label, {
    x: PAD,
    y: baseline,
    fill: palette.inkKey,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.sectionLabel,
    "letter-spacing": TILE_TRACKING,
  }),
  ...(hint === null
    ? []
    : [
        text(hint, {
          x: GRID_RIGHT,
          y: baseline,
          fill: palette.inkFaint,
          "font-family": FONT_FAMILY,
          "font-size": personalFont.sectionHint,
          "text-anchor": "end",
        }),
      ]),
];

export const renderPersonalCard = (copy: Copy, card: CareerCard, column: number): string => {
  const sheet = personalLayoutOf(card);
  const ink = colourFor(column);

  return svgOf(IMAGE_WIDTH, sheet.height, [
    rect({ x: NOTHING, y: NOTHING, width: IMAGE_WIDTH, height: sheet.height, fill: palette.sheet }),
    ...heading(copy, card, ink),
    ...careerTiles(copy, card),
    ...(sheet.chartLabel === null
      ? []
      : sectionLabel(copy.personalChartLabel, copy.personalChartHint, sheet.chartLabel)),
    ...(sheet.plotTop === null
      ? []
      : eveningChart({
          nights: card.nights,
          top: sheet.plotTop,
          best: card.best,
          worst: card.worst,
          ink,
        })),
    ...(sheet.factsLabel === null
      ? []
      : sectionLabel(copy.personalFactsLabel, null, sheet.factsLabel)),
    ...factRows(copy, sheet.facts, ink),
    ...(sheet.plate === null ? [] : topFactPlate(copy, sheet.plate, ink)),
  ]);
};
