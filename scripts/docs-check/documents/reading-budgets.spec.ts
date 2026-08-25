import { beforeEach, describe, expect, it, vi } from "vitest";


const linesInSpy = vi.fn();

const installedSkillsSpy = vi.fn();

const skillFileSpy = vi.fn((skill: string) => `FILE-OF-${skill}`);

const existsSyncSpy = vi.fn();

vi.mock("../document-files.ts", () => ({
  SESSION_DOCUMENT: "THE-SESSION-DOCUMENT",
  DEBT_DOCUMENT: "THE-DEBT-DOCUMENT",
  SKILLS_FOLDER: "THE-SKILLS-FOLDER",
  installedSkills: () => installedSkillsSpy(),
  linesIn: (file: string) => linesInSpy(file),
  skillFile: (skill: string) => skillFileSpy(skill),
}));

vi.mock("node:fs", () => ({
  existsSync: (path: string) => existsSyncSpy(path),
}));

const { lineBudgetComplaints, skillBudgetComplaints, overBudget, skillsOverBudget } = await import(
  "./reading-budgets.ts"
);

const NO_COMPLAINTS = 0;

const ONE_COMPLAINT = 1;

const FIRST = 0;

const AT_BUDGET = 100;

const OVER_BUDGET = 101;

const UNDER_BUDGET = 40;

const UNUSED_LINES = 0;

const REASON = "trim it";

const ONE_LINE = 1;

const SESSION_BUDGET = 380;

const DEBT_BUDGET = 640;

const A_BUDGETED_SKILL = "finish-phase";

const A_SKILL_FILE = `FILE-OF-${A_BUDGETED_SKILL}`;

const FAR_OVER_ANY_BUDGET = 9999;

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
    expect(complaints[FIRST]).toContain("FILE-OF-unbudgeted-skill");
    expect(complaints[FIRST]).toContain("every one of them has a number here");
  });

  it("should name a budgeted skill whose SKILL.md is missing", () => {
    const complaints = skillBudgetComplaints(
      ["hollow-skill"],
      { "hollow-skill": AT_BUDGET },
      () => ({ exists: false, lines: UNUSED_LINES })
    );

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("FILE-OF-hollow-skill");
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

describe("overBudget", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    linesInSpy.mockReturnValue(UNDER_BUDGET);
  });

  it("should measure both documents it answers for, each by its own name", () => {
    overBudget();

    expect(linesInSpy).toHaveBeenCalledWith("THE-SESSION-DOCUMENT");
    expect(linesInSpy).toHaveBeenCalledWith("THE-DEBT-DOCUMENT");
  });

  it("should say nothing while both documents sit exactly at the session budget", () => {
    linesInSpy.mockReturnValue(SESSION_BUDGET);

    expect(overBudget()).toEqual([]);
  });

  it("should name the session document one line over, and only it", () => {
    linesInSpy.mockReturnValue(SESSION_BUDGET + ONE_LINE);

    const complaints = overBudget();

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("THE-SESSION-DOCUMENT");
    expect(complaints[FIRST]).toContain("move a paragraph into a skill rather than raising");
  });

  it("should still spare the debt document at exactly its own, larger budget", () => {
    linesInSpy.mockReturnValue(DEBT_BUDGET);

    const complaints = overBudget();

    expect(complaints).toHaveLength(ONE_COMPLAINT);
    expect(complaints[FIRST]).toContain("THE-SESSION-DOCUMENT");
  });

  it("should name the debt document one line over, and say why an entry is not free", () => {
    linesInSpy.mockReturnValue(DEBT_BUDGET + ONE_LINE);

    const said = overBudget().join("\n");

    expect(said).toContain("THE-DEBT-DOCUMENT");
    expect(said).toContain("re-read at the start of every phase");
    expect(said).toContain("Close one whose trigger has fired");
    expect(said).toContain("fewer lines, rather than raising the number");
  });
});

describe("skillsOverBudget", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    installedSkillsSpy.mockReturnValue([A_BUDGETED_SKILL]);
    existsSyncSpy.mockReturnValue(true);
    linesInSpy.mockReturnValue(UNDER_BUDGET);
  });

  it("should carry a budget for a skill this repository actually installs", () => {
    const said = skillsOverBudget().join("\n");

    expect(said).not.toContain("no line budget");
    expect(said).not.toContain("a skill folder with no SKILL.md in it");
  });

  it("should hold an installed skill to the number the table gives it", () => {
    linesInSpy.mockReturnValue(FAR_OVER_ANY_BUDGET);

    const said = skillsOverBudget().join("\n");

    expect(said).toContain(A_SKILL_FILE);
    expect(said).toContain("move a rule into the skill loaded when it applies");
  });

  it("should ask after the skill's own file rather than its folder", () => {
    skillsOverBudget();

    expect(skillFileSpy).toHaveBeenCalledWith(A_BUDGETED_SKILL);
    expect(existsSyncSpy).toHaveBeenCalledWith(A_SKILL_FILE);
  });

  it("should not count the lines of a SKILL.md that is not there", () => {
    existsSyncSpy.mockReturnValue(false);

    const said = skillsOverBudget().join("\n");

    expect(said).toContain("a skill folder with no SKILL.md in it");
    expect(linesInSpy).not.toHaveBeenCalled();
  });
});
