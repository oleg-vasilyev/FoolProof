import { existsSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { FIRST_GROUP, anchorOf, headingsOf } from "../shared/markdown-text.ts";
import {
  AGENTS_FOLDER,
  DOCUMENTS,
  FLOW_DOCUMENT,
  SKILLS_FOLDER,
  definedAgents,
  insideAStrippedFolder,
  installedSkills,
  read,
  skillFile,
  skillPages,
} from "../shared/document-files.ts";


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

const A_LINK = /\]\(([^)]+)\)/g;

const A_WINDOWS_SEPARATOR = "\\";

const NOT_A_PATH_ALREADY = "(?<![\\w~/.-])";

const A_NAMED_FILE =
  "\\/[A-Za-z0-9._/-]*\\.(?:json|html|mjs|yml|css|svg|png|service|timer|md|sh|ts|js)(?![A-Za-z0-9])";

const anchorsByDocument = (): Record<string, ReadonlySet<string>> =>
  Object.fromEntries(
    DOCUMENTS.map((file) => [file, new Set(headingsOf(read(file)).map(anchorOf))])
  );

export const linkComplaints = (
  file: string,
  text: string,
  anchorsByPath: Readonly<Record<string, ReadonlySet<string>>>,
  exists: (target: string) => boolean
): readonly string[] =>
  [...text.matchAll(A_LINK)].flatMap((match) => {
    const link = match[FIRST_GROUP] ?? "";

    if (link.startsWith("http") || link.startsWith("#")) {
      return [];
    }

    const [path = "", anchor] = link.split("#");
    const target = normalize(join(dirname(file), path)).split(A_WINDOWS_SEPARATOR).join("/");

    if (!exists(target)) {
      return [`${file}: links to ${link}, which does not exist`];
    }

    const known = anchorsByPath[target];

    if (anchor !== undefined && known !== undefined && !known.has(anchor)) {
      return [`${file}: links to ${link}, but that heading is not in ${target}`];
    }

    return [];
  });

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

const linksToNothing = (): readonly string[] => {
  const anchorsByPath = anchorsByDocument();

  return DOCUMENTS.flatMap((file) => linkComplaints(file, read(file), anchorsByPath, existsSync));
};

const pathsNoLongerInTheRepository = (): readonly string[] => {
  const prefixes = prefixesUnderTheSource(featuresOnDisk());

  return everythingThatCites().flatMap(([document, text]) =>
    citationComplaints(
      document,
      text,
      prefixes,
      (path) => existsSync(path) || insideAStrippedFolder(path)
    )
  );
};

export const pointersThatResolveToNothing = (): readonly string[] => [
  ...linksToNothing(),
  ...pathsNoLongerInTheRepository(),
];
