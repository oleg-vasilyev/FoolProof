import { describe, expect, it } from "vitest";
import {
  afterLogLine,
  estimateComplaints,
  fieldsIn,
  theLogBlockIn,
} from "./phase-log-fields.ts";


const NOTHING = 0;

const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const FIRST = 0;

const A_LOG = "logbook/phases/2026-08-26-a-phase.md";

const walking = (path: string, skipped: string): string =>
  ["# A phase", "", "```", `Path:       ${path}`, `Skipped:    ${skipped}`, "```", ""].join("\n");

describe("theLogBlockIn", () => {
  it("should take the lines of the first fenced block and nothing after it", () => {
    const log = "# A phase\n\n```\nKind:       process\n```\n\nprose that follows\n";

    expect(theLogBlockIn(log)).toEqual(["Kind:       process"]);
  });

  it("should find nothing in a log that never opens a block", () => {
    expect(theLogBlockIn("# A phase\n\njust prose\n")).toEqual([]);
  });

  it("should read to the end when the block was left unclosed", () => {
    expect(theLogBlockIn("```\nKind:       process\n")).toEqual(["Kind:       process", ""]);
  });

  it("should not open on a fence quoted inside a sentence", () => {
    expect(theLogBlockIn("the fence is ```\nKind:       process\n")).toEqual([]);
  });
});

describe("afterLogLine", () => {
  const NOTHING_READ = { standing: "", said: new Map<string, string>() };

  it("should start a field and keep its value", () => {
    expect(afterLogLine(NOTHING_READ, "Kind:       process").said.get("Kind")).toBe("process");
  });

  it("should carry a wrapped value onto the field still standing", () => {
    const read = ["Path:       framing →", "            release"].reduce(afterLogLine, NOTHING_READ);

    expect(read.said.get("Path")).toBe("framing → release");
  });

  it("should ignore a line arriving before any field has been named", () => {
    expect(afterLogLine(NOTHING_READ, "   loose prose").said.size).toBe(NOTHING);
  });

  it("should not let a blank line inside the block pad the value it is standing in", () => {
    const read = ["Kind:       process", "", "Path:       framing"].reduce(
      afterLogLine,
      NOTHING_READ
    );

    expect(read.said.get("Kind")).toBe("process");
  });

  it("should read a hyphenated field name, which Off-map is", () => {
    expect(afterLogLine(NOTHING_READ, "Off-map:    none").said.get("Off-map")).toBe("none");
  });

  it("should not read a lower-case word before a colon as a field", () => {
    const read = ["Path:       framing", "note: this is prose"].reduce(afterLogLine, NOTHING_READ);

    expect(read.said.get("Path")).toBe("framing note: this is prose");
  });

  it("should not read an indented field name as a new field, since that is a wrapped value", () => {
    const read = ["Path:       framing", "            Kind: not a field"].reduce(
      afterLogLine,
      NOTHING_READ
    );

    expect(read.said.has("Kind")).toBe(false);
    expect(read.said.get("Path")).toBe("framing Kind: not a field");
  });

  it("should read a field written tight against its colon", () => {
    expect(afterLogLine(NOTHING_READ, "Kind:process").said.get("Kind")).toBe("process");
  });

  it("should trim the value a field was written with", () => {
    expect(afterLogLine(NOTHING_READ, "Kind:       process   ").said.get("Kind")).toBe("process");
  });

  it("should trim a wrapped line before joining it on", () => {
    const read = ["Path:       framing →", "            release   "].reduce(
      afterLogLine,
      NOTHING_READ
    );

    expect(read.said.get("Path")).toBe("framing → release");
  });

  it("should treat a line of nothing but spaces as blank", () => {
    const read = ["Kind:       process", "     ", "Path:       framing"].reduce(
      afterLogLine,
      NOTHING_READ
    );

    expect(read.said.get("Kind")).toBe("process");
  });
});

describe("fieldsIn", () => {
  it("should read every field of a log, wrapped values joined", () => {
    const log = walking("framing → release", "quality gates");

    expect(fieldsIn(log).get("Path")).toBe("framing → release");
    expect(fieldsIn(log).get("Skipped")).toBe("quality gates");
  });
});

describe("estimateComplaints", () => {
  it("should refuse a tilde in front of a number", () => {
    const said = estimateComplaints(A_LOG, new Map([["Ran", "~50 min"]]));

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain('"Ran: ~50 min"');
    expect(said[FIRST]).toContain("cannot tell a measurement from a guess");
    expect(said[FIRST]).toContain("poisons all five");
    expect(said[FIRST]).toContain('written "not measured", never estimated');
  });

  it("should refuse the words a tilde is spelled out as", () => {
    expect(estimateComplaints(A_LOG, new Map([["Ran", "about 50 min"]]))).toHaveLength(
      ONE_COMPLAINT
    );
    expect(estimateComplaints(A_LOG, new Map([["Ran", "roughly 4 errands"]]))).toHaveLength(
      ONE_COMPLAINT
    );
    expect(estimateComplaints(A_LOG, new Map([["Ran", "around 12 files"]]))).toHaveLength(
      ONE_COMPLAINT
    );
    expect(estimateComplaints(A_LOG, new Map([["Ran", "approximately 3 hours"]]))).toHaveLength(
      ONE_COMPLAINT
    );
  });

  it("should refuse a number left vague by a suffix", () => {
    expect(estimateComplaints(A_LOG, new Map([["Ran", "50-ish minutes"]]))).toHaveLength(
      ONE_COMPLAINT
    );
  });

  it("should let a measured number through", () => {
    expect(estimateComplaints(A_LOG, new Map([["Ran", "18m31s · Opus 5 · 41k"]]))).toHaveLength(
      NOTHING
    );
  });

  it("should let the answer the rule actually asks for through", () => {
    expect(estimateComplaints(A_LOG, new Map([["Ran", "not measured"]]))).toHaveLength(NOTHING);
  });

  it("should not read a hedge with no number after it as one", () => {
    const said = estimateComplaints(A_LOG, new Map([["Rework", "none — nothing about the codec"]]));

    expect(said).toHaveLength(NOTHING);
  });

  it("should complain once per field, so a log with two guesses shows both", () => {
    const said = estimateComplaints(
      A_LOG,
      new Map([
        ["Ran", "~50 min"],
        ["Delegated", "about 3 errands"],
      ])
    );

    expect(said).toHaveLength(TWO_COMPLAINTS);
  });
});
