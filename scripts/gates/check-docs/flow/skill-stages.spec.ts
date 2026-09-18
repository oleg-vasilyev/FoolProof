import { describe, expect, it } from "vitest";
import {
  descriptionComplaints,
  skillsByStage,
  stageComplaints,
  stagesDeclaredIn,
  stagesNamedIn,
} from "./skill-stages.ts";


const FIRST = 0;

const ONE_COMPLAINT = 1;

const NOTHING = 0;

const STAGE_THREE = 3;

const STAGE_FIVE = 5;

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

describe("stagesNamedIn", () => {
  it("should read the stage a description names in prose", () => {
    expect(stagesNamedIn("Stage 3 — use when the gates are due")).toEqual([STAGE_THREE]);
  });

  it("should read a stage named in the middle of a sentence, whatever its case", () => {
    expect(stagesNamedIn("this is stage 5 work")).toEqual([STAGE_FIVE]);
  });

  it("should read every number when a description names several stages at once", () => {
    expect(stagesNamedIn("drawn at stages 3 and 5")).toEqual([STAGE_THREE, STAGE_FIVE]);
  });

  it("should read nothing from a number that is not a stage", () => {
    expect(stagesNamedIn("closes 3 findings")).toHaveLength(NOTHING);
  });

  it("should read nothing from a stage word carrying no number after it", () => {
    expect(stagesNamedIn("stages and steps are cited by name")).toHaveLength(NOTHING);
  });

  it("should read nothing from a description that names no stage at all", () => {
    expect(stagesNamedIn("use whenever a query is needed")).toHaveLength(NOTHING);
  });
});

describe("descriptionComplaints", () => {
  it("should agree when the description names the stage the title claims", () => {
    const claimed = new Map([["build-it", [STAGE_THREE]]]);
    const described = new Map([["build-it", "Stage 3 — use once the code is written"]]);

    expect(descriptionComplaints(claimed, described)).toEqual([]);
  });

  it("should say which stage is missing and why the description is what decides when", () => {
    const claimed = new Map([["build-it", [STAGE_THREE]]]);
    const described = new Map([["build-it", "Load it when any list of changes is accepted"]]);
    const said = descriptionComplaints(claimed, described).join("\n");

    expect(said).toContain("its title claims stage 3");
    expect(said).toContain("read before it is loaded");
    expect(said).toContain("obeyed at the owner's first message");
    expect(said).toContain("a phase's whole sequencing");
    expect(said).toContain('Say "stage 3" in it');
  });

  it("should complain once per stage the description leaves out", () => {
    const claimed = new Map([["build-it", [STAGE_THREE, STAGE_FIVE]]]);
    const described = new Map([["build-it", "Stage 3 — use once the code is written"]]);
    const said = descriptionComplaints(claimed, described);

    expect(said).toHaveLength(ONE_COMPLAINT);
    expect(said[FIRST]).toContain("claims stage 5");
  });

  it("should treat a skill with no description at all as naming no stage", () => {
    const claimed = new Map([["build-it", [STAGE_THREE]]]);

    expect(descriptionComplaints(claimed, new Map())).toHaveLength(ONE_COMPLAINT);
  });

  it("should say nothing about a skill whose title claims no stage", () => {
    const claimed = new Map([["build-it", []]]);

    expect(descriptionComplaints(claimed, new Map())).toEqual([]);
  });
});
