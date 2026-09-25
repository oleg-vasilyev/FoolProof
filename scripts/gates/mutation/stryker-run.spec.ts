import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Family } from "./mutation-families.ts";


const mkdirSyncSpy = vi.fn();

const readFileSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

const spawnSyncSpy = vi.fn();

vi.mock("node:fs", () => ({
  mkdirSync: (...args: readonly unknown[]) => mkdirSyncSpy(...args),
  readFileSync: (...args: readonly unknown[]) => readFileSyncSpy(...args),
  writeFileSync: (...args: readonly unknown[]) => writeFileSyncSpy(...args),
}));

vi.mock("node:child_process", () => ({
  spawnSync: (...args: readonly unknown[]) => spawnSyncSpy(...args),
}));

const { derivedConfig, derivedConfigPathOf, runStryker, worstOf } = await import("./stryker-run.ts");


const A_RUN = "reports/runs/x/a-run";

const FAMILY: Family = { family: "tooling", config: "x/some-stryker.json", report: "x-report.json" };

const DERIVED_PATH = "reports/runs/x/a-run/stryker-tooling.json";

const CONCURRENCY = 3;

const JSON_INDENT = 2;

const GREEN = 0;

const RED = 3;

const KILLED = 1;

const FIRST = 0;

const ORIGINAL = {
  testRunner: "a-runner",
  concurrency: CONCURRENCY,
  mutate: ["x/**/*.ts", "!x/**/*.spec.ts"],
  tempDirName: "reports/.old-tmp",
  jsonReporter: { fileName: "reports/old/mutation.json" },
  htmlReporter: { fileName: "reports/old/index.html" },
};

const DERIVED = {
  ...ORIGINAL,
  tempDirName: "reports/runs/x/a-run/stryker-tooling-tmp",
  jsonReporter: { fileName: "reports/runs/x/a-run/x-report.json" },
  htmlReporter: { fileName: "reports/runs/x/a-run/mutation-tooling.html" },
};

describe("derivedConfigPathOf()", () => {
  it("should put the family's derived config inside the run folder, named after the family", () => {
    expect(derivedConfigPathOf(A_RUN, FAMILY)).toBe(DERIVED_PATH);
  });
});

describe("derivedConfig()", () => {
  it("should keep every key of the family's config and move the sandbox and both reports into the run", () => {
    expect(JSON.parse(derivedConfig(JSON.stringify(ORIGINAL), FAMILY, A_RUN))).toEqual(DERIVED);
  });

  it("should write the config indented, so a person can read the one a run used", () => {
    expect(derivedConfig(JSON.stringify(ORIGINAL), FAMILY, A_RUN)).toBe(JSON.stringify(DERIVED, null, JSON_INDENT));
  });
});

describe("runStryker()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    readFileSyncSpy.mockReturnValue(JSON.stringify(ORIGINAL));
    spawnSyncSpy.mockReturnValue({ status: GREEN });
  });

  it("should read the family's own config and write the derived one into the run folder it made", () => {
    runStryker(FAMILY, A_RUN, []);

    expect(readFileSyncSpy).toHaveBeenCalledWith("x/some-stryker.json", "utf8");
    expect(mkdirSyncSpy).toHaveBeenCalledWith(A_RUN, { recursive: true });
    expect(writeFileSyncSpy).toHaveBeenCalledWith(DERIVED_PATH, JSON.stringify(DERIVED, null, JSON_INDENT));
  });

  it("should make the folder before writing into it, and write the config before Stryker reads it", () => {
    runStryker(FAMILY, A_RUN, []);

    const made = mkdirSyncSpy.mock.invocationCallOrder[FIRST] ?? Infinity;
    const written = writeFileSyncSpy.mock.invocationCallOrder[FIRST] ?? Infinity;
    const spawned = spawnSyncSpy.mock.invocationCallOrder[FIRST] ?? -Infinity;

    expect(made).toBeLessThan(written);
    expect(written).toBeLessThan(spawned);
  });

  it("should run Stryker's own entry under this node on the derived config, the extra arguments after", () => {
    runStryker(FAMILY, A_RUN, ["--mutate", "x/a.ts"]);

    expect(spawnSyncSpy).toHaveBeenCalledWith(
      process.execPath,
      ["node_modules/@stryker-mutator/core/bin/stryker.js", "run", DERIVED_PATH, "--mutate", "x/a.ts"],
      { stdio: "inherit" }
    );
  });

  it("should pass Stryker's status through, and read a run killed by a signal as red", () => {
    spawnSyncSpy.mockReturnValueOnce({ status: RED }).mockReturnValueOnce({ status: null });

    expect(runStryker(FAMILY, A_RUN, [])).toBe(RED);
    expect(runStryker(FAMILY, A_RUN, [])).toBe(KILLED);
  });
});

describe("worstOf()", () => {
  const A_GREEN = 0;

  const A_RED = 3;

  const ANOTHER_RED = 5;

  it("should be green only when every family was, and when there was no family at all", () => {
    expect(worstOf([A_GREEN, A_GREEN])).toBe(A_GREEN);
    expect(worstOf([])).toBe(A_GREEN);
  });

  it("should carry the first red status through, whichever family it came from", () => {
    expect(worstOf([A_GREEN, A_RED])).toBe(A_RED);
    expect(worstOf([A_RED, ANOTHER_RED])).toBe(A_RED);
  });
});
