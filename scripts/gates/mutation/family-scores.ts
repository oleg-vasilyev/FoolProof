import { calculateMetrics } from "mutation-testing-metrics";
import { parse, type Reader } from "../shared/report-reader.ts";
import { survivorsIn, type ReportedFiles, type Survivors } from "./surviving-mutants.ts";
import type { Family, FamilyName } from "./mutation-families.ts";


const NO_VALID_MUTANTS = 0;

export interface FamilyScore {
  readonly family: FamilyName;
  readonly score: number | null;
  readonly bar: number;
  readonly killed: number;
  readonly survived: number;
  readonly noCoverage: number;
  readonly timeout: number;
  readonly survivors: Survivors;
}

interface MutationReport {
  readonly files: Parameters<typeof calculateMetrics>[0] & ReportedFiles;
}

interface StrykerConfig {
  readonly thresholds: { readonly break: number };
}

export const familyScore = (read: Reader, family: Family): FamilyScore | null => {
  const report = parse<MutationReport>(read, family.report);
  const config = parse<StrykerConfig>(read, family.config);

  if (report === null || config === null) {
    return null;
  }

  const metrics = calculateMetrics(report.files).metrics;

  return {
    family: family.family,
    score: metrics.totalValid === NO_VALID_MUTANTS ? null : metrics.mutationScore,
    bar: config.thresholds.break,
    killed: metrics.killed,
    survived: metrics.survived,
    noCoverage: metrics.noCoverage,
    timeout: metrics.timeout,
    survivors: survivorsIn(report.files),
  };
};
