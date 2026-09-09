import { describe, expect, it } from "vitest";
import { MOST_FINDINGS } from "./finding.ts";
import { A_TSC_LINE, typecheckFindingsIn } from "./typecheck-findings.ts";


const AN_ERROR_LINE = "src/shared/text/type-probe.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.";

describe("typecheckFindingsIn()", () => {
  it("should read a tsc line in its --pretty false shape into file, line, column, code and message", () => {
    expect(typecheckFindingsIn([AN_ERROR_LINE])).toEqual([
      {
        file: "src/shared/text/type-probe.ts",
        line: 1,
        column: 14,
        rule: "TS2322",
        message: "Type 'string' is not assignable to type 'number'.",
      },
    ]);
  });

  it("should sew the indented continuation lines of a long message onto the finding before them", () => {
    const output = [
      "src/a.ts(3,5): error TS2322: Type '{ a: string; }' is not assignable to type 'B'.",
      "  Types of property 'a' are incompatible.",
      "    Type 'string' is not assignable to type 'number'.",
      "src/b.ts(1,1): error TS2304: Cannot find name 'x'.",
    ];

    expect(typecheckFindingsIn(output).map((finding) => finding.message)).toEqual([
      "Type '{ a: string; }' is not assignable to type 'B'.\nTypes of property 'a' are incompatible.\nType 'string' is not assignable to type 'number'.",
      "Cannot find name 'x'.",
    ]);
  });

  it("should ignore the runner's own command line, blank lines and an indented line before any finding", () => {
    const output = ["$ node node_modules/typescript/bin/tsc --noEmit", "", "  stray", AN_ERROR_LINE, ""];

    expect(typecheckFindingsIn(output)).toHaveLength(1);
  });

  it("should keep at most the ceiling", () => {
    const many = Array.from({ length: MOST_FINDINGS + 3 }, (_, at) => `src/a.ts(${String(at + 1)},1): error TS1: m`);

    expect(typecheckFindingsIn(many)).toHaveLength(MOST_FINDINGS);
  });

  it("should match only an error line, never a warning or prose that mentions TS", () => {
    expect(A_TSC_LINE.test("src/a.ts(1,1): warning TS1: m")).toBe(false);
    expect(A_TSC_LINE.test("Found 1 error in src/a.ts:1")).toBe(false);
    expect(A_TSC_LINE.test(AN_ERROR_LINE)).toBe(true);
  });
});
