import { beforeEach, describe, expect, it, vi } from "vitest";
import { FAMILIES } from "./mutation-families.ts";


const execFileSyncSpy = vi.fn();

const spawnSyncSpy = vi.fn();

const readFileSyncSpy = vi.fn();

vi.mock("node:child_process", () => ({
  execFileSync: (...args: readonly unknown[]) => execFileSyncSpy(...args),
  spawnSync: (...args: readonly unknown[]) => spawnSyncSpy(...args),
}));

vi.mock("node:fs", () => ({
  readFileSync: (...args: readonly unknown[]) => readFileSyncSpy(...args),
}));

const {
  DEFAULT_BASELINE,
  changedFiles,
  exclusionsOf,
  foldersOf,
  gitLines,
  held,
  mutateArgument,
  patternsIn,
  planFor,
  mutateChanged,
  runStryker,
  subjectsOf,
  planLines,
  worstOf,
} = await import("./mutate-changed.ts");


const SOURCE_PATTERNS = ["src/**/*.ts", "!src/**/*.spec.ts", "!src/**/*.stub.ts"];

const TOOLING_PATTERNS = ["scripts/docs-check/**/*.ts", "scripts/run-battery.ts", "!scripts/**/*.spec.ts"];

const patternsOf = (config: string): readonly string[] =>
  config === "stryker.config.json" ? SOURCE_PATTERNS : TOOLING_PATTERNS;

const SOURCE = FAMILIES[0] ?? { family: "source", config: "", report: "" };

const TOOLING = FAMILIES[1] ?? { family: "tooling", config: "", report: "" };

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
    expect(foldersOf(TOOLING_PATTERNS)).toEqual(["scripts/docs-check/", "scripts/run-battery.ts"]);
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
    expect(held(TOOLING_PATTERNS, "scripts/run-battery.ts")).toBe(true);
  });

  it("should not hold a file from another folder, nor a document under the right one", () => {
    expect(held(SOURCE_PATTERNS, "scripts/run-battery.ts")).toBe(false);
    expect(held(SOURCE_PATTERNS, "src/README.md")).toBe(false);
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
    const changed = ["src/a.ts", "src/a.spec.ts", "scripts/run-battery.ts", "README.md"];

    expect(planFor(changed, patternsOf)).toEqual([
      { family: SOURCE, files: ["src/a.ts"] },
      { family: TOOLING, files: ["scripts/run-battery.ts"] },
    ]);
  });

  it("should give a family with nothing changed an empty plan, not drop it", () => {
    expect(planFor(["src/a.ts"], patternsOf)[SECOND]).toEqual({ family: TOOLING, files: [] });
  });

  it("should ask for each family's patterns by its own config", () => {
    const patterns = vi.fn(patternsOf);

    planFor(["src/a.ts"], patterns);

    expect(patterns).toHaveBeenCalledWith("stryker.config.json");
    expect(patterns).toHaveBeenCalledWith("stryker.scripts.json");
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

describe("worstOf()", () => {
  it("should be green only when every family was", () => {
    expect(worstOf([GREEN, GREEN])).toBe(GREEN);
  });

  it("should carry the first red status through, whichever family it came from", () => {
    expect(worstOf([GREEN, RED])).toBe(RED);
    expect(worstOf([RED, ALSO_RED])).toBe(RED);
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

describe("runStryker()", () => {
  const plan = { family: SOURCE, files: ["src/a.ts"] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run Stryker's own entry under this node, on the family's config, with the files and exclusions", () => {
    spawnSyncSpy.mockReturnValue({ status: GREEN });

    expect(runStryker(plan, SOURCE_PATTERNS)).toBe(GREEN);
    expect(spawnSyncSpy).toHaveBeenCalledWith(
      process.execPath,
      [
        "node_modules/@stryker-mutator/core/bin/stryker.js",
        "run",
        "stryker.config.json",
        "--mutate",
        "src/a.ts,!src/**/*.spec.ts,!src/**/*.stub.ts",
      ],
      { stdio: "inherit" }
    );
  });

  it("should pass a red status through, and read a run killed by a signal as red too", () => {
    spawnSyncSpy.mockReturnValueOnce({ status: RED }).mockReturnValueOnce({ status: null });

    expect(runStryker(plan, SOURCE_PATTERNS)).toBe(RED);
    expect(runStryker(plan, SOURCE_PATTERNS)).toBe(KILLED);
  });
});

describe("mutateChanged()", () => {
  const say = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    readFileSyncSpy.mockImplementation((config: string) => JSON.stringify({ mutate: patternsOf(config) }));
    spawnSyncSpy.mockReturnValue({ status: GREEN });
  });

  it("should measure against origin/main unless the environment names a baseline", () => {
    execFileSyncSpy.mockReturnValue("");

    mutateChanged({}, say);

    expect(execFileSyncSpy.mock.calls[FIRST]?.[SECOND]).toEqual(["diff", "--name-only", "origin/main"]);

    mutateChanged({ MUTATE_AGAINST: "v1.20.1" }, say);

    expect(execFileSyncSpy.mock.calls[THIRD]?.[SECOND]).toEqual(["diff", "--name-only", "v1.20.1"]);
  });

  it("should say each family's plan, run Stryker only for the ones with files, and answer green", () => {
    execFileSyncSpy.mockReturnValueOnce("src/a.ts\n").mockReturnValueOnce("");

    expect(mutateChanged({}, say)).toBe(GREEN);
    expect(say.mock.calls.map((call) => call[FIRST])).toEqual([
      "mutating 1 changed source file(s):",
      "  src/a.ts",
      "no tooling changed against origin/main — nothing to mutate there",
    ]);
    expect(spawnSyncSpy).toHaveBeenCalledTimes(ONCE);
    expect(spawnSyncSpy.mock.calls[FIRST]?.[SECOND]).toContain("stryker.config.json");
  });

  it("should read each family's patterns from its own config file", () => {
    execFileSyncSpy.mockReturnValueOnce("scripts/run-battery.ts\n").mockReturnValueOnce("");

    mutateChanged({}, say);

    expect(readFileSyncSpy).toHaveBeenCalledWith("stryker.config.json", "utf8");
    expect(readFileSyncSpy).toHaveBeenCalledWith("stryker.scripts.json", "utf8");
  });

  it("should answer red when a family's run was", () => {
    execFileSyncSpy.mockReturnValueOnce("src/a.ts\n").mockReturnValueOnce("");
    spawnSyncSpy.mockReturnValue({ status: RED });

    expect(mutateChanged({}, say)).toBe(RED);
  });
});
