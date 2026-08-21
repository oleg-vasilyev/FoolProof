import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { percentLabel } from "#scoresheet/render/percent-label.ts";
import { text } from "#scoresheet/render/svg-tags.ts";
import {
  TILES_PER_ROW,
  TILES_TOP,
  TILE_NOTE_DROP,
  TILE_ROW_HEIGHT,
  TILE_SECOND_NOTE_DROP,
  TILE_TRACKING,
  TILE_VALUE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { Copy } from "#scoresheet/copy.ts";


type TileNotes = readonly [string, string];

interface Tile {
  readonly label: string;
  readonly value: string;
  readonly notes: TileNotes;
  readonly ink: string;
}

const FIRST_NOTE = 0;

const SECOND_NOTE = 1;

const columnWidth = (): number => (GRID_RIGHT - PAD) / TILES_PER_ROW;

const countAndChance = (copy: Copy, count: string, chance: number): TileNotes => [
  count,
  copy.tileSeatPredicts(percentLabel(chance)),
];

const tilesOf = (copy: Copy, card: CareerCard, ink: string): readonly Tile[] => [
  {
    label: copy.tileShare,
    value: percentLabel(card.share),
    notes: [copy.tileShareFloor, copy.tileShareCeiling],
    ink,
  },
  {
    label: copy.tileFool,
    value: percentLabel(card.tally.foolRate),
    notes: countAndChance(
      copy,
      copy.tileOutOfDecided(card.tally.fools, card.tally.decided),
      card.tally.seatChanceInDecided
    ),
    ink: palette.cellFool,
  },
  {
    label: copy.tileFirst,
    value: percentLabel(card.tally.firstRate),
    notes: countAndChance(
      copy,
      copy.tileOutOf(card.tally.firsts, card.tally.games),
      card.tally.seatChance
    ),
    ink: palette.ink,
  },
  {
    label: copy.tileFirstMove,
    value: percentLabel(card.tally.openRate),
    notes: countAndChance(
      copy,
      copy.tileOutOf(card.tally.opens, card.tally.games),
      card.tally.seatChance
    ),
    ink: palette.ink,
  },
];

const noteLine = (note: string, left: number, baseline: number): string =>
  text(note, {
    x: left,
    y: baseline,
    fill: palette.inkFaint,
    "font-family": FONT_FAMILY,
    "font-size": personalFont.tileNote,
  });

const drawTile = (tile: Tile, index: number): readonly string[] => {
  const left = PAD + (index % TILES_PER_ROW) * columnWidth();
  const top = TILES_TOP + Math.floor(index / TILES_PER_ROW) * TILE_ROW_HEIGHT;

  return [
    text(tile.label, {
      x: left,
      y: top,
      fill: palette.inkKey,
      "font-family": FONT_FAMILY,
      "font-size": personalFont.tileLabel,
      "letter-spacing": TILE_TRACKING,
    }),
    text(tile.value, {
      x: left,
      y: top + TILE_VALUE_DROP,
      fill: tile.ink,
      "font-family": FONT_FAMILY,
      "font-weight": "bold",
      "font-size": personalFont.tileValue,
    }),
    noteLine(tile.notes[FIRST_NOTE], left, top + TILE_NOTE_DROP),
    noteLine(tile.notes[SECOND_NOTE], left, top + TILE_SECOND_NOTE_DROP),
  ];
};

export const careerTiles = (copy: Copy, card: CareerCard, ink: string): readonly string[] =>
  tilesOf(copy, card, ink).flatMap(drawTile);
