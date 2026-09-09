import { calculateMetrics } from "mutation-testing-metrics";
import type { Gate } from "./gate-list.ts";
import { FAMILIES, type Family, type FamilyName } from "./mutation-families.ts";
import type { Finding } from "./finding.ts";
import { lintFindingsIn } from "./lint-findings.ts";
import { typecheckFindingsIn } from "./typecheck-findings.ts";
import { survivorsIn, type ReportedFiles, type Survivors } from "./surviving-mutants.ts";


export type MutationScope = "the diff" | "everything" | `since ${string}` | `named ${string}`;

export interface FamilyScore {
  readonly family: FamilyName;
  readonly score: number;
  readonly bar: number;
  readonly killed: number;
  readonly survived: number;
  readonly noCoverage: number;
  readonly timeout: number;
  readonly survivors: Survivors;
}

export interface Failure {
  readonly file: string;
  readonly name: string;
  readonly message: string;
  readonly botLog: string | null;
}

export interface CaseCount {
  readonly cases: number;
  readonly files: number;
  readonly failed: number;
  readonly failures: readonly Failure[];
}

export interface CoverageRates {
  readonly statements: number;
  readonly branches: number;
  readonly functions: number;
  readonly lines: number;
}

export type GateNumbers =
  | { readonly kind: "none" }
  | { readonly kind: "findings"; readonly findings: readonly Finding[] }
  | ({ readonly kind: "harness" } & CaseCount)
  | ({ readonly kind: "tests" } & CaseCount)
  | ({ readonly kind: "coverage" } & CaseCount & CoverageRates)
  | { readonly kind: "mutation"; readonly scope: MutationScope; readonly families: readonly FamilyScore[] }
  | ({ readonly kind: "e2e" } & CaseCount)
  | { readonly kind: "missing"; readonly expected: string };

export type Reader = (path: string) => string | null;

export const TESTS_RESULTS = "reports/tests/results.json";

export const HARNESS_RESULTS = "reports/tests/harness-results.json";

export const COVERAGE_SUMMARY = "reports/coverage/coverage-summary.json";

export const E2E_RESULTS = "reports/e2e/results.json";

export const LINT_FINDINGS = "reports/lint/findings.json";

export const BOT_LOGS = "reports/e2e/bot";

export const MOST_FAILURES = 10;

export const MOST_MESSAGE_LINES = 3;

const NO_ARGUMENTS = 0;

const FIRST = 0;

const FAILED = "failed";

const A_STACK_FRAME = /^\s+at /;

const NOT_A_FILE_NAME = /[^a-z0-9]+/g;

const A_DASH_AT_AN_END = /^-|-$/g;

interface AssertionResult {
  readonly fullName: string;
  readonly ancestorTitles?: readonly string[];
  readonly status: string;
  readonly failureMessages: readonly string[];
}

interface FileResult {
  readonly name: string;
  readonly status?: string;
  readonly message?: string;
  readonly assertionResults: readonly AssertionResult[];
}

interface VitestResults {
  readonly numTotalTests: number;
  readonly numFailedTests: number;
  readonly testResults: readonly FileResult[];
}

interface CoverageSummary {
  readonly total: Record<keyof CoverageRates, { readonly pct: number }>;
}

interface MutationReport {
  readonly files: Parameters<typeof calculateMetrics>[0] & ReportedFiles;
}

interface StrykerConfig {
  readonly thresholds: { readonly break: number };
}

const parse = <T>(read: Reader, path: string): T | null => {
  const text = read(path);

  if (text === null) {
    return null;
  }

  return JSON.parse(text) as T;
};

export const botLogPathOf = (scenario: string): string =>
  `${BOT_LOGS}/${scenario.toLowerCase().replace(NOT_A_FILE_NAME, "-").replace(A_DASH_AT_AN_END, "")}.log`;

export const messageOf = (stack: string | undefined): string => {
  const lines = (stack ?? "").split("\n");
  const firstFrame = lines.findIndex((line) => A_STACK_FRAME.test(line));

  return lines
    .slice(NO_ARGUMENTS, firstFrame === -1 ? lines.length : firstFrame)
    .slice(NO_ARGUMENTS, MOST_MESSAGE_LINES)
    .join("\n")
    .trimEnd();
};

export const THE_FILE_DID_NOT_LOAD = "the file did not load";

const failedAssertionsIn = (file: FileResult, playsABot: boolean): readonly Failure[] =>
  file.assertionResults
    .filter((assertion) => assertion.status === FAILED)
    .map((assertion) => {
      const scenario = assertion.ancestorTitles?.[FIRST];

      return {
        file: file.name,
        name: assertion.fullName,
        message: messageOf(assertion.failureMessages[FIRST]),
        botLog: playsABot && scenario !== undefined ? botLogPathOf(scenario) : null,
      };
    });

