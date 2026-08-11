import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import type { Cell, ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";


const ROW_HEIGHT = 50;

const COLUMN_WIDTH = 200;

const GRID_TOP = 400;

const GRID_LEFT = 100;

const CELL_FONT = 26;

const INDEX_FONT = 20;

const EVERY_ROW = 1;

const indexStrideSpy = vi.fn(() => EVERY_ROW);

const BASELINE = 777;

const COLUMN_NAME_FONT = 34;

const textSpy = vi.fn();

const cellFaceSpy = vi.fn();

const baselineSpy = vi.fn();

const colourForSpy = vi.fn();

const nameToFitSpy = vi.fn();

const FITTED_TEXT = "the-fitted-name";

const NAME_GUTTER = 20;

vi.mock("#scoresheet/render/chronology/chronology-layout.ts", () => ({
  CELL_INSET: 2,
  CELL_SHRINK: 4,
  GRID_LEFT,
  GRID_TOP,
  cellFontOf: () => CELL_FONT,
  columnCentre: (_sheet: unknown, column: number) =>
    GRID_LEFT + column * COLUMN_WIDTH + COLUMN_WIDTH / 2,
  nameToFit: (name: string, width: number, largest: number) => nameToFitSpy(name, width, largest),
  indexFontOf: () => INDEX_FONT,
  indexStrideOf: () => indexStrideSpy(),
}));

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY: "Test Sans",
  fontSize: { columnName: COLUMN_NAME_FONT },
}));

