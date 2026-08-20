import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { shareAt } from "#scoresheet/domain/scoring.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";


const NOTHING = 0;

const LAST = -1;

const FIRST = 0;

export const ENOUGH_TO_JUDGE_A_NIGHT = 3;

export const ENOUGH_NIGHTS_TO_CHART = 5;

export const eveningsShortOfChart = (nights: number): number =>
  Math.max(ENOUGH_NIGHTS_TO_CHART - nights, NOTHING);

export interface EveningShare {
  readonly seriesNo: number;
  readonly playedOn: string;
  readonly games: number;
  readonly decided: number;
  readonly fools: number;
  readonly firsts: number;
  readonly share: number;
}

type Night = readonly CareerAppearance[];

const byNight = (appearances: readonly CareerAppearance[]): readonly Night[] =>
  appearances.reduce<readonly Night[]>((nights, appearance) => {
    const open = nights.at(LAST);

    return open === undefined || open[FIRST]?.seriesNo !== appearance.seriesNo
      ? [...nights, [appearance]]
      : [...nights.slice(FIRST, LAST), [...open, appearance]];
  }, []);

const shareAcross = (night: Night): number =>
  night.reduce(
    (shares, appearance) => shares + shareAt(appearance.position, appearance.tableSize),
    NOTHING
  ) / night.length;

const summarise = (night: Night): readonly EveningShare[] => {
  const opening = night[FIRST];

  return opening === undefined
    ? []
    : [
        {
          seriesNo: opening.seriesNo,
          playedOn: opening.playedOn,
          games: night.length,
          decided: night.filter((appearance) => appearance.finish !== Finish.Drawn).length,
          fools: night.filter((appearance) => appearance.finish === Finish.Fool).length,
          firsts: night.filter((appearance) => appearance.finish === Finish.First).length,
          share: shareAcross(night),
        },
      ];
};

export const eveningShares = (
  appearances: readonly CareerAppearance[]
): readonly EveningShare[] => byNight(appearances).flatMap(summarise);

const ALONE = 1;

type Furthest = (...shares: readonly number[]) => number;

const pick = (nights: readonly EveningShare[], furthestOf: Furthest): EveningShare | null => {
  const judged = nights.filter((night) => night.games >= ENOUGH_TO_JUDGE_A_NIGHT);
  const furthest = furthestOf(...judged.map((night) => night.share));
  const holders = judged.filter((night) => night.share === furthest);

  return holders.length === ALONE ? (holders[FIRST] ?? null) : null;
};

export const bestEvening = (nights: readonly EveningShare[]): EveningShare | null =>
  pick(nights, Math.max);

export const worstEvening = (nights: readonly EveningShare[]): EveningShare | null =>
  pick(nights, Math.min);
