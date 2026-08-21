import { Locale } from "#shared/locale/locales.ts";
import { copyIn } from "#scoresheet/copy.ts";
import { honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import type { Finalist, SeriesChronology } from "#shared/repository/repository-contract.ts";
import { handleOf } from "#scoresheet/render/poster-baseboard.ts";
import { BOT_HANDLE } from "./bot-handle.ts";
import { personalCards } from "./gallery-careers.ts";


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
  readonly burned: boolean;
}

interface Case {
  readonly name: string;
  readonly locale: Locale;
  readonly asks: string;
  readonly players: readonly string[];
  readonly rounds: readonly Round[];
  readonly handle?: string;
}

const rotate = (order: readonly number[], by: number): readonly number[] =>
  order.length === NOBODY ? order : [...order.slice(by % order.length), ...order.slice(NOBODY, by % order.length)];

const everyone = (players: number): readonly number[] =>
  Array.from({ length: players }, (_unused, seat) => seat);

const rotatingRounds = (
  players: number,
  rounds: number,
  drawn = false,
  burned = false
): readonly Round[] =>
  Array.from({ length: rounds }, (_unused, round) => ({
    order: rotate(everyone(players), round),
    drawn,
    burned,
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
    burned: false,
  }));

const positionIn = (round: Round, at: number): number => {
  if (round.burned) {
    return at === FIRST_OUT ? round.order.length : at;
  }

  return round.drawn && at >= round.order.length - SHARED_LAST
    ? round.order.length - ONE_PLACE
    : at + FIRST_PLACE;
};

const placementsOf = (round: Round): readonly Finalist[] =>
  round.order.map((player, at) => ({
    playerId: player + FIRST_ID,
    position: positionIn(round, at),
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

const WIDEST_HANDLE = handleOf("W".repeat(32));

const SHORTEST_HANDLE = handleOf("durak");

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

const OVER_THE_EVENING = 13;

const RESTING_EACH_GAME = 3;

const restsThisRound = (player: number, round: number): boolean =>
  Array.from(
    { length: RESTING_EACH_GAME },
    (_unused, at) => ((round * RESTING_EACH_GAME) % OVER_THE_EVENING + at) % OVER_THE_EVENING
  ).includes(player);

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
    asks: "ten long names who all stayed — headings, legend and colours at the limit one game may seat",
    players: LONG_NAMES,
    rounds: rotatingRounds(LONG_NAMES.length, A_QUALIFYING_EVENING),
  },
  {
    name: "crowded-and-burned",
    locale: Locale.Ru,
    asks: "ten long names over a long evening — the widest winners lines the card can draw",
    players: LONG_NAMES,
    rounds: rotatingRounds(LONG_NAMES.length, A_ROTATING_EVENING),
  },
  {
    name: "three-legend-rows",
    locale: Locale.Ru,
    asks: "thirteen players over one evening, never more than ten at a table at once — the third legend row, and the lower ceiling it costs",
    players: [...LONG_NAMES, ...SHORT_NAMES.slice(NOBODY, THREE_AT_THE_TABLE)],
    rounds: seatedRounds(
      OVER_THE_EVENING,
      A_ROTATING_EVENING,
      (player, round) => !restsThisRound(player, round)
    ),
  },
  {
    name: "crowded-past-the-ceiling",
    locale: Locale.Ru,
    asks: "ten long names and more games than a two-row legend leaves room for",
    players: LONG_NAMES,
    rounds: rotatingRounds(LONG_NAMES.length, PAST_THE_CEILING),
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
    asks: "whoever opened was left the fool, every game — the table curse at its worst, and the awards it draws onto whoever opened first",
    players: SHORT_NAMES.slice(NOBODY, A_QUALIFYING_EVENING),
    rounds: rotatingRounds(A_QUALIFYING_EVENING, A_ROTATING_EVENING, false, true),
  },
  {
    name: "widest-handle",
    locale: Locale.En,
    asks: "the widest handle Telegram allows — a full-width baseboard takes all 33 characters at full size, with nothing scaled to fit",
    players: [THE_LONGEST_NAME, ...SHORT_NAMES.slice(NOBODY, TWO_AT_THE_TABLE)],
    rounds: rotatingRounds(THREE_AT_THE_TABLE, A_QUALIFYING_EVENING),
    handle: WIDEST_HANDLE,
  },
  {
    name: "shortest-handle",
    locale: Locale.Ru,
    asks: "the shortest handle Telegram allows — still the sheet's own mark rather than a stray word",
    players: SHORT_NAMES.slice(NOBODY, THREE_AT_THE_TABLE),
    rounds: rotatingRounds(THREE_AT_THE_TABLE, A_QUALIFYING_EVENING),
    handle: SHORTEST_HANDLE,
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
      svg: renderScoresheet(copy, evening, shown.handle ?? BOT_HANDLE),
    },
    ...(honours === null
      ? []
      : [
          {
            file: `${shown.name}-awards`,
            asks: shown.asks,
            svg: renderAwards(copy, evening, honours, shown.handle ?? BOT_HANDLE),
          },
        ]),
  ];
};

export const gallery = (): readonly Drawing[] => [
  ...GALLERY.flatMap(drawingsFor),
  ...personalCards(),
];
