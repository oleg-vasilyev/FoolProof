import type { CareerHistory } from "#shared/repository/repository-contract.ts";
import type { Career } from "#scoresheet/domain/career/career-appearances.ts";
import type { CareerTally } from "#scoresheet/domain/career/career-tally.ts";
import type { EveningShare } from "#scoresheet/domain/career/career-evenings.ts";


export interface CareerSubject {
  readonly history: CareerHistory;
  readonly career: Career;
  readonly tally: CareerTally;
  readonly nights: readonly EveningShare[];
}
