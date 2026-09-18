import { GATE, type Gate } from "../shared/gate-names.ts";
import { FAMILIES } from "../mutation/mutation-families.ts";
import { familyScore, type FamilyScore } from "../mutation/family-scores.ts";
import {
  CHECK_DOCS_COMPLAINTS,
  COVERAGE_SUMMARY,
  E2E_RESULTS,
  HARNESS_RESULTS,
  LINT_FINDINGS,
  TESTS_RESULTS,
} from "../shared/gate-paths.ts";
import type { Reader } from "../shared/report-reader.ts";
import type { Finding } from "../shared/finding.ts";
import { complaintsIn } from "../check-docs/check-docs-complaints.ts";
import { lintFindingsIn } from "../lint/lint-findings.ts";
import { typecheckFindingsIn } from "../typecheck/typecheck-findings.ts";
import { casesIn, ratesIn, resultsIn, type CaseCount, type CoverageRates } from "../test/test-results.ts";


export type MutationScope = "the diff" | "everything" | `since ${string}` | `named ${string}`;

export type GateNumbers =
  | { readonly kind: "none" }
  | { readonly kind: "findings"; readonly findings: readonly Finding[] }
  | { readonly kind: "complaints"; readonly complaints: readonly string[] }
  | ({ readonly kind: "harness" } & CaseCount)
  | ({ readonly kind: "tests" } & CaseCount)
  | ({ readonly kind: "coverage" } & CaseCount & CoverageRates)
  | { readonly kind: "mutation"; readonly scope: MutationScope; readonly families: readonly FamilyScore[] }
  | ({ readonly kind: "e2e" } & CaseCount)
  | { readonly kind: "missing"; readonly expected: string };

const NO_ARGUMENTS = 0;

export const outputsOf = (gate: Gate): readonly string[] => {
  switch (gate) {
    case GATE.typecheck:
    case GATE.e2eTypecheck:
      return [];

    case GATE.checkDocs:
      return [CHECK_DOCS_COMPLAINTS];

    case GATE.lint:
      return [LINT_FINDINGS];

    case GATE.harness:
      return [HARNESS_RESULTS];

    case GATE.test:
      return [TESTS_RESULTS];

    case GATE.coverage:
      return [TESTS_RESULTS, COVERAGE_SUMMARY];

    case GATE.mutationChanged:
    case GATE.mutation:
      return FAMILIES.map((family) => family.report);

    case GATE.e2e:
    case GATE.e2eChanged:
      return [E2E_RESULTS];
  }
};

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

const testNumbers = (read: Reader, kind: "harness" | "tests" | "e2e", path: string): GateNumbers => {
  const results = resultsIn(read, path);

  return results === null ? { kind: "missing", expected: path } : { kind, ...casesIn(results, kind === "e2e") };
};

const coverageNumbers = (read: Reader): GateNumbers => {
  const results = resultsIn(read, TESTS_RESULTS);
  const rates = ratesIn(read, COVERAGE_SUMMARY);

  if (results === null) {
    return { kind: "missing", expected: TESTS_RESULTS };
  }

  if (rates === null) {
    return { kind: "tests", ...casesIn(results, false) };
  }

  return { kind: "coverage", ...casesIn(results, false), ...rates };
};

const lintNumbers = (read: Reader): GateNumbers => {
  const json = read(LINT_FINDINGS);

  return json === null ? { kind: "missing", expected: LINT_FINDINGS } : { kind: "findings", findings: lintFindingsIn(json) };
};

const checkDocsNumbers = (read: Reader): GateNumbers => {
  const json = read(CHECK_DOCS_COMPLAINTS);

  return json === null
    ? { kind: "missing", expected: CHECK_DOCS_COMPLAINTS }
    : { kind: "complaints", complaints: complaintsIn(json) };
};

const mutationNumbers = (read: Reader, scope: MutationScope): GateNumbers => ({
  kind: "mutation",
  scope,
  families: FAMILIES.flatMap((family) => {
    const score = familyScore(read, family);

    return score === null ? [] : [score];
  }),
});

export const numbersFor = (
  gate: Gate,
  scope: MutationScope,
  read: Reader,
  output: readonly string[]
): GateNumbers => {
  switch (gate) {
    case GATE.checkDocs:
      return checkDocsNumbers(read);

    case GATE.lint:
      return lintNumbers(read);

    case GATE.typecheck:
    case GATE.e2eTypecheck:
      return { kind: "findings", findings: typecheckFindingsIn(output) };

    case GATE.harness:
      return testNumbers(read, "harness", HARNESS_RESULTS);

    case GATE.test:
      return testNumbers(read, "tests", TESTS_RESULTS);

    case GATE.coverage:
      return coverageNumbers(read);

    case GATE.mutationChanged:
    case GATE.mutation:
      return mutationNumbers(read, scope);

    case GATE.e2e:
      return testNumbers(read, "e2e", E2E_RESULTS);

    case GATE.e2eChanged:
      return read(E2E_RESULTS) === null ? { kind: "none" } : testNumbers(read, "e2e", E2E_RESULTS);
  }
};
