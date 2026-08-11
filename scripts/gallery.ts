import { Locale } from "#shared/locale/locales.ts";
import { copyIn } from "#scoresheet/copy.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import type { Finalist, SeriesChronology } from "#shared/repository/repository-contract.ts";


export const GALLERY_DIR = "reports/gallery";

const GALLERY_DATE = "2026-08-11";

const FIRST_ID = 1;

const FIRST_PLACE = 1;

const ONE_PLACE = 1;

const SHARED_LAST = 2;

const NOBODY = 0;

const FIRST_OUT = 0;

interface Round {
  readonly order: readonly number[];
  readonly drawn: boolean;
}

interface Case {
  readonly name: string;
  readonly locale: Locale;
  readonly asks: string;
  readonly players: readonly string[];
  readonly rounds: readonly Round[];
}

const rotate = (order: readonly number[], by: number): readonly number[] =>
  order.length === NOBODY ? order : [...order.slice(by % order.length), ...order.slice(NOBODY, by % order.length)];

const everyone = (players: number): readonly number[] =>
  Array.from({ length: players }, (_unused, seat) => seat);

const rotatingRounds = (players: number, rounds: number, drawn = false): readonly Round[] =>
  Array.from({ length: rounds }, (_unused, round) => ({
    order: rotate(everyone(players), round),
    drawn,
  }));

const seatedRounds = (
  players: number,
  rounds: number,
  seated: (player: number, round: number) => boolean
): readonly Round[] =>
  Array.from({ length: rounds }, (_unused, round) => ({
    order: rotate(
      everyone(players).filter((player) => seated(player, round)),
      round
    ),
    drawn: false,
  }));

const placementsOf = (round: Round): readonly Finalist[] =>
  round.order.map((player, at) => ({
    playerId: player + FIRST_ID,
    position:
      round.drawn && at >= round.order.length - SHARED_LAST
        ? round.order.length - ONE_PLACE
        : at + FIRST_PLACE,
  }));

const eveningOf = (shown: Case): SeriesChronology => ({
  startedOn: GALLERY_DATE,
  players: shown.players.map((displayName, index) => ({
    playerId: index + FIRST_ID,
    displayName,
  })),
  games: shown.rounds.map((round, index) => ({
    gameId: index + FIRST_ID,
    starterId: (round.order[FIRST_OUT] ?? NOBODY) + FIRST_ID,
    placements: placementsOf(round),
  })),
});

const SHORT_NAMES = ["Oleg", "Anya", "Roma", "Dima", "Veronika", "Kim"];

const LONG_NAMES = [
  "Александра-Константиновна",
  "Владимир-Вячеславович",
  "Екатерина",
  "Роман",
  "Вероника",
  "Анастасия",
  "Дмитрий",
  "Ольга",
  "Святослав",
  "Аня",
];

const THE_LONGEST_NAME = "Вильгельмина-Аполлинария".padEnd(32, "я");

const A_SINGLE_GAME = 1;

const A_SHORT_EVENING = 6;

const A_QUALIFYING_EVENING = 5;

const A_DRAWN_EVENING = 8;

const A_MIXED_EVENING = 12;

const A_ROTATING_EVENING = 10;

const PAST_THE_CEILING = 40;

const TWO_AT_THE_TABLE = 2;

const THREE_AT_THE_TABLE = 3;

const FOUR_AT_THE_TABLE = 4;

const SIX_AT_THE_TABLE = 6;

const ARRIVES_AT = 4;

const LEAVES_AFTER = 6;

const GONE_FROM = 2;

const BACK_AT = 7;

const LATE_JOINER = 3;

const EARLY_LEAVER = 4;

const WANDERER = 5;

export const GALLERY: readonly Case[] = [
  {
    name: "one-game",
    locale: Locale.En,
    asks: "the shortest evening that draws anything at all",
    players: SHORT_NAMES.slice(NOBODY, THREE_AT_THE_TABLE),
    rounds: rotatingRounds(THREE_AT_THE_TABLE, A_SINGLE_GAME),
  },
  {
    name: "two-players",
    locale: Locale.Ru,
    asks: "the narrowest table, where every game is a win or a fool",
    players: SHORT_NAMES.slice(NOBODY, TWO_AT_THE_TABLE),
    rounds: rotatingRounds(TWO_AT_THE_TABLE, A_SHORT_EVENING),
  },
  {
    name: "crowded-table",
    locale: Locale.Ru,
    asks: "ten columns of long names — headings, legend and colours at their limit",
    players: LONG_NAMES,
    rounds: rotatingRounds(LONG_NAMES.length, A_QUALIFYING_EVENING),
  },
  {
    name: "crowded-and-burned",
    locale: Locale.Ru,
    asks: "ten long names on one winners line — the awards that crown the whole table",
    players: LONG_NAMES,
    rounds: rotatingRounds(LONG_NAMES.length, A_ROTATING_EVENING),
  },
  {
    name: "one-huge-name",
    locale: Locale.Ru,
    asks: "the longest name a player may have, beside two short ones",
    players: [THE_LONGEST_NAME, ...SHORT_NAMES.slice(NOBODY, TWO_AT_THE_TABLE)],
    rounds: rotatingRounds(THREE_AT_THE_TABLE, A_SHORT_EVENING),
  },
  {
    name: "over-the-ceiling",
    locale: Locale.Ru,
    asks: "more games than the sheet holds — row height at its floor, and the note that says so",
    players: SHORT_NAMES.slice(NOBODY, A_QUALIFYING_EVENING),
    rounds: rotatingRounds(A_QUALIFYING_EVENING, PAST_THE_CEILING),
  },
  {
    name: "all-drawn",
    locale: Locale.En,
    asks: "an evening nobody lost — no fool plate, and the draw states everywhere",
    players: SHORT_NAMES.slice(NOBODY, FOUR_AT_THE_TABLE),
    rounds: rotatingRounds(FOUR_AT_THE_TABLE, A_DRAWN_EVENING, true),
  },
  {
    name: "coming-and-going",
    locale: Locale.En,
    asks: "arrivals, departures and a gap in the middle — dashed stretches and absent cells",
    players: SHORT_NAMES,
    rounds: seatedRounds(SIX_AT_THE_TABLE, A_MIXED_EVENING, (player, round) => {
      if (player === LATE_JOINER) {
        return round >= ARRIVES_AT;
      }

      if (player === EARLY_LEAVER) {
        return round <= LEAVES_AFTER;
      }

      if (player === WANDERER) {
        return round < GONE_FROM || round >= BACK_AT;
      }

      return true;
    }),
  },
  {
    name: "everybody-burned",
    locale: Locale.Ru,
    asks: "the fool going right round the table — the rotation award and the table curse",
    players: SHORT_NAMES.slice(NOBODY, A_QUALIFYING_EVENING),
    rounds: rotatingRounds(A_QUALIFYING_EVENING, A_ROTATING_EVENING),
  },
];

export interface Drawing {
  readonly file: string;
  readonly asks: string;
  readonly svg: string;
}

const drawingsFor = (shown: Case): readonly Drawing[] => {
  const copy = copyIn(shown.locale);
  const evening = eveningOf(shown);
  const honours = honoursFor(evening);

  return [
    {
      file: `${shown.name}-chronology`,
      asks: shown.asks,
      svg: renderScoresheet(copy, evening),
    },
    ...(honours === null
      ? []
      : [
          {
            file: `${shown.name}-awards`,
            asks: shown.asks,
            svg: renderAwards(copy, evening, honours),
          },
        ]),
  ];
};

export const gallery = (): readonly Drawing[] => GALLERY.flatMap(drawingsFor);
