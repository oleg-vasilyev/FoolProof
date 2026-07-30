import type { Cell } from "#scoresheet/domain/scoring.ts";
import {
  CELL_INSET,
  CELL_SHRINK,
  FONT_FAMILY,
  GRID_LEFT,
  GRID_TOP,
  cellFontOf,
  columnCentre,
  fontSize,
  indexFontOf,
  type Sheet,
} from "#scoresheet/render/sheet-layout.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import { rect, text } from "#scoresheet/render/svg-tags.ts";


const NAME_LIFT = 30;

const NAME_ADVANCE = 0.58;

const NAME_MIN_SIZE = 14;

const BASELINE_RATIO = 0.68;

const INDEX_GAP = 16;

const INDEX_DIGITS = 2;

const fillFor = (cell: Cell): string => {
  switch (cell.kind) {
    case "absent":
      return palette.cellAbsent;

    case "placed":
      return palette.cellPlaced;

    case "drawn":
      return palette.cellDrawn;

    case "fool":
      return palette.cellFool;
  }
};

const captionFor = (cell: Cell): string => (cell.kind === "absent" ? "" : String(cell.position));

const nameSizeFor = (sheet: Sheet, name: string): number =>
  Math.max(
    NAME_MIN_SIZE,
    Math.min(fontSize.columnName, sheet.columnWidth / (name.length * NAME_ADVANCE))
  );

export const columnNames = (sheet: Sheet): readonly string[] =>
  sheet.players.map((player, column) =>
    text(player.displayName, {
      x: columnCentre(sheet, column),
      y: GRID_TOP - NAME_LIFT,
      fill: colourFor(column),
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": nameSizeFor(sheet, player.displayName),
      "text-anchor": "middle",
    })
  );

const rowIndex = (sheet: Sheet, round: number): string =>
  text(String(round + 1).padStart(INDEX_DIGITS, "0"), {
    x: GRID_LEFT - INDEX_GAP,
    y: GRID_TOP + round * sheet.rowHeight + sheet.rowHeight * BASELINE_RATIO,
    fill: palette.inkFaint,
    "font-family": FONT_FAMILY,
    "font-size": indexFontOf(sheet.rowHeight),
    "text-anchor": "end",
  });

const cellOf = (sheet: Sheet, cell: Cell, column: number, round: number): readonly string[] => {
  const left = GRID_LEFT + column * sheet.columnWidth;
  const top = GRID_TOP + round * sheet.rowHeight;
  const caption = captionFor(cell);

  const block = rect({
    x: left + CELL_INSET,
    y: top + CELL_INSET,
    width: sheet.columnWidth - CELL_SHRINK,
    height: sheet.rowHeight - CELL_SHRINK,
    fill: fillFor(cell),
  });

  if (caption === "") {
    return [block];
  }

  return [
    block,
    text(caption, {
      x: columnCentre(sheet, column),
      y: top + sheet.rowHeight * BASELINE_RATIO,
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-size": cellFontOf(sheet.rowHeight),
      "text-anchor": "middle",
    }),
  ];
};

export const chronologyGrid = (sheet: Sheet): readonly string[] =>
  Array.from({ length: sheet.rounds }, (_unused, round) => [
    rowIndex(sheet, round),
    ...sheet.players.flatMap((player, column) =>
      cellOf(sheet, player.cells[round] ?? { kind: "absent" }, column, round)
    ),
  ]).flat();
