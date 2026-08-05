import { AwardName } from "#scoresheet/domain/awards/award-catalogue.ts";
import type { SeriesChronology } from "#shared/repository/repository-contract.ts";
import type { Award, Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import { sessionAppearances, type SessionAppearances } from "#scoresheet/domain/session-appearances.ts";
import { foolOfTheNight, kingOfTheTable } from "#scoresheet/domain/awards/share-awards.ts";
import { allOrNothing, theInvisible, untouchable } from "#scoresheet/domain/awards/position-awards.ts";
import { encore, sweetRevenge, teflon } from "#scoresheet/domain/awards/streak-awards.ts";
import {
  firstBlood,
  ironSeat,
  theIrishGoodbye,
  theTruce,
} from "#scoresheet/domain/awards/attendance-awards.ts";
import { dealersCurse, tableCurse } from "#scoresheet/domain/awards/dealer-awards.ts";


export const EVENING_MINIMUM = 5;

const MOST_AWARDS = 9;

const FROM_THE_TOP = 0;

const THE_FOOL = 1;

const RULES_IN_ORDER: readonly ((evening: SessionAppearances) => Award | null)[] = [
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
  award.name === AwardName.FirstBlood &&
  fool !== null &&
  award.winners.some((winner) => fool.winners.includes(winner));

export const honoursFor = (chronology: SeriesChronology): Honours | null => {
  if (chronology.games.length < EVENING_MINIMUM) {
    return null;
  }

  const evening = sessionAppearances(chronology);
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
