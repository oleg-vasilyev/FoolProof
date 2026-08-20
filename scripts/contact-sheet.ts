import { palette } from "#scoresheet/render/palette.ts";
import { rect, svgOf, text } from "#scoresheet/render/svg-tags.ts";
import type { Drawing } from "./gallery.ts";


const COLUMNS = 7;

const THUMB_WIDTH = 300;

const GAP = 24;

const MARGIN = 40;

const LABEL_SIZE = 17;

const LABEL_DROP = 20;

const LABEL_BAND = 30;

const TITLE_SIZE = 32;

const TITLE_BAND = 74;

const SHEET_MAX_HEIGHT = 4000;

const ROW_START = 0;

const NEWEST_ROW = -1;

const WITHOUT_THE_NEWEST = -1;

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
  drawings.reduce<readonly (readonly Drawing[])[]>((rows, drawing, index) => {
    const open = rows.at(NEWEST_ROW);

    return index % COLUMNS === ROW_START || open === undefined
      ? [...rows, [drawing]]
      : [...rows.slice(ROW_START, WITHOUT_THE_NEWEST), [...open, drawing]];
  }, []);

const cellsIn = (row: readonly Drawing[], top: number): readonly string[] =>
  row.flatMap((drawing, column) => {
    const x = MARGIN + column * (THUMB_WIDTH + GAP);

    return [
      text(drawing.file, {
        x,
        y: top + LABEL_DROP,
        fill: palette.inkHint,
        "font-family": "Noto Sans",
        "font-size": LABEL_SIZE,
      }),
      placed(drawing, x, top + LABEL_BAND),
    ];
  });

const topsOf = (rows: readonly (readonly Drawing[])[]): readonly number[] =>
  rows.reduce<readonly number[]>(
    (tops, row) => [
      ...tops,
      (tops.at(NEWEST_ROW) ?? TITLE_BAND) +
        (tops.length === ROW_START
          ? ROW_START
          : LABEL_BAND + Math.max(...(rows[tops.length - 1] ?? []).map(thumbHeightOf)) + GAP),
    ],
    []
  );

const sheetWidth = MARGIN * 2 + COLUMNS * THUMB_WIDTH + (COLUMNS - 1) * GAP;

export const contactSheet = (title: string, drawings: readonly Drawing[]): string => {
  const rows = rowsOf(drawings);
  const tops = topsOf(rows);
  const lastRow = rows.at(NEWEST_ROW) ?? [];
  const height =
    (tops.at(NEWEST_ROW) ?? TITLE_BAND) +
    LABEL_BAND +
    Math.max(...lastRow.map(thumbHeightOf), ROW_START) +
    MARGIN;

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
      y: TITLE_SIZE + MARGIN / 2,
      fill: palette.ink,
      "font-family": "Noto Sans",
      "font-size": TITLE_SIZE,
      "font-weight": "bold",
    }),
    ...rows.flatMap((row, index) => cellsIn(row, tops[index] ?? TITLE_BAND)),
  ]);
};
