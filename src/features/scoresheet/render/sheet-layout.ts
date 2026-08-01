import { scoreSeries, type ScoredPlayer } from "#scoresheet/domain/scoring.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";


export const IMAGE_WIDTH = 1620;

const IMAGE_MAX_HEIGHT = 2560;

export const PAD = 60;

export const GUTTER = 86;

export const GRID_TOP = 486;

export const GRID_LEFT = PAD + GUTTER;

export const GRID_RIGHT = IMAGE_WIDTH - PAD;

const ROW_HEIGHT_MAX = 56;

const ROW_HEIGHT_MIN = 26;

export const GRID_TO_CHART = 190;

export const CHART_HEIGHT = 620;

export const PLOT_INSET = 24;

export const PLOT_LEFT = GRID_LEFT;

export const PLOT_RIGHT = GRID_RIGHT - PLOT_INSET;

export const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

const BOTTOM_PAD = 240;

const HALF = 2;

export const CELL_INSET = 2;

export const CELL_SHRINK = CELL_INSET * HALF;

export const FONT_FAMILY = "Noto Sans";

const ROWS_HEIGHT = IMAGE_MAX_HEIGHT - GRID_TOP - GRID_TO_CHART - CHART_HEIGHT - BOTTOM_PAD;

export const MAX_ROWS = Math.floor(ROWS_HEIGHT / ROW_HEIGHT_MIN);

const CELL_FONT_RATIO = 0.52;

const INDEX_FONT_RATIO = 0.42;

const LEGEND_FONT_RATIO = 0.11;

export const fontSize = {
  eyebrow: 30,
  title: 126,
  date: 52,
  subtitle: 42,
  sectionLabel: 30,
  columnName: 32,
  axis: 22,
  legend: 30,
  legendTally: 22,
  keyLabel: 24,
  hint: 24,
} as const;

export const cellFontOf = (rowHeight: number): number => Math.round(rowHeight * CELL_FONT_RATIO);

export const indexFontOf = (rowHeight: number): number => Math.round(rowHeight * INDEX_FONT_RATIO);

export const legendFontOf = (slotWidth: number): number =>
  Math.min(fontSize.legend, Math.round(slotWidth * LEGEND_FONT_RATIO));

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
