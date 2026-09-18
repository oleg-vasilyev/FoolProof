import { beforeEach, describe, expect, it, vi } from "vitest";
import { MutationMetricsStub } from "../mutation/mutation-testing-metrics.stub.ts";
import { GATE } from "../shared/gate-names.ts";
import {
  CHECK_DOCS_COMPLAINTS,
  COVERAGE_SUMMARY,
  E2E_RESULTS,
  HARNESS_RESULTS,
  LINT_FINDINGS,
  TESTS_RESULTS,
} from "../shared/gate-paths.ts";


const metrics = new MutationMetricsStub();

vi.mock("mutation-testing-metrics", () => metrics.module);

const { numbersFor, outputsOf, scopeOf } = await import("./gate-numbers.ts");


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

const NO_OUTPUT: readonly string[] = [];

const NO_SURVIVORS = { named: [], total: 0 };

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

const VALID_MUTANTS = KILLED + SURVIVED;

const NO_VALID_MUTANTS = 0;

const metricsOf = (score: number) => ({
  metrics: {
    mutationScore: score,
    totalValid: VALID_MUTANTS,
    killed: KILLED,
    survived: SURVIVED,
    noCoverage: NO_COVERAGE,
    timeout: TIMEOUT,
  },
});

const NONE_COUNTED = 0;

const NOTHING_MUTATED = {
  metrics: {
    mutationScore: Number.NaN,
    totalValid: NO_VALID_MUTANTS,
    killed: NONE_COUNTED,
    survived: NONE_COUNTED,
    noCoverage: NONE_COUNTED,
    timeout: NONE_COUNTED,
  },
};

const readerOver = (files: Record<string, string>) => (path: string) => files[path] ?? null;

const SOURCE_CONFIG = JSON.stringify({ thresholds: { break: SOURCE_BAR } });

const SOURCE_REPORT = JSON.stringify({ files: SOURCE_FILES });

const everything = readerOver({
  [TESTS_RESULTS]: vitestJson(CASES, FAILED, FILES),
  [HARNESS_RESULTS]: vitestJson(CASES, FAILED, FILES),
  [COVERAGE_SUMMARY]: coverageJson(),
  [E2E_RESULTS]: vitestJson(CASES, FAILED, FILES),
  "scripts/gates/mutation/stryker.config.json": SOURCE_CONFIG,
  "scripts/gates/mutation/stryker.scripts.json": JSON.stringify({ thresholds: { break: TOOLING_BAR } }),
  "reports/mutation/mutation.json": SOURCE_REPORT,
  "reports/mutation-scripts/mutation.json": JSON.stringify({ files: TOOLING_FILES }),
});

const nothing = readerOver({});

describe("outputsOf()", () => {
  it("should name nothing for a gate whose tool writes no report", () => {
    expect(outputsOf(GATE.typecheck)).toEqual([]);
    expect(outputsOf(GATE.e2eTypecheck)).toEqual([]);
  });

  it("should name the complaints the documents gate writes, so a stale list is never read as this run's", () => {
    expect(outputsOf(GATE.checkDocs)).toEqual([CHECK_DOCS_COMPLAINTS]);
  });

  it("should name the findings file ESLint writes, so a stale one is forgotten before the run", () => {
    expect(outputsOf(GATE.lint)).toEqual([LINT_FINDINGS]);
  });

  it("should name both files the coverage run writes", () => {
    expect(outputsOf(GATE.coverage)).toEqual([TESTS_RESULTS, COVERAGE_SUMMARY]);
  });

  it("should name the suite's results file for a bare test run", () => {
    expect(outputsOf(GATE.test)).toEqual([TESTS_RESULTS]);
  });

  it("should name both families' reports for a mutation run, changed or full", () => {
    expect(outputsOf(GATE.mutationChanged)).toEqual([
      "reports/mutation/mutation.json",
      "reports/mutation-scripts/mutation.json",
    ]);
    expect(outputsOf(GATE.mutation)).toEqual(outputsOf(GATE.mutationChanged));
  });

  it("should name the e2e results for either e2e run", () => {
    expect(outputsOf(GATE.e2e)).toEqual([E2E_RESULTS]);
    expect(outputsOf(GATE.e2eChanged)).toEqual([E2E_RESULTS]);
  });

  it("should name the harness's own results file for the harness units", () => {
    expect(outputsOf(GATE.harness)).toEqual([HARNESS_RESULTS]);
  });
});

