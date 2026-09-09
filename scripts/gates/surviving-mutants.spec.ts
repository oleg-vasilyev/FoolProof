import { describe, expect, it } from "vitest";
import { MOST_MUTANTS_NAMED, survivorsIn } from "./surviving-mutants.ts";


const mutant = (line: number, status: string, replacement = "x") => ({
  status,
  replacement,
  location: { start: { line, column: 1 }, end: { line, column: 2 } },
});

describe("survivorsIn()", () => {
  it("should keep the survived and the uncovered mutants with their file, line and replacement, and drop the killed", () => {
    const files = {
      "scripts/gates/a.ts": { mutants: [mutant(5, "Killed"), mutant(9, "Survived", '""'), mutant(2, "NoCoverage", "true")] },
    };

    expect(survivorsIn(files)).toEqual({
      named: [
        { file: "scripts/gates/a.ts", line: 2, replacement: "true", status: "NoCoverage" },
        { file: "scripts/gates/a.ts", line: 9, replacement: '""', status: "Survived" },
      ],
      total: 2,
    });
  });

  it("should drop a timeout as well, since a mutant that hung was caught", () => {
    expect(survivorsIn({ "a.ts": { mutants: [mutant(1, "Timeout")] } })).toEqual({ named: [], total: 0 });
  });

  it("should order by file then line, across files", () => {
    const files = {
      "b.ts": { mutants: [mutant(1, "Survived")] },
      "a.ts": { mutants: [mutant(7, "Survived"), mutant(3, "Survived")] },
    };

    expect(survivorsIn(files).named.map((survivor) => `${survivor.file}:${String(survivor.line)}`)).toEqual([
      "a.ts:3",
      "a.ts:7",
      "b.ts:1",
    ]);
  });

  it("should name at most the ceiling and still count them all", () => {
    const many = Array.from({ length: MOST_MUTANTS_NAMED + 4 }, (_, at) => mutant(at + 1, "Survived"));
    const survivors = survivorsIn({ "a.ts": { mutants: many } });

    expect(survivors.named).toHaveLength(MOST_MUTANTS_NAMED);
    expect(survivors.total).toBe(MOST_MUTANTS_NAMED + 4);
  });

  it("should read a mutant with no replacement as an empty one rather than crash", () => {
    const bare = { status: "Survived", location: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } } };

    expect(survivorsIn({ "a.ts": { mutants: [bare] } }).named[0]?.replacement).toBe("");
  });
});
