import type { CareerCard } from "#scoresheet/domain/career/career-card.ts";
import { ENOUGH_NIGHTS_TO_CHART } from "#scoresheet/domain/career/career-evenings.ts";
import {
  CHART_BOTTOM_GAP,
  CHART_TOP_DROP,
  FACTS_TOP_DROP,
  FACT_HEIGHT,
  PLATE_GAP,
  PLATE_HEIGHT,
  PLOT_HEIGHT,
  SECTION_LABEL_DROP,
  SHEET_BOTTOM,
  TILES_PER_ROW,
  TILES_TOP,
  TILE_BOTTOM_GAP,
  TILE_COUNT,
  TILE_NOTE_DROP,
  TILE_ROW_HEIGHT,
} from "#scoresheet/render/personal/personal-metrics.ts";


const NOTHING = 0;

const ONE_ROW = 1;

const ROWS_BELOW_THE_FIRST = Math.ceil(TILE_COUNT / TILES_PER_ROW) - ONE_ROW;

export const FactName = {
  Best: "best",
  Worst: "worst",
  Streak: "streak",
} as const;

export type FactName = (typeof FactName)[keyof typeof FactName];

export interface PlacedFact {
  readonly name: FactName;
  readonly top: number;
}

export interface PersonalLayout {
  readonly height: number;
  readonly chartLabel: number | null;
  readonly plotTop: number | null;
  readonly factsLabel: number | null;
  readonly facts: readonly PlacedFact[];
  readonly plateTop: number | null;
}

const factsIn = (card: CareerCard): readonly FactName[] => [
  ...(card.best === null ? [] : [FactName.Best]),
  ...(card.worst === null ? [] : [FactName.Worst]),
  ...(card.streak === null ? [] : [FactName.Streak]),
];

export const personalLayoutOf = (card: CareerCard): PersonalLayout => {
  const afterTiles =
    TILES_TOP + ROWS_BELOW_THE_FIRST * TILE_ROW_HEIGHT + TILE_NOTE_DROP + TILE_BOTTOM_GAP;

  const charted = card.nights.length >= ENOUGH_NIGHTS_TO_CHART;
  const chartLabel = charted ? afterTiles + SECTION_LABEL_DROP : null;
  const plotTop = chartLabel === null ? null : chartLabel + CHART_TOP_DROP;
  const afterChart = plotTop === null ? afterTiles : plotTop + PLOT_HEIGHT + CHART_BOTTOM_GAP;

  const named = factsIn(card);
  const factsTop = afterChart + FACTS_TOP_DROP;
  const facts = named.map((name, index) => ({ name, top: factsTop + index * FACT_HEIGHT }));
  const factsLabel = named.length === NOTHING ? null : afterChart + SECTION_LABEL_DROP;
  const afterFacts = named.length === NOTHING ? afterChart : factsTop + named.length * FACT_HEIGHT;

  const plateTop = card.rival === null ? null : afterFacts + PLATE_GAP;
  const afterPlate = plateTop === null ? afterFacts : plateTop + PLATE_HEIGHT;

  return { height: afterPlate + SHEET_BOTTOM, chartLabel, plotTop, factsLabel, facts, plateTop };
};
