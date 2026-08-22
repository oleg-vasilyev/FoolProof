import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { NEUTRAL } from "#scoresheet/domain/scoring.ts";
import type { CareerAppearance } from "#scoresheet/domain/career/career-appearances.ts";


const NOTHING = 0;

const ONE_SEAT = 1;

export interface CareerTally {
  readonly games: number;
  readonly evenings: number;
  readonly shareChance: number;
  readonly fools: number;
  readonly decided: number;
  readonly foolRate: number;
  readonly seatChanceInDecided: number;
  readonly firsts: number;
  readonly firstRate: number;
  readonly seatChance: number;
  readonly opens: number;
  readonly openRate: number;
}

const rateOf = (part: number, whole: number): number =>
  whole === NOTHING ? NOTHING : part / whole;

const seatChanceOver = (appearances: readonly CareerAppearance[]): number =>
  rateOf(
    appearances.reduce(
      (chances, appearance) => chances + rateOf(ONE_SEAT, appearance.tableSize),
      NOTHING
    ),
    appearances.length
  );

const finishing = (
  appearances: readonly CareerAppearance[],
  finish: Finish
): readonly CareerAppearance[] => appearances.filter((appearance) => appearance.finish === finish);

export const careerTally = (appearances: readonly CareerAppearance[]): CareerTally => {
  const decided = appearances.filter((appearance) => appearance.finish !== Finish.Drawn);
  const fools = finishing(decided, Finish.Fool).length;
  const firsts = finishing(appearances, Finish.First).length;
  const opens = appearances.filter((appearance) => appearance.opened).length;

  return {
    games: appearances.length,
    evenings: new Set(appearances.map((appearance) => appearance.seriesNo)).size,
    shareChance: NEUTRAL,
    fools,
    decided: decided.length,
    foolRate: rateOf(fools, decided.length),
    seatChanceInDecided: seatChanceOver(decided),
    firsts,
    firstRate: rateOf(firsts, appearances.length),
    seatChance: seatChanceOver(appearances),
    opens,
    openRate: rateOf(opens, appearances.length),
  };
};
