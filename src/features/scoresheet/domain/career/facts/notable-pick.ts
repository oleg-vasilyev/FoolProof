import { notable } from "#scoresheet/domain/career/facts/noise-floor.ts";
import { rarestOf, type Rare } from "#scoresheet/domain/career/facts/rarest-of.ts";
import type { CareerFact } from "#scoresheet/domain/career/facts/fact-catalogue.ts";


export const notablePick = (field: readonly Rare<CareerFact>[]): CareerFact | null => {
  const rarest = rarestOf(field);

  return rarest !== null && notable(rarest.tail, field.length) ? rarest.fact : null;
};
