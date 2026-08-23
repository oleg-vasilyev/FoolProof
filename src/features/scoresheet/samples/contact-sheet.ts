import { FONT_FAMILY } from "#shared/fonts/font-family.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { rect, svgOf, text } from "#scoresheet/render/svg-tags.ts";
import type { Drawing } from "#shared/drawings/drawings-contract.ts";


const COLUMNS = 7;

const THUMB_WIDTH = 300;

const GAP = 24;

const HALF_A_MARGIN = 2;

const MARGIN = 40;

const LABEL_SIZE = 17;

const LABEL_DROP = 20;

const LABEL_BAND = 30;

const TITLE_SIZE = 32;

const TITLE_BAND = 74;

const SHEET_MAX_HEIGHT = 4000;

const ROW_START = 0;

const A_WIDTH = /<svg[^>]*\swidth="([\d.]+)"/;

const A_HEIGHT = /<svg[^>]*\sheight="([\d.]+)"/;

const A_ROOT_WIDTH = /\swidth="[\d.]+"/;

const A_ROOT_HEIGHT = /\sheight="[\d.]+"/;

const A_ROOT_TAG = /<svg\b/;

const sizeOf = (drawing: Drawing, pattern: RegExp, named: string): number => {
  const found = pattern.exec(drawing.svg)?.[1];

  if (found === undefined) {
    throw new Error(
      `${drawing.file}: its root <svg> states no ${named}, so it cannot be placed on the ` +
        `contact sheet — a poster is built by svgOf(), which always states both`
    );
  }

  return Number(found);
};

const thumbHeightOf = (drawing: Drawing): number =>
  (sizeOf(drawing, A_HEIGHT, "height") / sizeOf(drawing, A_WIDTH, "width")) * THUMB_WIDTH;

const placed = (drawing: Drawing, x: number, y: number): string =>
  drawing.svg
    .replace(A_ROOT_WIDTH, ` width="${THUMB_WIDTH}"`)
    .replace(A_ROOT_HEIGHT, ` height="${thumbHeightOf(drawing)}"`)
    .replace(A_ROOT_TAG, `<svg x="${x}" y="${y}"`);

const rowsOf = (drawings: readonly Drawing[]): readonly (readonly Drawing[])[] =>
  Array.from({ length: Math.ceil(drawings.length / COLUMNS) }, (_unused, row) =>
    drawings.slice(row * COLUMNS, row * COLUMNS + COLUMNS)
  );

const cellsIn = (row: readonly Drawing[], top: number): readonly string[] =>
  row.flatMap((drawing, column) => {
    const x = MARGIN + column * (THUMB_WIDTH + GAP);

    return [
      text(drawing.file, {
        x,
        y: top + LABEL_DROP,
        fill: palette.inkHint,
        "font-family": FONT_FAMILY,
        "font-size": LABEL_SIZE,
      }),
      placed(drawing, x, top + LABEL_BAND),
    ];
  });

const rowHeightOf = (row: readonly Drawing[]): number =>
  LABEL_BAND + Math.max(...row.map(thumbHeightOf));

const topOf = (rows: readonly (readonly Drawing[])[], index: number): number =>
  rows.slice(ROW_START, index).reduce((top, above) => top + rowHeightOf(above) + GAP, TITLE_BAND);

const sheetWidth = MARGIN * 2 + COLUMNS * THUMB_WIDTH + (COLUMNS - 1) * GAP;

export const contactSheet = (title: string, drawings: readonly Drawing[]): string => {
  const rows = rowsOf(drawings);
  const height =
    rows.reduce((below, row) => below + rowHeightOf(row) + GAP, TITLE_BAND) - GAP + MARGIN;

  if (height > SHEET_MAX_HEIGHT) {
    throw new Error(
      `the contact sheet would be ${String(Math.round(height))}px tall, past ` +
        `${String(SHEET_MAX_HEIGHT)} — a picture that long reads as nothing, so raise ` +
        `COLUMNS or shrink THUMB_WIDTH rather than shipping one nobody can take in`
    );
  }

  return svgOf(sheetWidth, height, [
    rect({ x: 0, y: 0, width: sheetWidth, height, fill: palette.plateShade }),
    text(title, {
      x: MARGIN,
      y: TITLE_SIZE + MARGIN / HALF_A_MARGIN,
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-size": TITLE_SIZE,
      "font-weight": "bold",
    }),
    ...rows.flatMap((row, index) => cellsIn(row, topOf(rows, index))),
  ]);
};
