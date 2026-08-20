import { FONT_FAMILY, GRID_RIGHT, PAD } from "#scoresheet/render/card-metrics.ts";
import { palette } from "#scoresheet/render/palette.ts";
import { percentLabel } from "#scoresheet/render/percent-label.ts";
import { timeTally } from "#scoresheet/render/tally-phrases.ts";
import { text } from "#scoresheet/render/svg-tags.ts";
import {
  TILES_PER_ROW,
  TILES_TOP,
  TILE_NOTE_DROP,
  TILE_ROW_HEIGHT,
  TILE_TRACKING,
  TILE_VALUE_DROP,
  personalFont,
} from "#scoresheet/render/personal/personal-metrics.ts";
import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import type { Copy } from "#scoresheet/copy.ts";


interface Tile {
  readonly label: string;
  readonly value: string;
  readonly note: string | null;
  readonly ink: string;
}

const columnWidth = (): number => (GRID_RIGHT - PAD) / TILES_PER_ROW;

const tilesOf = (copy: Copy, card: CareerCard): readonly Tile[] => [
  { label: copy.tileGames, value: String(card.tally.games), note: null, ink: palette.ink },
  { label: copy.tileEvenings, value: String(card.tally.evenings), note: null, ink: palette.ink },
  {
    label: copy.tileShare,
    value: percentLabel(card.share),
    note: copy.tileShareNote,
    ink: palette.ink,
  },
  {
    label: copy.tileFool,
    value: percentLabel(card.tally.foolRate),
    note: copy.tileFoolNote(
      card.tally.fools,
      card.tally.decided,
      percentLabel(card.tally.expectedFoolRate)
    ),
    ink: palette.cellFool,
  },
  {
    label: copy.tileFirst,
    value: percentLabel(card.tally.firstRate),
    note: copy.tileTimesExpected(
      timeTally(copy, card.tally.firsts),
      percentLabel(card.tally.expectedFirstRate)
    ),
    ink: palette.ink,
  },
  {
    label: copy.tileDealt,
    value: percentLabel(card.tally.openRate),
    note: timeTally(copy, card.tally.opens),
    ink: palette.ink,
  },
];

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
    ...(tile.note === null
      ? []
      : [
          text(tile.note, {
            x: left,
            y: top + TILE_NOTE_DROP,
            fill: palette.inkFaint,
            "font-family": FONT_FAMILY,
            "font-size": personalFont.tileNote,
          }),
        ]),
  ];
};

export const careerTiles = (copy: Copy, card: CareerCard): readonly string[] =>
  tilesOf(copy, card).flatMap(drawTile);
