import { describe, expect, it } from "vitest";
import {
  afterFlowLine,
  flowComplaints,
  replyComplaints,
  skillsByStage,
  stageComplaints,
  stagesDeclaredIn,
} from "./the-flow-drawing.ts";


const THE_OWNER = "U";

const NOBODY = "";

const NOTHING_ASKED = { asked: NOBODY, complaints: [] };

const FIRST = 0;

const ONE_COMPLAINT = 1;

const NOTHING = 0;

const STAGE_THREE = 3;

const STAGE_FIVE = 5;

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

describe("afterFlowLine", () => {
  it("should remember who the errand went to", () => {
    expect(afterFlowLine(NOTHING_ASKED, "  C->>R: review the whole diff", THE_OWNER).asked).toBe("R");
  });

  it("should say nothing when the one asked is the one who answers", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review the whole diff", THE_OWNER);

    expect(afterFlowLine(asked, "  R-->>C: eight findings", THE_OWNER).complaints).toEqual([]);
  });

  it("should complain when somebody else hands the work back", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review the whole diff", THE_OWNER);
    const answered = afterFlowLine(asked, "  S-->>C: eight findings", THE_OWNER);

    expect(answered.complaints).toHaveLength(ONE_COMPLAINT);
    expect(answered.complaints[FIRST]).toContain("the errand went to R and S answered it");
  });

  it("should forget the errand once it has complained, so one slip is not counted twice", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review", THE_OWNER);
    const answered = afterFlowLine(asked, "  S-->>C: findings", THE_OWNER);

    expect(afterFlowLine(answered, "  K-->>C: more findings", THE_OWNER).complaints).toHaveLength(
      ONE_COMPLAINT
    );
  });

  it("should let the owner answer anything, because a person is not an errand", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review", THE_OWNER);

    expect(afterFlowLine(asked, "  U-->>C: looks right to me", THE_OWNER).complaints).toEqual([]);
  });

  it("should ignore a note Claude makes to itself rather than reading it as an errand", () => {
    expect(afterFlowLine(NOTHING_ASKED, "  C->>C: writes the copy table", THE_OWNER).asked).toBe(
      NOBODY
    );
  });

  it("should say nothing about an answer that follows no errand at all", () => {
    expect(afterFlowLine(NOTHING_ASKED, "  R-->>C: findings", THE_OWNER).complaints).toEqual([]);
  });

  it("should read a solid arrow back as an answer, the same as a dashed one", () => {
    const asked = afterFlowLine(NOTHING_ASKED, "  C->>R: review", THE_OWNER);

    expect(afterFlowLine(asked, "  S->>C: findings", THE_OWNER).complaints).toHaveLength(
      ONE_COMPLAINT
    );
  });
});

