import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Cell } from "#scoresheet/domain/scoring.ts";
import type { Sheet } from "#scoresheet/render/sheet-layout.ts";


const ROW_HEIGHT = 50;

const COLUMN_WIDTH = 200;

const GRID_TOP = 400;

const GRID_LEFT = 100;

const CELL_FONT = 26;

const INDEX_FONT = 20;

const rectSpy = vi.fn();

const textSpy = vi.fn();

const colourForSpy = vi.fn();

vi.mock("#scoresheet/render/sheet-layout.ts", () => ({
  CELL_INSET: 2,
  CELL_SHRINK: 4,
  FONT_FAMILY: "Test Sans",
  GRID_LEFT,
  GRID_TOP,
  cellFontOf: () => CELL_FONT,
  columnCentre: (_sheet: unknown, column: number) =>
    GRID_LEFT + column * COLUMN_WIDTH + COLUMN_WIDTH / 2,
  fontSize: { columnName: 32 },
  indexFontOf: () => INDEX_FONT,
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: {
    cellAbsent: "absent",
    cellPlaced: "placed",
    cellDrawn: "drawn",
    cellFool: "fool",
    ink: "ink",
    inkFaint: "faint",
  },
  colourFor: (column: number) => colourForSpy(column),
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { chronologyGrid, columnNames } = await import("#scoresheet/render/chronology-grid.ts");

const NONE = 0;

const ONE = 1;

const PLACED: Cell = { kind: "placed", position: 2 };

const sheetOf = (cells: readonly (readonly Cell[])[], names?: readonly string[]): Sheet =>
  ({
    startedOn: "2026-07-24",
    players: cells.map((own, index) => ({
      playerId: index,
      displayName: names?.[index] ?? `P${index}`,
      cells: own,
      running: [],
      total: NONE,
    })),
    rounds: cells[0]?.length ?? NONE,
    omitted: NONE,
    rowHeight: ROW_HEIGHT,
    columnWidth: COLUMN_WIDTH,
    gridHeight: (cells[0]?.length ?? NONE) * ROW_HEIGHT,
    chartTop: NONE,
    height: NONE,
  }) as Sheet;

const rectFor = (call: number): Record<string, unknown> =>
  (rectSpy.mock.calls[call]?.[0] ?? {}) as Record<string, unknown>;

const printed = (): readonly string[] => textSpy.mock.calls.map((call) => String(call[0]));

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("chronology", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rectSpy.mockImplementation(() => "<rect/>");
    textSpy.mockImplementation(() => "<text/>");
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

    it("should shrink a name that would not fit its column", () => {
      const long = "Alexandrina-Konstantinovna";
      columnNames(sheetOf([[]], [long]));

      expect(Number(attributesOfText(long)["font-size"])).toBeLessThan(
        Number(attributesOfText("P0")["font-size"] ?? Number.MAX_SAFE_INTEGER)
      );
    });

    it("should not blow a short name up past the design size", () => {
      const DESIGN_SIZE = 32;
      columnNames(sheetOf([[]], ["Al"]));

      expect(Number(attributesOfText("Al")["font-size"])).toBe(DESIGN_SIZE);
    });

    it("should size a long name so it spans the column rather than overflowing it", () => {
      const fifteen = "Konstantinovna";
      const ADVANCE = 0.58;
      columnNames(sheetOf([[]], [fifteen]));

      expect(Number(attributesOfText(fifteen)["font-size"])).toBeCloseTo(
        COLUMN_WIDTH / (fifteen.length * ADVANCE)
      );
    });

    it("should centre the heading over its column", () => {
      columnNames(sheetOf([[]]));

      expect(attributesOfText("P0")["text-anchor"]).toBe("middle");
    });

    it("should set the headings in bold, so they read as headings", () => {
      columnNames(sheetOf([[]]));

      expect(attributesOfText("P0")["font-weight"]).toBe("bold");
    });

    it("should keep a very long name legible rather than shrinking to nothing", () => {
      const MINIMUM = 14;
      const absurd = "x".repeat(200);
      columnNames(sheetOf([[]], [absurd]));

      expect(Number(attributesOfText(absurd)["font-size"])).toBe(MINIMUM);
    });
  });

  describe("chronologyGrid()", () => {
    it("should draw a block for every player in every round", () => {
      chronologyGrid(sheetOf([[PLACED, PLACED], [PLACED, PLACED]]));
      const PLAYERS = 2;
      const ROUNDS = 2;

      expect(rectSpy).toHaveBeenCalledTimes(PLAYERS * ROUNDS);
    });

    it("should number every round", () => {
      chronologyGrid(sheetOf([[PLACED, PLACED, PLACED]]));

      expect(printed()).toContain("01");
      expect(printed()).toContain("03");
    });

    it("should pad the round number so the column stays flush", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(printed()).toContain("01");
    });

    it("should put the round number left of the grid", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(Number(attributesOfText("01").x)).toBeLessThan(GRID_LEFT);
    });

    it("should print the position inside the block", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(printed()).toContain("2");
    });

    it("should print nothing in a block for a game that was sat out", () => {
      chronologyGrid(sheetOf([[{ kind: "absent" }]]));

      expect(printed()).toEqual(["01"]);
    });

    it("should fill a placed block with the placed colour", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(rectFor(NONE).fill).toBe("placed");
    });

    it("should fill an absent block with the absent colour", () => {
      chronologyGrid(sheetOf([[{ kind: "absent" }]]));

      expect(rectFor(NONE).fill).toBe("absent");
    });

    it("should fill a fool's block with the fool colour", () => {
      chronologyGrid(sheetOf([[{ kind: "fool", position: 3 }]]));

      expect(rectFor(NONE).fill).toBe("fool");
    });

    it("should fill a drawn block with the drawn colour", () => {
      chronologyGrid(sheetOf([[{ kind: "drawn", position: 2 }]]));

      expect(rectFor(NONE).fill).toBe("drawn");
    });

    it("should inset the block so neighbouring cells do not touch", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(rectFor(NONE).width).toBeLessThan(COLUMN_WIDTH);
      expect(rectFor(NONE).height).toBeLessThan(ROW_HEIGHT);
    });

    it("should step down one row height per round", () => {
      chronologyGrid(sheetOf([[PLACED, PLACED]]));
      const FIRST = 0;
      const SECOND = 1;

      expect(Number(rectFor(SECOND).y) - Number(rectFor(FIRST).y)).toBe(ROW_HEIGHT);
    });

    it("should start the grid at its top edge", () => {
      chronologyGrid(sheetOf([[PLACED]]));
      const INSET = 2;

      expect(rectFor(NONE).y).toBe(GRID_TOP + INSET);
    });

    it("should sit the digit's baseline inside its own row", () => {
      chronologyGrid(sheetOf([[PLACED]]));
      const baseline = Number(attributesOfText("2").y);

      expect(baseline).toBeGreaterThan(GRID_TOP);
      expect(baseline).toBeLessThan(GRID_TOP + ROW_HEIGHT);
    });

    it("should move the digit down exactly one row per round", () => {
      chronologyGrid(sheetOf([[PLACED, { kind: "placed", position: 3 }]]));

      expect(Number(attributesOfText("3").y) - Number(attributesOfText("2").y)).toBe(ROW_HEIGHT);
    });

    it("should centre the digit in its cell", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(attributesOfText("2")["text-anchor"]).toBe("middle");
      expect(attributesOfText("2").x).toBe(GRID_LEFT + COLUMN_WIDTH / 2);
    });

    it("should sit the round number's baseline inside its row", () => {
      chronologyGrid(sheetOf([[PLACED]]));
      const baseline = Number(attributesOfText("01").y);

      expect(baseline).toBeGreaterThan(GRID_TOP);
      expect(baseline).toBeLessThan(GRID_TOP + ROW_HEIGHT);
    });

    it("should right-align the round number against the grid's edge", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(attributesOfText("01")["text-anchor"]).toBe("end");
    });

    it("should size the digit from the row it sits in", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(attributesOfText("2")["font-size"]).toBe(CELL_FONT);
    });

    it("should size the round number from the row it sits in", () => {
      chronologyGrid(sheetOf([[PLACED]]));

      expect(attributesOfText("01")["font-size"]).toBe(INDEX_FONT);
    });

    it("should treat a missing cell as an absence rather than crashing", () => {
      const shortOfCells = sheetOf([[PLACED]]);
      const stretched = { ...shortOfCells, rounds: 2 } as Sheet;

      chronologyGrid(stretched);

      expect(rectFor(ONE).fill).toBe("absent");
    });
  });
});
