export type SurvivorStatus = "Survived" | "NoCoverage";

export interface Mutant {
  readonly file: string;
  readonly line: number;
  readonly replacement: string;
  readonly status: SurvivorStatus;
}

export interface Survivors {
  readonly named: readonly Mutant[];
  readonly total: number;
}

export const MOST_MUTANTS_NAMED = 20;

const NOTHING = 0;

const SURVIVOR_STATUSES: readonly string[] = ["Survived", "NoCoverage"];

interface ReportedMutant {
  readonly status: string;
  readonly replacement?: string;
  readonly location: { readonly start: { readonly line: number } };
}

export interface ReportedFiles {
  readonly [file: string]: { readonly mutants: readonly ReportedMutant[] };
}

const byFileThenLine = (a: Mutant, b: Mutant): number =>
  a.file.localeCompare(b.file) || a.line - b.line;

export const survivorsIn = (files: ReportedFiles): Survivors => {
  const all = Object.entries(files)
    .flatMap(([file, reported]) =>
      reported.mutants
        .filter((mutant) => SURVIVOR_STATUSES.includes(mutant.status))
        .map((mutant) => ({
          file,
          line: mutant.location.start.line,
          replacement: mutant.replacement ?? "",
          status: mutant.status as SurvivorStatus,
        }))
    )
    .sort(byFileThenLine);

  return { named: all.slice(NOTHING, MOST_MUTANTS_NAMED), total: all.length };
};