describe("flowComplaints", () => {
  it("should pass a drawing that names every agent, skill and command there is", () => {
    expect(flowComplaints(A_DRAWING_USING_ALL_OF_IT, ALL_THREE_TARGETS)).toEqual([]);
  });

  it("should name an errand sent to an agent that does not exist", () => {
    const said = flowComplaints("C->>G: the ghost agent reads it", ALL_THREE_TARGETS);

    expect(said.some((one) => one.includes('"ghost" agent'))).toBe(true);
  });

  it("should say why an agent the drawing never reaches is a finding at all", () => {
    const said = flowComplaints("nothing here", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain("reviewer.md");
    expect(said).toContain("how anybody learns this agent exists");
    expect(said).toContain("nobody will think to run");
  });

  it("should say why a skill the drawing never reaches for is a rule nobody arrives at", () => {
    const said = flowComplaints("C->>R: the reviewer agent reads it", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain('never reaches for the "build-it" skill');
    expect(said).toContain("only description of when a skill applies");
  });

  it("should name a skill the drawing reaches for that is not installed", () => {
    const said = flowComplaints("the ghost-skill skill applies", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain('reaching for the "ghost-skill" skill');
    expect(said).toContain(".claude/skills");
  });

  it("should name a command the drawing draws that package.json does not have", () => {
    const said = flowComplaints("run npm run nonesuch", ALL_THREE_TARGETS).join("\n");

    expect(said).toContain('draws "npm run nonesuch"');
  });
});

describe("skillsByStage", () => {
  it("should tie a skill to the stage whose note it sits under", () => {
    const drawing = [
      "note over C: Stage 3.",
      "the build-it skill applies",
      "note over C: Stage 5.",
      "the ship-it skill applies",
    ].join("\n");

    expect(skillsByStage(drawing)).toEqual([
      ["build-it", STAGE_THREE],
      ["ship-it", STAGE_FIVE],
    ]);
  });

  it("should tie nothing to a stage in a drawing that marks none", () => {
    expect(skillsByStage("the build-it skill applies")).toEqual([]);
  });

  it("should carry a skill named after the last mark to the end of the drawing", () => {
    const drawing = "note over C: Stage 5.\nlater the ship-it skill applies";

    expect(skillsByStage(drawing)).toEqual([["ship-it", STAGE_FIVE]]);
  });
});

describe("stagesDeclaredIn", () => {
  it("should read the stage a skill claims under its title", () => {
    expect(stagesDeclaredIn("# Doing it\n\n> **Stage 3** of the flow\n")).toEqual([STAGE_THREE]);
  });

  it("should read both numbers when a skill claims two stages", () => {
    expect(stagesDeclaredIn("> **Stages 3 and 5** of the flow\n")).toEqual([
      STAGE_THREE,
      STAGE_FIVE,
    ]);
  });

  it("should not read a claim that only appears inside a fenced example", () => {
    expect(stagesDeclaredIn("```\n> **Stage 3**\n```\n")).toHaveLength(NOTHING);
  });

  it("should read nothing from a skill that claims no stage", () => {
    expect(stagesDeclaredIn("# Doing it\n\nprose\n")).toHaveLength(NOTHING);
  });
});

describe("stageComplaints", () => {
  it("should agree when the drawing and the skill name the same stage", () => {
    const claimed = new Map([["build-it", [STAGE_THREE]]]);

    expect(stageComplaints([["build-it", STAGE_THREE]], claimed)).toEqual([]);
  });

  it("should tell the skill exactly what to write when the drawing reaches a stage it disowns", () => {
    const said = stageComplaints([["build-it", STAGE_THREE]], new Map()).join("\n");

    expect(said).toContain("reaches for this skill in stage 3");
    expect(said).toContain('say "> **Stage 3**" under its title');
  });

  it("should say a claim nobody draws is a number that drifts", () => {
    const claimed = new Map([["build-it", [STAGE_FIVE]]]);
    const said = stageComplaints([], claimed).join("\n");

    expect(said).toContain("claims stage 5");
    expect(said).toContain("a number that drifts");
  });
});

describe("replyComplaints", () => {
  it("should say nothing about a drawing where every errand is answered by its own lane", () => {
    const drawing = "participant C as Claude\nactor U as Owner\nC->>R: asks\nR-->>C: answers";

    expect(replyComplaints(drawing)).toEqual([]);
  });

  it("should refuse to run quietly when Claude's lane is no longer declared", () => {
    const said = replyComplaints("actor U as Owner\nC->>R: asks");

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("reads exactly like one with");
    expect(said[FIRST]).toContain("teach it the new id");
  });

  it("should catch an errand answered by a lane it was never given to", () => {
    const drawing = "participant C as Claude\nactor U as Owner\nC->>R: asks\nP-->>C: answers";
    const said = replyComplaints(drawing);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("went to R and P answered it");
  });

  it("should let the owner answer anything, because the owner is not an errand", () => {
    const drawing = "participant C as Claude\nactor U as Owner\nC->>R: asks\nU-->>C: decides";

    expect(replyComplaints(drawing)).toEqual([]);
  });
});
