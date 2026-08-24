import { existsSync } from "node:fs";
import {
  DEBT_DOCUMENT,
  SESSION_DOCUMENT,
  SKILLS_FOLDER,
  installedSkills,
  linesIn,
  skillFile,
} from "./the-documents.ts";


const SESSION_LINE_BUDGET = 380;

const DEBT_LINE_BUDGET = 620;

const SKILL_BUDGETS: Readonly<Record<string, number>> = {
  "add-a-feature": 170,
  "add-repository-method": 80,
  "finish-phase": 700,
  "refresh-the-pictures": 240,
  retrospective: 165,
  "update-the-design-page": 70,
  "write-a-commit": 120,
  "write-a-doc": 175,
  "write-a-spec": 495,
  "write-an-e2e-scenario": 140,
};

export const overBudget = (): readonly string[] => [
  ...(linesIn(SESSION_DOCUMENT) <= SESSION_LINE_BUDGET
    ? []
    : [
        `${SESSION_DOCUMENT}: ${String(linesIn(SESSION_DOCUMENT))} lines, budget is ` +
          `${String(SESSION_LINE_BUDGET)} — move a paragraph into a skill rather than ` +
          `raising the number`,
      ]),
  ...(linesIn(DEBT_DOCUMENT) <= DEBT_LINE_BUDGET
    ? []
    : [
        `${DEBT_DOCUMENT}: ${String(linesIn(DEBT_DOCUMENT))} lines, budget is ` +
          `${String(DEBT_LINE_BUDGET)} — this file is re-read at the start of every ` +
          `phase, so an entry costs every phase that will never pick it up. Close one ` +
          `whose trigger has fired, or say the same thing in fewer lines, rather than ` +
          `raising the number`,
      ]),
];

export const skillsOverBudget = (): readonly string[] => {
  const installed = installedSkills();

  return [
    ...Object.keys(SKILL_BUDGETS)
      .filter((skill) => !installed.includes(skill))
      .map(
        (skill) =>
          `scripts/docs/reading-budgets.ts: budgets a "${skill}" skill that is not in ` +
          `${SKILLS_FOLDER} — a row nothing can fail reads exactly like a row that ` +
          `never complains, so delete it with the skill`
      ),
    ...installed.flatMap((skill) => {
      const budget = SKILL_BUDGETS[skill];

      if (budget === undefined) {
        return [
          `${skillFile(skill)}: no line budget — a skill is read whole by the job that ` +
            `loads it, so every one of them has a number here; add a row at the length ` +
            `this skill is now`,
        ];
      }

      if (!existsSync(skillFile(skill))) {
        return [`${skillFile(skill)}: a skill folder with no SKILL.md in it`];
      }

      const lines = linesIn(skillFile(skill));

      return lines <= budget
        ? []
        : [
            `${skillFile(skill)}: ${String(lines)} lines, budget is ${String(budget)} — ` +
              `move a rule into the skill loaded when it applies, or compress an incident ` +
              `into the rule it bought, rather than raising the number`,
          ];
    }),
  ];
};
