import { beforeEach, describe, expect, it, vi } from "vitest";
import { MutationMetricsStub } from "./mutation-testing-metrics.stub.ts";
import type { Family } from "./mutation-families.ts";
import type { Survivors } from "./surviving-mutants.ts";


const metrics = new MutationMetricsStub();

vi.mock("mutation-testing-metrics", () => metrics.module);

const parseSpy = vi.fn();

vi.mock("../shared/report-reader.ts", () => ({
  parse: (read: unknown, path: string) => parseSpy(read, path),
}));

const survivorsInSpy = vi.fn();

vi.mock("./surviving-mutants.ts", () => ({
  survivorsIn: (files: unknown) => survivorsInSpy(files),
}));

const { familyScore } = await import("./family-scores.ts");


const A_FAMILY: Family = {
  family: "tooling",
  config: "a-config.json",
  report: "a-report.json",
};

const REPORTED_FILES = { "scripts/a.ts": { mutants: [] } };

const A_REPORT = { files: REPORTED_FILES };

const A_BAR = 73;

const A_CONFIG = { thresholds: { break: A_BAR } };

const A_SCORE = 61.5;

const KILLED = 11;

const SURVIVED = 3;

const NO_COVERAGE = 5;

const TIMEOUT = 7;

const VALID_MUTANTS = 19;

const NO_VALID_MUTANTS = 0;

const NONE_COUNTED = 0;

const A_SURVIVOR_LINE = 42;

const SURVIVORS_IN_ALL = 4;

const THE_SURVIVORS: Survivors = {
  named: [{ file: "scripts/a.ts", line: A_SURVIVOR_LINE, replacement: "\"\"", status: "Survived" }],
  total: SURVIVORS_IN_ALL,
};

const FIRST_CALL = 1;

const SECOND_CALL = 2;

const NEVER = 0;

const read = vi.fn();

const parsedFrom =
  (files: Record<string, unknown>) =>
  (_read: unknown, path: string): unknown =>
    files[path] ?? null;

describe("familyScore()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    metrics.scored({
      mutationScore: A_SCORE,
      totalValid: VALID_MUTANTS,
      killed: KILLED,
      survived: SURVIVED,
      noCoverage: NO_COVERAGE,
      timeout: TIMEOUT,
    });
    survivorsInSpy.mockReturnValue(THE_SURVIVORS);
    parseSpy.mockImplementation(parsedFrom({ [A_FAMILY.report]: A_REPORT, [A_FAMILY.config]: A_CONFIG }));
  });

  it("should carry each count through under its own name, and take the bar from the config rather than the report", () => {
    expect(familyScore(read, A_FAMILY)).toEqual({
      family: A_FAMILY.family,
      score: A_SCORE,
      bar: A_BAR,
      killed: KILLED,
      survived: SURVIVED,
      noCoverage: NO_COVERAGE,
      timeout: TIMEOUT,
      survivors: THE_SURVIVORS,
    });
  });

  it("should read the report and the config through the reader it was handed, the report first", () => {
    familyScore(read, A_FAMILY);

    expect(parseSpy).toHaveBeenNthCalledWith(FIRST_CALL, read, A_FAMILY.report);
    expect(parseSpy).toHaveBeenNthCalledWith(SECOND_CALL, read, A_FAMILY.config);
  });

  it("should measure the report's files, not the whole report, and scan those same files for survivors", () => {
    familyScore(read, A_FAMILY);

    expect(metrics.calculateMetricsSpy).toHaveBeenCalledWith(REPORTED_FILES);
    expect(survivorsInSpy).toHaveBeenCalledWith(REPORTED_FILES);
  });

  it("should leave the score empty when the run made no valid mutants, rather than hand on the NaN", () => {
    metrics.scored({
      mutationScore: Number.NaN,
      totalValid: NO_VALID_MUTANTS,
      killed: NONE_COUNTED,
      survived: NONE_COUNTED,
      noCoverage: NONE_COUNTED,
      timeout: NONE_COUNTED,
    });

    expect(familyScore(read, A_FAMILY)?.score).toBeNull();
  });

  it("should say nothing at all when the run wrote no report, rather than score an absent one", () => {
    parseSpy.mockImplementation(parsedFrom({ [A_FAMILY.config]: A_CONFIG }));

    expect(familyScore(read, A_FAMILY)).toBeNull();
    expect(metrics.calculateMetricsSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should say nothing when the report is there but its config is not, the bar being unknown", () => {
    parseSpy.mockImplementation(parsedFrom({ [A_FAMILY.report]: A_REPORT }));

    expect(familyScore(read, A_FAMILY)).toBeNull();
    expect(metrics.calculateMetricsSpy).toHaveBeenCalledTimes(NEVER);
  });
});
