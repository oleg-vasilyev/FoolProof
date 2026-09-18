import { describe, expect, it } from "vitest";
import { MOST_FINDINGS, savedFindingsIn } from "./finding.ts";


const ONE_MORE = 1;

const A_LINE = 3;

const A_COLUMN = 1;

const aFinding = (at: number) => ({
  file: `src/a${String(at)}.ts`,
  line: A_LINE,
  column: A_COLUMN,
  rule: "TS2322",
  message: "no",
});

describe("savedFindingsIn", () => {
  it("should read back the findings a gate wrote", () => {
    expect(savedFindingsIn(JSON.stringify([aFinding(ONE_MORE)]))).toEqual([aFinding(ONE_MORE)]);
  });

  it("should read a gate that found nothing as nothing, not as a missing file", () => {
    expect(savedFindingsIn("[]")).toEqual([]);
  });

  it("should keep at most as many as the other gates name", () => {
    const many = Array.from({ length: MOST_FINDINGS + ONE_MORE }, (unused, at) => aFinding(at));

    expect(savedFindingsIn(JSON.stringify(many))).toHaveLength(MOST_FINDINGS);
  });

  it("should refuse a file that is not JSON, so the gate reports it missing rather than empty", () => {
    expect(savedFindingsIn("not json")).toBeNull();
  });

  it("should refuse a JSON value that is not a list, for the same reason", () => {
    expect(savedFindingsIn(JSON.stringify({ file: "a.ts" }))).toBeNull();
  });

  it("should drop an entry missing a field, rather than reporting a finding with holes in it", () => {
    const { message: unused, ...withoutAMessage } = aFinding(ONE_MORE);

    expect(savedFindingsIn(JSON.stringify([withoutAMessage, aFinding(ONE_MORE)]))).toEqual([
      aFinding(ONE_MORE),
    ]);
  });

  it("should drop an entry whose line is not a number, which would print as NaN", () => {
    const wrongShape = { ...aFinding(ONE_MORE), line: "3" };

    expect(savedFindingsIn(JSON.stringify([wrongShape]))).toEqual([]);
  });
});
