import { ADVANCES } from "#shared/fonts/glyph-advances.ts";


const NOTHING = 0;

const ELLIPSIS = "…";

interface Kept {
  readonly text: string;
  readonly width: number;
  readonly full: boolean;
}

const NOTHING_KEPT: Kept = { text: "", width: NOTHING, full: false };

const advanceOf = (glyph: string, fallback: number): number => ADVANCES[glyph] ?? fallback;

export const widthOf = (name: string, size: number, advance: number): number =>
  [...name].reduce((width, glyph) => width + advanceOf(glyph, advance) * size, NOTHING);

const keptWithin = (name: string, room: number, size: number, advance: number): string =>
  [...name].reduce((soFar: Kept, glyph): Kept => {
    const width = soFar.width + advanceOf(glyph, advance) * size;

    return soFar.full || width > room
      ? { ...soFar, full: true }
      : { text: soFar.text + glyph, width, full: false };
  }, NOTHING_KEPT).text;

export const nameToFit = (
  name: string,
  width: number,
  size: number,
  advance: number
): string => {
  if (widthOf(name, size, advance) <= width) {
    return name;
  }

  const room = width - widthOf(ELLIPSIS, size, advance);

  return `${keptWithin(name, room, size, advance).trimEnd()}${ELLIPSIS}`;
};
