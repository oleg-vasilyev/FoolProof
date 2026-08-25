import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AGENTS_FOLDER,
  DOCUMENTS,
  FLOW_DOCUMENT,
  SKILLS_FOLDER,
  definedAgents,
  installedSkills,
  read,
  skillFile,
  skillPages,
} from "../document-files.ts";


const FROM_THE_START = 0;

const SOURCE_FOLDER = "src";

const FEATURES_FOLDER = "src/features";

const ROOT_FOLDERS = [
  ".claude",
  ".github",
  ".githooks",
  "src",
  "scripts",
  "e2e",
  "deploy",
  "docs",
  "assets",
];

const A_DOT = /\./g;

const NOT_A_PATH_ALREADY = "(?<![\\w~/.-])";

const A_NAMED_FILE =
  "\\/[A-Za-z0-9._/-]*\\.(?:json|html|mjs|yml|css|svg|png|service|timer|md|sh|ts|js)(?![A-Za-z0-9])";

export const aCitedPath = (folders: readonly string[]): RegExp =>
  new RegExp(
    `${NOT_A_PATH_ALREADY}(?:${folders.map((folder) => folder.replace(A_DOT, "\\.")).join("|")})` +
      A_NAMED_FILE,
    "g"
  );

export const citedPathsIn = (
  text: string,
  prefixes: Readonly<Record<string, string>>
): readonly string[] => [
  ...new Set(text.match(aCitedPath([...ROOT_FOLDERS, ...Object.keys(prefixes)])) ?? []),
];

export const whereACitationPoints = (
  cited: string,
  prefixes: Readonly<Record<string, string>>
): string => {
  const prefix = prefixes[cited.slice(FROM_THE_START, cited.indexOf("/"))];

  return prefix === undefined ? cited : `${prefix}/${cited}`;
};

export const citationComplaints = (
  document: string,
  text: string,
  prefixes: Readonly<Record<string, string>>,
  isThere: (path: string) => boolean
): readonly string[] =>
  citedPathsIn(text, prefixes)
    .filter((cited) => !isThere(whereACitationPoints(cited, prefixes)))
    .map(
      (cited) =>
        `${document}: names "${cited}", which is not in the repository — a rule whose ` +
        `subject has moved is a rule nobody can follow, and no compiler reads prose, so ` +
        `nothing else fails when one rots`
    );

const A_LINK_OR_A_CODE_SPAN = (page: string): RegExp =>
  new RegExp(`[(\`]${page.replace(A_DOT, "\\.")}[)\`]`);

export const pageComplaints = (
  skill: string,
  pages: readonly string[],
  skillText: string
): readonly string[] =>
  pages
    .filter((page) => !A_LINK_OR_A_CODE_SPAN(page).test(skillText))
    .map(
      (page) =>
        `${skillFile(skill)}: never opens "${page}" lying beside it — a page nothing ` +
        `sends a reader to is a page nobody reads, which is how splitting a skill ` +
        `loses the rule instead of moving it`
    );

export const prefixesUnderTheSource = (features: readonly string[]): Readonly<Record<string, string>> =>
  Object.fromEntries([
    ["features", SOURCE_FOLDER],
    ["shared", SOURCE_FOLDER],
    ...features.map((feature) => [feature, FEATURES_FOLDER] as const),
  ]);

const featuresOnDisk = (): readonly string[] => readdirSync(FEATURES_FOLDER);

const pageFile = (skill: string, page: string): string => join(SKILLS_FOLDER, skill, page);

const skillsWithAFile = (): readonly string[] =>
  installedSkills().filter((skill) => existsSync(skillFile(skill)));

const everythingThatCites = (): readonly (readonly [string, string])[] => [
  ...[...DOCUMENTS, FLOW_DOCUMENT].map((document) => [document, read(document)] as const),
  ...skillsWithAFile().flatMap((skill) => [
    [skillFile(skill), read(skillFile(skill))] as const,
    ...skillPages(skill).map(
      (page) => [pageFile(skill, page), read(pageFile(skill, page))] as const
    ),
  ]),
  ...definedAgents().map((agent) => {
    const file = join(AGENTS_FOLDER, `${agent}.md`);

    return [file, read(file)] as const;
  }),
];

export const citationsWithNoFile = (): readonly string[] => {
  const prefixes = prefixesUnderTheSource(featuresOnDisk());

  return everythingThatCites().flatMap(([document, text]) =>
    citationComplaints(document, text, prefixes, existsSync)
  );
};

export const pagesNobodyOpens = (): readonly string[] =>
  skillsWithAFile().flatMap((skill) =>
    pageComplaints(skill, skillPages(skill), read(skillFile(skill)))
  );
