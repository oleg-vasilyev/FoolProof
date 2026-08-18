import { copy } from "#scoresheet/copy.en.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import { careerCard } from "#scoresheet/domain/career/career-card.ts";
import { renderPersonalCard } from "#scoresheet/render/personal/personal-svg.ts";
import type {
  CareerGame,
  CareerHistory,
  Finalist,
  SeriesChronology,
} from "#shared/repository/repository-contract.ts";


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

const NIGHTS_IN_A_CAREER = 6;

const DAYS_BETWEEN_NIGHTS = 7;

const MS_IN_A_DAY = 86_400_000;

const SAMPLE_SUBJECT = 1;

const DATE_START = 0;

const FIRST_SEAT = 0;

const rotated = (order: readonly number[], by: number): readonly number[] =>
  order.map((_, index) => order[(index + by) % order.length] ?? FIRST_PLACE);

const nightOf = (night: number): readonly CareerGame[] => {
  const playedOn = new Date(
    new Date(`${SAMPLE_DATE}T20:00:00Z`).getTime() + night * DAYS_BETWEEN_NIGHTS * MS_IN_A_DAY
  )
    .toISOString()
    .slice(DATE_START, SAMPLE_DATE.length);

  return EXIT_ORDERS.map((order, index) => {
    const spun = rotated(order, night);

    return {
      seriesNo: night + FIRST_ID,
      playedOn,
      starterId: spun[FIRST_SEAT] ?? null,
      placements: placementsOf(spun, index === DRAWN_GAME),
    };
  });
};

export const sampleCareer = (): CareerHistory => ({
  players: NAMES.map((displayName, index) => ({ playerId: index + FIRST_ID, displayName })),
  games: Array.from({ length: NIGHTS_IN_A_CAREER }, (_, night) => nightOf(night)).flat(),
});

export type Posters = {
  readonly chronology: string;
  readonly awards: string;
  readonly personal: string;
};

const subjectColumn = (): number =>
  sampleCareer().players.findIndex((player) => player.playerId === SAMPLE_SUBJECT);

export const posters = (): Posters => {
  const evening = sampleEvening();
  const honours = honoursFor(evening);

  if (honours === null) {
    throw new Error("the sample evening is too short to earn awards — lengthen EXIT_ORDERS");
  }

  const career = careerCard(sampleCareer(), SAMPLE_SUBJECT);

  if (career === null) {
    throw new Error("the sample career has no games — check NAMES and EXIT_ORDERS");
  }

  return {
    chronology: renderScoresheet(copy, evening),
    awards: renderAwards(copy, evening, honours),
    personal: renderPersonalCard(copy, career, subjectColumn()),
  };
};
