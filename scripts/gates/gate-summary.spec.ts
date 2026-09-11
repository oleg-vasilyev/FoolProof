import { beforeEach, describe, expect, it, vi } from "vitest";
import { BATTERY, GATE } from "./gate-names.ts";
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

const { gatesParagraph, paragraphFileOf, reasonLines, relativeTo, stampLineOf, summaryLines } =
  await import("./gate-summary.ts");


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
  gate: GATE.mutationChanged,
  ok: false,
  because: GATE.coverage,
  startedAt: "2026-09-09T10:00:00.000Z",
};

const NONE: GateNumbers = { kind: "none" };

const NO_SURVIVORS = { named: [], total: 0 };

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
  survivors: NO_SURVIVORS,
} as const;

const TOOLING_SCORED = { ...SOURCE_SCORED, family: "tooling", score: 84.02 } as const;

const E2E: GateNumbers = { kind: "e2e", cases: 205, files: 17, failed: NO_FAILURES, failures: [] };

const aGreenPhase = (): readonly GateVerdict[] => [
  verdictWith(GATE.lint, true, NONE),
  verdictWith(GATE.typecheck, true, NONE),
  verdictWith(GATE.coverage, true, COVERAGE),
  verdictWith(GATE.mutationChanged, true, {
    kind: "mutation",
    scope: "the diff",
    families: [SOURCE_SCORED],
  }),
  verdictWith(GATE.e2eChanged, true, E2E),
];

describe("paragraphFileOf() and stampLineOf()", () => {
  const AT = new Date("2026-09-11T12:00:00.000Z");

  const A_STAMP = "check:release · abc1234 · 2026-09-11T12:00:00.000Z";

  it("should put the battery, the HEAD and the ISO time on one line above the paragraph", () => {
    expect(paragraphFileOf(BATTERY.release, "abc1234", AT, "Gates: check:release green.")).toBe(
      `${A_STAMP}\nGates: check:release green.\n`
    );
  });

  it("should say the HEAD is unknown rather than leave the slot empty when git answered nothing", () => {
    expect(paragraphFileOf(BATTERY.phase, null, AT, "Gates: x.")).toBe(
      "check:phase · unknown · 2026-09-11T12:00:00.000Z\nGates: x.\n"
    );
  });

  it("should read its own stamp back off the file it wrote", () => {
    expect(stampLineOf(paragraphFileOf(BATTERY.release, "abc1234", AT, "Gates: x."))).toBe(A_STAMP);
  });

  it("should see no stamp on a file that opens with the paragraph itself, or on no file", () => {
    expect(stampLineOf("Gates: check:phase green.\n")).toBeNull();
    expect(stampLineOf(null)).toBeNull();
  });
});

