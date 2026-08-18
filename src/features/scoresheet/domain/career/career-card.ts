import type { CareerHistory } from "#shared/repository/repository-contract.ts";
import { careerOf } from "#scoresheet/domain/career/career-appearances.ts";
import { careerTally, type CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import {
  bestEvening,
  eveningShares,
  worstEvening,
  type EveningShare,
} from "#scoresheet/domain/career/career-evenings.ts";
import { careerFacts } from "#scoresheet/domain/career/facts/career-facts.ts";
import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";


const FIRST = 0;

export interface CareerCard {
  readonly playerId: number;
  readonly displayName: string;
  readonly since: string;
  readonly share: number;
  readonly tally: CareerTally;
  readonly nights: readonly EveningShare[];
  readonly best: EveningShare | null;
  readonly worst: EveningShare | null;
  readonly facts: readonly CareerFact[];
}

const otherThan = (worst: EveningShare | null, best: EveningShare | null): EveningShare | null =>
  worst === null || worst.seriesNo === best?.seriesNo ? null : worst;

export const careerCard = (history: CareerHistory, playerId: number): CareerCard | null => {
  const career = careerOf(history, playerId);
  const opening = career?.appearances[FIRST];

  if (career === null || opening === undefined) {
    return null;
  }

  const nights = eveningShares(career.appearances);
  const best = bestEvening(nights);
  const tally = careerTally(career.appearances);

  return {
    playerId,
    displayName: career.displayName,
    since: opening.playedOn,
    share: career.share,
    tally,
    nights,
    best,
    worst: otherThan(worstEvening(nights), best),
    facts: careerFacts({ history, career, tally, nights }),
  };
};
