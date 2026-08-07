import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import type { Cell } from "#scoresheet/domain/scoring.ts";


const rectSpy = vi.fn();

const textSpy = vi.fn();

vi.mock("#scoresheet/render/card-metrics.ts", () => ({ FONT_FAMILY: "Test Sans" }));

vi.mock("#scoresheet/render/palette.ts", () => ({
  palette: {
    sheet: "sheet",
    cellAbsentEdge: "absent edge",
    cellPlaced: "placed",
    cellDrawn: "drawn",
    cellDrawnEdge: "drawn edge",
    cellFool: "fool",
    cellFoolInk: "fool ink",
    ink: "ink",
    inkFaint: "faint",
  },
}));

vi.mock("#scoresheet/render/svg-tags.ts", () => ({
  rect: (attributes: Record<string, unknown>) => rectSpy(attributes),
  text: (value: string, attributes: Record<string, unknown>) => textSpy(value, attributes),
}));

const { baselineIn, cellFace } = await import("#scoresheet/render/chronology/cell-face.ts");

const BOX = { x: 100, y: 200, width: 60, height: 40, fontSize: 24 } as const;

const HALF = 2;

const ABSENT_MARK = "—";

const EDGE_INSET = 1;

const BLOCK = 0;

const EDGE = 1;

const ONLY_THE_BLOCK = 1;

const BLOCK_AND_EDGE = 2;

const THIRD_PLACE = 3;

const LAST_PLACE = 5;

const CENTRE = BOX.x + BOX.width / HALF;

const blockOf = (): Record<string, unknown> =>
  (rectSpy.mock.calls[BLOCK]?.[0] ?? {}) as Record<string, unknown>;

const edgeOf = (): Record<string, unknown> =>
  (rectSpy.mock.calls[EDGE]?.[0] ?? {}) as Record<string, unknown>;

const captionOf = (): Record<string, unknown> =>
  (textSpy.mock.calls[BLOCK]?.[1] ?? {}) as Record<string, unknown>;

const printed = (): string => String(textSpy.mock.calls[BLOCK]?.[0]);

const draw = (cell: Cell): readonly string[] => cellFace(BOX, cell);

