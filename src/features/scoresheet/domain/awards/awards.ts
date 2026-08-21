import { AwardName, RAREST_FIRST } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { Award, Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import { sessionAppearances, type SessionAppearances } from "#scoresheet/domain/session-appearances.ts";
import { foolOfTheNight, kingOfTheTable } from "#scoresheet/domain/awards/share-awards.ts";
import {
  allOrNothing,
  theAnchor,
  theFavourite,
  theInvisible,
  theUnderstudy,
  untouchable,
} from "#scoresheet/domain/awards/position-awards.ts";
import { encore, secondWind, sweetRevenge, teflon } from "#scoresheet/domain/awards/streak-awards.ts";
import {
  firstBlood,
  ironSeat,
  revolvingDoor,
  theCameo,
  theIrishGoodbye,
  theLatecomer,
} from "#scoresheet/domain/awards/attendance-awards.ts";
import {
  homeAdvantage,
  hotSeat,
  neverAsked,
  openersCurse,
  tableCurse,
  theDoorman,
} from "#scoresheet/domain/awards/opener-awards.ts";
import {
  groundhogDay,
  hatTrick,
  thePendulum,
  theLadder,
  theSlide,
} from "#scoresheet/domain/awards/run-awards.ts";
import {
  falseDawn,
  theComeback,
  theFlatline,
  theRollercoaster,
  wireToWire,
} from "#scoresheet/domain/awards/chart-awards.ts";
import { thePacifist, theTruce } from "#scoresheet/domain/awards/table-awards.ts";
import { theNemesis } from "#scoresheet/domain/awards/rivalry-awards.ts";


export const EVENING_MINIMUM = 5;

const MOST_AWARDS = 9;

const ONE_ROW = 1;

const NO_ROWS = 0;

const NOT_SHORT = 0;

const RULES_IN_ORDER: readonly ((evening: SessionAppearances) => Award | null)[] = [
  kingOfTheTable,
  wireToWire,
  theFavourite,
  hatTrick,
  homeAdvantage,
  untouchable,
  teflon,
  hotSeat,
  theComeback,
  theLadder,
  sweetRevenge,
  ironSeat,
  theTruce,
  thePacifist,
  theNemesis,
  theDoorman,
  neverAsked,
  theLatecomer,
  revolvingDoor,
  theCameo,
  secondWind,
  theUnderstudy,
  theFlatline,
  theInvisible,
  groundhogDay,
  thePendulum,
  theRollercoaster,
  allOrNothing,
  theIrishGoodbye,
  theAnchor,
  theSlide,
  falseDawn,
  openersCurse,
  encore,
  firstBlood,
  foolOfTheNight,
];

interface Selection {
  readonly king: Award | null;
  readonly fool: Award | null;
  readonly rest: readonly Award[];
}

const OVERSHADOWED: readonly (readonly [AwardName, AwardName])[] = [
  [AwardName.FirstBlood, AwardName.FoolOfTheNight],
  [AwardName.FirstBlood, AwardName.SecondWind],
  [AwardName.HotSeat, AwardName.HomeAdvantage],
  [AwardName.TheFavourite, AwardName.King],
];

const sharesAWinner = (award: Award, other: Award): boolean =>
  award.winners.some((winner) => other.winners.includes(winner));

const saysNothingNew = (award: Award, fired: readonly Award[]): boolean =>
  OVERSHADOWED.some(
    ([lesser, greater]) =>
      award.name === lesser &&
      fired.some((other) => other.name === greater && sharesAWinner(award, other))
  );

const rarestFirst = (one: Award, other: Award): number =>
  RAREST_FIRST.indexOf(one.name) - RAREST_FIRST.indexOf(other.name);

const splitOut = (fired: readonly Award[]): Selection => {
  const king = fired.find((award) => award.name === AwardName.King) ?? null;
  const fool = fired.find((award) => award.name === AwardName.FoolOfTheNight) ?? null;

  return {
    king,
    fool,
    rest: fired.filter(
      (award) => award !== king && award !== fool && !saysNothingNew(award, fired)
    ),
  };
};

const roomFor = (selection: Selection): number =>
  MOST_AWARDS -
  (selection.king === null ? NO_ROWS : ONE_ROW) -
  (selection.fool === null ? NO_ROWS : ONE_ROW);

type Rows = ReadonlyMap<number, number>;

const rowsAfter = (rows: Rows, award: Award): Rows =>
  new Map([
    ...rows,
    ...award.winners.map(
      (winner) => [winner, (rows.get(winner) ?? NO_ROWS) + ONE_ROW] as const
    ),
  ]);

const mostRowsAmongWinnersOf = (award: Award, rows: Rows): number =>
  Math.max(...award.winners.map((winner) => rows.get(winner) ?? NO_ROWS));

const leastSaidAbout = (ranked: readonly Award[], rows: Rows): Award =>
  ranked.reduce((held, challenger) =>
    mostRowsAmongWinnersOf(challenger, rows) < mostRowsAmongWinnersOf(held, rows)
      ? challenger
      : held
  );

const spreadOut = (ranked: readonly Award[], rows: Rows, room: number): readonly Award[] => {
  if (room <= NO_ROWS || ranked.length === NO_ROWS) {
    return [];
  }

  const next = leastSaidAbout(ranked, rows);

  return [
    next,
    ...spreadOut(
      ranked.filter((award) => award !== next),
      rowsAfter(rows, next),
      room - ONE_ROW
    ),
  ];
};

const pinnedRows = (selection: Selection): Rows =>
  [selection.king, selection.fool]
    .filter((award): award is Award => award !== null)
    .reduce(rowsAfter, new Map<number, number>());

export const gamesShortOfAwards = (played: number): number =>
  Math.max(EVENING_MINIMUM - played, NOT_SHORT);

export const honoursFor = (chronology: SeriesChronology): Honours | null => {
  if (chronology.games.length < EVENING_MINIMUM) {
    return null;
  }

  const evening = sessionAppearances(chronology);
  const fired = RULES_IN_ORDER.flatMap((rule) => rule(evening) ?? []);
  const selection = splitOut(fired);
  const chosen = spreadOut(
    [...selection.rest].sort(rarestFirst),
    pinnedRows(selection),
    roomFor(selection)
  );
  const printed = fired.filter(
    (award) => award === selection.king || chosen.includes(award)
  );

  return {
    awards: selection.fool === null ? printed : [...printed, selection.fool],
    curse: tableCurse(evening),
  };
};
