import { copy } from "#scoresheet/copy.en.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import type { Finalist, SeriesChronology } from "#shared/repository/repository-contract.ts";


export const MOCKUP_DIR = "docs/mockups";

const SAMPLE_DATE = "2026-08-06";

const NAMES = ["Олег", "Аня", "Рома", "Дима", "Вероника"];

const FIRST_ID = 1;

const FIRST_PLACE = 1;

const DRAWN_GAME = 4;

const SHARED_LAST = 2;

const ONE_PLACE = 1;

const EXIT_ORDERS: readonly (readonly number[])[] = [
  [1, 2, 3, 4, 5],
  [3, 1, 5, 2, 4],
  [2, 4, 1, 3, 5],
  [1, 3, 2, 5, 4],
  [4, 5, 1, 2, 3],
  [1, 2, 5, 3, 4],
  [2, 3, 1, 4],
  [5, 1, 4, 2, 3],
  [1, 4, 3, 5, 2],
  [3, 2, 4, 1, 5],
  [1, 5, 2, 4, 3],
  [2, 1, 3, 5, 4],
];

const placementsOf = (order: readonly number[], drawn: boolean): readonly Finalist[] =>
  order.map((playerId, index) => ({
    playerId,
    position:
      drawn && index >= order.length - SHARED_LAST
        ? order.length - ONE_PLACE
        : index + FIRST_PLACE,
  }));

export const sampleEvening = (): SeriesChronology => ({
  startedOn: SAMPLE_DATE,
  players: NAMES.map((displayName, index) => ({ playerId: index + FIRST_ID, displayName })),
  games: EXIT_ORDERS.map((order, index) => ({
    gameId: index + FIRST_ID,
    starterId: order[0] ?? null,
    placements: placementsOf(order, index === DRAWN_GAME),
  })),
});

export interface Posters {
  readonly chronology: string;
  readonly awards: string;
}

export const posters = (): Posters => {
  const evening = sampleEvening();
  const honours = honoursFor(evening);

  if (honours === null) {
    throw new Error("the sample evening is too short to earn awards — lengthen EXIT_ORDERS");
  }

  return {
    chronology: renderScoresheet(copy, evening),
    awards: renderAwards(copy, evening, honours),
  };
};
