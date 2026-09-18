import { describe, expect, it } from "vitest";
import { findingsOf, worstStatusOf } from "./typecheck-run.ts";


const PASSED = 0;

const FAILED = 1;

const A_SIGNAL = 143;

const AN_ERROR_IN_SRC = "src/a.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.";

const AN_ERROR_IN_E2E = "e2e/pages/chat.ts(9,3): error TS2551: Property 'tap' does not exist.";

const A_PASS: { readonly output: readonly string[]; readonly status: number } = { output: [""], status: PASSED };

describe("findingsOf", () => {
  it("should gather what each project reported into one list, in the order the projects ran", () => {
    const findings = findingsOf([
      { output: [AN_ERROR_IN_SRC], status: FAILED },
      { output: [AN_ERROR_IN_E2E], status: FAILED },
    ]);

    expect(findings.map((finding) => finding.file)).toEqual(["src/a.ts", "e2e/pages/chat.ts"]);
  });

  it("should read nothing out of a project that said nothing", () => {
    expect(findingsOf([A_PASS])).toEqual([]);
  });

  it("should read nothing when no project ran at all", () => {
    expect(findingsOf([])).toEqual([]);
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
