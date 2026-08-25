import { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { A_LINE } from "./markdown-text.ts";


export const DOCUMENTS = [
  "README.md",
  "PLAN.md",
  "CLAUDE.md",
  "TECH-DEBT.md",
  "e2e/README.md",
  "deploy/README.md",
];

export const SESSION_DOCUMENT = "CLAUDE.md";

export const DEBT_DOCUMENT = "TECH-DEBT.md";

export const SPEC_DOCUMENT = "PLAN.md";

export const TREE_DOCUMENT = "README.md";

export const FLOW_DOCUMENT = "DEVELOPMENT-FLOW.md";

export const SKILLS_FOLDER = ".claude/skills";

export const AGENTS_FOLDER = ".claude/agents";

const A_MARKDOWN_FILE = /\.md$/;

export const read = (file: string): string =>
  readFileSync(file, "utf8").replaceAll("\r\n", "\n");

export const linesIn = (document: string): number => read(document).split(A_LINE).length;

export const skillFile = (skill: string): string => join(SKILLS_FOLDER, skill, "SKILL.md");

export const skillPages = (skill: string): readonly string[] =>
  readdirSync(join(SKILLS_FOLDER, skill)).filter(
    (entry) => A_MARKDOWN_FILE.test(entry) && entry !== "SKILL.md"
  );

export const installedSkills = (): readonly string[] => readdirSync(SKILLS_FOLDER);

export const definedAgents = (): readonly string[] =>
  readdirSync(AGENTS_FOLDER).map((file) => file.replace(A_MARKDOWN_FILE, ""));
