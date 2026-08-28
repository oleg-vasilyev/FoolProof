import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  DEBT_DOCUMENT,
  SESSION_DOCUMENT,
  SKILLS_FOLDER,
  installedSkills,
  linesIn,
  skillFile,
  skillPages,
} from "../document-files.ts";


const NOTHING = 0;

const SESSION_LINE_BUDGET = 380;

const DEBT_LINE_BUDGET = 640;

const PAGE_LINE_BUDGET = 120;

const SKILL_BUDGETS: Readonly<Record<string, number>> = {
  "add-a-feature": 170,
  "add-repository-method": 80,
  "finish-phase": 470,
  "fix-a-bug": 160,
  "refresh-the-pictures": 240,
  retrospective: 185,
  "update-the-design-page": 70,
  "write-a-commit": 120,
  "write-a-doc": 175,
  "write-a-spec": 395,
  "write-an-e2e-scenario": 140,
};

const SESSION_OVER_BUDGET_REASON = "move a paragraph into a skill rather than raising the number";

const DEBT_OVER_BUDGET_REASON =
  "this file is re-read at the start of every phase, so an entry costs every phase that " +
  "will never pick it up. Close one whose trigger has fired, or say the same thing in " +
  "fewer lines, rather than raising the number";

type LineBudgetCheck = {
  readonly file: string;
  readonly lines: number;
  readonly budget: number;
  readonly reason: string;
};

export const lineBudgetComplaints = (checks: readonly LineBudgetCheck[]): readonly string[] =>
  checks.flatMap(({ file, lines, budget, reason }) =>
    lines <= budget
      ? []
      : [`${file}: ${String(lines)} lines, budget is ${String(budget)} — ${reason}`]
  );

export const overBudget = (): readonly string[] =>
  lineBudgetComplaints([
    {
      file: SESSION_DOCUMENT,
      lines: linesIn(SESSION_DOCUMENT),
      budget: SESSION_LINE_BUDGET,
      reason: SESSION_OVER_BUDGET_REASON,
    },
    {
      file: DEBT_DOCUMENT,
      lines: linesIn(DEBT_DOCUMENT),
      budget: DEBT_LINE_BUDGET,
      reason: DEBT_OVER_BUDGET_REASON,
    },
  ]);

type SkillFileFacts = {
  readonly exists: boolean;
  readonly lines: number;
};

export const skillBudgetComplaints = (
  installed: readonly string[],
  budgets: Readonly<Record<string, number>>,
  factsOf: (skill: string) => SkillFileFacts
): readonly string[] => [
  ...Object.keys(budgets)
    .filter((skill) => !installed.includes(skill))
    .map(
      (skill) =>
        `scripts/docs-check/documents/reading-budgets.ts: budgets a "${skill}" skill that is not in ` +
        `${SKILLS_FOLDER} — a row nothing can fail reads exactly like a row that ` +
        `never complains, so delete it with the skill`
    ),
  ...installed.flatMap((skill) => {
    const budget = budgets[skill];

    if (budget === undefined) {
      return [
        `${skillFile(skill)}: no line budget — a skill is read whole by the job that ` +
          `loads it, so every one of them has a number here; add a row at the length ` +
          `this skill is now`,
      ];
    }

    const facts = factsOf(skill);

    if (!facts.exists) {
      return [`${skillFile(skill)}: a skill folder with no SKILL.md in it`];
    }

    return facts.lines <= budget
      ? []
      : [
          `${skillFile(skill)}: ${String(facts.lines)} lines, budget is ${String(budget)} — ` +
            `cut what only one of its triggers needs into a page beside it and link to ` +
            `that, move a rule into the skill loaded when it applies, or compress an ` +
            `incident into the rule it bought, rather than raising the number`,
        ];
  }),
];

export const skillsOverBudget = (): readonly string[] =>
  skillBudgetComplaints(installedSkills(), SKILL_BUDGETS, (skill) => {
    const exists = existsSync(skillFile(skill));

    return { exists, lines: exists ? linesIn(skillFile(skill)) : NOTHING };
  });

export const pageBudgetComplaints = (
  pages: readonly string[],
  linesOf: (page: string) => number
): readonly string[] =>
  pages
    .filter((page) => linesOf(page) > PAGE_LINE_BUDGET)
    .map(
      (page) =>
        `${page}: ${String(linesOf(page))} lines, budget is ${String(PAGE_LINE_BUDGET)} — ` +
        `a page is read whole the moment something opens it, so it obeys the rule its ` +
        `skill obeys; split it by the reason a reader arrives, or shorten it`
    );

export const pagesOverBudget = (): readonly string[] =>
  pageBudgetComplaints(
    installedSkills().flatMap((skill) =>
      skillPages(skill).map((page) => join(SKILLS_FOLDER, skill, page))
    ),
    linesIn
  );
