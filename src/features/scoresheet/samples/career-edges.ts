import { Locale } from "#shared/locale/locales.ts";
import { careerCard } from "#scoresheet/domain/career/career-card.ts";
import { copyIn } from "#scoresheet/copy.ts";
import { renderPersonalCard } from "#scoresheet/render/personal/personal-svg.ts";
import { BOT_HANDLE } from "#scoresheet/samples/sample-handle.ts";
import type { CareerGame, CareerHistory, Finalist } from "#shared/repository/repository-contract.ts";
import type { Drawing } from "#shared/drawings/drawings-contract.ts";
import { LONGEST_NAME } from "#shared/table/table-limits.ts";


const CAREER_OPENED_ON = "2026-01-09";

const FIRST_ID = 1;

const FIRST_PLACE = 1;

const FIRST = 0;

const NOBODY = 0;

const ONE_PLACE = 1;

const SHARED_LAST = 2;

const NIGHT_ONE = 1;

const DAYS_BETWEEN_NIGHTS = 7;

const MS_IN_A_DAY = 86_400_000;

const A_DATE_ALONE = 10;

const THE_SUBJECT = 1;

const THE_BOGEY = 3;

const SUBJECT_COLUMN = 0;

const ENOUGH_TO_PLAY = 3;

const EVERY_OTHER = 2;

const EVERY_FOURTH = 4;

const EVERY_NINTH = 9;

type Fate = (order: readonly number[], game: number, night: number) => readonly number[];

type Away = (playerId: number, night: number) => boolean;

type Drawn = (game: number) => boolean;

interface CareerCase {
  readonly name: string;
  readonly locale: Locale;
  readonly asks: string;
  readonly players: readonly string[];
  readonly nights: number;
  readonly gamesEachNight: number;
  readonly gamesOn?: (night: number) => number;
  readonly fate: Fate;
  readonly away?: Away;
  readonly drawn?: Drawn;
}

const everyone = (players: number): readonly number[] =>
  Array.from({ length: players }, (_unused, seat) => seat + FIRST_ID);

const rotate = (order: readonly number[], by: number): readonly number[] =>
  order.length === NOBODY
    ? order
    : [...order.slice(by % order.length), ...order.slice(NOBODY, by % order.length)];

const without = (order: readonly number[], playerId: number): readonly number[] =>
  order.filter((seated) => seated !== playerId);

const asTheyFall: Fate = (order) => order;

const winsEveryGame: Fate = (order) =>
  order.includes(THE_SUBJECT) ? [THE_SUBJECT, ...without(order, THE_SUBJECT)] : order;

const burnsEveryGame: Fate = (order) =>
  order.includes(THE_SUBJECT) ? [...without(order, THE_SUBJECT), THE_SUBJECT] : order;

const climbingNights: Fate = (order, game, night) => {
  if (!order.includes(THE_SUBJECT)) {
    return order;
  }

  return game < night
    ? [THE_SUBJECT, ...without(order, THE_SUBJECT)]
    : [...without(order, THE_SUBJECT), THE_SUBJECT];
};

const burnedByTheBogey: Fate = (order, game) =>
  game % EVERY_OTHER === FIRST && order.includes(THE_SUBJECT) && order.includes(THE_BOGEY)
    ? [...without(without(order, THE_SUBJECT), THE_BOGEY), THE_BOGEY, THE_SUBJECT]
    : order;

const everybodyEveryNight: Away = () => false;

const nothingDrawn: Drawn = () => false;

const everyFourthDrawn: Drawn = (game) => game % EVERY_FOURTH === FIRST;

const everyNinthDrawn: Drawn = (game) => game % EVERY_NINTH === FIRST;

const nightDate = (night: number): string =>
  new Date(
    new Date(`${CAREER_OPENED_ON}T20:00:00Z`).getTime() +
      night * DAYS_BETWEEN_NIGHTS * MS_IN_A_DAY
  )
    .toISOString()
    .slice(FIRST, A_DATE_ALONE);

const placementsOf = (order: readonly number[], drawn: boolean): readonly Finalist[] =>
  order.map((playerId, at) => ({
    playerId,
    position:
      drawn && at >= order.length - SHARED_LAST
        ? order.length - ONE_PLACE
        : at + FIRST_PLACE,
  }));