describe("cellFace()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    rectSpy.mockImplementation(() => "<rect/>");
    textSpy.mockImplementation(() => "<text/>");
  });

  describe("a place taken", () => {
    it("should fill the block with the plain cell colour", () => {
      draw({ kind: CellKind.Placed, position: THIRD_PLACE });

      expect(blockOf().fill).toBe("placed");
    });

    it("should print the place and nothing else", () => {
      draw({ kind: CellKind.Placed, position: THIRD_PLACE });

      expect(printed()).toBe(String(THIRD_PLACE));
    });

    it("should leave the plain cell without an edge, so only the states carry one", () => {
      const BLOCK_AND_CAPTION = 2;

      expect(draw({ kind: CellKind.Placed, position: THIRD_PLACE })).toHaveLength(
        BLOCK_AND_CAPTION
      );
      expect(rectSpy).toHaveBeenCalledTimes(ONLY_THE_BLOCK);
    });

    it("should set the place in the reading ink at no particular weight", () => {
      draw({ kind: CellKind.Placed, position: THIRD_PLACE });

      expect(captionOf().fill).toBe("ink");
      expect(captionOf()["font-weight"]).toBeUndefined();
    });
  });

  describe("a draw for last", () => {
    it("should fill the block with the drawn colour", () => {
      draw({ kind: CellKind.Drawn, position: THIRD_PLACE });

      expect(blockOf().fill).toBe("drawn");
    });

    it("should add an edge so the state never rides on hue alone", () => {
      const BLOCK_EDGE_AND_CAPTION = 3;

      expect(draw({ kind: CellKind.Drawn, position: THIRD_PLACE })).toHaveLength(
        BLOCK_EDGE_AND_CAPTION
      );
      expect(rectSpy).toHaveBeenCalledTimes(BLOCK_AND_EDGE);
      expect(edgeOf().stroke).toBe("drawn edge");
    });

    it("should dash that edge, rather than outline it solid", () => {
      draw({ kind: CellKind.Drawn, position: THIRD_PLACE });

      expect(String(edgeOf()["stroke-dasharray"])).toMatch(/^\d+ \d+$/);
    });

    it("should inset the edge by one pixel on every side, so both it and the fill show", () => {
      draw({ kind: CellKind.Drawn, position: THIRD_PLACE });

      expect(edgeOf().x).toBe(BOX.x + EDGE_INSET);
      expect(edgeOf().y).toBe(BOX.y + EDGE_INSET);
      expect(edgeOf().width).toBe(BOX.width - EDGE_INSET * HALF);
      expect(edgeOf().height).toBe(BOX.height - EDGE_INSET * HALF);
    });

    it("should keep the digit at the weight of an ordinary place", () => {
      draw({ kind: CellKind.Drawn, position: THIRD_PLACE });

      expect(captionOf()["font-weight"]).toBeUndefined();
    });

    it("should leave the edge unfilled so the block below still shows", () => {
      draw({ kind: CellKind.Drawn, position: THIRD_PLACE });

      expect(edgeOf().fill).toBe("none");
    });
  });

  describe("the fool", () => {
    it("should fill the block with the one red in the grid", () => {
      draw({ kind: CellKind.Fool, position: LAST_PLACE });

      expect(blockOf().fill).toBe("fool");
    });

    it("should set the digit bold, in the ink kept for crimson", () => {
      draw({ kind: CellKind.Fool, position: LAST_PLACE });

      expect(captionOf().fill).toBe("fool ink");
      expect(captionOf()["font-weight"]).toBe("bold");
    });

    it("should need no edge, because red is already unmistakable", () => {
      draw({ kind: CellKind.Fool, position: LAST_PLACE });

      expect(rectSpy).toHaveBeenCalledTimes(ONLY_THE_BLOCK);
    });
  });

  describe("a player who was not there", () => {
    it("should fill the block with the sheet, so the cell reads as empty", () => {
      draw({ kind: CellKind.Absent });

      expect(blockOf().fill).toBe("sheet");
    });

    it("should outline the emptiness rather than leave a hole", () => {
      draw({ kind: CellKind.Absent });

      expect(edgeOf().stroke).toBe("absent edge");
    });

    it("should print a dash where a place would have been", () => {
      draw({ kind: CellKind.Absent });

      expect(printed()).toBe(ABSENT_MARK);
    });

    it("should keep the dash quieter than a place, and no heavier", () => {
      draw({ kind: CellKind.Absent });

      expect(captionOf().fill).toBe("faint");
      expect(captionOf()["font-weight"]).toBeUndefined();
    });
  });

  describe("every cell", () => {
    it("should centre the caption over the block", () => {
      draw({ kind: CellKind.Placed, position: THIRD_PLACE });

      expect(captionOf().x).toBe(CENTRE);
      expect(captionOf()["text-anchor"]).toBe("middle");
    });

    it("should sit the caption on the box's own baseline", () => {
      draw({ kind: CellKind.Placed, position: THIRD_PLACE });

      expect(captionOf().y).toBe(baselineIn(BOX));
    });

    it("should take the caption size from the box rather than a fixed scale", () => {
      draw({ kind: CellKind.Placed, position: THIRD_PLACE });

      expect(captionOf()["font-size"]).toBe(BOX.fontSize);
    });

    it("should cover the box the caller asked for", () => {
      draw({ kind: CellKind.Placed, position: THIRD_PLACE });

      expect(blockOf()).toMatchObject({
        x: BOX.x,
        y: BOX.y,
        width: BOX.width,
        height: BOX.height,
      });
    });
  });
});

describe("baselineIn()", () => {
  it("should sit the caption below the middle of the box, where a digit reads centred", () => {
    const middle = BOX.y + BOX.height / HALF;

    expect(baselineIn(BOX)).toBeGreaterThan(middle);
    expect(baselineIn(BOX)).toBeLessThan(BOX.y + BOX.height);
  });
});
