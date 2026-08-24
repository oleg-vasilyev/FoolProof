import { existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { FIRST_GROUP, anchorOf, headingsOf } from "../markdown-text.ts";
import {
  DOCUMENTS,
  SESSION_DOCUMENT,
  SPEC_DOCUMENT,
  definedAgents,
  installedSkills,
  read,
} from "../document-files.ts";


const NOTHING = 0;

const LAST = -1;

const A_LINK = /\]\(([^)]+)\)/g;

const A_SPEC_SECTION = /^## (.+)$/gm;

const A_CONTENTS_LINK = /\[[^\]]+\]\(#([a-z0-9-]+)\)/g;

const SPEC_CONTENTS = "What is in here";

const A_WINDOWS_SEPARATOR = "\\";

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

export const brokenLinks = (): readonly string[] => {
  const anchorsByPath = anchorsByDocument();

  return DOCUMENTS.flatMap((file) => linkComplaints(file, read(file), anchorsByPath, existsSync));
};

export const specContentsComplaints = (text: string): readonly string[] => {
  const sections = [...text.matchAll(A_SPEC_SECTION)]
    .map((match) => match[FIRST_GROUP] ?? "")
    .filter((section) => section !== SPEC_CONTENTS);
  const contents = text.split(`## ${SPEC_CONTENTS}`).at(LAST)?.split("\n## ").at(NOTHING) ?? "";
  const listed = new Set(
    [...contents.matchAll(A_CONTENTS_LINK)].map((link) => link[FIRST_GROUP] ?? "")
  );
  const anchors = new Set(sections.map(anchorOf));

  return [
    ...sections
      .filter((section) => !listed.has(anchorOf(section)))
      .map(
        (section) =>
          `${SPEC_DOCUMENT}: "${section}" is not in "${SPEC_CONTENTS}" — this file is ` +
          `read by following a link, so a section the list does not carry is one nobody ` +
          `arrives at`
      ),
    ...[...listed]
      .filter((anchor) => !anchors.has(anchor))
      .map(
        (anchor) =>
          `${SPEC_DOCUMENT}: "${SPEC_CONTENTS}" points at #${anchor}, which is not a ` +
          `section here any more — a contents list nobody can follow is worse than none`
      ),
  ];
};

export const specContentsOutOfStep = (): readonly string[] =>
  specContentsComplaints(read(SPEC_DOCUMENT));

export const unreachableHelpComplaints = (
  session: string,
  skills: readonly string[],
  agents: readonly string[]
): readonly string[] => [
  ...skills
    .filter((skill) => !session.includes(skill))
    .map(
      (skill) =>
        `${SESSION_DOCUMENT}: names no route to the "${skill}" skill — a skill ` +
        `nothing points at is one nobody loads`
    ),
  ...agents
    .filter((agent) => !session.includes(agent))
    .map(
      (agent) =>
        `${SESSION_DOCUMENT}: names no route to the "${agent}" agent — an agent ` +
        `nothing points at never runs`
    ),
];

export const unreachableHelp = (): readonly string[] =>
  unreachableHelpComplaints(read(SESSION_DOCUMENT), installedSkills(), definedAgents());
