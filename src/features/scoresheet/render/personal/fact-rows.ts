import { FONT_FAMILY, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { rect, text } from "#scoresheet/render/svg-tags.ts";
import {
  FACT_HEIGHT,
  FACT_HOLDER_DROP,
  FACT_INDEX_INDENT,
  FACT_REASON_DROP,
  FACT_SPINE_INSET,
  FACT_SPINE_WIDTH,
  FACT_TEXT_INDENT,
  FACT_TITLE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { factInk } from "#scoresheet/render/personal/fact-ink.ts";
import { factLines } from "#scoresheet/render/personal/fact-lines.ts";
import type { PlacedFact } from "#scoresheet/render/personal/personal-layout.ts";
import type { Copy } from "#scoresheet/copy.ts";


const ONE_PLACE = 1;

const INDEX_DIGITS = 2;

const BOTH_ENDS = 2;

const INDEX_FILL = "0";

const drawn = (
  copy: Copy,
  placed: PlacedFact,
  place: number,
  ink: string
): readonly string[] => {
  const lines = factLines(copy, placed.fact);
  const tone = factInk(placed.fact, ink);

  return [
    rect({
      x: PAD,
      y: placed.top + FACT_SPINE_INSET,
      width: FACT_SPINE_WIDTH,
      height: FACT_HEIGHT - FACT_SPINE_INSET * BOTH_ENDS,
      fill: tone,
    }),
    text(String(place).padStart(INDEX_DIGITS, INDEX_FILL), {
      x: PAD + FACT_INDEX_INDENT,
      y: placed.top + FACT_TITLE_DROP,
      fill: palette.inkFigure,
      "font-family": FONT_FAMILY,
      "font-size": personalFont.factIndex,
    }),
    text(lines.title, {
      x: PAD + FACT_TEXT_INDENT,
      y: placed.top + FACT_TITLE_DROP,
      fill: palette.ink,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": personalFont.factTitle,
    }),
    text(lines.holder, {
      x: PAD + FACT_TEXT_INDENT,
      y: placed.top + FACT_HOLDER_DROP,
      fill: tone,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": personalFont.factHolder,
    }),
    text(lines.reason, {
      x: PAD + FACT_TEXT_INDENT,
      y: placed.top + FACT_REASON_DROP,
      fill: palette.inkMuted,
      "font-family": FONT_FAMILY,
      "font-size": personalFont.factReason,
    }),
  ];
};

export const factRows = (
  copy: Copy,
  facts: readonly PlacedFact[],
  ink: string
): readonly string[] =>
  facts.flatMap((placed, index) => drawn(copy, placed, index + ONE_PLACE, ink));
