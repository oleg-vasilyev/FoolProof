import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAMILIES } from "./mutation-families.ts";


const execFileSyncSpy = vi.fn();

const runStrykerSpy = vi.fn();

const readFileSyncSpy = vi.fn();

const worstOfSpy = vi.fn<(statuses: readonly number[]) => number>(() => GREEN);

vi.mock("node:child_process", () => ({
  execFileSync: (...args: readonly unknown[]) => execFileSyncSpy(...args),
}));

vi.mock("node:fs", () => ({
  readFileSync: (...args: readonly unknown[]) => readFileSyncSpy(...args),
}));

vi.mock("./stryker-run.ts", () => ({
  runStryker: (...args: readonly unknown[]) => runStrykerSpy(...args),
  worstOf: (statuses: readonly number[]) => worstOfSpy(statuses),
}));

const {
  DEFAULT_BASELINE,
  changedFiles,
  excluded,
  exclusionsOf,
  foldersOf,
  gitLines,
  held,
  mutateArgument,
  patternsIn,
  planFor,
  mutateChanged,
  strayAmong,
  subjectsOf,
  planLines,
} = await import("./mutate-changed.ts");


const SOURCE_PATTERNS = ["src/**/*.ts", "!src/**/*.spec.ts", "!src/**/*.stub.ts"];

const TOOLING_PATTERNS = [
  "scripts/gates/**/*.ts",
  "scripts/hooks/**/*.ts",
  "!scripts/**/*.spec.ts",
  "!scripts/gates/test/vitest.config.ts",
  "!scripts/gates/e2e/e2e-changed.ts",
];

const SOURCE = FAMILIES[0] ?? { family: "source", config: "", report: "" };

const TOOLING = FAMILIES[1] ?? { family: "tooling", config: "", report: "" };

const patternsOf = (config: string): readonly string[] =>
  config === SOURCE.config ? SOURCE_PATTERNS : TOOLING_PATTERNS;

const A_RUN = "reports/runs/x/a-run";

const GREEN = 0;

const RED = 3;

const ALSO_RED = 5;

const KILLED = 1;

const ONCE = 1;

const FIRST = 0;

const SECOND = 1;

const THIRD = 2;

describe("DEFAULT_BASELINE", () => {
  it("should measure against the remote main unless told otherwise", () => {
    expect(DEFAULT_BASELINE).toBe("origin/main");
  });
});

describe("patternsIn()", () => {
  it("should read the mutate list out of a Stryker config's text", () => {
    expect(patternsIn('{"mutate": ["src/**/*.ts", "!src/**/*.spec.ts"]}')).toEqual([
      "src/**/*.ts",
      "!src/**/*.spec.ts",
    ]);
  });
});

describe("exclusionsOf() and foldersOf()", () => {
  it("should keep only the patterns that start with a bang as exclusions", () => {
    expect(exclusionsOf(SOURCE_PATTERNS)).toEqual(["!src/**/*.spec.ts", "!src/**/*.stub.ts"]);
  });

  it("should turn each positive glob into the folder it covers, and leave a single file as it is", () => {
    expect(foldersOf(TOOLING_PATTERNS)).toEqual(["scripts/gates/", "scripts/hooks/"]);
  });

  it("should strip only a trailing recursive glob, leaving a deeper literal path alone", () => {
    expect(foldersOf(["scripts/**/*.ts.txt"])).toEqual(["scripts/**/*.ts.txt"]);
  });
});

describe("held()", () => {
  it("should hold a TypeScript file under one of the family's folders", () => {
    expect(held(SOURCE_PATTERNS, "src/main.ts")).toBe(true);
  });

  it("should hold a file the family names outright", () => {
    expect(held(TOOLING_PATTERNS, "scripts/gates/run-battery.ts")).toBe(true);
  });

  it("should not hold a file from another folder, nor a document under the right one", () => {
    expect(held(SOURCE_PATTERNS, "scripts/gates/run-battery.ts")).toBe(false);
    expect(held(SOURCE_PATTERNS, "src/README.md")).toBe(false);
  });

  it("should not hold a file under a held folder that an exclusion names, by file or by folder", () => {
    expect(held(TOOLING_PATTERNS, "scripts/gates/e2e/e2e-changed.ts")).toBe(false);
    expect(held(TOOLING_PATTERNS, "scripts/gates/test/vitest.config.ts")).toBe(false);
    expect(held(TOOLING_PATTERNS, "scripts/gates/shared/gate-list.ts")).toBe(true);
  });

  it("should read an exclusion as a glob, so a basename pattern reaches into every folder", () => {
    expect(excluded(SOURCE_PATTERNS, "src/features/a/b.spec.ts")).toBe(true);
    expect(excluded(["!src/**/sqlite-connection.ts"], "src/shared/repository/sqlite-connection.ts")).toBe(true);
    expect(excluded(SOURCE_PATTERNS, "src/main.ts")).toBe(false);
  });
});

