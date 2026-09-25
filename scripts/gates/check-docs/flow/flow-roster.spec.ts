import { describe, expect, it } from "vitest";
import { agentErrandsOffTheirLane, rosterComplaints } from "./flow-roster.ts";


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

describe("agentErrandsOffTheirLane", () => {
  const LANES = [
    "    participant Hand as Subagents I brief by hand — one question to answer",
    "    note over Hand: participant Named2 as a label quoting .claude/agents",
    "    participant Named as Named agents, .claude/agents",
  ];

  const drawn = (...errands: readonly string[]): string => [...LANES, ...errands].join("\r\n");

  it("should pass an errand to a named agent sent on the lane labelled .claude/agents", () => {
    expect(agentErrandsOffTheirLane(drawn("        C->>Named: now the reviewer agent reads it"), ["reviewer"])).toEqual([]);
  });

  it("should name a named agent sent its errand on another lane, and the line that did it", () => {
    const said = agentErrandsOffTheirLane(drawn("        C->>Hand: then the reviewer agent, one brief per piece"), [
      "reviewer",
    ]);

    expect(said).toEqual([
      "DEVELOPMENT-FLOW.md: the reviewer agent is sent its errand on lane Hand, not on Named where " +
        ".claude/agents is drawn — a reader takes the lane for what kind of helper answers, so a named " +
        "agent on another lane reads as one briefed by hand — C->>Hand: then the reviewer agent, one brief per piece",
    ]);
  });

  it("should leave alone an errand whose agent is not one of .claude/agents, and a line that is no errand", () => {
    const lines = drawn(
      "        C->>Hand: the fact-checker agent reads git",
      "        Hand-->>C: the reviewer agent answered",
      "        %% C->>Hand: the reviewer agent, commented out"
    );

    expect(agentErrandsOffTheirLane(lines, ["reviewer"])).toEqual([]);
  });

  it("should refuse to pass quietly when no lane is labelled .claude/agents", () => {
    expect(agentErrandsOffTheirLane("C->>Hand: the reviewer agent reads it", ["reviewer"])).toEqual([
      "DEVELOPMENT-FLOW.md: no participant is labelled .claude/agents, so the errands sent to named " +
        "agents have no lane to be held to — a check matching nothing reads exactly like one with " +
        "nothing to report",
    ]);
  });
});
