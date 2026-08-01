import { beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "#scoresheet/copy.en.ts";
import type { Sheet } from "#scoresheet/render/sheet-layout.ts";


const PAD = 60;

const rectSpy = vi.fn();

const textSpy = vi.fn();

vi.mock("#scoresheet/render/sheet-layout.ts", () => ({
  FONT_FAMILY: "Test Sans",
  PAD,
  fontSize: { keyLabel: 24 },
}));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: {
    cellPlaced: "placed",
    cellDrawn: "drawn",
    cellFool: "fool",
    cellAbsent: "absent",
    ruling: "ruling",
    inkMuted: "muted",
  },
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { cellKey } = await import("#scoresheet/render/cell-key.ts");

const NONE = 0;

const GRID_BOTTOM = 810;

const SLOT_WIDTH = 330;

const KEY_DROP = 44;

const SWATCH_LIFT = 20;

const SWATCH_SIZE = 26;

const LABEL_GAP = 16;

const BASELINE = GRID_BOTTOM + KEY_DROP;

const sheetOf = (): Sheet =>
  ({
    startedOn: "2026-07-24",
    players: [],
    rounds: NONE,
    omitted: NONE,
    rowHeight: NONE,
    columnWidth: NONE,
    gridHeight: NONE,
    gridBottom: GRID_BOTTOM,
    chartTop: NONE,
    height: NONE,
  }) satisfies Sheet;

const rectFor = (call: number): Record<string, unknown> =>
  (rectSpy.mock.calls[call]?.[0] ?? {}) as Record<string, unknown>;

const printed = (): readonly string[] => textSpy.mock.calls.map((call) => String(call[0]));

const attributesOfText = (value: string): Record<string, unknown> =>
  (textSpy.mock.calls.find((call) => call[0] === value)?.[1] ?? {}) as Record<string, unknown>;

describe("cellKey()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rectSpy.mockImplementation(() => "<rect/>");
    textSpy.mockImplementation(() => "<text/>");
  });

  it("should draw four entries", () => {
    cellKey(sheetOf());

    const ENTRIES = 4;

    expect(rectSpy).toHaveBeenCalledTimes(ENTRIES);
    expect(textSpy).toHaveBeenCalledTimes(ENTRIES);
  });

  it("should explain each cell colour in order", () => {
    cellKey(sheetOf());

    expect(printed()).toEqual([
      copy.sheetKeyPlaced,
      copy.sheetKeyDrawn,
      copy.sheetKeyFool,
      copy.sheetKeyAbsent,
    ]);
  });

  it("should give each swatch the colour of the cell it explains", () => {
    cellKey(sheetOf());

    expect(rectFor(NONE).fill).toBe("placed");
    expect(rectFor(1).fill).toBe("drawn");
    expect(rectFor(2).fill).toBe("fool");
    expect(rectFor(3).fill).toBe("absent");
  });

  it("should advance each slot to the right of the one before it", () => {
    cellKey(sheetOf());
    const first = Number(rectFor(0).x);
    const second = Number(rectFor(1).x);
    const third = Number(rectFor(2).x);

    expect(second).toBeGreaterThan(first);
    expect(third).toBeGreaterThan(second);
  });

  it("should space slots a whole slot width apart, not by some other step", () => {
    cellKey(sheetOf());
    const SECOND_SLOT = 1;

    expect(rectFor(SECOND_SLOT).x).toBe(PAD + SECOND_SLOT * SLOT_WIDTH);
  });

  it("should start the first slot at the page margin", () => {
    cellKey(sheetOf());

    expect(rectFor(NONE).x).toBe(PAD);
  });

  it("should derive the baseline from the grid's own bottom edge, not a recomputed one", () => {
    cellKey(sheetOf());

    expect(Number(attributesOfText(copy.sheetKeyPlaced).y)).toBe(BASELINE);
  });

  it("should sit the swatch exactly SWATCH_LIFT above the baseline", () => {
    cellKey(sheetOf());

    expect(rectFor(NONE).y).toBe(BASELINE - SWATCH_LIFT);
  });

  it("should start the label SWATCH_SIZE plus LABEL_GAP to the right of its swatch", () => {
    cellKey(sheetOf());

    expect(attributesOfText(copy.sheetKeyPlaced).x).toBe(PAD + SWATCH_SIZE + LABEL_GAP);
  });

  it("should stroke every swatch so a black fill still shows against the sheet", () => {
    cellKey(sheetOf());

    expect(rectFor(NONE).stroke).toBe("ruling");
    expect(rectFor(3).stroke).toBe("ruling");
    expect(Number(rectFor(NONE)["stroke-width"])).toBeGreaterThan(NONE);
  });

  it("should put the label to the right of its swatch", () => {
    cellKey(sheetOf());

    expect(Number(attributesOfText(copy.sheetKeyPlaced).x)).toBeGreaterThan(
      Number(rectFor(NONE).x)
    );
  });
});
