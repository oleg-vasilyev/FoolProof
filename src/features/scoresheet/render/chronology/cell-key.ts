import { CellKind } from "#scoresheet/domain/game-outcomes.ts";
import { type Cell } from "#scoresheet/domain/scoring.ts";
import { GRID_LEFT, type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
import { FONT_FAMILY, fontSize } from "#scoresheet/render/card-metrics.ts";
import { type CellBox, baselineIn, cellFace } from "#scoresheet/render/chronology/cell-face.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { text } from "#scoresheet/render/svg-tags.ts";


const KEY_DROP = 38;

const SLOT_WIDTH = 380;

const MINI_WIDTH = 64;

const MINI_HEIGHT = 38;

const LABEL_GAP = 18;

export const KEY_LABEL_ROOM = SLOT_WIDTH - MINI_WIDTH - LABEL_GAP;

const PLACE_ABOVE_FOOL = 1;

type KeyKind = typeof CellKind.Drawn | typeof CellKind.Fool | typeof CellKind.Absent;

const KEY_KINDS: readonly KeyKind[] = [CellKind.Drawn, CellKind.Fool, CellKind.Absent];

const drawnIn = (sheet: Sheet, kind: KeyKind): boolean =>
  sheet.players.some((player) => player.cells.some((cell) => cell.kind === kind));

const kindsOn = (sheet: Sheet): readonly KeyKind[] =>
  KEY_KINDS.filter((kind) => drawnIn(sheet, kind));

const labelFor = (copy: Copy, kind: KeyKind): string => {
  switch (kind) {
    case CellKind.Drawn:
      return copy.sheetKeyDrawn;

    case CellKind.Fool:
      return copy.sheetKeyFool;

    case CellKind.Absent:
      return copy.sheetKeyAbsent;
  }
};

const sampleFor = (kind: KeyKind, players: number): Cell => {
  switch (kind) {
    case CellKind.Drawn:
      return { kind: CellKind.Drawn, position: players - PLACE_ABOVE_FOOL };

    case CellKind.Fool:
      return { kind: CellKind.Fool, position: players };

    case CellKind.Absent:
      return { kind: CellKind.Absent };
  }
};

const boxIn = (sheet: Sheet, slot: number): CellBox => ({
  x: GRID_LEFT + slot * SLOT_WIDTH,
  y: sheet.gridBottom + KEY_DROP,
  width: MINI_WIDTH,
  height: MINI_HEIGHT,
  fontSize: fontSize.keyCell,
});

const entryOf = (copy: Copy, sheet: Sheet, kind: KeyKind, slot: number): readonly string[] => {
  const box = boxIn(sheet, slot);

  return [
    ...cellFace(box, sampleFor(kind, sheet.biggestTable)),
    text(labelFor(copy, kind), {
      x: box.x + MINI_WIDTH + LABEL_GAP,
      y: baselineIn(box),
      fill: palette.inkKey,
      "font-family": FONT_FAMILY,
      "font-size": fontSize.keyLabel,
    }),
  ];
};

export const cellKey = (copy: Copy, sheet: Sheet): readonly string[] =>
  kindsOn(sheet).flatMap((kind, slot) => entryOf(copy, sheet, kind, slot));
