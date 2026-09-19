import { beforeEach, describe, expect, it, vi } from "vitest";


const spawnSyncSpy = vi.fn();

const mkdirSyncSpy = vi.fn();

const writeFileSyncSpy = vi.fn();

const saySpy = vi.fn();

vi.mock("node:child_process", () => ({
  spawnSync: (...args: readonly unknown[]) => spawnSyncSpy(...args),
}));

vi.mock("node:fs", () => ({
  mkdirSync: (...args: readonly unknown[]) => mkdirSyncSpy(...args),
  writeFileSync: (...args: readonly unknown[]) => writeFileSyncSpy(...args),
}));

vi.mock("../shared/say.ts", () => ({
  say: (line: unknown) => saySpy(line),
}));

const typecheckFindingsInSpy = vi.fn();

vi.mock("./typecheck-findings.ts", () => ({
  typecheckFindingsIn: (lines: readonly string[]) => typecheckFindingsInSpy(lines),
}));

const A_TSC = "a-tsc.js";

vi.mock("../shared/tool-binaries.ts", () => ({ TSC: A_TSC }));

const { findingsOf, runTypecheck, worstStatusOf } = await import("./typecheck-run.ts");


const PASSED = 0;

const FAILED = 1;

const A_SIGNAL = 143;

const AN_ERROR_IN_SRC = "src/a.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.";

const AN_ERROR_IN_E2E = "e2e/pages/chat.ts(9,3): error TS2551: Property 'tap' does not exist.";

const A_PASS: { readonly output: readonly string[]; readonly status: number } = { output: [""], status: PASSED };

const WHAT_THE_PARSER_READ = [
  { file: "src/a.ts", line: 1, column: 14, rule: "TS2322", message: "a message" },
];

describe("findingsOf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    typecheckFindingsInSpy.mockReturnValue(WHAT_THE_PARSER_READ);
  });

  it("should hand the parser what each project said, in the order the projects ran", () => {
    findingsOf([
      { output: [AN_ERROR_IN_SRC], status: FAILED },
      { output: [AN_ERROR_IN_E2E], status: FAILED },
    ]);

    expect(typecheckFindingsInSpy).toHaveBeenCalledWith([AN_ERROR_IN_SRC, AN_ERROR_IN_E2E]);
  });

  it("should report whatever the parser read out of them, adding nothing of its own", () => {
    expect(findingsOf([A_PASS])).toBe(WHAT_THE_PARSER_READ);
  });

  it("should still ask the parser when no project ran, so the file is written either way", () => {
    findingsOf([]);

    expect(typecheckFindingsInSpy).toHaveBeenCalledWith([]);
  });
});

