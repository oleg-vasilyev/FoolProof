import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { type Cell } from "#scoresheet/domain/scoring.ts";
import { FONT_FAMILY } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { type Attributes, rect, text } from "#scoresheet/render/svg-tags.ts";


const ABSENT_MARK = "—";

const HALF = 2;

const EDGE_INSET = 1;

const EDGE_SHRINK = EDGE_INSET * HALF;

const EDGE_WIDTH = 2;

const EDGE_DASH = "7 6";

const NO_FILL = "none";

const BOLD = "bold";

const BASELINE_RATIO = 0.68;

interface Face {
  readonly fill: string;
  readonly edge: string | null;
  readonly ink: string;
  readonly bold: boolean;
}

export interface CellBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fontSize: number;
}

const faceOf = (kind: Cell["kind"]): Face => {
  switch (kind) {
    case CellKind.Absent:
      return {
        fill: palette.sheet,
        edge: palette.cellAbsentEdge,
        ink: palette.inkFaint,
        bold: false,
      };

    case CellKind.Placed:
      return { fill: palette.cellPlaced, edge: null, ink: palette.ink, bold: false };

    case CellKind.Drawn:
      return {
        fill: palette.cellDrawn,
        edge: palette.cellDrawnEdge,
        ink: palette.ink,
        bold: false,
      };

    case CellKind.Fool:
      return { fill: palette.cellFool, edge: null, ink: palette.cellFoolInk, bold: true };
  }
};

const captionOf = (cell: Cell): string =>
  cell.kind === CellKind.Absent ? ABSENT_MARK : String(cell.position);

const edgeIn = (box: CellBox, colour: string): string =>
  rect({
    x: box.x + EDGE_INSET,
    y: box.y + EDGE_INSET,
    width: box.width - EDGE_SHRINK,
    height: box.height - EDGE_SHRINK,
    fill: NO_FILL,
    stroke: colour,
    "stroke-width": EDGE_WIDTH,
    "stroke-dasharray": EDGE_DASH,
  });

const weightOf = (face: Face): Attributes => (face.bold ? { "font-weight": BOLD } : {});

export const baselineIn = (box: CellBox): number => box.y + box.height * BASELINE_RATIO;

export const cellFace = (box: CellBox, cell: Cell): readonly string[] => {
  const face = faceOf(cell.kind);

  return [
    rect({ x: box.x, y: box.y, width: box.width, height: box.height, fill: face.fill }),
    ...(face.edge === null ? [] : [edgeIn(box, face.edge)]),
    text(captionOf(cell), {
      x: box.x + box.width / HALF,
      y: baselineIn(box),
      fill: face.ink,
      "font-family": FONT_FAMILY,
      "font-size": box.fontSize,
      ...weightOf(face),
      "text-anchor": "middle",
    }),
  ];
};
