import { describe, expect, it } from "vitest";
import {
  linkComplaints,
  specContentsComplaints,
  unreachableHelpComplaints,
} from "./document-references.ts";


const NO_COMPLAINTS = 0;

const ONE_COMPLAINT = 1;

const TWO_COMPLAINTS = 2;

const FIRST = 0;

const FILE = "README.md";

const ALWAYS = (): boolean => true;

const NEVER = (): boolean => false;

describe("linkComplaints", () => {
  it("should say nothing about a link that resolves and carries no anchor", () => {
    const complaints = linkComplaints(FILE, "[see](PLAN.md)", {}, ALWAYS);

    expect(complaints).toEqual([]);
  });

  it("should skip a link starting with http, because it names nothing on disk", () => {
    const complaints = linkComplaints(FILE, "[see](https://example.com)", {}, NEVER);

    expect(complaints).toEqual([]);
  });

  it("should skip a link that only names an anchor in the same document", () => {
    const complaints = linkComplaints(FILE, "[see](#a-heading)", {}, NEVER);

    expect(complaints).toEqual([]);
  });

  it("should name a target that does not exist on disk", () => {
    const complaints = linkComplaints(FILE, "[see](GHOST.md)", {}, NEVER);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("GHOST.md");
    expect(complaints[FIRST]).toContain("does not exist");
  });

  it("should name a heading that the target document does not carry", () => {
    const complaints = linkComplaints(
      FILE,
      "[see](PLAN.md#missing)",
      { "PLAN.md": new Set(["real-heading"]) },
      ALWAYS
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("PLAN.md#missing");
    expect(complaints[FIRST]).toContain("that heading is not in PLAN.md");
  });

  it("should say nothing about a heading the target document actually carries", () => {
    const complaints = linkComplaints(
      FILE,
      "[see](PLAN.md#real-heading)",
      { "PLAN.md": new Set(["real-heading"]) },
      ALWAYS
    );

    expect(complaints).toEqual([]);
  });

  it("should say nothing about an anchor into a target whose headings were never gathered", () => {
    const complaints = linkComplaints(FILE, "[see](OTHER.md#anything)", {}, ALWAYS);

    expect(complaints).toEqual([]);
  });

  it("should resolve a target relative to the document that links it", () => {
    const complaints = linkComplaints(
      "deploy/README.md",
      "[see](../PLAN.md#missing)",
      { "PLAN.md": new Set(["real-heading"]) },
      ALWAYS
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("that heading is not in PLAN.md");
  });

  it("should not read a link that a sentence merely mentions the shape of", () => {
    const complaints = linkComplaints(FILE, "prose about [text] and (parens) separately", {}, NEVER);

    expect(complaints).toEqual([]);
  });

  it("should find several complaints across several links", () => {
    const complaints = linkComplaints(FILE, "[a](GHOST.md) and [b](ANOTHER.md)", {}, NEVER);

    expect(complaints).toHaveLength(TWO_COMPLAINTS);
  });
});

describe("specContentsComplaints", () => {
  const contentsPointingAt = (anchor: string): string =>
    `## What is in here\n\n[a section](#${anchor})\n\n## A section\n\nbody\n`;

  it("should say nothing when every section is listed and every listed anchor is a section", () => {
    expect(specContentsComplaints(contentsPointingAt("a-section"))).toEqual([]);
  });

  it("should name a section that the contents list does not carry", () => {
    const text = "## What is in here\n\nnothing here\n\n## A forgotten section\n\nbody\n";
    const complaints = specContentsComplaints(text);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"A forgotten section"');
    expect(complaints[FIRST]).toContain("is one nobody arrives at");
  });

  it("should name a contents entry pointing at a section that no longer exists", () => {
    const text = "## What is in here\n\n[gone](#gone)\n";
    const complaints = specContentsComplaints(text);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("#gone");
    expect(complaints[FIRST]).toContain("worse than none");
  });

  it("should not list the contents heading itself as a missing section", () => {
    expect(specContentsComplaints(contentsPointingAt("a-section"))).toEqual([]);
  });
});

describe("unreachableHelpComplaints", () => {
  it("should say nothing when the session document names every skill and agent", () => {
    const complaints = unreachableHelpComplaints(
      "read the add-a-feature skill, then the phase-reviewer agent",
      ["add-a-feature"],
      ["phase-reviewer"]
    );

    expect(complaints).toEqual([]);
  });

  it("should name a skill the session document never routes to", () => {
    const complaints = unreachableHelpComplaints("nothing here about it", ["orphan-skill"], []);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"orphan-skill"');
    expect(complaints[FIRST]).toContain("nobody loads");
  });

  it("should name an agent the session document never routes to", () => {
    const complaints = unreachableHelpComplaints("nothing here about it", [], ["orphan-agent"]);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"orphan-agent"');
    expect(complaints[FIRST]).toContain("never runs");
  });

  it("should find both kinds of complaint together", () => {
    const complaints = unreachableHelpComplaints("nothing here", ["orphan-skill"], ["orphan-agent"]);

    expect(complaints).toHaveLength(TWO_COMPLAINTS);
  });

  it("should say nothing when there is nothing to route to", () => {
    expect(unreachableHelpComplaints("anything", [], [])).toHaveLength(NO_COMPLAINTS);
  });
});
