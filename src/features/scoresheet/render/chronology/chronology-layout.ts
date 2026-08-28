import { scoreSeries, type ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { GRID_RIGHT, IMAGE_MAX_HEIGHT, SHEET_BASE, USUAL_FALLBACK, PAD, fontSize } from "#scoresheet/render/card-metrics.ts";


export const GUTTER = 86;

export const GRID_LABEL_BASELINE = 428;

export const GRID_TOP = 518;

export const GRID_LEFT = PAD + GUTTER;

const ROW_HEIGHT_MAX = 56;

const ROW_HEIGHT_MIN = 26;

export const GRID_TO_CHART = 210;

export const CHART_HEIGHT = 620;

export const PLOT_INSET = 24;

export const PLOT_LEFT = GRID_LEFT;

export const PLOT_RIGHT = GRID_RIGHT - PLOT_INSET;

export const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

const HALF = 2;

export const CELL_INSET = 2;

export const CELL_SHRINK = CELL_INSET * HALF;

const CELL_FONT_RATIO = 0.52;

const INDEX_FONT_RATIO = 0.42;

export const cellFontOf = (rowHeight: number): number => Math.round(rowHeight * CELL_FONT_RATIO);

const INDEX_ROOM = 31;

const INDEX_STRIDES: readonly number[] = [1, 5, 10];

const WIDEST_STRIDE = 10;

export const indexStrideOf = (rowHeight: number): number =>
  INDEX_STRIDES.find((stride) => rowHeight * stride >= INDEX_ROOM) ?? WIDEST_STRIDE;

export const indexFontOf = (rowHeight: number): number =>
  Math.min(
    Math.round(ROW_HEIGHT_MAX * INDEX_FONT_RATIO),
    Math.round(rowHeight * indexStrideOf(rowHeight) * INDEX_FONT_RATIO)
  );

export const LEGEND_GUTTER = 24;

export const LEGEND_SLOT_MAX = 284;

export const LEGEND_LABEL_DROP = 96;

export const LEGEND_RULE_DROP = 132;

export const LEGEND_SHARE_DROP = 180;

export const LEGEND_NAME_DROP = 222;

export const LEGEND_TALLY_DROP = 256;

const LEGEND_ROW_GAP = 24;

const LEGEND_TAIL = SHEET_BASE;

export const LEGEND_ROW_PITCH = LEGEND_TALLY_DROP - LEGEND_RULE_DROP + LEGEND_ROW_GAP;

const LEGEND_PAD = LEGEND_TALLY_DROP - LEGEND_ROW_PITCH + LEGEND_TAIL;

const LEGEND_NAME_MIN = 14;

const LEGEND_SLOT_MIN = LEGEND_GUTTER + LEGEND_NAME_MIN * fontSize.legend * USUAL_FALLBACK;

const LEGEND_COLUMNS_MAX = Math.floor(PLOT_WIDTH / LEGEND_SLOT_MIN);

export const legendRowsOf = (players: number): number =>
  Math.ceil(players / LEGEND_COLUMNS_MAX);

export const legendColumnsOf = (players: number): number =>
  Math.ceil(players / legendRowsOf(players));

export const legendSlotOf = (players: number): number =>
  Math.min(LEGEND_SLOT_MAX, PLOT_WIDTH / legendColumnsOf(players));

const bottomPadOf = (players: number): number =>
  LEGEND_PAD + legendRowsOf(players) * LEGEND_ROW_PITCH;

const gamesRoomFor = (players: number): number =>
  IMAGE_MAX_HEIGHT - GRID_TOP - GRID_TO_CHART - CHART_HEIGHT - bottomPadOf(players);

export const maxGamesFor = (players: number): number =>
  Math.floor(gamesRoomFor(players) / ROW_HEIGHT_MIN);

export interface Sheet {
  readonly startedOn: string;
  readonly players: readonly ScoredPlayer[];
  readonly biggestTable: number;
  readonly played: number;
  readonly rounds: number;
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly gridHeight: number;
  readonly gridBottom: number;
  readonly chartTop: number;
  readonly height: number;
}

const rowHeightFor = (rounds: number, room: number): number =>
  Math.min(ROW_HEIGHT_MAX, Math.max(ROW_HEIGHT_MIN, Math.floor(room / rounds)));

const NO_SEATS = 0;

const biggestTableIn = (chronology: SeriesChronology): number =>
  chronology.games.reduce(
    (biggest, game) => Math.max(biggest, game.placements.length),
    NO_SEATS
  );

export const layoutOf = (chronology: SeriesChronology): Sheet => {
  const seated = chronology.players.length;
  const played = chronology.games.length;
  const players = scoreSeries(chronology.players, chronology.games);
  const rounds = Math.min(played, maxGamesFor(seated));
  const rowHeight = rowHeightFor(rounds, gamesRoomFor(seated));
  const gridHeight = rounds * rowHeight;
  const gridBottom = GRID_TOP + gridHeight;
  const chartTop = gridBottom + GRID_TO_CHART;

  return {
    startedOn: chronology.startedOn,
    players,
    biggestTable: biggestTableIn(chronology),
    played,
    rounds,
    rowHeight,
    columnWidth: (GRID_RIGHT - GRID_LEFT) / players.length,
    gridHeight,
    gridBottom,
    chartTop,
    height: chartTop + CHART_HEIGHT + bottomPadOf(seated),
  };
};

export const columnCentre = (sheet: Sheet, column: number): number =>
  GRID_LEFT + column * sheet.columnWidth + sheet.columnWidth / HALF;

export const chartBottomOf = (sheet: Sheet): number => sheet.chartTop + CHART_HEIGHT;
