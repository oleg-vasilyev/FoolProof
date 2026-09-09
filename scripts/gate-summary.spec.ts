import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GateVerdict, RanVerdict } from "./gate-verdict.ts";
import type { GateNumbers } from "./gate-numbers.ts";


const lineForSpy = vi.fn();

const rerunCommandForSpy = vi.fn();

vi.mock("./gate-verdict.ts", () => ({
  lineFor: (verdict: unknown) => lineForSpy(verdict),
}));

vi.mock("./gate-list.ts", () => ({
  rerunCommandFor: (gate: unknown) => rerunCommandForSpy(gate),
}));

const { gatesParagraph, reasonLines, relativeTo, summaryLines } = await import("./gate-summary.ts");


const PASSED = 0;

const RED = 1;

const NO_FAILURES = 0;

const THREE_FAILED = 3;

const ONCE = 1;

const verdictWith = (gate: RanVerdict["gate"], ok: boolean, numbers: GateNumbers): RanVerdict => ({
  kind: "ran",
  gate,
  named: false,
  ok,
  exitCode: ok ? PASSED : RED,
  startedAt: "2026-09-09T10:00:00.000Z",
  durationMs: 0,
  numbers,
  tail: [],
});

const SKIPPED: GateVerdict = {
  kind: "skipped",
  gate: "test:mutation:changed",
  ok: false,
  because: "test:coverage",
  startedAt: "2026-09-09T10:00:00.000Z",
};

const NONE: GateNumbers = { kind: "none" };

const COVERAGE: GateNumbers = {
  kind: "coverage",
  cases: 4651,
  files: 199,
  failed: NO_FAILURES,
  failures: [],
  statements: 99.84,
  branches: 97.61,
  functions: 100,
  lines: 99.83,
};

const SOURCE_SCORED = {
  family: "source",
  score: 99.5177,
  bar: 85,
  killed: 1,
  survived: 1,
  noCoverage: 0,
  timeout: 0,
} as const;

const TOOLING_SCORED = { ...SOURCE_SCORED, family: "tooling", score: 84.02 } as const;

const E2E: GateNumbers = { kind: "e2e", cases: 205, files: 17, failed: NO_FAILURES, failures: [] };

const aGreenPhase = (): readonly GateVerdict[] => [
  verdictWith("lint", true, NONE),
  verdictWith("typecheck", true, NONE),
  verdictWith("test:coverage", true, COVERAGE),
  verdictWith("test:mutation:changed", true, {
    kind: "mutation",
    scope: "the diff",
    families: [SOURCE_SCORED],
  }),
  verdictWith("e2e:changed", true, E2E),
];

describe("gatesParagraph()", () => {
  it("should write the green paragraph in the fixed shape the commit template asks for", () => {
    expect(gatesParagraph(aGreenPhase(), "check:phase")).toBe(
      "Gates: check:phase green — 4651 tests in 199 files, coverage 99.84/97.61/100/99.83, " +
        "mutation 99.52% over the changed source and nothing to run over the tooling, " +
        "e2e 205 cases in 17 files."
    );
  });

  it("should name both families when both ran, in source then tooling order", () => {
    const verdicts = [
      verdictWith("test:mutation:changed", true, {
        kind: "mutation",
        scope: "since v1.20.0",
        families: [TOOLING_SCORED, SOURCE_SCORED],
      }),
    ];

    expect(gatesParagraph(verdicts, "check:release")).toBe(
      "Gates: check:release green — mutation 99.52% over the source changed since v1.20.0 " +
        "and 84.02% over the tooling changed since v1.20.0."
    );
  });

  it("should call the full run a run over everything", () => {
    const verdicts = [
      verdictWith("test:mutation", true, {
        kind: "mutation",
        scope: "everything",
        families: [SOURCE_SCORED, TOOLING_SCORED],
      }),
    ];

    expect(gatesParagraph(verdicts, "check:release")).toContain(
      "mutation 99.52% over all the source and 84.02% over all the tooling"
    );
  });

  it("should count the harness units apart from the suite", () => {
    const verdicts = [
      verdictWith("test:e2e-harness", true, { kind: "harness", cases: 75, files: 9, failed: NO_FAILURES, failures: [] }),
    ];

    expect(gatesParagraph(verdicts, "check:push")).toBe(
      "Gates: check:push green — 75 cases in 9 files of harness units."
    );
  });

  it("should say a suite that wrote no coverage as tests without coverage, never as harness units", () => {
    const verdicts = [
      verdictWith("test:coverage", true, { kind: "tests", cases: 4771, files: 207, failed: NO_FAILURES, failures: [] }),
    ];

    expect(gatesParagraph(verdicts, "check")).toBe(
      "Gates: check green — 4771 tests in 207 files, no coverage written."
    );
  });

  it("should open RED with every red gate named, and the failures counted where a tool counts them", () => {
    const verdicts = [
      verdictWith("lint", false, NONE),
      verdictWith("test:coverage", false, { ...COVERAGE, failed: THREE_FAILED }),
      verdictWith("e2e:changed", true, E2E),
    ];

    expect(gatesParagraph(verdicts, "check:phase")).toBe(
      "Gates: check:phase RED (lint red, test:coverage red (3 failed)) — e2e 205 cases in 17 files."
    );
  });

  it("should not count zero failures on a gate that was red for another reason", () => {
    expect(gatesParagraph([verdictWith("test:coverage", false, COVERAGE)], "check:phase")).toBe(
      "Gates: check:phase RED (test:coverage red)."
    );
  });

  it("should name the family under its bar when a mutation gate is red", () => {
    const verdicts = [
      verdictWith("test:mutation:changed", false, {
        kind: "mutation",
        scope: "the diff",
        families: [SOURCE_SCORED, { ...TOOLING_SCORED, score: 76.07, bar: 80 }],
      }),
    ];

    expect(gatesParagraph(verdicts, "check:phase")).toBe(
      "Gates: check:phase RED (test:mutation:changed red (76.07% tooling under the 80% bar))."
    );
  });

  it("should say a skipped gate was skipped and why, as a red gate", () => {
    expect(gatesParagraph([SKIPPED], "check:phase")).toBe(
      "Gates: check:phase RED (test:mutation:changed red (skipped, test:coverage was red))."
    );
  });

  it("should say which file a green gate failed to write, rather than invent a number", () => {
    const verdicts = [verdictWith("e2e", true, { kind: "missing", expected: "reports/e2e/results.json" })];

    expect(gatesParagraph(verdicts, "check:release")).toBe(
      "Gates: check:release green — no numbers: reports/e2e/results.json was not written."
    );
  });

  it("should end after the verdict when no gate carries numbers", () => {
    expect(gatesParagraph([verdictWith("lint", true, NONE)], "check")).toBe("Gates: check green.");
  });
});