const failuresOf = (file: FileResult, playsABot: boolean): readonly Failure[] => {
  const failed = failedAssertionsIn(file, playsABot);

  if (failed.length === NO_ARGUMENTS && file.status === FAILED) {
    return [{ file: file.name, name: THE_FILE_DID_NOT_LOAD, message: messageOf(file.message), botLog: null }];
  }

  return failed;
};

export const failuresIn = (results: VitestResults, playsABot: boolean): readonly Failure[] =>
  results.testResults.flatMap((file) => failuresOf(file, playsABot)).slice(NO_ARGUMENTS, MOST_FAILURES);

const casesIn = (results: VitestResults, playsABot: boolean): CaseCount => ({
  cases: results.numTotalTests,
  files: results.testResults.length,
  failed: results.numFailedTests,
  failures: failuresIn(results, playsABot),
});

export const outputsOf = (gate: Gate): readonly string[] => {
  switch (gate) {
    case "typecheck":
    case "docs-check":
    case "e2e:typecheck":
      return [];

    case "lint":
      return [LINT_FINDINGS];

    case "test:e2e-harness":
      return [HARNESS_RESULTS];

    case "test":
      return [TESTS_RESULTS];

    case "test:coverage":
      return [TESTS_RESULTS, COVERAGE_SUMMARY];

    case "test:mutation:changed":
    case "test:mutation":
      return FAMILIES.map((family) => family.report);

    case "e2e":
    case "e2e:changed":
      return [E2E_RESULTS];
  }
};

export const scopeOf = (
  gate: Gate,
  mutateAgainst: string | undefined,
  args: readonly string[] = []
): MutationScope => {
  if (gate === "test:mutation") {
    return "everything";
  }

  if (args.length > NO_ARGUMENTS) {
    return `named ${String(args.length)}`;
  }

  return mutateAgainst === undefined ? "the diff" : `since ${mutateAgainst}`;
};

const familyScore = (read: Reader, family: Family): FamilyScore | null => {
  const report = parse<MutationReport>(read, family.report);
  const config = parse<StrykerConfig>(read, family.config);

  if (report === null || config === null) {
    return null;
  }

  const metrics = calculateMetrics(report.files).metrics;

  return {
    family: family.family,
    score: metrics.mutationScore,
    bar: config.thresholds.break,
    killed: metrics.killed,
    survived: metrics.survived,
    noCoverage: metrics.noCoverage,
    timeout: metrics.timeout,
    survivors: survivorsIn(report.files),
  };
};

const testNumbers = (read: Reader, kind: "harness" | "tests" | "e2e", path: string): GateNumbers => {
  const results = parse<VitestResults>(read, path);

  return results === null
    ? { kind: "missing", expected: path }
    : { kind, ...casesIn(results, kind === "e2e") };
};

const coverageNumbers = (read: Reader): GateNumbers => {
  const results = parse<VitestResults>(read, TESTS_RESULTS);
  const summary = parse<CoverageSummary>(read, COVERAGE_SUMMARY);

  if (results === null) {
    return { kind: "missing", expected: TESTS_RESULTS };
  }

  if (summary === null) {
    return { kind: "tests", ...casesIn(results, false) };
  }

  return {
    kind: "coverage",
    ...casesIn(results, false),
    statements: summary.total.statements.pct,
    branches: summary.total.branches.pct,
    functions: summary.total.functions.pct,
    lines: summary.total.lines.pct,
  };
};

const lintNumbers = (read: Reader): GateNumbers => {
  const json = read(LINT_FINDINGS);

  return json === null ? { kind: "missing", expected: LINT_FINDINGS } : { kind: "findings", findings: lintFindingsIn(json) };
};

export const numbersFor = (
  gate: Gate,
  scope: MutationScope,
  read: Reader,
  output: readonly string[]
): GateNumbers => {
  switch (gate) {
    case "docs-check":
      return { kind: "none" };

    case "lint":
      return lintNumbers(read);

    case "typecheck":
    case "e2e:typecheck":
      return { kind: "findings", findings: typecheckFindingsIn(output) };

    case "test:e2e-harness":
      return testNumbers(read, "harness", HARNESS_RESULTS);

    case "test":
      return testNumbers(read, "tests", TESTS_RESULTS);

    case "test:coverage":
      return coverageNumbers(read);

    case "test:mutation:changed":
    case "test:mutation":
      return {
        kind: "mutation",
        scope,
        families: FAMILIES.flatMap((family) => {
          const score = familyScore(read, family);

          return score === null ? [] : [score];
        }),
      };

    case "e2e":
      return testNumbers(read, "e2e", E2E_RESULTS);

    case "e2e:changed":
      return read(E2E_RESULTS) === null ? { kind: "none" } : testNumbers(read, "e2e", E2E_RESULTS);
  }
};
