import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";


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

export const FIRST_GROUP = 1;

export const SECOND_GROUP = 2;

export const A_LINE = /\r?\n/;

const A_MARKDOWN_FILE = /\.md$/;

const A_HEADING = /^#+ .+$/gm;

const ITS_HASHES = /^#+ /;

const NOT_IN_AN_ANCHOR = /[^a-z0-9 -]/g;

const SPACES_IN_AN_ANCHOR = / +/g;

const A_FENCED_BLOCK = /```[\s\S]*?```/g;

const A_BACKTICKED_WORD = /`([^`]+)`/g;

const BETWEEN_BACKTICKED_WORDS = /[\s/]+/;

export const read = (file: string): string =>
  readFileSync(file, "utf8").replaceAll("\r\n", "\n");

export const linesIn = (document: string): number => read(document).split(A_LINE).length;

export const headingsOf = (text: string): readonly string[] =>
  (text.match(A_HEADING) ?? []).map((heading) => heading.replace(ITS_HASHES, ""));

export const anchorOf = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(NOT_IN_AN_ANCHOR, "")
    .trim()
    .replace(SPACES_IN_AN_ANCHOR, "-");

export const withoutFencedBlocks = (text: string): string => text.replace(A_FENCED_BLOCK, "");

export const backtickedWordsOf = (text: string): ReadonlySet<string> =>
  new Set(
    [...withoutFencedBlocks(text).matchAll(A_BACKTICKED_WORD)].flatMap((match) =>
      (match[FIRST_GROUP] ?? "").split(BETWEEN_BACKTICKED_WORDS)
    )
  );

export const namesIn = (text: string, pattern: RegExp): readonly string[] =>
  [...text.matchAll(pattern)].map((match) => match[FIRST_GROUP] ?? "");

export const skillFile = (skill: string): string => join(SKILLS_FOLDER, skill, "SKILL.md");

export const installedSkills = (): readonly string[] => readdirSync(SKILLS_FOLDER);

export const definedAgents = (): readonly string[] =>
  readdirSync(AGENTS_FOLDER).map((file) => file.replace(A_MARKDOWN_FILE, ""));
