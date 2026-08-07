import { scoreSeries, type ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import { GRID_RIGHT, IMAGE_MAX_HEIGHT, PAD, fontSize } from "#scoresheet/render/card-metrics.ts";


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

const BOTTOM_PAD = 320;

const HALF = 2;

export const CELL_INSET = 2;

export const CELL_SHRINK = CELL_INSET * HALF;

const ROWS_HEIGHT = IMAGE_MAX_HEIGHT - GRID_TOP - GRID_TO_CHART - CHART_HEIGHT - BOTTOM_PAD;

export const MAX_ROWS = Math.floor(ROWS_HEIGHT / ROW_HEIGHT_MIN);

const CELL_FONT_RATIO = 0.52;

const INDEX_FONT_RATIO = 0.42;

const LEGEND_FONT_RATIO = 0.11;

const NAME_ADVANCE = 0.58;

const NAME_MIN_SIZE = 14;

const ELLIPSIS = "…";

export const cellFontOf = (rowHeight: number): number => Math.round(rowHeight * CELL_FONT_RATIO);

export const indexFontOf = (rowHeight: number): number => Math.round(rowHeight * INDEX_FONT_RATIO);

export const legendFontOf = (slotWidth: number): number =>
  Math.min(fontSize.legend, Math.round(slotWidth * LEGEND_FONT_RATIO));

export interface FittedName {
  readonly text: string;
  readonly size: number;
}

export const nameToFit = (name: string, width: number, largest: number): FittedName => {
  const wanted = width / (name.length * NAME_ADVANCE);

  if (wanted >= NAME_MIN_SIZE) {
    return { text: name, size: Math.min(largest, wanted) };
  }

  const fits = Math.floor(width / (NAME_MIN_SIZE * NAME_ADVANCE));

  return {
    text: `${name.slice(0, Math.max(fits - ELLIPSIS.length, 0))}${ELLIPSIS}`,
    size: NAME_MIN_SIZE,
  };
};

export interface Sheet {
  readonly startedOn: string;
  readonly players: readonly ScoredPlayer[];
  readonly rounds: number;
  readonly omitted: number;
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly gridHeight: number;
  readonly gridBottom: number;
  readonly chartTop: number;
  readonly height: number;
}

const rowHeightFor = (rounds: number): number =>
  Math.min(ROW_HEIGHT_MAX, Math.max(ROW_HEIGHT_MIN, Math.floor(ROWS_HEIGHT / rounds)));

export const layoutOf = (chronology: SeriesChronology): Sheet => {
  const shown = chronology.games.slice(-MAX_ROWS);
  const players = scoreSeries(chronology.players, shown);
  const rounds = shown.length;
  const rowHeight = rowHeightFor(rounds);
  const gridHeight = rounds * rowHeight;
  const gridBottom = GRID_TOP + gridHeight;
  const chartTop = gridBottom + GRID_TO_CHART;

  return {
    startedOn: chronology.startedOn,
    players,
    rounds,
    omitted: chronology.games.length - rounds,
    rowHeight,
    columnWidth: (GRID_RIGHT - GRID_LEFT) / players.length,
    gridHeight,
    gridBottom,
    chartTop,
    height: chartTop + CHART_HEIGHT + BOTTOM_PAD,
  };
};

export const columnCentre = (sheet: Sheet, column: number): number =>
  GRID_LEFT + column * sheet.columnWidth + sheet.columnWidth / HALF;

export const chartBottomOf = (sheet: Sheet): number => sheet.chartTop + CHART_HEIGHT;