describe("subjectsOf()", () => {
  it("should drop the specs and the stubs, which are never mutated, and each duplicate", () => {
    expect(
      subjectsOf(["src/a.ts", "src/a.spec.ts", "src/b.stub.ts", "src/a.ts", "scripts/c.ts"])
    ).toEqual(["src/a.ts", "scripts/c.ts"]);
  });

  it("should keep a file whose name merely contains spec, and drop only a real spec or stub", () => {
    expect(subjectsOf(["src/spec-reader.ts", "src/a.spec.ts.bak"])).toEqual([
      "src/spec-reader.ts",
      "src/a.spec.ts.bak",
    ]);
  });
});

describe("mutateArgument()", () => {
  it("should list the files first and the family's exclusions after them, comma-joined", () => {
    expect(mutateArgument(SOURCE_PATTERNS, ["src/a.ts", "src/b.ts"])).toBe(
      "src/a.ts,src/b.ts,!src/**/*.spec.ts,!src/**/*.stub.ts"
    );
  });
});

describe("planFor()", () => {
  it("should route each changed subject to the family whose folders hold it, source first", () => {
    const changed = ["src/a.ts", "src/a.spec.ts", "scripts/gates/run-battery.ts", "README.md"];

    expect(planFor(changed, patternsOf)).toEqual([
      { family: SOURCE, files: ["src/a.ts"] },
      { family: TOOLING, files: ["scripts/gates/run-battery.ts"] },
    ]);
  });

  it("should give a family with nothing changed an empty plan, not drop it", () => {
    expect(planFor(["src/a.ts"], patternsOf)[SECOND]).toEqual({ family: TOOLING, files: [] });
  });

  it("should ask for each family's patterns by its own config", () => {
    const patterns = vi.fn(patternsOf);

    planFor(["src/a.ts"], patterns);

    expect(patterns).toHaveBeenCalledWith(SOURCE.config);
    expect(patterns).toHaveBeenCalledWith(TOOLING.config);
  });
});

describe("planLines()", () => {
  it("should say there is nothing to mutate for an empty plan, naming the baseline", () => {
    expect(planLines({ family: TOOLING, files: [] }, "v1.20.1")).toEqual([
      "no tooling changed against v1.20.1 — nothing to mutate there",
    ]);
  });

  it("should count the files and list them indented", () => {
    expect(planLines({ family: SOURCE, files: ["src/a.ts", "src/b.ts"] }, "origin/main")).toEqual([
      "mutating 2 changed source file(s):",
      "  src/a.ts",
      "  src/b.ts",
    ]);
  });
});

describe("gitLines() and changedFiles()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should ask git and hand back its non-empty lines, trimmed", () => {
    execFileSyncSpy.mockReturnValue(" src/a.ts \n\nsrc/b.ts\n");

    expect(gitLines("diff", "--name-only")).toEqual(["src/a.ts", "src/b.ts"]);
    expect(execFileSyncSpy).toHaveBeenCalledWith("git", ["diff", "--name-only"], { encoding: "utf8" });
  });

  it("should take the diff against the baseline and the untracked files, in that order", () => {
    execFileSyncSpy.mockReturnValueOnce("src/a.ts\n").mockReturnValueOnce("src/new.ts\n");

    expect(changedFiles("v1.20.1")).toEqual(["src/a.ts", "src/new.ts"]);
    expect(execFileSyncSpy.mock.calls.map((call) => call[SECOND])).toEqual([
      ["diff", "--name-only", "v1.20.1"],
      ["ls-files", "--others", "--exclude-standard"],
    ]);
  });
});