describe("runTypecheck", () => {
  const A_PROJECT = ".";

  const AN_E2E_PROJECT = "e2e";

  const FINDINGS_PATH = "reports/typecheck/findings.json";

  const A_BLANK_LINE = "   ";

  const ranSaying = (stdout: string | null, stderr: string | null, status: number | null) => {
    spawnSyncSpy.mockReturnValue({ stdout, stderr, status });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    typecheckFindingsInSpy.mockReturnValue(WHAT_THE_PARSER_READ);
    ranSaying("", "", PASSED);
  });

  it("should check every project it was given, each with its own tsconfig", () => {
    runTypecheck([A_PROJECT, AN_E2E_PROJECT], FINDINGS_PATH);

    expect(spawnSyncSpy.mock.calls.map((call) => (call[1] as readonly string[])[2])).toEqual([
      A_PROJECT,
      AN_E2E_PROJECT,
    ]);
  });

  it("should ask tsc for plain output, since the findings are parsed and not read", () => {
    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(spawnSyncSpy.mock.calls[0]?.[1]).toEqual([
      A_TSC,
      "-p",
      A_PROJECT,
      "--noEmit",
      "--pretty",
      "false",
    ]);
  });

  it("should write whatever the parser read, where it was told", () => {
    ranSaying(AN_ERROR_IN_SRC, "", FAILED);

    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(writeFileSyncSpy.mock.calls[0]?.[0]).toBe(FINDINGS_PATH);
    expect(JSON.parse(String(writeFileSyncSpy.mock.calls[0]?.[1]))).toEqual(WHAT_THE_PARSER_READ);
  });

  it("should make the folder before writing into it, or a clean clone has nowhere to write", () => {
    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(mkdirSyncSpy).toHaveBeenCalledWith("reports/typecheck", { recursive: true });
    expect(Number(mkdirSyncSpy.mock.invocationCallOrder[0])).toBeLessThan(
      Number(writeFileSyncSpy.mock.invocationCallOrder[0])
    );
  });

  it("should write an empty list rather than no file when nothing is wrong", () => {
    typecheckFindingsInSpy.mockReturnValue([]);

    expect(runTypecheck([A_PROJECT], FINDINGS_PATH)).toBe(PASSED);
    expect(writeFileSyncSpy.mock.calls[0]?.[1]).toBe("[]");
  });

  it("should fail when any project failed", () => {
    spawnSyncSpy
      .mockReturnValueOnce({ stdout: "", stderr: "", status: PASSED })
      .mockReturnValueOnce({ stdout: AN_ERROR_IN_E2E, stderr: "", status: FAILED });

    expect(runTypecheck([A_PROJECT, AN_E2E_PROJECT], FINDINGS_PATH)).toBe(FAILED);
  });

  it("should fail when tsc never ran at all, which leaves no status behind", () => {
    ranSaying(null, null, null);

    expect(runTypecheck([A_PROJECT], FINDINGS_PATH)).toBe(FAILED);
  });

  it("should invent no output for a tsc that printed none, so the red gate says nothing rather than something", () => {
    ranSaying(null, null, null);

    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(saySpy).not.toHaveBeenCalled();
    expect(typecheckFindingsInSpy).toHaveBeenCalledWith([]);
  });

  it("should read tsc's streams as text, or every line would arrive as bytes", () => {
    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(spawnSyncSpy.mock.calls[0]?.[2]).toEqual({ encoding: "utf8" });
  });

  it("should say whatever tsc printed on either stream, so a red gate carries its reason", () => {
    ranSaying(AN_ERROR_IN_SRC, "tsc: command failed", FAILED);

    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(saySpy.mock.calls.map((call) => call[0])).toEqual([
      AN_ERROR_IN_SRC,
      "tsc: command failed",
    ]);
  });

  it("should say nothing for a line that is only whitespace", () => {
    ranSaying(`${A_BLANK_LINE}\n${AN_ERROR_IN_SRC}`, "", FAILED);

    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(saySpy.mock.calls.map((call) => call[0])).toEqual([AN_ERROR_IN_SRC]);
  });

  it("should read a Windows line ending as a line ending and not as part of the message", () => {
    ranSaying(`${AN_ERROR_IN_SRC}\r\n${AN_ERROR_IN_E2E}`, null, FAILED);

    runTypecheck([A_PROJECT], FINDINGS_PATH);

    expect(typecheckFindingsInSpy).toHaveBeenCalledWith([AN_ERROR_IN_SRC, AN_ERROR_IN_E2E]);
  });
});

describe("worstStatusOf", () => {
  it("should pass only when every project passed", () => {
    expect(worstStatusOf([A_PASS, A_PASS])).toBe(PASSED);
  });

  it("should fail when any project failed, however many passed beside it", () => {
    expect(worstStatusOf([A_PASS, { output: [AN_ERROR_IN_E2E], status: FAILED }])).toBe(FAILED);
  });

  it("should fail on a status that is neither pass nor one, such as a signal", () => {
    expect(worstStatusOf([{ output: [], status: A_SIGNAL }])).toBe(FAILED);
  });

  it("should pass when no project ran, which leaves the findings file empty rather than absent", () => {
    expect(worstStatusOf([])).toBe(PASSED);
  });
});
