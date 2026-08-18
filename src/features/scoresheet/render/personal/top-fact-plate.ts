import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { rect, text } from "#scoresheet/render/svg-tags.ts";
import {
  PLATE_HEIGHT,
  PLATE_INDENT,
  PLATE_NAME_DROP,
  PLATE_REASON_DROP,
  PLATE_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { factLines } from "#scoresheet/render/personal/fact-lines.ts";
import { factInk, isBadNews } from "#scoresheet/render/personal/fact-ink.ts";
import type { PlacedFact } from "#scoresheet/render/personal/personal-layout.ts";
import type { Copy } from "#scoresheet/copy.ts";


export const topFactPlate = (
  copy: Copy,
  placed: PlacedFact,
  ink: string
): readonly string[] => {
  const lines = factLines(copy, placed.fact);
  const bad = isBadNews(placed.fact);

  return [
    rect({
      x: PAD,
      y: placed.top,
      width: GRID_RIGHT - PAD,
      height: PLATE_HEIGHT,
      fill: factInk(placed.fact, ink),
    }),
    text(lines.title, {
      x: PAD + PLATE_INDENT,
      y: placed.top + PLATE_TITLE_DROP,
      fill: palette.plateInk,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": personalFont.plateTitle,
    }),
    text(lines.holder, {
      x: PAD + PLATE_INDENT,
      y: placed.top + PLATE_NAME_DROP,
      fill: palette.plateInk,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": personalFont.plateName,
    }),
    text(lines.reason, {
      x: PAD + PLATE_INDENT,
      y: placed.top + PLATE_REASON_DROP,
      fill: bad ? palette.plateCap : palette.plateShade,
      "font-family": FONT_FAMILY,
      "font-size": personalFont.plateReason,
    }),
  ];
};