describe("gatesParagraph()", () => {
  it("should write the green paragraph in the fixed shape the commit template asks for", () => {
    expect(gatesParagraph(aGreenPhase(), BATTERY.phase)).toBe(
      "Gates: check:phase green — 4651 tests in 199 files, coverage 99.84/97.61/100/99.83, " +
        "mutation 99.52% over the changed source and nothing to run over the tooling, " +
        "e2e 205 cases in 17 files."
    );
  });

  it("should name both families when both ran, in source then tooling order", () => {
    const verdicts = [
      verdictWith(GATE.mutationChanged, true, {
        kind: "mutation",
        scope: "since v1.20.0",
        families: [TOOLING_SCORED, SOURCE_SCORED],
      }),
    ];

    expect(gatesParagraph(verdicts, BATTERY.release)).toBe(
      "Gates: check:release green — mutation 99.52% over the source changed since v1.20.0 " +
        "and 84.02% over the tooling changed since v1.20.0."
    );
  });

  it("should call the full run a run over everything", () => {
    const verdicts = [
      verdictWith(GATE.mutation, true, {
        kind: "mutation",
        scope: "everything",
        families: [SOURCE_SCORED, TOOLING_SCORED],
      }),
    ];

    expect(gatesParagraph(verdicts, BATTERY.release)).toContain(
      "mutation 99.52% over all the source and 84.02% over all the tooling"
    );
  });

  it("should say a family the full run never reached was not run, rather than that it had nothing", () => {
    const verdicts = [
      verdictWith(GATE.mutation, false, { kind: "mutation", scope: "everything", families: [SOURCE_SCORED] }),
    ];

    expect(gatesParagraph(verdicts, BATTERY.release)).toContain("tooling not run");
    expect(gatesParagraph(verdicts, BATTERY.release)).not.toContain("nothing to run over the tooling");
  });

  it("should count the harness units apart from the suite", () => {
    const verdicts = [
      verdictWith(GATE.harness, true, { kind: "harness", cases: 75, files: 9, failed: NO_FAILURES, failures: [] }),
    ];

    expect(gatesParagraph(verdicts, BATTERY.push)).toBe(
      "Gates: check:push green — 75 cases in 9 files of harness units."
    );
  });

  it("should say a suite that wrote no coverage as tests without coverage, never as harness units", () => {
    const verdicts = [
      verdictWith(GATE.coverage, true, { kind: "tests", cases: 4771, files: 207, failed: NO_FAILURES, failures: [] }),
    ];

    expect(gatesParagraph(verdicts, BATTERY.quick)).toBe(
      "Gates: check:quick green — 4771 tests in 207 files, no coverage written."
    );
  });

  it("should open RED with every red gate named, and the failures counted where a tool counts them", () => {
    const verdicts = [
      verdictWith(GATE.lint, false, NONE),
      verdictWith(GATE.coverage, false, { ...COVERAGE, failed: THREE_FAILED }),
      verdictWith(GATE.e2eChanged, true, E2E),
    ];

    expect(gatesParagraph(verdicts, BATTERY.phase)).toBe(
      "Gates: check:phase RED (lint red, test:coverage red (3 failed)) — e2e 205 cases in 17 files."
    );
  });

  it("should not count zero failures on a gate that was red for another reason", () => {
    expect(gatesParagraph([verdictWith(GATE.coverage, false, COVERAGE)], BATTERY.phase)).toBe(
      "Gates: check:phase RED (test:coverage red)."
    );
  });

  it("should count a red lint's or typecheck's findings in the paragraph, and say nothing at zero", () => {
    const finding = { file: "src/a.ts", line: 1, column: 1, rule: "x", message: "m" };

    expect(gatesParagraph([verdictWith(GATE.lint, false, { kind: "findings", findings: [finding, finding] })], BATTERY.quick)).toBe(
      "Gates: check:quick RED (lint red (2 findings))."
    );
    expect(gatesParagraph([verdictWith(GATE.typecheck, false, { kind: "findings", findings: [finding] })], BATTERY.quick)).toBe(
      "Gates: check:quick RED (typecheck red (1 finding))."
    );
    expect(gatesParagraph([verdictWith(GATE.lint, false, { kind: "findings", findings: [] })], BATTERY.quick)).toBe(
      "Gates: check:quick RED (lint red)."
    );
  });

  it("should name the family under its bar when a mutation gate is red", () => {
    const verdicts = [
      verdictWith(GATE.mutationChanged, false, {
        kind: "mutation",
        scope: "the diff",
        families: [SOURCE_SCORED, { ...TOOLING_SCORED, score: 76.07, bar: 80 }],
      }),
    ];

    expect(gatesParagraph(verdicts, BATTERY.phase)).toBe(
      "Gates: check:phase RED (test:mutation:changed red (76.07% tooling under the 80% bar))."
    );
  });

  it("should say a skipped gate was skipped and why, as a red gate", () => {
    expect(gatesParagraph([SKIPPED], BATTERY.phase)).toBe(
      "Gates: check:phase RED (test:mutation:changed red (skipped, test:coverage was red))."
    );
  });

  it("should say which file a green gate failed to write, rather than invent a number", () => {
    const verdicts = [verdictWith(GATE.e2e, true, { kind: "missing", expected: "reports/e2e/results.json" })];

    expect(gatesParagraph(verdicts, BATTERY.release)).toBe(
      "Gates: check:release green — no numbers: reports/e2e/results.json was not written."
    );
  });

  it("should end after the verdict when no gate carries numbers", () => {
    expect(gatesParagraph([verdictWith(GATE.lint, true, NONE)], BATTERY.quick)).toBe("Gates: check:quick green.");
  });
});

describe("summaryLines()", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    lineForSpy.mockImplementation((verdict: GateVerdict) => `${verdict.gate}: a line`);
    rerunCommandForSpy.mockImplementation((gate: string) => `rerun ${gate}`);
  });

  it("should give one line per gate, from the verdict's own line", () => {
    const lines = summaryLines(aGreenPhase(), ROOT);

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
    const lines = summaryLines([verdictWith(GATE.lint, false, NONE), verdictWith(GATE.e2e, false, NONE)], ROOT);

    expect(lines.slice(-THREE_FAILED)).toEqual([
      "Re-run a red gate alone, not the whole battery:",
      "  rerun lint",
      "  rerun e2e",
    ]);
  });

  it("should count a skipped gate among the red ones to re-run", () => {
    const lines = summaryLines([SKIPPED], ROOT);

    expect(rerunCommandForSpy).toHaveBeenCalledTimes(ONCE);
    expect(lines.at(-1)).toBe("  rerun test:mutation:changed");
  });

  it("should add no advice to a green run", () => {
    expect(summaryLines(aGreenPhase(), ROOT).join("\n")).not.toContain("Re-run");
  });

  it("should print a gate's reasons under its line, so a battery says what a single run would", () => {
    const finding = { file: "src/a.ts", line: 8, column: 1, rule: "project/no-comments", message: "No comments" };
    const lines = summaryLines([verdictWith(GATE.lint, false, { kind: "findings", findings: [finding] })], ROOT);

    expect(lines.slice(0, 2)).toEqual(["lint: a line", "  ✗ src/a.ts:8:1 project/no-comments — No comments"]);
  });
});