describe("scopeOf()", () => {
  it("should call the full run everything, whatever the baseline says", () => {
    expect(scopeOf(GATE.mutation, "v1.20.0")).toBe("everything");
  });

  it("should call a changed run with no baseline the diff", () => {
    expect(scopeOf(GATE.mutationChanged, undefined)).toBe("the diff");
  });

  it("should name the baseline a changed run was given", () => {
    expect(scopeOf(GATE.mutationChanged, "v1.20.0")).toBe("since v1.20.0");
  });
});

describe("numbersFor()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    metrics.calculateMetricsSpy.mockImplementation((files: unknown) =>
      metricsOf("src/a.ts" in (files as object) ? SOURCE_SCORE : TOOLING_SCORE)
    );
  });

  it("should read the documents gate's complaints out of the file it wrote, so the paragraph can count them", () => {
    const complaints = ['README.md: does not list the "check:quick" script', "CLAUDE.md: 401 lines, over its 380 budget"];

    expect(
      numbersFor(GATE.checkDocs, "the diff", readerOver({ [CHECK_DOCS_COMPLAINTS]: JSON.stringify(complaints) }), NO_OUTPUT)
    ).toEqual({ kind: "complaints", complaints });
  });

  it("should say the complaints were never written when the documents gate left nothing", () => {
    expect(numbersFor(GATE.checkDocs, "the diff", nothing, NO_OUTPUT)).toEqual({
      kind: "missing",
      expected: CHECK_DOCS_COMPLAINTS,
    });
  });

  it("should read lint's findings out of the file ESLint wrote, and say when it wrote none", () => {
    const lintJson = JSON.stringify([
      { filePath: "D:/x/src/a.ts", messages: [{ ruleId: "no-var", severity: 2, line: 3, column: 1, message: "no var" }] },
    ]);

    expect(numbersFor(GATE.lint, "the diff", readerOver({ [LINT_FINDINGS]: lintJson }), NO_OUTPUT)).toEqual({
      kind: "findings",
      findings: [{ file: "D:/x/src/a.ts", line: 3, column: 1, rule: "no-var", message: "no var" }],
    });
    expect(numbersFor(GATE.lint, "the diff", nothing, NO_OUTPUT)).toEqual({ kind: "missing", expected: LINT_FINDINGS });
  });

  it("should read both typechecks' findings out of the captured output, since tsc writes no file", () => {
    const output = ["src/a.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.", ""];

    for (const gate of [GATE.typecheck, GATE.e2eTypecheck] as const) {
      expect(numbersFor(gate, "the diff", nothing, output)).toEqual({
        kind: "findings",
        findings: [{ file: "src/a.ts", line: 1, column: 14, rule: "TS2322", message: "Type 'string' is not assignable to type 'number'." }],
      });
    }
  });

  it("should count the harness units out of the harness's own results", () => {
    expect(numbersFor(GATE.harness, "the diff", everything, NO_OUTPUT)).toEqual({
      kind: "harness",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
    expect(numbersFor(GATE.harness, "the diff", nothing, NO_OUTPUT)).toEqual({
      kind: "missing",
      expected: HARNESS_RESULTS,
    });
  });

  it("should read coverage's four percentages in statements, branches, functions, lines order", () => {
    expect(numbersFor(GATE.coverage, "the diff", everything, NO_OUTPUT)).toEqual({
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
    expect(numbersFor(GATE.coverage, "the diff", nothing, NO_OUTPUT)).toEqual({
      kind: "missing",
      expected: TESTS_RESULTS,
    });
  });

  it("should still count the cases and the failures when a red suite wrote no coverage", () => {
    const withoutSummary = readerOver({ [TESTS_RESULTS]: vitestJson(CASES, FAILED, FILES) });

    expect(numbersFor(GATE.coverage, "the diff", withoutSummary, NO_OUTPUT)).toEqual({
      kind: "tests",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
  });

  it("should score each mutation family from its own report against its own bar", () => {
    expect(numbersFor(GATE.mutationChanged, "since v1.20.0", everything, NO_OUTPUT)).toEqual({
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
          survivors: NO_SURVIVORS,
        },
        {
          family: "tooling",
          score: TOOLING_SCORE,
          bar: TOOLING_BAR,
          killed: KILLED,
          survived: SURVIVED,
          noCoverage: NO_COVERAGE,
          timeout: TIMEOUT,
          survivors: NO_SURVIVORS,
        },
      ],
    });
  });

  it("should keep a family whose score came back empty, rather than drop it out of the numbers", () => {
    metrics.calculateMetricsSpy.mockImplementation(() => NOTHING_MUTATED);

    expect(numbersFor(GATE.mutationChanged, "the diff", everything, NO_OUTPUT)).toMatchObject({
      kind: "mutation",
      families: [
        { family: "source", score: null, killed: NONE_COUNTED },
        { family: "tooling", score: null, killed: NONE_COUNTED },
      ],
    });
  });

  it("should hand the report's files to the score calculation, not the whole report", () => {
    numbersFor(GATE.mutation, "everything", everything, NO_OUTPUT);

    expect(metrics.calculateMetricsSpy).toHaveBeenNthCalledWith(FIRST_CALL, SOURCE_FILES);
    expect(metrics.calculateMetricsSpy).toHaveBeenNthCalledWith(SECOND_CALL, TOOLING_FILES);
  });

  it("should leave out a family whose run wrote nothing, rather than read a stale score", () => {
    const sourceOnly = readerOver({
      "scripts/gates/mutation/stryker.config.json": SOURCE_CONFIG,
      "reports/mutation/mutation.json": SOURCE_REPORT,
    });

    expect(numbersFor(GATE.mutationChanged, "the diff", sourceOnly, NO_OUTPUT)).toMatchObject({
      kind: "mutation",
      families: [{ family: "source" }],
    });
  });

  it("should leave out a family whose report is there but whose config is not, and the other way round", () => {
    const reportOnly = readerOver({ "reports/mutation/mutation.json": SOURCE_REPORT });
    const configOnly = readerOver({ "scripts/gates/mutation/stryker.config.json": SOURCE_CONFIG });

    expect(numbersFor(GATE.mutation, "everything", reportOnly, NO_OUTPUT)).toMatchObject({ families: [] });
    expect(numbersFor(GATE.mutation, "everything", configOnly, NO_OUTPUT)).toMatchObject({ families: [] });
  });

  it("should report no families at all when nothing was mutated", () => {
    expect(numbersFor(GATE.mutationChanged, "the diff", nothing, NO_OUTPUT)).toEqual({
      kind: "mutation",
      scope: "the diff",
      families: [],
    });
  });

  it("should count e2e cases out of the e2e results, for the changed run too", () => {
    expect(numbersFor(GATE.e2e, "the diff", everything, NO_OUTPUT)).toEqual({
      kind: "e2e",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
    expect(numbersFor(GATE.e2eChanged, "the diff", everything, NO_OUTPUT)).toEqual(
      numbersFor(GATE.e2e, "the diff", everything, NO_OUTPUT)
    );
  });

  it("should say which file an e2e run failed to write", () => {
    expect(numbersFor(GATE.e2e, "the diff", nothing, NO_OUTPUT)).toEqual({ kind: "missing", expected: E2E_RESULTS });
  });
});

describe("scopeOf(), with named files", () => {
  it("should name the count of files when the run was given some, whatever the baseline", () => {
    expect(scopeOf(GATE.mutationChanged, "v1.20.0", ["a.ts", "b.ts"])).toBe("named 2");
  });

  it("should still call the full run everything", () => {
    expect(scopeOf(GATE.mutation, undefined, ["a.ts"])).toBe("everything");
  });
});

describe("numbersFor(), an e2e run over the diff with nothing to play", () => {
  it("should carry no numbers rather than complain, since playing nothing writes nothing", () => {
    expect(numbersFor(GATE.e2eChanged, "the diff", nothing, NO_OUTPUT)).toEqual({ kind: "none" });
    expect(numbersFor(GATE.e2e, "the diff", nothing, NO_OUTPUT)).toEqual({ kind: "missing", expected: E2E_RESULTS });
  });
});

