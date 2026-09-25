import { GATE, type Gate } from "../shared/gate-names.ts";
import { FAMILIES } from "../mutation/mutation-families.ts";
import { familyScore, type FamilyScore } from "../mutation/family-scores.ts";
import {
  CHECK_DOCS_COMPLAINTS,
  COVERAGE_SUMMARY,
  E2E_SELECTION,
  LINT_FINDINGS,
  RESULTS,
  TYPECHECK_FINDINGS,
  inRun,
} from "../shared/gate-paths.ts";
import { selectionIn, type E2eSelection } from "../e2e/e2e-selection.ts";
import type { Reader } from "../shared/report-reader.ts";
import { savedFindingsIn, type Finding } from "../shared/finding.ts";
import { complaintsIn } from "../check-docs/shared/complaints-report.ts";
import { lintFindingsIn } from "../lint/lint-findings.ts";
import { casesIn, ratesIn, resultsIn, type CaseCount, type CoverageRates } from "../test/test-results.ts";


export type MutationScope = "the diff" | "everything" | `since ${string}` | `named ${string}`;

export type GateNumbers =
  | { readonly kind: "findings"; readonly findings: readonly Finding[] }
  | { readonly kind: "complaints"; readonly complaints: readonly string[] }
  | ({ readonly kind: "harness" } & CaseCount)
  | ({ readonly kind: "tests" } & CaseCount)
  | ({ readonly kind: "coverage" } & CaseCount & CoverageRates)
  | { readonly kind: "mutation"; readonly scope: MutationScope; readonly families: readonly FamilyScore[] }
  | ({ readonly kind: "e2e"; readonly selection: E2eSelection } & CaseCount)
  | { readonly kind: "missing"; readonly expected: string };

const NO_ARGUMENTS = 0;

export const scopeOf = (
  gate: Gate,
  mutateAgainst: string | undefined,
  args: readonly string[] = []
): MutationScope => {
  if (gate === GATE.mutation) {
    return "everything";
  }

  if (args.length > NO_ARGUMENTS) {
    return `named ${String(args.length)}`;
  }

  return mutateAgainst === undefined ? "the diff" : `since ${mutateAgainst}`;
};

const testNumbers = (read: Reader, kind: "harness" | "tests", path: string): GateNumbers => {
  const results = resultsIn(read, path);

  return results === null ? { kind: "missing", expected: path } : { kind, ...casesIn(results, false) };
};

const coverageNumbers = (read: Reader, folder: string): GateNumbers => {
  const results = resultsIn(read, inRun(folder, RESULTS));
  const rates = ratesIn(read, inRun(folder, COVERAGE_SUMMARY));

  if (results === null) {
    return { kind: "missing", expected: inRun(folder, RESULTS) };
  }

  if (rates === null) {
    return { kind: "tests", ...casesIn(results, false) };
  }

  return { kind: "coverage", ...casesIn(results, false), ...rates };
};

const lintNumbers = (read: Reader, path: string): GateNumbers => {
  const json = read(path);

  return json === null ? { kind: "missing", expected: path } : { kind: "findings", findings: lintFindingsIn(json) };
};

const checkDocsNumbers = (read: Reader, path: string): GateNumbers => {
  const json = read(path);

  return json === null
    ? { kind: "missing", expected: path }
    : { kind: "complaints", complaints: complaintsIn(json) };
};

const mutationNumbers = (read: Reader, scope: MutationScope, folder: string): GateNumbers => ({
  kind: "mutation",
  scope,
  families: FAMILIES.flatMap((family) => {
    const score = familyScore(read, family, folder);

    return score === null ? [] : [score];
  }),
});

const NO_CASES = 0;

const savedFindings = (read: Reader, path: string): GateNumbers => {
  const json = read(path);
  const findings = json === null ? null : savedFindingsIn(json);

  return findings === null ? { kind: "missing", expected: path } : { kind: "findings", findings };
};

const selectionRead = (read: Reader, path: string): E2eSelection | null => {
  const json = read(path);

  return json === null ? null : selectionIn(json);
};

const played = (read: Reader, selection: E2eSelection, path: string): GateNumbers => {
  const results = resultsIn(read, path);

  return results === null
    ? { kind: "missing", expected: path }
    : { kind: "e2e", selection, ...casesIn(results, true) };
};

const e2eNumbers = (read: Reader, selection: E2eSelection | null, folder: string): GateNumbers => {
  if (selection === null) {
    return { kind: "missing", expected: inRun(folder, E2E_SELECTION) };
  }

  switch (selection.kind) {
    case "nothing":
      return { kind: "e2e", selection, cases: NO_CASES, files: NO_CASES, failed: NO_CASES, failures: [] };

    case "everything":
    case "scenarios":
      return played(read, selection, inRun(folder, RESULTS));
  }
};

export const numbersFor = (gate: Gate, scope: MutationScope, read: Reader, folder: string): GateNumbers => {
  switch (gate) {
    case GATE.checkDocs:
      return checkDocsNumbers(read, inRun(folder, CHECK_DOCS_COMPLAINTS));

    case GATE.lint:
      return lintNumbers(read, inRun(folder, LINT_FINDINGS));

    case GATE.typecheck:
    case GATE.e2eTypecheck:
      return savedFindings(read, inRun(folder, TYPECHECK_FINDINGS));

    case GATE.harness:
      return testNumbers(read, "harness", inRun(folder, RESULTS));

    case GATE.test:
      return testNumbers(read, "tests", inRun(folder, RESULTS));

    case GATE.coverage:
      return coverageNumbers(read, folder);

    case GATE.mutationChanged:
    case GATE.mutation:
      return mutationNumbers(read, scope, folder);

    case GATE.e2e:
      return e2eNumbers(read, { kind: "everything" }, folder);

    case GATE.e2eChanged:
      return e2eNumbers(read, selectionRead(read, inRun(folder, E2E_SELECTION)), folder);
  }
};
