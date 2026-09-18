import { botLogPathOf } from "../shared/gate-paths.ts";
import { parse, type Reader } from "../shared/report-reader.ts";


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

export const MOST_FAILURES = 10;

export const MOST_MESSAGE_LINES = 3;

export const THE_FILE_DID_NOT_LOAD = "the file did not load";

const NOTHING = 0;

const FIRST = 0;

const FAILED = "failed";

const A_STACK_FRAME = /^\s+at /;

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

export interface VitestResults {
  readonly numTotalTests: number;
  readonly numFailedTests: number;
  readonly testResults: readonly FileResult[];
}

interface CoverageSummary {
  readonly total: Record<keyof CoverageRates, { readonly pct: number }>;
}

export const messageOf = (stack: string | undefined): string => {
  const lines = (stack ?? "").split("\n");
  const firstFrame = lines.findIndex((line) => A_STACK_FRAME.test(line));

  return lines
    .slice(NOTHING, firstFrame === -1 ? lines.length : firstFrame)
    .slice(NOTHING, MOST_MESSAGE_LINES)
    .join("\n")
    .trimEnd();
};

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

  if (failed.length === NOTHING && file.status === FAILED) {
    return [{ file: file.name, name: THE_FILE_DID_NOT_LOAD, message: messageOf(file.message), botLog: null }];
  }

  return failed;
};

export const failuresIn = (results: VitestResults, playsABot: boolean): readonly Failure[] =>
  results.testResults.flatMap((file) => failuresOf(file, playsABot)).slice(NOTHING, MOST_FAILURES);

export const casesIn = (results: VitestResults, playsABot: boolean): CaseCount => ({
  cases: results.numTotalTests,
  files: results.testResults.length,
  failed: results.numFailedTests,
  failures: failuresIn(results, playsABot),
});

export const resultsIn = (read: Reader, path: string): VitestResults | null =>
  parse<VitestResults>(read, path);

export const ratesIn = (read: Reader, path: string): CoverageRates | null => {
  const summary = parse<CoverageSummary>(read, path);

  if (summary === null) {
    return null;
  }

  return {
    statements: summary.total.statements.pct,
    branches: summary.total.branches.pct,
    functions: summary.total.functions.pct,
    lines: summary.total.lines.pct,
  };
};
