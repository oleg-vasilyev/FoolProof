import { describe, expect, it } from "vitest";
import { frontmatterComplaints, frontmatterOf, unparseableKeys } from "./frontmatter-yaml.ts";


const NOTHING = 0;

const ONE_KEY = 1;

const ONE_COMPLAINT = 1;

const FIRST = 0;

describe("frontmatterOf", () => {
  it("should take the lines between the fences, which is all a parser reads as YAML", () => {
    expect(frontmatterOf("---\nname: one\nmodel: fable\n---\n\nthe body\n")).toEqual([
      "name: one",
      "model: fable",
    ]);
  });

  it("should find nothing in a file that opens with prose rather than a fence", () => {
    expect(frontmatterOf("# A document\n\nname: not frontmatter\n")).toEqual([]);
  });

  it("should not read a fence further down as the end of a block that never opened", () => {
    expect(frontmatterOf("# A document\n\nname: a: b\n\n---\n\nmore prose\n")).toEqual([]);
  });

  it("should find nothing when the block was opened and never closed", () => {
    expect(frontmatterOf("---\nname: one\n")).toEqual([]);
  });
});

describe("unparseableKeys", () => {
  it("should name a key whose unquoted value holds a colon and a space", () => {
    const broken = "---\ndescription: Run a phase: the gates, and the commit\n---\n";

    expect(unparseableKeys(broken)).toEqual(["description"]);
  });

  it("should accept the same value once it is quoted, which is the fix being asked for", () => {
    const quoted = '---\ndescription: "Run a phase: the gates, and the commit"\n---\n';

    expect(unparseableKeys(quoted)).toHaveLength(NOTHING);
  });

  it("should accept a colon with no space after it, which no parser reads as a mapping", () => {
    expect(unparseableKeys("---\nname: add-a-feature\nurl: https://example.com\n---\n")).toHaveLength(
      NOTHING
    );
  });

  it("should read only the block, so a colon in the body is not a finding", () => {
    const body = "---\nname: one\n---\n\nA sentence: it has a colon in it.\n";

    expect(unparseableKeys(body)).toHaveLength(NOTHING);
  });

  it("should name every broken key rather than stopping at the first", () => {
    const two = "---\nname: a: b\ndescription: c: d\n---\n";

    expect(unparseableKeys(two)).toEqual(["name", "description"]);
  });

  it("should ignore a list item, which carries no key of its own", () => {
    expect(unparseableKeys("---\ntools:\n  - Read: all\n---\n")).toHaveLength(NOTHING);
  });

  it("should read a key only at the start of its line, so a nested item is not one", () => {
    expect(unparseableKeys("---\ntools:\n  - Read: a: b\n---\n")).toHaveLength(NOTHING);
  });

  it("should see the quotes past however much space was left before them", () => {
    const spaced = '---\ndescription:   "Run a phase: the gates"\n---\n';

    expect(unparseableKeys(spaced)).toHaveLength(NOTHING);
  });

  it("should not call a value quoted because a quote appears somewhere inside it", () => {
    const inside = '---\ndescription: he said "no": and left\n---\n';

    expect(unparseableKeys(inside)).toEqual(["description"]);
  });
});

describe("frontmatterComplaints", () => {
  it("should say what a parser does with it and what to do about it", () => {
    const complaints = frontmatterComplaints(
      "SKILL.md",
      "---\ndescription: Run a phase: the gates\n---\n"
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("SKILL.md");
    expect(complaints[FIRST]).toContain("nested mapping");
    expect(complaints[FIRST]).toContain("renders the whole block as an error");
    expect(complaints[FIRST]).toContain("may read no description at all");
    expect(complaints[FIRST]).toContain("double quotes");
  });

  it("should say nothing about a file whose block parses", () => {
    expect(frontmatterComplaints("SKILL.md", "---\nname: one\n---\n")).toHaveLength(NOTHING);
  });

  it("should name the key it is complaining about, so a long block is searchable", () => {
    const complaints = frontmatterComplaints("a.md", "---\nwhenToUse: after this: and that\n---\n");

    expect(complaints[FIRST]).toContain("whenToUse");
    expect(unparseableKeys("---\nwhenToUse: after this: and that\n---\n")).toHaveLength(ONE_KEY);
  });
});
