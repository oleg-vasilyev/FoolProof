import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { percentLabel } from "#scoresheet/render/percent-label.ts";
import { gameTally } from "#scoresheet/render/tally-phrases.ts";
import { rect, line, text } from "#scoresheet/render/svg-tags.ts";
import {
  TILES_PER_ROW,
  TILES_TOP,
  TILE_BAR_DROP,
  TILE_BAR_HEIGHT,
  TILE_BAR_RADIUS,
  TILE_BAR_WIDTH,
  TILE_MARK_GAP,
  TILE_MARK_LIFT,
  TILE_NOTE_DROP,
  TILES_NOTE_BASELINE,
  TILE_ROW_HEIGHT,
  TILE_TICK_DROP,
  TILE_TICK_RISE,
  TILE_TICK_WIDTH,
  TILE_TRACKING,
  TILE_VALUE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import { gapOf } from "#scoresheet/render/personal/tile-gap.ts";
import { Standing } from "#scoresheet/render/personal/tile-standings.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { Copy } from "#scoresheet/copy.ts";


const HIGHER_IS_BETTER = true;

const HIGHER_IS_WORSE = false;

const A_DEAL_NOT_A_SKILL = 0;

interface Tile {
  readonly label: string;
  readonly value: number;
  readonly expected: number;
  readonly decided: number;
  readonly favours: boolean;
  readonly count: string;
  readonly ink: string;
}

const columnWidth = (): number => (GRID_RIGHT - PAD) / TILES_PER_ROW;

const tilesOf = (copy: Copy, card: CareerCard, ink: string): readonly Tile[] => [
  {
    label: copy.tileShare,
    value: card.share,
    expected: card.tally.shareChance,
    decided: card.tally.games,
    favours: HIGHER_IS_BETTER,
    count: gameTally(copy, card.tally.games),
    ink,
  },
  {
    label: copy.tileFool,
    value: card.tally.foolRate,
    expected: card.tally.seatChanceInDecided,
    decided: card.tally.decided,
    favours: HIGHER_IS_WORSE,
    count: copy.tileOutOf(card.tally.fools, card.tally.decided),
    ink: palette.ink,
  },
  {
    label: copy.tileFirst,
    value: card.tally.firstRate,
    expected: card.tally.seatChance,
    decided: card.tally.games,
    favours: HIGHER_IS_BETTER,
    count: copy.tileOutOf(card.tally.firsts, card.tally.games),
    ink: palette.ink,
  },
  {
    label: copy.tileFirstMove,
    value: card.tally.openRate,
    expected: card.tally.seatChance,
    decided: A_DEAL_NOT_A_SKILL,
    favours: HIGHER_IS_BETTER,
    count: copy.tileOutOf(card.tally.opens, card.tally.games),
    ink: palette.ink,
  },
];

const gapInkOf = (standing: Standing, ink: string): string | null => {
  switch (standing) {
    case Standing.Better:
      return ink;

    case Standing.Worse:
      return palette.cellFool;

    case Standing.Unproven:
      return palette.inkFigure;

    case Standing.Level:
      return null;
  }
};

const barAt = (left: number, top: number, width: number, fill: string): string =>
  rect({
    x: left,
    y: top,
    width,
    height: TILE_BAR_HEIGHT,
    rx: TILE_BAR_RADIUS,
    fill,
  });

const gapAt = (left: number, top: number, tile: Tile, playerInk: string): readonly string[] => {
  const gap = gapOf(tile.value, tile.expected, tile.decided, tile.favours);
  const ink = gapInkOf(gap.standing, playerInk);

  return ink === null
    ? []
    : [
        rect({
          x: left + TILE_BAR_WIDTH * gap.from,
          y: top,
          width: TILE_BAR_WIDTH * (gap.to - gap.from),
          height: TILE_BAR_HEIGHT,
          fill: ink,
        }),
      ];
};

const markAt = (left: number, top: number, expected: number): readonly string[] => [
  line({
    x1: left + TILE_BAR_WIDTH * expected,
    y1: top - TILE_TICK_RISE,
    x2: left + TILE_BAR_WIDTH * expected,
    y2: top + TILE_TICK_DROP,
    stroke: palette.ink,
    "stroke-width": TILE_TICK_WIDTH,
  }),
  text(percentLabel(expected), {
    x: left + TILE_BAR_WIDTH + TILE_MARK_GAP,
    y: top + TILE_MARK_LIFT,
    fill: palette.inkHint,
    "font-family": FONT_FAMILY,
    "font-weight": "bold",
    "font-size": personalFont.tileNote,
  }),
];

const drawTile = (tile: Tile, index: number, playerInk: string): readonly string[] => {
  const left = PAD + (index % TILES_PER_ROW) * columnWidth();
  const top = TILES_TOP + Math.floor(index / TILES_PER_ROW) * TILE_ROW_HEIGHT;
  const barTop = top + TILE_BAR_DROP;

  return [
    text(tile.label, {
      x: left,
      y: top,
      fill: palette.inkKey,
      "font-family": FONT_FAMILY,
      "font-size": personalFont.tileLabel,
      "letter-spacing": TILE_TRACKING,
    }),
    text(percentLabel(tile.value), {
      x: left,
      y: top + TILE_VALUE_DROP,
      fill: tile.ink,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": personalFont.tileValue,
    }),
    barAt(left, barTop, TILE_BAR_WIDTH, palette.cellPlaced),
    barAt(left, barTop, TILE_BAR_WIDTH * tile.value, palette.inkFaint),
    ...gapAt(left, barTop, tile, playerInk),
    ...markAt(left, barTop, tile.expected),
    text(tile.count, {
      x: left,
      y: top + TILE_NOTE_DROP,
      fill: palette.inkFaint,
      "font-family": FONT_FAMILY,
      "font-size": personalFont.tileNote,
    }),
  ];
};

export const careerTiles = (copy: Copy, card: CareerCard, ink: string): readonly string[] => [
  ...tilesOf(copy, card, ink).flatMap((tile, index) => drawTile(tile, index, ink)),
  text(copy.tileExpectationNote, {
    x: PAD,
    y: TILES_NOTE_BASELINE,
    fill: palette.inkFaint,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.tileNote,
  }),
];