const nightOf = (shown: CareerCase, night: number): readonly CareerGame[] => {
  const away = shown.away ?? everybodyEveryNight;
  const drawn = shown.drawn ?? nothingDrawn;
  const seated = everyone(shown.players.length).filter((playerId) => !away(playerId, night));

  if (seated.length < ENOUGH_TO_PLAY) {
    return [];
  }

  const games = shown.gamesOn?.(night) ?? shown.gamesEachNight;

  return Array.from({ length: games }, (_unused, game) => ({
    seriesNo: night + NIGHT_ONE,
    playedOn: nightDate(night),
    starterId: seated[(night + game) % seated.length] ?? null,
    placements: placementsOf(shown.fate(rotate(seated, game), game, night), drawn(game)),
  }));
};

const historyOf = (shown: CareerCase): CareerHistory => ({
  players: shown.players.map((displayName, index) => ({
    playerId: index + FIRST_ID,
    displayName,
  })),
  games: Array.from({ length: shown.nights }, (_unused, night) => nightOf(shown, night)).flat(),
});

const SHORT_NAMES = ["Олег", "Аня", "Рома", "Дима", "Вероника", "Ким"];

const THE_LONGEST_NAME = "Шжюмщ-Ащфыв".padEnd(LONGEST_NAME, "Ш");

const A_LONG_BOGEY = "Александра-Константиновна";

const THE_WIDEST_NAME = "Щ".repeat(LONGEST_NAME);

const A_HAIR_OF_ROOM = "Макс aka Wolf";

const AFTER_THE_SUBJECT = 1;

const LONG_NAMES: readonly string[] = SHORT_NAMES.map((name, index) => {
  if (index + FIRST_ID === THE_SUBJECT) {
    return THE_LONGEST_NAME;
  }

  return index + FIRST_ID === THE_BOGEY ? A_LONG_BOGEY : name;
});

const THREE_AT_THE_TABLE = 3;

const FIVE_AT_THE_TABLE = 5;

const ONE_NIGHT = 1;

const JUST_UNDER_THE_CHART = 4;

const A_LONG_CAREER = 12;

const A_CAREER_OF_YEARS = 111;

const A_CLIMBING_CAREER = 7;

const A_SHORT_NIGHT = 3;

const A_NIGHT_OF_ONE = 1;

const A_NIGHT_TOO_SHORT = 2;

const THE_FEWEST_CHARTED = 5;

const EVERY_SEVENTH = 7;

const A_FULL_NIGHT = 6;

const A_NIGHT_THAT_RAN_LONG = 9;

const A_LATE_ARRIVAL = 5;

const ARRIVES_ON = 6;

const A_WANDERER = 4;

const GONE_FROM = 3;

const BACK_ON = 9;

