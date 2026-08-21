import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { Honours, TableCurse } from "#scoresheet/domain/awards/award-catalogue.ts";
import { cardHeading } from "#scoresheet/render/card-heading.ts";
import { awardRow } from "#scoresheet/render/awards/award-row.ts";
import {
  CURSE_BASELINE_DROP,
  CURSE_FACT_FONT,
  CURSE_LABEL_FONT,
  CURSE_TRACKING,
  ROWS_TOP,
  awardsLayoutOf,
  type AwardsSheet,
} from "#scoresheet/render/awards/awards-layout.ts";
import { foolPlate } from "#scoresheet/render/awards/fool-plate.ts";
import { FONT_FAMILY, GRID_RIGHT, IMAGE_WIDTH, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { posterBaseboard } from "#scoresheet/render/poster-baseboard.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { gameTally } from "#scoresheet/render/tally-phrases.ts";
import { line, rect, svgOf, text } from "#scoresheet/render/svg-tags.ts";


const NONE = 0;

const RULE_WIDTH = 1;

const background = (sheet: AwardsSheet): string =>
  rect({ x: NONE, y: NONE, width: IMAGE_WIDTH, height: sheet.height, fill: palette.sheet });

const headingRule = (): string =>
  line({
    x1: PAD,
    y1: ROWS_TOP,
    x2: GRID_RIGHT,
    y2: ROWS_TOP,
    stroke: palette.ruling,
    "stroke-width": RULE_WIDTH,
  });

const curseNote = (copy: Copy, curse: TableCurse, top: number): readonly string[] => [
  line({
    x1: PAD,
    y1: top,
    x2: GRID_RIGHT,
    y2: top,
    stroke: palette.ruling,
    "stroke-width": RULE_WIDTH,
  }),
  text(copy.awardsCurseLabel, {
    x: PAD,
    y: top + CURSE_BASELINE_DROP,
    fill: palette.cellFool,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": CURSE_LABEL_FONT,
    "letter-spacing": CURSE_TRACKING,
  }),
  text(copy.curseFact(curse.burns, gameTally(copy, curse.games)), {
    x: GRID_RIGHT,
    y: top + CURSE_BASELINE_DROP,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": CURSE_FACT_FONT,
    "text-anchor": "end",
  }),
];

const curseSection = (copy: Copy, sheet: AwardsSheet): readonly string[] =>
  sheet.curse === null ? [] : curseNote(copy, sheet.curse.fact, sheet.curse.top);

export const renderAwards = (
  copy: Copy,
  chronology: SeriesChronology,
  honours: Honours,
  handle: string
): string => {
  const sheet = awardsLayoutOf(chronology, honours);

  return svgOf(IMAGE_WIDTH, sheet.height, [
    background(sheet),
    ...cardHeading(copy, {
      title: copy.awardsTitle,
      startedOn: sheet.startedOn,
      games: sheet.games,
      players: sheet.players,
    }),
    headingRule(),
    ...sheet.rows.flatMap((placed) => awardRow(copy, placed, sheet.density)),
    ...(sheet.fool === null ? [] : foolPlate(copy, sheet.fool, sheet.density)),
    ...curseSection(copy, sheet),
    ...posterBaseboard(handle, sheet.height),
  ]);
};
