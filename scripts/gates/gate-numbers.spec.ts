import { beforeEach, describe, expect, it, vi } from "vitest";


const calculateMetricsSpy = vi.fn();

vi.mock("mutation-testing-metrics", () => ({
  calculateMetrics: (files: unknown) => calculateMetricsSpy(files),
}));

const {
  COVERAGE_SUMMARY,
  E2E_RESULTS,
  HARNESS_RESULTS,
  MOST_FAILURES,
  TESTS_RESULTS,
  numbersFor,
  outputsOf,
  scopeOf,
} = await import("./gate-numbers.ts");


const CASES = 4651;

const FAILED = 3;

const FILES = 199;

const STATEMENTS = 99.84;

const BRANCHES = 97.61;

const FUNCTIONS = 100;

const LINES = 99.83;

const SOURCE_SCORE = 96.43;

const TOOLING_SCORE = 85.14;

const SOURCE_BAR = 85;

const TOOLING_BAR = 80;

const KILLED = 7536;

const SURVIVED = 258;

const NO_COVERAGE = 21;

const TIMEOUT = 10;

const FIRST_CALL = 1;

const SECOND_CALL = 2;

const SOURCE_FILES = { "src/a.ts": { mutants: [] } };

const TOOLING_FILES = { "scripts/b.ts": { mutants: [] } };

const vitestJson = (cases: number, failed: number, files: number): string =>
  JSON.stringify({
    numTotalTests: cases,
    numFailedTests: failed,
    testResults: Array.from({ length: files }, () => ({ name: "a.spec.ts", assertionResults: [] })),
  });

const coverageJson = (): string =>
  JSON.stringify({
    total: {
      statements: { pct: STATEMENTS },
      branches: { pct: BRANCHES },
      functions: { pct: FUNCTIONS },
      lines: { pct: LINES },
    },
  });

const metricsOf = (score: number) => ({
  metrics: {
    mutationScore: score,
    killed: KILLED,
    survived: SURVIVED,
    noCoverage: NO_COVERAGE,
    timeout: TIMEOUT,
  },
});

const readerOver = (files: Record<string, string>) => (path: string) => files[path] ?? null;

const SOURCE_CONFIG = JSON.stringify({ thresholds: { break: SOURCE_BAR } });

const SOURCE_REPORT = JSON.stringify({ files: SOURCE_FILES });

const everything = readerOver({
  [TESTS_RESULTS]: vitestJson(CASES, FAILED, FILES),
  [HARNESS_RESULTS]: vitestJson(CASES, FAILED, FILES),
  [COVERAGE_SUMMARY]: coverageJson(),
  [E2E_RESULTS]: vitestJson(CASES, FAILED, FILES),
  "scripts/gates/config/stryker.config.json": SOURCE_CONFIG,
  "scripts/gates/config/stryker.scripts.json": JSON.stringify({ thresholds: { break: TOOLING_BAR } }),
  "reports/mutation/mutation.json": SOURCE_REPORT,
  "reports/mutation-scripts/mutation.json": JSON.stringify({ files: TOOLING_FILES }),
});

const nothing = readerOver({});

describe("the report paths", () => {
  it("should be the files the reporters were configured to write, the harness apart from the suite", () => {
    expect(TESTS_RESULTS).toBe("reports/tests/results.json");
    expect(HARNESS_RESULTS).toBe("reports/tests/harness-results.json");
    expect(COVERAGE_SUMMARY).toBe("reports/coverage/coverage-summary.json");
    expect(E2E_RESULTS).toBe("reports/e2e/results.json");
  });
});

describe("outputsOf()", () => {
  it("should name nothing for a gate whose tool writes no report", () => {
    expect(outputsOf("lint")).toEqual([]);
    expect(outputsOf("typecheck")).toEqual([]);
    expect(outputsOf("docs-check")).toEqual([]);
    expect(outputsOf("e2e:typecheck")).toEqual([]);
  });

  it("should name both files the coverage run writes", () => {
    expect(outputsOf("test:coverage")).toEqual([TESTS_RESULTS, COVERAGE_SUMMARY]);
  });

  it("should name both families' reports for a mutation run, changed or full", () => {
    expect(outputsOf("test:mutation:changed")).toEqual([
      "reports/mutation/mutation.json",
      "reports/mutation-scripts/mutation.json",
    ]);
    expect(outputsOf("test:mutation")).toEqual(outputsOf("test:mutation:changed"));
  });

  it("should name the e2e results for either e2e run", () => {
    expect(outputsOf("e2e")).toEqual([E2E_RESULTS]);
    expect(outputsOf("e2e:changed")).toEqual([E2E_RESULTS]);
  });

  it("should name the harness's own results file for the harness units", () => {
    expect(outputsOf("test:e2e-harness")).toEqual([HARNESS_RESULTS]);
  });
});