const CAREERS: readonly CareerCase[] = [
  {
    name: "first-night",
    locale: Locale.En,
    asks:
      "one evening old — the chart section holds its place with a floor and a sentence" +
      " rather than a heading over nothing, and every count is at its smallest",
    players: SHORT_NAMES.slice(NOBODY, THREE_AT_THE_TABLE),
    nights: ONE_NIGHT,
    gamesEachNight: A_SHORT_NIGHT,
    fate: asTheyFall,
  },
  {
    name: "under-the-chart",
    locale: Locale.Ru,
    asks:
      "one evening short of a chart — the section keeps its name and owes a single evening," +
      " in the singular",
    players: SHORT_NAMES.slice(NOBODY, FIVE_AT_THE_TABLE),
    nights: JUST_UNDER_THE_CHART,
    gamesEachNight: A_FULL_NIGHT,
    fate: burnedByTheBogey,
  },
  {
    name: "a-long-career",
    locale: Locale.Ru,
    asks: "the tallest card the sheet can draw — a chart, three facts, and a plate beneath them",
    players: SHORT_NAMES,
    nights: A_LONG_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: burnedByTheBogey,
  },
  {
    name: "the-longest-names",
    locale: Locale.Ru,
    asks: "the longest name a player may have, in the heading and again on the plate",
    players: LONG_NAMES,
    nights: A_LONG_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: burnedByTheBogey,
  },
  {
    name: "never-burned",
    locale: Locale.En,
    asks: "a career of nothing but wins — every fact is good news and no plate turns red",
    players: SHORT_NAMES.slice(NOBODY, FIVE_AT_THE_TABLE),
    nights: A_LONG_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: winsEveryGame,
  },
  {
    name: "always-burned",
    locale: Locale.Ru,
    asks: "a career of nothing but losses — the worst every fact can say about one player",
    players: SHORT_NAMES.slice(NOBODY, FIVE_AT_THE_TABLE),
    nights: A_LONG_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: burnsEveryGame,
  },
  {
    name: "an-uneven-career",
    locale: Locale.En,
    asks: "every evening a different share — the only card that can single out a best and a worst",
    players: SHORT_NAMES,
    nights: A_CLIMBING_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: climbingNights,
  },
  {
    name: "the-widest-counts",
    locale: Locale.Ru,
    asks:
      "a career of years at the narrowest table — three-digit counts on every tile," +
      " and a ninth of the games drawn, so the fool is read against a smaller whole",
    players: SHORT_NAMES.slice(NOBODY, THREE_AT_THE_TABLE),
    nights: A_CAREER_OF_YEARS,
    gamesEachNight: A_NIGHT_THAT_RAN_LONG,
    fate: burnsEveryGame,
    drawn: everyNinthDrawn,
  },
  {
    name: "comes-and-goes",
    locale: Locale.En,
    asks: "a long absence and a return, against tables that change size around it",
    players: SHORT_NAMES,
    nights: A_LONG_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: asTheyFall,
    away: (playerId, night) => {
      if (playerId === A_LATE_ARRIVAL) {
        return night < ARRIVES_ON;
      }

      return playerId === A_WANDERER && night >= GONE_FROM && night < BACK_ON;
    },
    drawn: everyFourthDrawn,
  },
  {
    name: "a-passed-over-peak",
    locale: Locale.Ru,
    asks:
      "the curve's highest and lowest points are one-game nights — both titles land" +
      " elsewhere, and the faint dots with the hint say why the peaks were passed over",
    players: SHORT_NAMES,
    nights: A_CLIMBING_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    gamesOn: (night) =>
      night === FIRST || night === A_CLIMBING_CAREER - ONE_NIGHT ? A_NIGHT_OF_ONE : A_FULL_NIGHT,
    fate: climbingNights,
  },
  {
    name: "too-short-to-judge",
    locale: Locale.En,
    asks:
      "five nights and none reaches three games — the whole curve is faint dots, no title" +
      " is marked anywhere, and the hint alone carries the explanation",
    players: SHORT_NAMES.slice(NOBODY, FIVE_AT_THE_TABLE),
    nights: THE_FEWEST_CHARTED,
    gamesEachNight: A_NIGHT_TOO_SHORT,
    fate: climbingNights,
  },
  {
    name: "a-crowded-curve",
    locale: Locale.En,
    asks:
      "a career of years with one-game nights scattered through it and the best and worst" +
      " adjacent — faint dots stay tellable from judged dots at the tightest pitch, and one" +
      " sits right beside the worst ring",
    players: SHORT_NAMES,
    nights: A_CAREER_OF_YEARS,
    gamesEachNight: A_FULL_NIGHT,
    gamesOn: (night) => (night % EVERY_SEVENTH === FIRST ? A_NIGHT_OF_ONE : A_FULL_NIGHT),
    fate: climbingNights,
  },
  {
    name: "the-widest-name",
    locale: Locale.Ru,
    asks:
      "thirty-two of the widest glyph the bold face carries — the heading cuts the name" +
      " to its measured room instead of running through the counter beside it",
    players: [THE_WIDEST_NAME, ...SHORT_NAMES.slice(AFTER_THE_SUBJECT, FIVE_AT_THE_TABLE)],
    nights: A_LONG_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: asTheyFall,
  },
  {
    name: "a-hair-of-room",
    locale: Locale.En,
    asks:
      "a name whose measured ink all but fills the heading's room — kept whole, no ellipsis," +
      " and still clear of the counter",
    players: [A_HAIR_OF_ROOM, ...SHORT_NAMES.slice(AFTER_THE_SUBJECT, FIVE_AT_THE_TABLE)],
    nights: A_LONG_CAREER,
    gamesEachNight: A_FULL_NIGHT,
    fate: asTheyFall,
  },
];

const drawingOf = (shown: CareerCase): Drawing => {
  const card = careerCard(historyOf(shown), THE_SUBJECT);

  if (card === null) {
    throw new Error(`${shown.name}: the subject finished no game — check its fate and its nights`);
  }

  return {
    file: `${shown.name}-personal`,
    asks: shown.asks,
    svg: renderPersonalCard(copyIn(shown.locale), card, SUBJECT_COLUMN, BOT_HANDLE),
  };
};

export const careerHistories = (): readonly CareerHistory[] => CAREERS.map(historyOf);

export const personalCards = (): readonly Drawing[] => CAREERS.map(drawingOf);
