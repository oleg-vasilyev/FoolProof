import { BASEBOARD_BAR, FONT_FAMILY, IMAGE_WIDTH } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { rect, text } from "#scoresheet/render/svg-tags.ts";


const AT = "@";

const LEFT_EDGE = 0;

const HANDLE_FONT = 26;

const HANDLE_LIFT = 14;

const ACROSS_THE_MIDDLE = 2;

export const handleOf = (username: string): string => `${AT}${username}`;

export const posterBaseboard = (handle: string, height: number): readonly string[] => [
  rect({
    x: LEFT_EDGE,
    y: height - BASEBOARD_BAR,
    width: IMAGE_WIDTH,
    height: BASEBOARD_BAR,
    fill: palette.plateShade,
  }),
  text(handle, {
    x: IMAGE_WIDTH / ACROSS_THE_MIDDLE,
    y: height - HANDLE_LIFT,
    fill: palette.inkKey,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": HANDLE_FONT,
    "text-anchor": "middle",
  }),
];