describe("mutateChanged()", () => {
  const say = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    readFileSyncSpy.mockImplementation((config: string) => JSON.stringify({ mutate: patternsOf(config) }));
    runStrykerSpy.mockReturnValue(GREEN);
  });

  it("should measure against origin/main unless the environment names a baseline", () => {
    execFileSyncSpy.mockReturnValue("");

    mutateChanged({}, say, A_RUN);

    expect(execFileSyncSpy.mock.calls[FIRST]?.[SECOND]).toEqual(["diff", "--name-only", "origin/main"]);

    mutateChanged({ MUTATE_AGAINST: "v1.20.1" }, say, A_RUN);

    expect(execFileSyncSpy.mock.calls[THIRD]?.[SECOND]).toEqual(["diff", "--name-only", "v1.20.1"]);
  });

  it("should say each family's plan, run Stryker only for the ones with files, and answer green", () => {
    execFileSyncSpy.mockReturnValueOnce("src/a.ts\n").mockReturnValueOnce("");

    expect(mutateChanged({}, say, A_RUN)).toBe(GREEN);
    expect(say.mock.calls.map((call) => call[FIRST])).toEqual([
      "mutating 1 changed source file(s):",
      "  src/a.ts",
      "no tooling changed against origin/main — nothing to mutate there",
    ]);
    expect(runStrykerSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should hand Stryker the family, the run's folder, and the files with the family's exclusions", () => {
    execFileSyncSpy.mockReturnValueOnce("src/a.ts\n").mockReturnValueOnce("");

    mutateChanged({}, say, A_RUN);

    expect(runStrykerSpy).toHaveBeenCalledWith(SOURCE, A_RUN, [
      "--mutate",
      "src/a.ts,!src/**/*.spec.ts,!src/**/*.stub.ts",
    ]);
  });

  it("should read each family's patterns from its own config file", () => {
    execFileSyncSpy.mockReturnValueOnce("scripts/gates/run-battery.ts\n").mockReturnValueOnce("");

    mutateChanged({}, say, A_RUN);

    expect(readFileSyncSpy).toHaveBeenCalledWith(SOURCE.config, "utf8");
    expect(readFileSyncSpy).toHaveBeenCalledWith(TOOLING.config, "utf8");
  });

  it("should answer whatever worstOf makes of every family's status, a family with nothing to run counting green", () => {
    execFileSyncSpy.mockReturnValueOnce("src/a.ts\n").mockReturnValueOnce("");
    runStrykerSpy.mockReturnValue(RED);
    worstOfSpy.mockReturnValueOnce(ALSO_RED);

    expect(mutateChanged({}, say, A_RUN)).toBe(ALSO_RED);
    expect(worstOfSpy).toHaveBeenCalledWith([RED, GREEN]);
  });
});

describe("mutateChanged(), with named files", () => {
  const say = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    readFileSyncSpy.mockImplementation((config: string) => JSON.stringify({ mutate: patternsOf(config) }));
    runStrykerSpy.mockReturnValue(GREEN);
  });

  it("should mutate exactly the files named, never asking git what changed", () => {
    mutateChanged({}, say, A_RUN, ["src/a.ts", "scripts/gates/run-battery.ts"]);

    expect(execFileSyncSpy).not.toHaveBeenCalled();
    expect(runStrykerSpy.mock.calls).toEqual([
      [SOURCE, A_RUN, ["--mutate", "src/a.ts,!src/**/*.spec.ts,!src/**/*.stub.ts"]],
      [
        TOOLING,
        A_RUN,
        [
          "--mutate",
          "scripts/gates/run-battery.ts,!scripts/**/*.spec.ts,!scripts/gates/test/vitest.config.ts,!scripts/gates/e2e/e2e-changed.ts",
        ],
      ],
    ]);
  });

  it("should say the plan against the named files rather than a baseline", () => {
    mutateChanged({ MUTATE_AGAINST: "v1.20.1" }, say, A_RUN, ["src/a.ts"]);

    expect(say.mock.calls.map((call) => call[FIRST])).toEqual([
      "mutating 1 changed source file(s):",
      "  src/a.ts",
      "no tooling changed against the named files — nothing to mutate there",
    ]);
  });
});

describe("strayAmong() and a named run over files no family holds", () => {
  const say = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    readFileSyncSpy.mockImplementation((config: string) => JSON.stringify({ mutate: patternsOf(config) }));
    runStrykerSpy.mockReturnValue(GREEN);
  });

  it("should name every file that landed in no plan, a typo and a spec included", () => {
    const plans = planFor(["src/a.ts", "scripts/gate-runer.ts", "src/a.spec.ts"], patternsOf);

    expect(strayAmong(["src/a.ts", "scripts/gate-runer.ts", "src/a.spec.ts"], plans)).toEqual([
      "scripts/gate-runer.ts",
      "src/a.spec.ts",
    ]);
  });

  it("should refuse a named file a folder holds but an exclusion drops, rather than pass on an empty run", () => {
    const status = mutateChanged({}, say, A_RUN, ["scripts/gates/e2e/e2e-changed.ts"]);

    expect(status).toBe(KILLED);
    expect(runStrykerSpy).not.toHaveBeenCalled();
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain("no family holds scripts/gates/e2e/e2e-changed.ts");
  });

  it("should refuse, red, without running Stryker, naming the stray file and what to name instead", () => {
    const status = mutateChanged({}, say, A_RUN, ["src/a.ts", "e2e/anything.ts"]);

    expect(status).toBe(KILLED);
    expect(runStrykerSpy).not.toHaveBeenCalled();
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain("no family holds e2e/anything.ts");
    expect(say.mock.calls[FIRST]?.[FIRST]).toContain("name the subject, not its spec");
  });

  it("should never refuse a diff run, where a family with nothing changed is ordinary", () => {
    execFileSyncSpy.mockReturnValueOnce("README.md\n").mockReturnValueOnce("");

    expect(mutateChanged({}, say, A_RUN)).toBe(GREEN);
  });
});
