import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { copy } from "#scoresheet/copy.en.ts";
import type { Cell, ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";


const GRID_LEFT = 146;

const KEY_CELL_FONT = 24;

const KEY_LABEL_FONT = 26;

const cellFaceSpy = vi.fn();

const baselineSpy = vi.fn();

const textSpy = vi.fn();

vi.mock("#scoresheet/render/chronology/chronology-layout.ts", () => ({ GRID_LEFT }));

vi.mock("#scoresheet/render/card-metrics.ts", () => ({
  FONT_FAMILY: "Test Sans",
  fontSize: { keyCell: KEY_CELL_FONT, keyLabel: KEY_LABEL_FONT },
}));

vi.mock("#scoresheet/render/chronology/cell-face.ts", () => ({
  cellFace: (box: unknown, cell: unknown) => cellFaceSpy(box, cell),
  baselineIn: (box: unknown) => baselineSpy(box),
}));

vi.mock("#scoresheet/render/palette.ts", () => ({ palette: { inkKey: "key ink" } }));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { cellKey } = await import("#scoresheet/render/chronology/cell-key.ts");

const NONE = 0;

const GRID_BOTTOM = 810;

const BASELINE = 999;

const AT_THE_TABLE = 5;

const ENTRIES = 3;

const PLACE_ABOVE_FOOL = 1;

const FIRST_SLOT = 0;

const SECOND_SLOT = 1;

const sheetOf = (): Sheet =>
  ({
    startedOn: "2026-07-24",
    players: Array.from({ length: AT_THE_TABLE }, () => ({}) as ScoredPlayer),
    rounds: NONE,
    omitted: NONE,
    rowHeight: NONE,
    columnWidth: NONE,
    gridHeight: NONE,
    gridBottom: GRID_BOTTOM,
    chartTop: NONE,
    height: NONE,
  }) satisfies Sheet;

const boxFor = (slot: number): Record<string, number> =>
  (cellFaceSpy.mock.calls[slot]?.[0] ?? {}) as Record<string, number>;

const cellFor = (slot: number): Cell => cellFaceSpy.mock.calls[slot]?.[1] as Cell;

const printed = (): readonly string[] => textSpy.mock.calls.map((call) => String(call[0]));

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("cellKey()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    cellFaceSpy.mockImplementation(() => ["<rect/>"]);
    baselineSpy.mockReturnValue(BASELINE);
    textSpy.mockImplementation(() => "<text/>");
  });

  it("should explain the three cells that are not the default one", () => {
    cellKey(copy, sheetOf());

    expect(printed()).toEqual([copy.sheetKeyDrawn, copy.sheetKeyFool, copy.sheetKeyAbsent]);
  });

  it("should show a real cell for each entry rather than a colour swatch", () => {
    cellKey(copy, sheetOf());

    expect(cellFaceSpy).toHaveBeenCalledTimes(ENTRIES);
    expect([cellFor(0).kind, cellFor(1).kind, cellFor(2).kind]).toEqual([
      CellKind.Drawn,
      CellKind.Fool,
      CellKind.Absent,
    ]);
  });

  it("should number the fool sample last at the table it is drawn for", () => {
    cellKey(copy, sheetOf());

    expect(cellFor(1)).toEqual({ kind: CellKind.Fool, position: AT_THE_TABLE });
  });

  it("should number the drawn sample one place above the fool", () => {
    cellKey(copy, sheetOf());

    expect(cellFor(0)).toEqual({
      kind: CellKind.Drawn,
      position: AT_THE_TABLE - PLACE_ABOVE_FOOL,
    });
  });

  it("should leave the absent sample without a place, because nobody took one", () => {
    cellKey(copy, sheetOf());

    expect(cellFor(2)).toEqual({ kind: CellKind.Absent });
  });

  it("should start the first slot at the grid's own left edge", () => {
    cellKey(copy, sheetOf());

    expect(boxFor(FIRST_SLOT).x).toBe(GRID_LEFT);
  });

  it("should space slots a whole slot width apart, not by some other step", () => {
    cellKey(copy, sheetOf());

    const step = Number(boxFor(SECOND_SLOT).x) - Number(boxFor(FIRST_SLOT).x);

    expect(boxFor(2).x).toBe(GRID_LEFT + step + step);
  });

  it("should hang the key below the grid's own bottom edge", () => {
    cellKey(copy, sheetOf());

    expect(boxFor(FIRST_SLOT).y).toBeGreaterThan(GRID_BOTTOM);
  });

  it("should set every miniature in the key's own cell size", () => {
    cellKey(copy, sheetOf());

    expect(boxFor(FIRST_SLOT).fontSize).toBe(KEY_CELL_FONT);
  });

  it("should put each label to the right of its own miniature", () => {
    cellKey(copy, sheetOf());

    const label = Number(attributesOfText(copy.sheetKeyFool).x);

    expect(label).toBeGreaterThan(Number(boxFor(SECOND_SLOT).x) + Number(boxFor(SECOND_SLOT).width));
    expect(label).toBeLessThan(Number(boxFor(2).x));
  });

  it("should sit the label on the miniature's own baseline rather than recompute one", () => {
    cellKey(copy, sheetOf());

    expect(baselineSpy).toHaveBeenCalledWith(boxFor(FIRST_SLOT));
    expect(attributesOfText(copy.sheetKeyDrawn).y).toBe(BASELINE);
  });

  it("should draw the labels in the key's own ink and size", () => {
    cellKey(copy, sheetOf());

    expect(attributesOfText(copy.sheetKeyAbsent).fill).toBe("key ink");
    expect(attributesOfText(copy.sheetKeyAbsent)["font-size"]).toBe(KEY_LABEL_FONT);
  });
});
