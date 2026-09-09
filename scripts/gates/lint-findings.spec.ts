import { describe, expect, it } from "vitest";
import { MOST_FINDINGS } from "./finding.ts";
import { A_PARSE_ERROR, lintFindingsIn } from "./lint-findings.ts";


const AN_ERROR = 2;

const A_WARNING = 1;

const resultsJson = (results: readonly unknown[]): string => JSON.stringify(results);

const message = (line: number, ruleId: string | null = "no-var", severity = AN_ERROR) => ({
  ruleId,
  severity,
  line,
  column: 1,
  message: `message at ${String(line)}`,
});

describe("lintFindingsIn()", () => {
  it("should read each error as a finding with its file, position, rule and message", () => {
    const json = resultsJson([{ filePath: "D:\\x\\src\\a.ts", messages: [message(3)] }]);

    expect(lintFindingsIn(json)).toEqual([
      { file: "D:\\x\\src\\a.ts", line: 3, column: 1, rule: "no-var", message: "message at 3" },
    ]);
  });

  it("should leave warnings out, since the gate runs quiet and only errors make it red", () => {
    const json = resultsJson([{ filePath: "a.ts", messages: [message(1, "x", A_WARNING), message(2)] }]);

    expect(lintFindingsIn(json).map((finding) => finding.line)).toEqual([2]);
  });

  it("should order findings by file, then line, then column", () => {
    const json = resultsJson([
      { filePath: "b.ts", messages: [message(9), message(2)] },
      { filePath: "a.ts", messages: [{ ...message(2), column: 7 }, message(2)] },
    ]);

    expect(lintFindingsIn(json).map((finding) => `${finding.file}:${String(finding.line)}:${String(finding.column)}`)).toEqual([
      "a.ts:2:1",
      "a.ts:2:7",
      "b.ts:2:1",
      "b.ts:9:1",
    ]);
  });

  it("should call a fatal parse error, which carries no rule, a parse finding rather than crash", () => {
    const json = resultsJson([{ filePath: "a.ts", messages: [{ ...message(1, null), fatal: true }] }]);

    expect(lintFindingsIn(json)[0]?.rule).toBe(A_PARSE_ERROR);
  });

  it("should place a message with no position at line and column zero", () => {
    const json = resultsJson([{ filePath: "a.ts", messages: [{ ruleId: "r", severity: AN_ERROR, message: "m" }] }]);

    expect(lintFindingsIn(json)[0]).toMatchObject({ line: 0, column: 0 });
  });

  it("should keep at most the ceiling, the rest being in the file", () => {
    const many = Array.from({ length: MOST_FINDINGS + 5 }, (_, at) => message(at + 1));

    expect(lintFindingsIn(resultsJson([{ filePath: "a.ts", messages: many }]))).toHaveLength(MOST_FINDINGS);
  });

  it("should read nothing out of text that is not JSON, or JSON that is not the results list", () => {
    expect(lintFindingsIn("{ cut off")).toEqual([]);
    expect(lintFindingsIn("")).toEqual([]);
    expect(lintFindingsIn("{}")).toEqual([]);
  });
});
