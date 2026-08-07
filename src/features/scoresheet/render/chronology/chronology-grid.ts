import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { type Cell } from "#scoresheet/domain/scoring.ts";
import { CELL_INSET, CELL_SHRINK, GRID_LEFT, GRID_TOP, cellFontOf, columnCentre, indexFontOf, nameToFit, type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
import { FONT_FAMILY, fontSize } from "#scoresheet/render/card-metrics.ts";
import { type CellBox, baselineIn, cellFace } from "#scoresheet/render/chronology/cell-face.ts";
import { colourFor, palette } from "#scoresheet/render/palette.ts";
import { text } from "#scoresheet/render/svg-tags.ts";


const FIRST_COLUMN = 0;

const NAME_LIFT = 30;

const NAME_GUTTER = 20;

const INDEX_GAP = 16;

const INDEX_DIGITS = 2;

export const columnNames = (sheet: Sheet): readonly string[] =>
  sheet.players.map((player, column) => {
    const fitted = nameToFit(player.displayName, sheet.columnWidth - NAME_GUTTER, fontSize.columnName);

    return text(fitted.text, {
      x: columnCentre(sheet, column),
      y: GRID_TOP - NAME_LIFT,
      fill: colourFor(column),
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": fitted.size,
      "text-anchor": "middle",
    });
  });

const boxIn = (sheet: Sheet, column: number, round: number): CellBox => ({
  x: GRID_LEFT + column * sheet.columnWidth + CELL_INSET,
  y: GRID_TOP + round * sheet.rowHeight + CELL_INSET,
  width: sheet.columnWidth - CELL_SHRINK,
  height: sheet.rowHeight - CELL_SHRINK,
  fontSize: cellFontOf(sheet.rowHeight),
});

const rowIndex = (sheet: Sheet, round: number): string =>
  text(String(round + 1).padStart(INDEX_DIGITS, "0"), {
    x: GRID_LEFT - INDEX_GAP,
    y: baselineIn(boxIn(sheet, FIRST_COLUMN, round)),
    fill: palette.inkFigure,
    "font-family": FONT_FAMILY,
    "font-size": indexFontOf(sheet.rowHeight),
    "text-anchor": "end",
  });

const cellOf = (sheet: Sheet, cell: Cell, column: number, round: number): readonly string[] =>
  cellFace(boxIn(sheet, column, round), cell);

export const chronologyGrid = (sheet: Sheet): readonly string[] =>
  Array.from({ length: sheet.rounds }, (_unused, round) => [
    rowIndex(sheet, round),
    ...sheet.players.flatMap((player, column) =>
      cellOf(sheet, player.cells[round] ?? { kind: CellKind.Absent }, column, round)
    ),
  ]).flat();
