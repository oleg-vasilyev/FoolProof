import { describe, expect, it } from "vitest";
import { contentsListComplaints } from "./plan-contents-list.ts";


const ONE_COMPLAINT = 1;

const FIRST = 0;

describe("contentsListComplaints", () => {
  const contentsPointingAt = (anchor: string): string =>
    `## What is in here\n\n[a section](#${anchor})\n\n## A section\n\nbody\n`;

  it("should say nothing when every section is listed and every listed anchor is a section", () => {
    expect(contentsListComplaints(contentsPointingAt("a-section"))).toEqual([]);
  });

  it("should name a section that the contents list does not carry", () => {
    const text = "## What is in here\n\nnothing here\n\n## A forgotten section\n\nbody\n";
    const complaints = contentsListComplaints(text);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"A forgotten section"');
    expect(complaints[FIRST]).toContain("is one nobody arrives at");
  });

  it("should name a contents entry pointing at a section that no longer exists", () => {
    const text = "## What is in here\n\n[gone](#gone)\n";
    const complaints = contentsListComplaints(text);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("#gone");
    expect(complaints[FIRST]).toContain("worse than none");
  });

  it("should not list the contents heading itself as a missing section", () => {
    expect(contentsListComplaints(contentsPointingAt("a-section"))).toEqual([]);
  });
});
