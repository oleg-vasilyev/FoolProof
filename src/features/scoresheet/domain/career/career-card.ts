import type { CareerHistory } from "#shared/repository/repository-contract.ts";
import { careerOf } from "#scoresheet/domain/career/career-appearances.ts";
import { careerTally, type CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import {
  bestEvening,
  eveningShares,
  worstEvening,
  type EveningShare,
} from "#scoresheet/domain/career/career-evenings.ts";
import { longestCleanStreak, type CleanStreak } from "#scoresheet/domain/career/clean-streak.ts";
import { chiefRival, type Rival } from "#scoresheet/domain/career/career-rival.ts";


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
  readonly streak: CleanStreak | null;
  readonly rival: Rival | null;
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

  return {
    playerId,
    displayName: career.displayName,
    since: opening.playedOn,
    share: career.share,
    tally: careerTally(career.appearances),
    nights,
    best,
    worst: otherThan(worstEvening(nights), best),
    streak: longestCleanStreak(career.appearances),
    rival: chiefRival(history, playerId),
  };
};
