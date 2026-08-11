import { awardReason, awardTitle, awardWinner } from "#scoresheet/render/awards/award-lines.ts";
import type { Copy } from "#scoresheet/copy.ts";
import {
  RANK_FONT,
  RANK_LEFT,
  ROW_TITLE_TRACKING,
  TEXT_LEFT,
  TICK_WIDTH,
  WINNER_TRACKING,
  baselineOf,
  type Density,
  type Placed,
} from "#scoresheet/render/awards/awards-layout.ts";
import { rankLabel } from "#scoresheet/render/awards/rank-label.ts";
import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { line, rect, text } from "#scoresheet/render/svg-tags.ts";


const RULE_WIDTH = 1;

export const awardRow = (copy: Copy, placed: Placed, density: Density): readonly string[] => {
  const contentTop = placed.top + density.rowPad;
  const winnerTop = contentTop + density.titleLine + density.titleGap;
  const reasonTop = winnerTop + density.winnerLine + density.winnerGap;

  return [
    rect({
      x: PAD,
      y: placed.top,
      width: TICK_WIDTH,
      height: placed.height,
      fill: placed.colour,
    }),
    text(rankLabel(placed.rank), {
      x: RANK_LEFT,
      y: contentTop + density.rankLift,
      fill: palette.inkFaint,
      "font-family": FONT_FAMILY,
      "font-size": RANK_FONT,
    }),
    text(awardTitle(copy, placed.award), {
      x: TEXT_LEFT,
      y: baselineOf(contentTop, density.titleFont),
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": density.titleFont,
      "letter-spacing": ROW_TITLE_TRACKING,
    }),
    text(awardWinner(copy, placed.names, placed.wholeTable), {
      x: TEXT_LEFT,
      y: baselineOf(winnerTop, density.winnerFont),
      fill: placed.colour,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": density.winnerFont,
      "letter-spacing": WINNER_TRACKING,
    }),
    text(awardReason(copy, placed.award), {
      x: TEXT_LEFT,
      y: baselineOf(reasonTop, density.reasonFont),
      fill: palette.inkMuted,
      "font-family": FONT_FAMILY,
      "font-size": density.reasonFont,
    }),
    line({
      x1: PAD,
      y1: placed.top + placed.height,
      x2: GRID_RIGHT,
      y2: placed.top + placed.height,
      stroke: palette.ruling,
      "stroke-width": RULE_WIDTH,
    }),
  ];
};
