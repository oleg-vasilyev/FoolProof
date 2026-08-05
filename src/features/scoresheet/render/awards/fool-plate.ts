import { awardReason, awardTitle, awardWinner } from "#scoresheet/render/awards/award-lines.ts";
import {
  CAP_HEIGHT,
  CAP_WIDTH,
  PLATE_TEXT_LEFT,
  PLATE_TITLE_LEFT,
  PLATE_TITLE_TRACKING,
  RANK_FONT,
  RANK_WIDTH,
  WINNER_TRACKING,
  baselineOf,
  plateBoxOf,
  type Density,
  type Placed,
} from "#scoresheet/render/awards/awards-layout.ts";
import { rankLabel } from "#scoresheet/render/awards/rank-label.ts";
import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { path, rect, text } from "#scoresheet/render/svg-tags.ts";


const CAP_OUTLINE = "M2 21 L2 12 L0 2 L8 8 L13 0 L18 8 L26 2 L24 12 L24 21 Z";

const CAP_DRAWN_AT = 26;

const HALF = 2;

const jesterCap = (top: number): string =>
  path({
    d: CAP_OUTLINE,
    fill: palette.plateCap,
    transform: `translate(${String(PLATE_TEXT_LEFT)} ${String(top)}) scale(${String(CAP_WIDTH / CAP_DRAWN_AT)})`,
  });

export const foolPlate = (placed: Placed, density: Density): readonly string[] => {
  const box = plateBoxOf(density);
  const headTop = placed.top + box.headTop;

  return [
    rect({
      x: PAD,
      y: placed.top,
      width: GRID_RIGHT - PAD,
      height: placed.height,
      fill: palette.cellFool,
    }),
    text(rankLabel(placed.rank), {
      x: PAD + RANK_WIDTH / HALF,
      y: placed.top + density.plateRankLift,
      fill: palette.plateSoft,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": RANK_FONT,
      "text-anchor": "middle",
    }),
    jesterCap(headTop + (density.plateFont - CAP_HEIGHT) / HALF),
    text(awardTitle(placed.award), {
      x: PLATE_TITLE_LEFT,
      y: baselineOf(headTop, density.plateFont),
      fill: palette.plateInk,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": density.plateFont,
      "letter-spacing": PLATE_TITLE_TRACKING,
    }),
    text(awardWinner(placed.names), {
      x: PLATE_TEXT_LEFT,
      y: baselineOf(placed.top + box.winnerTop, density.plateWinnerFont),
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": density.plateWinnerFont,
      "letter-spacing": WINNER_TRACKING,
    }),
    text(awardReason(placed.award), {
      x: PLATE_TEXT_LEFT,
      y: baselineOf(placed.top + box.reasonTop, density.reasonFont),
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-size": density.reasonFont,
    }),
  ];
};