vi.mock("#scoresheet/render/chronology/cell-face.ts", () => ({
  cellFace: (box: unknown, cell: unknown) => [cellFaceSpy(box, cell)],
  baselineIn: (box: unknown) => baselineSpy(box),
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: { ink: "ink", inkFigure: "figure" },
  colourFor: (column: number) => colourForSpy(column),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { chronologyGrid, columnNames } = await import("#scoresheet/render/chronology/chronology-grid.ts");

const NONE = 0;

const ONE = 1;

const CELL_INSET = 2;

const PLACED: Cell = { kind: CellKind.Placed, position: 2 };

const playerOf = (cells: readonly Cell[], index: number, name: string): ScoredPlayer => ({
  playerId: index,
  displayName: name,
  cells,
  running: [],
  share: NONE,
  games: NONE,
});

const sheetOf = (cells: readonly (readonly Cell[])[], names?: readonly string[]): Sheet =>
  ({
    startedOn: "2026-07-24",
    players: cells.map((own, index) => playerOf(own, index, names?.[index] ?? `P${index}`)),
    rounds: cells[0]?.length ?? NONE,
    omitted: NONE,
    rowHeight: ROW_HEIGHT,
    columnWidth: COLUMN_WIDTH,
    gridHeight: (cells[0]?.length ?? NONE) * ROW_HEIGHT,
    gridBottom: NONE,
    chartTop: NONE,
    height: NONE,
  }) satisfies Sheet;

const boxFor = (call: number): Record<string, number> =>
  (cellFaceSpy.mock.calls[call]?.[0] ?? {}) as Record<string, number>;

const cellFor = (call: number): Cell => cellFaceSpy.mock.calls[call]?.[1] as Cell;

const printed = (): readonly string[] => textSpy.mock.calls.map((call) => String(call[0]));

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("chronology", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    nameToFitSpy.mockImplementation((name: string) => name);

    textSpy.mockImplementation(() => "<text/>");
    cellFaceSpy.mockImplementation(() => "<cell/>");
    baselineSpy.mockReturnValue(BASELINE);
    colourForSpy.mockImplementation((column: number) => `colour-${String(column)}`);
  });

  describe("columnNames()", () => {
    it("should print one heading per player", () => {
      columnNames(sheetOf([[], []]));

      expect(printed()).toEqual(["P0", "P1"]);
    });

    it("should give each heading the colour of its column", () => {
      columnNames(sheetOf([[], []]));

      expect(colourForSpy.mock.calls.map((call) => call[0])).toEqual([NONE, ONE]);
    });

    it("should sit the headings above the grid", () => {
      columnNames(sheetOf([[]]));

      expect(Number(attributesOfText("P0").y)).toBeLessThan(GRID_TOP);
    });

    it("should centre each heading on its column", () => {
      columnNames(sheetOf([[], []]));

      expect(attributesOfText("P1").x).toBe(GRID_LEFT + COLUMN_WIDTH + COLUMN_WIDTH / 2);
    });

    it("should ask for each name to be fitted to its own column", () => {
      columnNames(sheetOf([[]], ["Konstantinovna"]));

      expect(nameToFitSpy).toHaveBeenCalledWith(
        "Konstantinovna",
        COLUMN_WIDTH - NAME_GUTTER,
        COLUMN_NAME_FONT
      );
    });

    it("should print whatever came back fitted, not the name it was given", () => {
      nameToFitSpy.mockReturnValue(FITTED_TEXT);
      columnNames(sheetOf([[]], ["Konstantinovna"]));

      expect(printed()).toEqual([FITTED_TEXT]);
    });

    it("should set every heading at the design size, however long the name was", () => {
      nameToFitSpy.mockReturnValue(FITTED_TEXT);
      columnNames(sheetOf([[]], ["Konstantinovna"]));

      expect(Number(attributesOfText(FITTED_TEXT)["font-size"])).toBe(COLUMN_NAME_FONT);
    });

    it("should centre the heading over its column", () => {
      columnNames(sheetOf([[]]));

      expect(attributesOfText("P0")["text-anchor"]).toBe("middle");
    });

    it("should set the headings in bold, so they read as headings", () => {
      columnNames(sheetOf([[]]));

      expect(attributesOfText("P0")["font-weight"]).toBe("bold");
    });

  });

  describe("chronologyGrid()", () => {
    it("should draw a cell for every player in every round", () => {
      chronologyGrid(sheetOf([[PLACED, PLACED], [PLACED, PLACED]]));
      const PLAYERS = 2;
      const ROUNDS = 2;

      expect(cellFaceSpy).toHaveBeenCalledTimes(PLAYERS * ROUNDS);
    });

    it("should hand each cell on untouched, deciding how it looks nowhere here", () => {
      const FOOL: Cell = { kind: CellKind.Fool, position: 3 };
      chronologyGrid(sheetOf([[FOOL]]));

      expect(cellFor(NONE)).toBe(FOOL);
    });

    it("should treat a missing cell as an absence rather than crashing", () => {
      const shortOfCells = sheetOf([[PLACED]]);
      const stretched = { ...shortOfCells, rounds: 2 } as Sheet;

      chronologyGrid(stretched);

      expect(cellFor(ONE)).toEqual({ kind: CellKind.Absent });
    });

    it("should number every round while the rows are roomy enough", () => {
      chronologyGrid(sheetOf([[PLACED, PLACED, PLACED]]));

      expect(printed()).toContain("01");
      expect(printed()).toContain("03");
    });

    describe("when the rows are too short to number one by one", () => {
      const EVERY_FIFTH = 5;

      const SIX_ROUNDS = 6;

      beforeEach(() => {
        indexStrideSpy.mockReturnValue(EVERY_FIFTH);
      });

      it("should number the rounds the stride lands on", () => {
        chronologyGrid(sheetOf([Array.from({ length: SIX_ROUNDS }, () => PLACED)]));

        expect(printed()).toContain("05");
      });

      it("should still number the first round, so the scale has a start", () => {
        chronologyGrid(sheetOf([Array.from({ length: SIX_ROUNDS }, () => PLACED)]));

        expect(printed()).toContain("01");
      });

      it("should leave the rounds between them unnumbered", () => {
        chronologyGrid(sheetOf([Array.from({ length: SIX_ROUNDS }, () => PLACED)]));

        expect(printed()).not.toContain("03");
      });

      it("should still draw every cell of the rounds it did not number", () => {
        chronologyGrid(sheetOf([Array.from({ length: SIX_ROUNDS }, () => PLACED)]));

        expect(cellFaceSpy).toHaveBeenCalledTimes(SIX_ROUNDS);
      });
    });

    it("should pad the round number so the column stays flush", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(printed()).toContain("01");
    });

    it("should put the round number left of the grid", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(Number(attributesOfText("01").x)).toBeLessThan(GRID_LEFT);
    });

    it("should inset the box so neighbouring cells do not touch", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(boxFor(NONE).width).toBeLessThan(COLUMN_WIDTH);
      expect(boxFor(NONE).height).toBeLessThan(ROW_HEIGHT);
    });

    it("should step down one row height per round", () => {
      chronologyGrid(sheetOf([[PLACED, PLACED]]));
      const FIRST = 0;
      const SECOND = 1;

      expect(Number(boxFor(SECOND).y) - Number(boxFor(FIRST).y)).toBe(ROW_HEIGHT);
    });

    it("should step across one column width per player", () => {
      chronologyGrid(sheetOf([[PLACED], [PLACED]]));

      expect(Number(boxFor(ONE).x) - Number(boxFor(NONE).x)).toBe(COLUMN_WIDTH);
    });

    it("should start the grid at its top edge", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(boxFor(NONE).y).toBe(GRID_TOP + CELL_INSET);
      expect(boxFor(NONE).x).toBe(GRID_LEFT + CELL_INSET);
    });

    it("should size the cell from the row it sits in", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(boxFor(NONE).fontSize).toBe(CELL_FONT);
    });

    it("should sit the round number on the baseline of the first cell in its row", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(baselineSpy).toHaveBeenCalledWith(boxFor(NONE));
      expect(attributesOfText("01").y).toBe(BASELINE);
    });

    it("should right-align the round number against the grid's edge", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(attributesOfText("01")["text-anchor"]).toBe("end");
    });

    it("should size the round number from the row it sits in", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(attributesOfText("01")["font-size"]).toBe(INDEX_FONT);
    });

    it("should keep the round number quieter than what the cells print", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(attributesOfText("01").fill).toBe("figure");
    });
  });
});
