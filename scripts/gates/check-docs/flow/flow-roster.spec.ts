import { describe, expect, it } from "vitest";
import { rosterComplaints } from "./flow-roster.ts";


const ALL_THREE_TARGETS = {
  agents: ["reviewer"],
  skills: new Set(["build-it"]),
  scripts: new Set(["check"]),
};

const A_DRAWING_USING_ALL_OF_IT = [
  "C->>R: the reviewer agent reads it",
  "note: the build-it skill applies",
  "run npm run check",
].join("\n");

describe("rosterComplaints", () => {
  it("should pass a drawing that names every agent, skill and command there is", () => {
    expect(rosterComplaints(A_DRAWING_USING_ALL_OF_IT, ALL_THREE_TARGETS)).toEqual([]);
  });

  it("should name an errand sent to an agent that does not exist", () => {
    const said = rosterComplaints("C->>G: the ghost agent reads it", ALL_THREE_TARGETS);

    expect(said.some((one) => one.includes('"ghost" agent'))).toBe(true);
  });

  it("should say why an agent the drawing never reaches is a finding at all", () => {
    const said = rosterComplaints("nothing here", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain("reviewer.md");
    expect(said).toContain("how anybody learns this agent exists");
    expect(said).toContain("nobody will think to run");
  });

  it("should say why a skill the drawing never reaches for is a rule nobody arrives at", () => {
    const said = rosterComplaints("C->>R: the reviewer agent reads it", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain('never reaches for the "build-it" skill');
    expect(said).toContain("only description of when a skill applies");
  });

  it("should name a skill the drawing reaches for that is not installed", () => {
    const said = rosterComplaints("the ghost-skill skill applies", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain('reaching for the "ghost-skill" skill');
    expect(said).toContain(".claude/skills");
  });

  it("should name a command the drawing draws that package.json does not have", () => {
    const said = rosterComplaints("run npm run nonesuch", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain('draws "npm run nonesuch"');
  });
});
