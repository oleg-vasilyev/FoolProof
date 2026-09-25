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

const inRunSpy = vi.fn();

vi.mock("../shared/gate-paths.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../shared/gate-paths.ts")>();

  return {
    inRun: (folder: string, file: string) => {
      inRunSpy(folder, file);

      return actual.inRun(folder, file);
    },
  };
});

const { familyScore } = await import("./family-scores.ts");


const A_FAMILY: Family = {
  family: "tooling",
  config: "a-config.json",
  report: "a-report.json",
};

const A_FOLDER = "reports/runs/test-mutation/a-run";

const THE_REPORT_IN_THE_FOLDER = "reports/runs/test-mutation/a-run/a-report.json";

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

const ONCE = 1;

const TWICE = 2;

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
    parseSpy.mockImplementation(
      parsedFrom({ [THE_REPORT_IN_THE_FOLDER]: A_REPORT, [A_FAMILY.config]: A_CONFIG })
    );
  });

  it("should carry each count through under its own name, and take the bar from the config rather than the report", () => {
    expect(familyScore(read, A_FAMILY, A_FOLDER)).toEqual({
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

  it("should read the report inside the run's folder and the config where the repository keeps it, the report first", () => {
    familyScore(read, A_FAMILY, A_FOLDER);

    expect(parseSpy).toHaveBeenCalledTimes(TWICE);
    expect(parseSpy).toHaveBeenNthCalledWith(FIRST_CALL, read, THE_REPORT_IN_THE_FOLDER);
    expect(parseSpy).toHaveBeenNthCalledWith(SECOND_CALL, read, A_FAMILY.config);
  });

  it("should place only the report in the folder, the folder first, the config never", () => {
    familyScore(read, A_FAMILY, A_FOLDER);

    expect(inRunSpy).toHaveBeenCalledTimes(ONCE);
    expect(inRunSpy).toHaveBeenCalledWith(A_FOLDER, A_FAMILY.report);
  });

  it("should not score a report lying outside the run's folder, which another run wrote", () => {
    parseSpy.mockImplementation(parsedFrom({ [A_FAMILY.report]: A_REPORT, [A_FAMILY.config]: A_CONFIG }));

    expect(familyScore(read, A_FAMILY, A_FOLDER)).toBeNull();
  });

  it("should measure the report's files, not the whole report, and scan those same files for survivors", () => {
    familyScore(read, A_FAMILY, A_FOLDER);

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

    expect(familyScore(read, A_FAMILY, A_FOLDER)?.score).toBeNull();
  });

  it("should say nothing at all when the run wrote no report, rather than score an absent one", () => {
    parseSpy.mockImplementation(parsedFrom({ [A_FAMILY.config]: A_CONFIG }));

    expect(familyScore(read, A_FAMILY, A_FOLDER)).toBeNull();
    expect(metrics.calculateMetricsSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should say nothing when the report is there but its config is not, the bar being unknown", () => {
    parseSpy.mockImplementation(parsedFrom({ [THE_REPORT_IN_THE_FOLDER]: A_REPORT }));

    expect(familyScore(read, A_FAMILY, A_FOLDER)).toBeNull();
    expect(metrics.calculateMetricsSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should not look for the config inside the run's folder, where no run ever writes one", () => {
    const configInTheFolder = `${A_FOLDER}/${A_FAMILY.config}`;

    parseSpy.mockImplementation(parsedFrom({ [THE_REPORT_IN_THE_FOLDER]: A_REPORT, [configInTheFolder]: A_CONFIG }));

    expect(familyScore(read, A_FAMILY, A_FOLDER)).toBeNull();
  });
});