describe("scopeOf()", () => {
  it("should call the full run everything, whatever the baseline says", () => {
    expect(scopeOf("test:mutation", "v1.20.0")).toBe("everything");
  });

  it("should call a changed run with no baseline the diff", () => {
    expect(scopeOf("test:mutation:changed", undefined)).toBe("the diff");
  });

  it("should name the baseline a changed run was given", () => {
    expect(scopeOf("test:mutation:changed", "v1.20.0")).toBe("since v1.20.0");
  });
});

describe("numbersFor()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    calculateMetricsSpy.mockImplementation((files: unknown) =>
      metricsOf("src/a.ts" in (files as object) ? SOURCE_SCORE : TOOLING_SCORE)
    );
  });

  it("should carry no numbers for lint, types, docs and the e2e types", () => {
    for (const gate of ["lint", "typecheck", "docs-check", "e2e:typecheck"] as const) {
      expect(numbersFor(gate, "the diff", everything)).toEqual({ kind: "none" });
    }
  });

  it("should count the harness units out of the harness's own results", () => {
    expect(numbersFor("test:e2e-harness", "the diff", everything)).toEqual({
      kind: "harness",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
    expect(numbersFor("test:e2e-harness", "the diff", nothing)).toEqual({
      kind: "missing",
      expected: HARNESS_RESULTS,
    });
  });

  it("should read coverage's four percentages in statements, branches, functions, lines order", () => {
    expect(numbersFor("test:coverage", "the diff", everything)).toEqual({
      kind: "coverage",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
      statements: STATEMENTS,
      branches: BRANCHES,
      functions: FUNCTIONS,
      lines: LINES,
    });
  });

  it("should say the results were never written when a coverage run left nothing", () => {
    expect(numbersFor("test:coverage", "the diff", nothing)).toEqual({
      kind: "missing",
      expected: TESTS_RESULTS,
    });
  });

  it("should still count the cases and the failures when a red suite wrote no coverage", () => {
    const withoutSummary = readerOver({ [TESTS_RESULTS]: vitestJson(CASES, FAILED, FILES) });

    expect(numbersFor("test:coverage", "the diff", withoutSummary)).toEqual({
      kind: "tests",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
  });

  it("should score each mutation family from its own report against its own bar", () => {
    expect(numbersFor("test:mutation:changed", "since v1.20.0", everything)).toEqual({
      kind: "mutation",
      scope: "since v1.20.0",
      families: [
        {
          family: "source",
          score: SOURCE_SCORE,
          bar: SOURCE_BAR,
          killed: KILLED,
          survived: SURVIVED,
          noCoverage: NO_COVERAGE,
          timeout: TIMEOUT,
        },
        {
          family: "tooling",
          score: TOOLING_SCORE,
          bar: TOOLING_BAR,
          killed: KILLED,
          survived: SURVIVED,
          noCoverage: NO_COVERAGE,
          timeout: TIMEOUT,
        },
      ],
    });
  });

  it("should hand the report's files to the score calculation, not the whole report", () => {
    numbersFor("test:mutation", "everything", everything);

    expect(calculateMetricsSpy).toHaveBeenNthCalledWith(FIRST_CALL, SOURCE_FILES);
    expect(calculateMetricsSpy).toHaveBeenNthCalledWith(SECOND_CALL, TOOLING_FILES);
  });

  it("should leave out a family whose run wrote nothing, rather than read a stale score", () => {
    const sourceOnly = readerOver({
      "scripts/gates/config/stryker.config.json": SOURCE_CONFIG,
      "reports/mutation/mutation.json": SOURCE_REPORT,
    });

    expect(numbersFor("test:mutation:changed", "the diff", sourceOnly)).toMatchObject({
      kind: "mutation",
      families: [{ family: "source" }],
    });
  });

  it("should leave out a family whose report is there but whose config is not, and the other way round", () => {
    const reportOnly = readerOver({ "reports/mutation/mutation.json": SOURCE_REPORT });
    const configOnly = readerOver({ "scripts/gates/config/stryker.config.json": SOURCE_CONFIG });

    expect(numbersFor("test:mutation", "everything", reportOnly)).toMatchObject({ families: [] });
    expect(numbersFor("test:mutation", "everything", configOnly)).toMatchObject({ families: [] });
  });

  it("should report no families at all when nothing was mutated", () => {
    expect(numbersFor("test:mutation:changed", "the diff", nothing)).toEqual({
      kind: "mutation",
      scope: "the diff",
      families: [],
    });
  });

  it("should count e2e cases out of the e2e results, for the changed run too", () => {
    expect(numbersFor("e2e", "the diff", everything)).toEqual({
      kind: "e2e",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
    expect(numbersFor("e2e:changed", "the diff", everything)).toEqual(
      numbersFor("e2e", "the diff", everything)
    );
  });

  it("should say which file an e2e run failed to write", () => {
    expect(numbersFor("e2e", "the diff", nothing)).toEqual({ kind: "missing", expected: E2E_RESULTS });
  });
});

const A_FAILED_FILE = "D:/Temp/FoolProof/scripts/gate-paths.spec.ts";

const A_FAILED_NAME = "fileStemOf() should turn the colons a file name may not carry into dashes";

const A_FAILED_MESSAGE =
  "AssertionError: expected 'test-mutation-changed' to be 'PROBE-this-must-fail' // Object.is equality";

const ELEVEN = 11;

const redJson = (failed: number): string =>
  JSON.stringify({
    numTotalTests: failed + 1,
    numFailedTests: failed,
    testResults: [
      {
        name: A_FAILED_FILE,
        assertionResults: [
          { fullName: "a green one", status: "passed", failureMessages: [] },
          ...Array.from({ length: failed }, (_, index) => ({
            fullName: `${A_FAILED_NAME} ${String(index)}`,
            status: "failed",
            failureMessages: [`${A_FAILED_MESSAGE}\n    at ${A_FAILED_FILE}:18:49\n    at runner.js:302:11`],
          })),
        ],
      },
    ],
  });

describe("failuresIn(), read off the reporter's real shape", () => {
  it("should name each failed assertion by file, full name and the first line of its stack", () => {
    const numbers = numbersFor("test", "the diff", readerOver({ [TESTS_RESULTS]: redJson(1) }));

    expect(numbers).toMatchObject({
      kind: "tests",
      failed: 1,
      failures: [{ file: A_FAILED_FILE, name: `${A_FAILED_NAME} 0`, message: A_FAILED_MESSAGE }],
    });
  });

  it("should keep at most ten failures, the rest being in the log", () => {
    const numbers = numbersFor("test", "the diff", readerOver({ [TESTS_RESULTS]: redJson(ELEVEN) }));

    expect(numbers.kind === "tests" ? numbers.failures : []).toHaveLength(MOST_FAILURES);
  });

  it("should carry no failures for a green run, on every reporter-backed kind", () => {
    for (const gate of ["test", "test:coverage", "test:e2e-harness", "e2e"] as const) {
      expect(numbersFor(gate, "the diff", everything)).toMatchObject({ failures: [] });
    }
  });

  it("should name the suite's results file as what a bare test run writes and reads", () => {
    expect(outputsOf("test")).toEqual([TESTS_RESULTS]);
    expect(numbersFor("test", "the diff", nothing)).toEqual({ kind: "missing", expected: TESTS_RESULTS });
  });
});

describe("scopeOf(), with named files", () => {
  it("should name the count of files when the run was given some, whatever the baseline", () => {
    expect(scopeOf("test:mutation:changed", "v1.20.0", ["a.ts", "b.ts"])).toBe("named 2");
  });

  it("should still call the full run everything", () => {
    expect(scopeOf("test:mutation", undefined, ["a.ts"])).toBe("everything");
  });
});

describe("numbersFor(), an e2e run over the diff with nothing to play", () => {
  it("should carry no numbers rather than complain, since playing nothing writes nothing", () => {
    expect(numbersFor("e2e:changed", "the diff", nothing)).toEqual({ kind: "none" });
    expect(numbersFor("e2e", "the diff", nothing)).toEqual({ kind: "missing", expected: E2E_RESULTS });
  });
});
