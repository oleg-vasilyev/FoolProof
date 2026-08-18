import { FONT_FAMILY, GRID_RIGHT, PAD, fontSize } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { sessionDate } from "#scoresheet/render/session-date.ts";
import { gameTally, playerTally } from "#scoresheet/render/tally-phrases.ts";
import { text } from "#scoresheet/render/svg-tags.ts";


const EYEBROW_BASELINE = 146;

const TITLE_BASELINE = 286;

const SUBTITLE_BASELINE = 227;

export const EYEBROW_TRACKING = 3;

export interface Heading {
  readonly title: string;
  readonly startedOn: string;
  readonly games: number;
  readonly players: number;
}

export const cardHeading = (copy: Copy, heading: Heading): readonly string[] => [
  text(copy.sheetEyebrow, {
    x: PAD,
    y: EYEBROW_BASELINE,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.eyebrow,
    "letter-spacing": EYEBROW_TRACKING,
  }),
  text(heading.title, {
    x: PAD,
    y: TITLE_BASELINE,
    fill: palette.ink,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": fontSize.title,
  }),
  text(sessionDate(copy, heading.startedOn), {
    x: GRID_RIGHT,
    y: EYEBROW_BASELINE,
    fill: palette.ink,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.date,
    "text-anchor": "end",
  }),
  text(copy.sheetSubtitle(gameTally(copy, heading.games), playerTally(copy, heading.players)), {
    x: GRID_RIGHT,
    y: SUBTITLE_BASELINE,
    fill: palette.inkMuted,
    "font-family": FONT_FAMILY,
    "font-size": fontSize.subtitle,
    "text-anchor": "end",
  }),
];
