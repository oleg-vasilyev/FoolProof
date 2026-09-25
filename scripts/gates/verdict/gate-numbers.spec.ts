import { beforeEach, describe, expect, it, vi } from "vitest";
import { MutationMetricsStub } from "../mutation/mutation-testing-metrics.stub.ts";
import { GATE } from "../shared/gate-names.ts";
import { FAMILIES } from "../mutation/mutation-families.ts";
import type { Reader } from "../shared/report-reader.ts";
import {
  CHECK_DOCS_COMPLAINTS,
  COVERAGE_SUMMARY,
  E2E_SELECTION,
  LINT_FINDINGS,
  RESULTS,
  SOURCE_MUTATION_REPORT,
  SOURCE_STRYKER_CONFIG,
  TOOLING_MUTATION_REPORT,
  TOOLING_STRYKER_CONFIG,
  TYPECHECK_FINDINGS,
} from "../shared/gate-paths.ts";


const metrics = new MutationMetricsStub();

vi.mock("mutation-testing-metrics", () => metrics.module);

const familyScoreSpy = vi.fn();

vi.mock("../mutation/family-scores.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../mutation/family-scores.ts")>();

  return {
    familyScore: (read: Reader, family: (typeof FAMILIES)[number], folder: string) => {
      familyScoreSpy(read, family, folder);

      return actual.familyScore(read, family, folder);
    },
  };
});

const { numbersFor, scopeOf } = await import("./gate-numbers.ts");


const FOLDER = "reports/runs/a-gate/20260925-120000-a1";

const ANOTHER_FOLDER = "reports/runs/a-gate/20260925-115900-b2";

const at = (file: string): string => `${FOLDER}/${file}`;

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

const THE_RUN_S_FILES = {
  [at(RESULTS)]: vitestJson(CASES, FAILED, FILES),
  [at(COVERAGE_SUMMARY)]: coverageJson(),
  [SOURCE_STRYKER_CONFIG]: SOURCE_CONFIG,
  [TOOLING_STRYKER_CONFIG]: JSON.stringify({ thresholds: { break: TOOLING_BAR } }),
  [at(SOURCE_MUTATION_REPORT)]: SOURCE_REPORT,
  [at(TOOLING_MUTATION_REPORT)]: JSON.stringify({ files: TOOLING_FILES }),
};

const everything = readerOver(THE_RUN_S_FILES);