const ROOT = "D:\\Temp\\FoolProof";

const A_FAILURE = {
  botLog: null,
  file: "D:/Temp/FoolProof/scripts/gate-paths.spec.ts",
  name: "fileStemOf() should turn the colons into dashes",
  message: "AssertionError: expected 'a' to be 'b'",
};

describe("gatesParagraph(), a run over named files", () => {
  it("should say how many named files a family's score covers, singular and plural", () => {
    const one = [
      verdictWith(GATE.mutationChanged, true, { kind: "mutation", scope: "named 1", families: [TOOLING_SCORED] }),
    ];
    const two = [
      verdictWith(GATE.mutationChanged, true, { kind: "mutation", scope: "named 2", families: [SOURCE_SCORED] }),
    ];

    expect(gatesParagraph(one, BATTERY.phase)).toContain("84.02% over 1 named tooling file");
    expect(gatesParagraph(two, BATTERY.phase)).toContain("99.52% over 2 named source files");
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
    expect(reasonLines(verdictWith(GATE.lint, true, NONE), ROOT)).toEqual([]);
    expect(reasonLines(SKIPPED, ROOT)).toEqual([]);
  });

  it("should list each finding as file:line:col rule — message, the file made relative", () => {
    const red = verdictWith(GATE.lint, false, {
      kind: "findings",
      findings: [
        { file: "D:\\Temp\\FoolProof\\src\\a.ts", line: 8, column: 1, rule: "project/no-comments", message: "No comments" },
        { file: "src/b.ts", line: 1, column: 14, rule: "TS2322", message: "Type 'string' is not\nassignable" },
      ],
    });

    expect(reasonLines(red, ROOT)).toEqual([
      "  ✗ src/a.ts:8:1 project/no-comments — No comments",
      "  ✗ src/b.ts:1:14 TS2322 — Type 'string' is not\n    assignable",
    ]);
  });

  it("should point an e2e failure at the bot log of its scenario, under the message", () => {
    const red = verdictWith(GATE.e2e, false, {
      kind: "e2e", cases: 1, files: 1, failed: 1,
      failures: [{ ...A_FAILURE, message: "expected\nreceived", botLog: "reports/e2e/bot/whole-game.log" }],
    });

    expect(reasonLines(red, ROOT)).toEqual([
      "  ✗ scripts/gate-paths.spec.ts › fileStemOf() should turn the colons into dashes: expected\n    received",
      "    bot output: reports/e2e/bot/whole-game.log",
    ]);
  });

  it("should list the mutants still alive under a mutation gate, red or green, with a ceiling said aloud", () => {
    const survivors = {
      named: [
        { file: "scripts/gates/a.ts", line: 12, replacement: "\"\"", status: "Survived" as const },
        { file: "scripts/gates/b.ts", line: 3, replacement: "true", status: "NoCoverage" as const },
      ],
      total: 5,
    };
    const green = verdictWith(GATE.mutationChanged, true, {
      kind: "mutation", scope: "the diff", families: [{ ...TOOLING_SCORED, survivors }],
    });

    expect(reasonLines(green, ROOT)).toEqual([
      "  tooling: 5 mutants alive",
      "    ✗ scripts/gates/a.ts:12 Survived «\"\"»",
      "    ✗ scripts/gates/b.ts:3 NoCoverage «true»",
      "    and 3 more in tooling's report",
    ]);
    expect(reasonLines(verdictWith(GATE.mutationChanged, true, { kind: "mutation", scope: "the diff", families: [SOURCE_SCORED] }), ROOT)).toEqual([]);
  });

  it("should list each failed assertion with its file made relative, its name and its message", () => {
    const red = verdictWith(GATE.test, false, { kind: "tests", cases: 2, files: 1, failed: 1, failures: [A_FAILURE] });

    expect(reasonLines(red, ROOT)).toEqual([
      "  ✗ scripts/gate-paths.spec.ts › fileStemOf() should turn the colons into dashes: AssertionError: expected 'a' to be 'b'",
    ]);
  });

  it("should fall back to the verdict's tail, indented, when the kind carries no failures", () => {
    const red = { ...verdictWith(GATE.docsCheck, false, NONE), tail: ["README.md: a complaint", "1 problem(s)"] };

    expect(reasonLines(red, ROOT)).toEqual(["  README.md: a complaint", "  1 problem(s)"]);
  });

  it("should fall back to the tail when a reporter-backed gate died before writing any failure", () => {
    const red = { ...verdictWith(GATE.e2e, false, { kind: "e2e", cases: 0, files: 0, failed: 0, failures: [] }), tail: ["killed"] };

    expect(reasonLines(red, ROOT)).toEqual(["  killed"]);
  });
});
