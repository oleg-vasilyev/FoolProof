import type { Cell } from "#scoresheet/domain/scoring.ts";
import { type Sheet } from "#scoresheet/render/chronology/chronology-layout.ts";
import { FONT_FAMILY, PAD, fontSize } from "#scoresheet/render/card-metrics.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { rect, text } from "#scoresheet/render/svg-tags.ts";


interface KeyEntry {
  readonly fill: string;
  readonly label: string;
}

const SWATCH_SIZE = 26;

const SWATCH_STROKE = 1;

const SLOT_WIDTH = 330;

const KEY_DROP = 44;

const SWATCH_LIFT = 20;

const LABEL_GAP = 16;

const ENTRIES: Record<Cell["kind"], KeyEntry> = {
  placed: { fill: palette.cellPlaced, label: copy.sheetKeyPlaced },
  drawn: { fill: palette.cellDrawn, label: copy.sheetKeyDrawn },
  fool: { fill: palette.cellFool, label: copy.sheetKeyFool },
  absent: { fill: palette.cellAbsent, label: copy.sheetKeyAbsent },
};

const KIND_ORDER: readonly Cell["kind"][] = ["placed", "drawn", "fool", "absent"];

const baselineOf = (sheet: Sheet): number => sheet.gridBottom + KEY_DROP;

const entryOf = (sheet: Sheet, entry: KeyEntry, slot: number): readonly string[] => {
  const left = PAD + slot * SLOT_WIDTH;

  return [
    rect({
      x: left,
      y: baselineOf(sheet) - SWATCH_LIFT,
      width: SWATCH_SIZE,
      height: SWATCH_SIZE,
      fill: entry.fill,
      stroke: palette.ruling,
      "stroke-width": SWATCH_STROKE,
    }),
    text(entry.label, {
      x: left + SWATCH_SIZE + LABEL_GAP,
      y: baselineOf(sheet),
      fill: palette.inkMuted,
      "font-family": FONT_FAMILY,
      "font-size": fontSize.keyLabel,
    }),
  ];
};

export const cellKey = (sheet: Sheet): readonly string[] =>
  KIND_ORDER.flatMap((kind, slot) => entryOf(sheet, ENTRIES[kind], slot));
