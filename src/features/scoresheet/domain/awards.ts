import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { Award, Honours } from "#scoresheet/domain/award-catalogue.ts";
import { eveningOf, type Evening } from "#scoresheet/domain/evening.ts";
import { foolOfTheNight, kingOfTheTable } from "#scoresheet/domain/share-awards.ts";
import { allOrNothing, theInvisible, untouchable } from "#scoresheet/domain/position-awards.ts";
import { encore, sweetRevenge, teflon } from "#scoresheet/domain/streak-awards.ts";
import {
  firstBlood,
  ironSeat,
  theIrishGoodbye,
  theTruce,
} from "#scoresheet/domain/attendance-awards.ts";
import { dealersCurse, tableCurse } from "#scoresheet/domain/dealer-awards.ts";


export const EVENING_MINIMUM = 5;

const MOST_AWARDS = 9;

const FROM_THE_TOP = 0;

const THE_FOOL = 1;

const RULES_IN_ORDER: readonly ((evening: Evening) => Award | null)[] = [
  kingOfTheTable,
  untouchable,
  teflon,
  sweetRevenge,
  ironSeat,
  theTruce,
  allOrNothing,
  theInvisible,
  theIrishGoodbye,
  dealersCurse,
  encore,
  firstBlood,
];

const repeatsTheFool = (award: Award, fool: Award | null): boolean =>
  award.name === "firstBlood" &&
  fool !== null &&
  award.winners.some((winner) => fool.winners.includes(winner));

export const honoursFor = (chronology: SeriesChronology): Honours | null => {
  if (chronology.games.length < EVENING_MINIMUM) {
    return null;
  }

  const evening = eveningOf(chronology);
  const fool = foolOfTheNight(evening);
  const room = fool === null ? MOST_AWARDS : MOST_AWARDS - THE_FOOL;
  const earned = RULES_IN_ORDER.flatMap((rule) => rule(evening) ?? [])
    .filter((award) => !repeatsTheFool(award, fool))
    .slice(FROM_THE_TOP, room);

  return {
    awards: fool === null ? earned : [...earned, fool],
    curse: tableCurse(evening),
  };
};
