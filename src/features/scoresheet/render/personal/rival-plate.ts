import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { timeTally } from "#scoresheet/render/tally-phrases.ts";
import { rect, text } from "#scoresheet/render/svg-tags.ts";
import {
  PLATE_HEIGHT,
  PLATE_INDENT,
  PLATE_NAME_DROP,
  PLATE_REASON_DROP,
  PLATE_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import type { Rival } from "#scoresheet/domain/career/career-rival.ts";
import type { Copy } from "#scoresheet/copy.ts";


export const rivalPlate = (
  copy: Copy,
  rival: Rival,
  subject: string,
  top: number
): readonly string[] => [
  rect({
    x: PAD,
    y: top,
    width: GRID_RIGHT - PAD,
    height: PLATE_HEIGHT,
    fill: palette.cellFool,
  }),
  text(copy.rivalTitle, {
    x: PAD + PLATE_INDENT,
    y: top + PLATE_TITLE_DROP,
    fill: palette.plateInk,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": personalFont.plateTitle,
  }),
  text(rival.displayName, {
    x: PAD + PLATE_INDENT,
    y: top + PLATE_NAME_DROP,
    fill: palette.plateInk,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": personalFont.plateName,
  }),
  text(copy.rivalReason(timeTally(copy, rival.duels), rival.lost, subject), {
    x: PAD + PLATE_INDENT,
    y: top + PLATE_REASON_DROP,
    fill: palette.plateCap,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.plateReason,
  }),
];