const nothing = readerOver({});

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

  it("should read the documents gate's complaints out of the file it wrote in its folder, so the paragraph can count them", () => {
    const complaints = ['README.md: does not list the "check:quick" script', "CLAUDE.md: 401 lines, over its 380 budget"];

    expect(
      numbersFor(GATE.checkDocs, "the diff", readerOver({ [at(CHECK_DOCS_COMPLAINTS)]: JSON.stringify(complaints) }), FOLDER)
    ).toEqual({ kind: "complaints", complaints });
  });

  it("should name the complaints file in its folder when the documents gate left nothing", () => {
    expect(numbersFor(GATE.checkDocs, "the diff", nothing, FOLDER)).toEqual({
      kind: "missing",
      expected: at(CHECK_DOCS_COMPLAINTS),
    });
  });

  it("should read lint's findings out of the file ESLint wrote in the folder, and name that file when it wrote none", () => {
    const lintJson = JSON.stringify([
      { filePath: "D:/x/src/a.ts", messages: [{ ruleId: "no-var", severity: 2, line: 3, column: 1, message: "no var" }] },
    ]);

    expect(numbersFor(GATE.lint, "the diff", readerOver({ [at(LINT_FINDINGS)]: lintJson }), FOLDER)).toEqual({
      kind: "findings",
      findings: [{ file: "D:/x/src/a.ts", line: 3, column: 1, rule: "no-var", message: "no var" }],
    });
    expect(numbersFor(GATE.lint, "the diff", nothing, FOLDER)).toEqual({ kind: "missing", expected: at(LINT_FINDINGS) });
  });

  it("should read either typecheck's findings out of the one file name, in that run's own folder", () => {
    const finding = { file: "src/a.ts", line: 1, column: 14, rule: "TS2322", message: "no" };
    const wrote = readerOver({ [at(TYPECHECK_FINDINGS)]: JSON.stringify([finding]) });

    for (const gate of [GATE.typecheck, GATE.e2eTypecheck]) {
      expect(numbersFor(gate, "the diff", wrote, FOLDER)).toEqual({ kind: "findings", findings: [finding] });
    }
  });

  it("should name the file in its folder a typecheck failed to write rather than reporting no findings", () => {
    for (const gate of [GATE.typecheck, GATE.e2eTypecheck]) {
      expect(numbersFor(gate, "the diff", nothing, FOLDER)).toEqual({
        kind: "missing",
        expected: at(TYPECHECK_FINDINGS),
      });
    }
  });

  it("should not read another run's findings, which lie in another folder under the same name", () => {
    const finding = { file: "src/a.ts", line: 1, column: 14, rule: "TS2322", message: "no" };
    const theOtherRun = readerOver({ [`${ANOTHER_FOLDER}/${TYPECHECK_FINDINGS}`]: JSON.stringify([finding]) });

    expect(numbersFor(GATE.typecheck, "the diff", theOtherRun, FOLDER)).toEqual({
      kind: "missing",
      expected: at(TYPECHECK_FINDINGS),
    });
  });

  it("should count the harness units out of the results in the harness run's folder", () => {
    expect(numbersFor(GATE.harness, "the diff", everything, FOLDER)).toEqual({
      kind: "harness",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
    expect(numbersFor(GATE.harness, "the diff", nothing, FOLDER)).toEqual({
      kind: "missing",
      expected: at(RESULTS),
    });
  });

  it("should count a test run out of the results in its folder, and name that file when there are none", () => {
    expect(numbersFor(GATE.test, "the diff", everything, FOLDER)).toEqual({
      kind: "tests",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
    expect(numbersFor(GATE.test, "the diff", everything, ANOTHER_FOLDER)).toEqual({
      kind: "missing",
      expected: `${ANOTHER_FOLDER}/${RESULTS}`,
    });
  });

  it("should read coverage's four percentages in statements, branches, functions, lines order", () => {
    expect(numbersFor(GATE.coverage, "the diff", everything, FOLDER)).toEqual({
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

  it("should name the results file in its folder when a coverage run left nothing", () => {
    expect(numbersFor(GATE.coverage, "the diff", nothing, FOLDER)).toEqual({
      kind: "missing",
      expected: at(RESULTS),
    });
  });

  it("should still count the cases and the failures when a red suite wrote no coverage", () => {
    const withoutSummary = readerOver({ [at(RESULTS)]: vitestJson(CASES, FAILED, FILES) });

    expect(numbersFor(GATE.coverage, "the diff", withoutSummary, FOLDER)).toEqual({
      kind: "tests",
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
  });

  it("should not take coverage percentages from a summary outside the run's folder", () => {
    const summaryElsewhere = readerOver({
      [at(RESULTS)]: vitestJson(CASES, FAILED, FILES),
      [`${ANOTHER_FOLDER}/${COVERAGE_SUMMARY}`]: coverageJson(),
    });

    expect(numbersFor(GATE.coverage, "the diff", summaryElsewhere, FOLDER)).toMatchObject({ kind: "tests" });
  });

  it("should score each mutation family from its own report against its own bar", () => {
    expect(numbersFor(GATE.mutationChanged, "since v1.20.0", everything, FOLDER)).toEqual({
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

  it("should hand every family's score the reader and the run's folder, in the order the families come", () => {
    numbersFor(GATE.mutation, "everything", everything, FOLDER);

    expect(familyScoreSpy).toHaveBeenCalledTimes(FAMILIES.length);
    expect(familyScoreSpy).toHaveBeenNthCalledWith(FIRST_CALL, everything, FAMILIES[0], FOLDER);
    expect(familyScoreSpy).toHaveBeenNthCalledWith(SECOND_CALL, everything, FAMILIES[1], FOLDER);
  });

  it("should keep a family whose score came back empty, rather than drop it out of the numbers", () => {
    metrics.calculateMetricsSpy.mockImplementation(() => NOTHING_MUTATED);

    expect(numbersFor(GATE.mutationChanged, "the diff", everything, FOLDER)).toMatchObject({
      kind: "mutation",
      families: [
        { family: "source", score: null, killed: NONE_COUNTED },
        { family: "tooling", score: null, killed: NONE_COUNTED },
      ],
    });
  });

  it("should hand the report's files to the score calculation, not the whole report", () => {
    numbersFor(GATE.mutation, "everything", everything, FOLDER);

    expect(metrics.calculateMetricsSpy).toHaveBeenNthCalledWith(FIRST_CALL, SOURCE_FILES);
    expect(metrics.calculateMetricsSpy).toHaveBeenNthCalledWith(SECOND_CALL, TOOLING_FILES);
  });

  it("should leave out a family whose run wrote nothing, rather than read a stale score", () => {
    const sourceOnly = readerOver({
      [SOURCE_STRYKER_CONFIG]: SOURCE_CONFIG,
      [at(SOURCE_MUTATION_REPORT)]: SOURCE_REPORT,
    });

    expect(numbersFor(GATE.mutationChanged, "the diff", sourceOnly, FOLDER)).toMatchObject({
      kind: "mutation",
      families: [{ family: "source" }],
    });
  });

  it("should report no families when every report lies in another run's folder", () => {
    expect(numbersFor(GATE.mutation, "everything", everything, ANOTHER_FOLDER)).toEqual({
      kind: "mutation",
      scope: "everything",
      families: [],
    });
  });

  it("should report no families at all when nothing was mutated", () => {
    expect(numbersFor(GATE.mutationChanged, "the diff", nothing, FOLDER)).toEqual({
      kind: "mutation",
      scope: "the diff",
      families: [],
    });
  });

  it("should count e2e cases out of the results in its folder, and call a full run every scenario", () => {
    expect(numbersFor(GATE.e2e, "the diff", everything, FOLDER)).toEqual({
      kind: "e2e",
      selection: { kind: "everything" },
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
  });

  it("should carry the selection the changed run recorded in its folder beside its counts", () => {
    const played = readerOver({
      [at(RESULTS)]: vitestJson(CASES, FAILED, FILES),
      [at(E2E_SELECTION)]: JSON.stringify({ kind: "scenarios", files: ["e2e/scenarios/whole-game.e2e.spec.ts"] }),
    });

    expect(numbersFor(GATE.e2eChanged, "the diff", played, FOLDER)).toEqual({
      kind: "e2e",
      selection: { kind: "scenarios", files: ["e2e/scenarios/whole-game.e2e.spec.ts"] },
      cases: CASES,
      files: FILES,
      failed: FAILED,
      failures: [],
    });
  });

  it("should name the results file in its folder when an e2e run failed to write it", () => {
    expect(numbersFor(GATE.e2e, "the diff", nothing, FOLDER)).toEqual({ kind: "missing", expected: at(RESULTS) });
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
  const playedNothing = readerOver({ [at(E2E_SELECTION)]: JSON.stringify({ kind: "nothing" }) });

  it("should report a run that played nothing rather than saying nothing at all", () => {
    expect(numbersFor(GATE.e2eChanged, "the diff", playedNothing, FOLDER)).toEqual({
      kind: "e2e",
      selection: { kind: "nothing" },
      cases: 0,
      files: 0,
      failed: 0,
      failures: [],
    });
  });

  it("should not ask for the results file, which a run that played nothing never wrote", () => {
    const asked: string[] = [];
    const watching = (path: string) => {
      asked.push(path);

      return playedNothing(path);
    };

    numbersFor(GATE.e2eChanged, "the diff", watching, FOLDER);

    expect(asked).toEqual([at(E2E_SELECTION)]);
  });

  it("should name the selection file in its folder when the gate died before recording one", () => {
    expect(numbersFor(GATE.e2eChanged, "the diff", nothing, FOLDER)).toEqual({
      kind: "missing",
      expected: at(E2E_SELECTION),
    });
  });

  it("should name the results file in its folder when a selection promised scenarios and none were written", () => {
    const promised = readerOver({
      [at(E2E_SELECTION)]: JSON.stringify({ kind: "scenarios", files: ["e2e/scenarios/whole-game.e2e.spec.ts"] }),
    });

    expect(numbersFor(GATE.e2eChanged, "the diff", promised, FOLDER)).toEqual({
      kind: "missing",
      expected: at(RESULTS),
    });
  });
});