describe("summaryLines()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    lineForSpy.mockImplementation((verdict: GateVerdict) => `${verdict.gate}: a line`);
    rerunCommandForSpy.mockImplementation((gate: string) => `rerun ${gate}`);
  });

  it("should give one line per gate, from the verdict's own line", () => {
    const lines = summaryLines(aGreenPhase());

    expect(lines).toEqual([
      "lint: a line",
      "typecheck: a line",
      "test:coverage: a line",
      "test:mutation:changed: a line",
      "e2e:changed: a line",
    ]);
    expect(lineForSpy).toHaveBeenCalledTimes(aGreenPhase().length);
  });

  it("should end a red run with the command that re-runs each red gate alone", () => {
    const lines = summaryLines([verdictWith("lint", false, NONE), verdictWith("e2e", false, NONE)]);

    expect(lines.slice(-THREE_FAILED)).toEqual([
      "Re-run a red gate alone, not the whole battery:",
      "  rerun lint",
      "  rerun e2e",
    ]);
  });

  it("should count a skipped gate among the red ones to re-run", () => {
    const lines = summaryLines([SKIPPED]);

    expect(rerunCommandForSpy).toHaveBeenCalledTimes(ONCE);
    expect(lines.at(-1)).toBe("  rerun test:mutation:changed");
  });

  it("should add no advice to a green run", () => {
    expect(summaryLines(aGreenPhase()).join("\n")).not.toContain("Re-run");
  });
});

const ROOT = "D:\\Temp\\FoolProof";

const A_FAILURE = {
  file: "D:/Temp/FoolProof/scripts/gate-paths.spec.ts",
  name: "fileStemOf() should turn the colons into dashes",
  message: "AssertionError: expected 'a' to be 'b'",
};

describe("gatesParagraph(), a run over named files", () => {
  it("should say how many named files a family's score covers, singular and plural", () => {
    const one = [
      verdictWith("test:mutation:changed", true, { kind: "mutation", scope: "named 1", families: [TOOLING_SCORED] }),
    ];
    const two = [
      verdictWith("test:mutation:changed", true, { kind: "mutation", scope: "named 2", families: [SOURCE_SCORED] }),
    ];

    expect(gatesParagraph(one, "check:phase")).toContain("84.02% over 1 named tooling file");
    expect(gatesParagraph(two, "check:phase")).toContain("99.52% over 2 named source files");
  });
});

describe("relativeTo()", () => {
  it("should strip the root, whichever slashes either side uses", () => {
    expect(relativeTo(ROOT, A_FAILURE.file)).toBe("scripts/gate-paths.spec.ts");
    expect(relativeTo("D:/Temp/FoolProof/", "D:\\Temp\\FoolProof\\src\\a.ts")).toBe("src/a.ts");
  });

  it("should leave a path outside the root alone, slashed forward", () => {
    expect(relativeTo(ROOT, "C:\\elsewhere\\a.ts")).toBe("C:/elsewhere/a.ts");
  });
});

describe("reasonLines()", () => {
  it("should say nothing for a green gate or a skipped one", () => {
    expect(reasonLines(verdictWith("lint", true, NONE), ROOT)).toEqual([]);
    expect(reasonLines(SKIPPED, ROOT)).toEqual([]);
  });

  it("should list each failed assertion with its file made relative, its name and its message", () => {
    const red = verdictWith("test", false, { kind: "tests", cases: 2, files: 1, failed: 1, failures: [A_FAILURE] });

    expect(reasonLines(red, ROOT)).toEqual([
      "  ✗ scripts/gate-paths.spec.ts › fileStemOf() should turn the colons into dashes: AssertionError: expected 'a' to be 'b'",
    ]);
  });

  it("should fall back to the verdict's tail, indented, when the kind carries no failures", () => {
    const red = { ...verdictWith("docs:check", false, NONE), tail: ["README.md: a complaint", "1 problem(s)"] };

    expect(reasonLines(red, ROOT)).toEqual(["  README.md: a complaint", "  1 problem(s)"]);
  });

  it("should fall back to the tail when a reporter-backed gate died before writing any failure", () => {
    const red = { ...verdictWith("e2e", false, { kind: "e2e", cases: 0, files: 0, failed: 0, failures: [] }), tail: ["killed"] };

    expect(reasonLines(red, ROOT)).toEqual(["  killed"]);
  });
});
