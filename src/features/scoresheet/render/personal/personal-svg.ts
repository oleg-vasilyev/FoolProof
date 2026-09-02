import { FONT_FAMILY, GRID_RIGHT, IMAGE_WIDTH, USUAL_FALLBACK, PAD, WIDEST_FALLBACK, fontSize } from "#scoresheet/render/card-metrics.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import type { ColumnLookup } from "#scoresheet/render/personal/colour-column.ts";
import { EYEBROW_TRACKING } from "#scoresheet/render/card-heading.ts";
import { eveningTally, gameTally } from "#scoresheet/render/tally-phrases.ts";
import { sessionDate } from "#scoresheet/render/session-date.ts";
import { line, rect, svgOf, text } from "#scoresheet/render/svg-tags.ts";
import { nameToFit, widthOf } from "#scoresheet/render/name-to-fit.ts";
import { posterBaseboard } from "#scoresheet/render/poster-baseboard.ts";
import { personalLayoutOf, type PersonalLayout } from "#scoresheet/render/personal/personal-layout.ts";
import {
  HEADING_RULE,
  SECTION_LABEL_DROP,
  TEASER_FLOOR_DASH,
  TEASER_FLOOR_DROP,
  TEASER_FLOOR_WIDTH,
  TEASER_TEXT_DROP,
  TILE_TRACKING,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { careerTiles } from "#scoresheet/render/personal/career-tiles.ts";
import { chartTeaser } from "#scoresheet/render/personal/chart-teaser.ts";
import { eveningChart } from "#scoresheet/render/personal/evening-chart.ts";
import { factRows } from "#scoresheet/render/personal/fact-rows.ts";
import { topFactPlate } from "#scoresheet/render/personal/top-fact-plate.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { Copy } from "#scoresheet/copy.ts";


const NOTHING = 0;

const RULE_WIDTH = 1;

const HALVES = 2;

const EYEBROW_BASELINE = 146;

const TITLE_BASELINE = 286;

const SUBTITLE_BASELINE = 227;

const TITLE_GAP = 40;

const subtitleOf = (copy: Copy, card: CareerCard): string =>
  copy.personalSubtitle(
    gameTally(copy, card.tally.games),
    eveningTally(copy, card.tally.evenings)
  );

const titleRoom = (copy: Copy, card: CareerCard): number =>
  GRID_RIGHT - PAD - TITLE_GAP - widthOf(subtitleOf(copy, card), fontSize.subtitle, USUAL_FALLBACK);

const heading = (copy: Copy, card: CareerCard, ink: string): readonly string[] => [
  text(copy.personalEyebrow, {
    x: PAD,
    y: EYEBROW_BASELINE,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.eyebrow,
    "letter-spacing": EYEBROW_TRACKING,
  }),
  text(nameToFit(card.displayName, titleRoom(copy, card), fontSize.title, WIDEST_FALLBACK), {
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
  text(subtitleOf(copy, card), {
    x: GRID_RIGHT,
    y: SUBTITLE_BASELINE,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.subtitle,
    "text-anchor": "end",
  }),
  line({
    x1: PAD,
    y1: HEADING_RULE,
    x2: GRID_RIGHT,
    y2: HEADING_RULE,
    stroke: palette.ruling,
    "stroke-width": RULE_WIDTH,
  }),
];

const sectionLabel = (label: string, baseline: number): readonly string[] => [
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
];

interface ChartSection {
  readonly copy: Copy;
  readonly card: CareerCard;
  readonly sheet: PersonalLayout;
  readonly ink: string;
}

const teaserBody = (saying: string, baseline: number): readonly string[] => [
  text(saying, {
    x: IMAGE_WIDTH / HALVES,
    y: baseline + TEASER_TEXT_DROP,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.chartTeaser,
    "text-anchor": "middle",
  }),
  line({
    x1: PAD,
    y1: baseline + TEASER_FLOOR_DROP,
    x2: GRID_RIGHT,
    y2: baseline + TEASER_FLOOR_DROP,
    stroke: palette.cellAbsentEdge,
    "stroke-width": TEASER_FLOOR_WIDTH,
    "stroke-dasharray": TEASER_FLOOR_DASH,
  }),
];

const chartSection = (section: ChartSection): readonly string[] => {
  const { copy, card, sheet, ink } = section;

  return [
    ...sectionLabel(copy.personalChartLabel, sheet.chartLabel),
    ...(sheet.plotTop === null
      ? teaserBody(chartTeaser(copy, card.nights.length), sheet.chartLabel)
      : eveningChart(copy, {
          nights: card.nights,
          top: sheet.plotTop,
          label: sheet.chartLabel,
          best: card.best,
          worst: card.worst,
          ink,
        })),
  ];
};

export const renderPersonalCard = (
  copy: Copy,
  card: CareerCard,
  columnOf: ColumnLookup,
  handle: string
): string => {
  const sheet = personalLayoutOf(card);
  const ink = colourFor(columnOf(card.playerId));

  return svgOf(IMAGE_WIDTH, sheet.height, [
    rect({ x: NOTHING, y: NOTHING, width: IMAGE_WIDTH, height: sheet.height, fill: palette.sheet }),
    ...heading(copy, card, ink),
    ...careerTiles(copy, card, ink),
    ...chartSection({ copy, card, sheet, ink }),
    ...sectionLabel(copy.personalFactsLabel, sheet.factsLabel),
    ...(sheet.facts.length === NOTHING && sheet.plate === null
      ? teaserBody(copy.personalFactsAwait, sheet.factsLabel)
      : []),
    ...factRows(copy, sheet.facts, ink, columnOf),
    ...(sheet.plate === null ? [] : topFactPlate(copy, sheet.plate, ink)),
    ...posterBaseboard(handle, sheet.height),
  ]);
};
