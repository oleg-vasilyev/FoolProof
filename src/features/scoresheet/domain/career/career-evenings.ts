import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { shareAt } from "#scoresheet/domain/scoring.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";


const NOTHING = 0;

const LAST = -1;

const FIRST = 0;

export const ENOUGH_TO_JUDGE_A_NIGHT = 3;

export const ENOUGH_NIGHTS_TO_CHART = 5;

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

const outranks = (challenger: EveningShare, holder: EveningShare, wanted: number): boolean => {
  const theirs = challenger.share * wanted;
  const held = holder.share * wanted;

  return (
    theirs > held ||
    (theirs === held && challenger.games > holder.games) ||
    (theirs === held && challenger.games === holder.games && challenger.seriesNo < holder.seriesNo)
  );
};

const pick = (nights: readonly EveningShare[], wanted: number): EveningShare | null =>
  nights
    .filter((night) => night.games >= ENOUGH_TO_JUDGE_A_NIGHT)
    .reduce<EveningShare | null>(
      (holder, challenger) =>
        holder === null || outranks(challenger, holder, wanted) ? challenger : holder,
      null
    );

const HIGHEST = 1;

const LOWEST = -1;

export const bestEvening = (nights: readonly EveningShare[]): EveningShare | null =>
  pick(nights, HIGHEST);

export const worstEvening = (nights: readonly EveningShare[]): EveningShare | null =>
  pick(nights, LOWEST);
