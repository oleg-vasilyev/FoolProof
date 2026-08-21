import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";
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
  TEASER_BOTTOM_GAP,
  TEASER_FLOOR_DROP,
  TILES_PER_ROW,
  TILES_TOP,
  TILE_BOTTOM_GAP,
  TILE_COUNT,
  TILE_ROW_HEIGHT,
  TILE_SECOND_NOTE_DROP,
} from "#scoresheet/render/personal/personal-metrics.ts";


const NOTHING = 0;

const ONE_ROW = 1;

export const MOST_ROWS = 3;

const ROWS_BELOW_THE_FIRST = Math.ceil(TILE_COUNT / TILES_PER_ROW) - ONE_ROW;

export interface PlacedFact {
  readonly fact: CareerFact;
  readonly top: number;
}

export interface PersonalLayout {
  readonly height: number;
  readonly chartLabel: number;
  readonly plotTop: number | null;
  readonly factsLabel: number | null;
  readonly facts: readonly PlacedFact[];
  readonly plate: PlacedFact | null;
}

export const aboutARival = (fact: CareerFact): boolean => "rival" in fact;

export const plateFactIn = (facts: readonly CareerFact[]): CareerFact | null =>
  facts.find(aboutARival) ?? null;

export const rowFactsIn = (facts: readonly CareerFact[]): readonly CareerFact[] => {
  const plated = plateFactIn(facts);

  return facts.filter((fact) => fact !== plated).slice(NOTHING, MOST_ROWS);
};

export const personalLayoutOf = (card: CareerCard): PersonalLayout => {
  const afterTiles =
    TILES_TOP + ROWS_BELOW_THE_FIRST * TILE_ROW_HEIGHT + TILE_SECOND_NOTE_DROP + TILE_BOTTOM_GAP;

  const chartLabel = afterTiles + SECTION_LABEL_DROP;
  const charted = card.nights.length >= ENOUGH_NIGHTS_TO_CHART;
  const plotTop = charted ? chartLabel + CHART_TOP_DROP : null;
  const afterChart =
    plotTop === null
      ? chartLabel + TEASER_FLOOR_DROP + TEASER_BOTTOM_GAP
      : plotTop + PLOT_HEIGHT + CHART_BOTTOM_GAP;

  const rows = rowFactsIn(card.facts);
  const factsTop = afterChart + FACTS_TOP_DROP;
  const facts = rows.map((fact, index) => ({ fact, top: factsTop + index * FACT_HEIGHT }));
  const showing = card.facts.length > NOTHING;
  const factsLabel = showing ? afterChart + SECTION_LABEL_DROP : null;
  const afterFacts = showing ? factsTop + rows.length * FACT_HEIGHT : afterChart;

  const plated = plateFactIn(card.facts);
  const plate = plated === null ? null : { fact: plated, top: afterFacts + PLATE_GAP };
  const afterPlate = plate === null ? afterFacts : plate.top + PLATE_HEIGHT;

  return { height: afterPlate + SHEET_BOTTOM, chartLabel, plotTop, factsLabel, facts, plate };
};
