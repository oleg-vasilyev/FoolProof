import { describe, expect, it } from "vitest";
import { lineBudgetComplaints, skillBudgetComplaints } from "./reading-budgets.ts";


const NO_COMPLAINTS = 0;

const ONE_COMPLAINT = 1;

const FIRST = 0;

const AT_BUDGET = 100;

const OVER_BUDGET = 101;

const UNDER_BUDGET = 40;

const UNUSED_LINES = 0;

const REASON = "trim it";

const ALWAYS_EXISTS = (): { readonly exists: boolean; readonly lines: number } => ({
  exists: true,
  lines: AT_BUDGET,
});

describe("lineBudgetComplaints", () => {
  it("should say nothing about a file exactly at its budget", () => {
    const complaints = lineBudgetComplaints([
      { file: "CLAUDE.md", lines: AT_BUDGET, budget: AT_BUDGET, reason: REASON },
    ]);

    expect(complaints).toEqual([]);
  });

  it("should name a file one line over its budget", () => {
    const complaints = lineBudgetComplaints([
      { file: "CLAUDE.md", lines: OVER_BUDGET, budget: AT_BUDGET, reason: REASON },
    ]);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("CLAUDE.md");
    expect(complaints[FIRST]).toContain(`${String(OVER_BUDGET)} lines, budget is ${String(AT_BUDGET)}`);
    expect(complaints[FIRST]).toContain(REASON);
  });

  it("should say nothing about a file comfortably under its budget", () => {
    const complaints = lineBudgetComplaints([
      { file: "CLAUDE.md", lines: UNDER_BUDGET, budget: AT_BUDGET, reason: REASON },
    ]);

    expect(complaints).toEqual([]);
  });

  it("should check every entry in the table, not only the first", () => {
    const complaints = lineBudgetComplaints([
      { file: "CLAUDE.md", lines: AT_BUDGET, budget: AT_BUDGET, reason: REASON },
      { file: "TECH-DEBT.md", lines: OVER_BUDGET, budget: AT_BUDGET, reason: REASON },
    ]);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("TECH-DEBT.md");
  });
});

describe("skillBudgetComplaints", () => {
  it("should say nothing about a skill installed, budgeted and within its lines", () => {
    const complaints = skillBudgetComplaints(["a-skill"], { "a-skill": AT_BUDGET }, ALWAYS_EXISTS);

    expect(complaints).toEqual([]);
  });

  it("should name a budget for a skill that is not installed", () => {
    const complaints = skillBudgetComplaints([], { "ghost-skill": AT_BUDGET }, ALWAYS_EXISTS);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain('"ghost-skill"');
    expect(complaints[FIRST]).toContain("delete it with the skill");
  });

  it("should name an installed skill that carries no budget row", () => {
    const complaints = skillBudgetComplaints(["unbudgeted-skill"], {}, ALWAYS_EXISTS);

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("unbudgeted-skill");
    expect(complaints[FIRST]).toContain("every one of them has a number here");
  });

  it("should name a budgeted skill whose SKILL.md is missing", () => {
    const complaints = skillBudgetComplaints(
      ["hollow-skill"],
      { "hollow-skill": AT_BUDGET },
      () => ({ exists: false, lines: UNUSED_LINES })
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("hollow-skill");
    expect(complaints[FIRST]).toContain("no SKILL.md in it");
  });

  it("should say nothing about a skill exactly at its budget", () => {
    const complaints = skillBudgetComplaints(
      ["a-skill"],
      { "a-skill": AT_BUDGET },
      () => ({ exists: true, lines: AT_BUDGET })
    );

    expect(complaints).toEqual([]);
  });

  it("should name a skill one line over its budget", () => {
    const complaints = skillBudgetComplaints(
      ["a-skill"],
      { "a-skill": AT_BUDGET },
      () => ({ exists: true, lines: OVER_BUDGET })
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("a-skill");
    expect(complaints[FIRST]).toContain(`${String(OVER_BUDGET)} lines, budget is ${String(AT_BUDGET)}`);
    expect(complaints[FIRST]).toContain("move a rule into the skill loaded when it applies");
  });

  it("should say nothing when there is nothing installed and nothing budgeted", () => {
    expect(skillBudgetComplaints([], {}, ALWAYS_EXISTS)).toHaveLength(NO_COMPLAINTS);
  });
});

describe("every budget complaint carries the reason it exists for", () => {
  const facts = (lines: number) => () => ({ exists: true, lines });

  it("should say why a budget for a skill nobody installed is worse than none", () => {
    const said = skillBudgetComplaints([], { ghost: AT_BUDGET }, facts(AT_BUDGET)).join("\n");

    expect(said).toContain("a row nothing can fail reads exactly like a row that");
    expect(said).toContain("never complains, so delete it with the skill");
  });

  it("should say why every skill owes a number, not merely that one is missing", () => {
    const said = skillBudgetComplaints(["build-it"], {}, facts(AT_BUDGET)).join("\n");

    expect(said).toContain("a skill is read whole by the job that");
    expect(said).toContain("add a row at the length");
    expect(said).toContain("this skill is now");
  });

  it("should say what to do instead of raising a budget that was passed", () => {
    const over = skillBudgetComplaints(["build-it"], { "build-it": AT_BUDGET }, facts(OVER_BUDGET));
    const said = over.join("\n");

    expect(said).toContain("move a rule into the skill loaded when it applies");
    expect(said).toContain("compress an incident");
    expect(said).toContain("rather than raising the number");
  });
});
