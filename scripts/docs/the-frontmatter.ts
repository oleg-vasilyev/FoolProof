import { definedAgents, installedSkills, read, skillFile } from "./the-documents.ts";
import { agentFile } from "./the-agent-contracts.ts";


const NOTHING = 0;

const NOWHERE = -1;

const AFTER_THE_FENCE = 1;

const FIRST_GROUP = 1;

const SECOND_GROUP = 2;

const A_FENCE = "---";

const BETWEEN_LINES = "\n";

const A_QUOTED_VALUE = /^["']/;

const A_PLAIN_KEY_AND_VALUE = /^([a-zA-Z_-]+):[ \t]+(.*)$/;

const A_MAPPING_INSIDE = /:[ \t]/;

export const frontmatterOf = (text: string): readonly string[] => {
  const lines = text.split(BETWEEN_LINES);

  if (lines[NOTHING] !== A_FENCE) {
    return [];
  }

  const closing = lines.indexOf(A_FENCE, AFTER_THE_FENCE);

  return closing === NOWHERE ? [] : lines.slice(AFTER_THE_FENCE, closing);
};

export const unparseableKeys = (text: string): readonly string[] =>
  frontmatterOf(text)
    .map((line) => A_PLAIN_KEY_AND_VALUE.exec(line))
    .filter((found) => found !== null)
    .filter((found) => !A_QUOTED_VALUE.test(found[SECOND_GROUP] ?? ""))
    .filter((found) => A_MAPPING_INSIDE.test(found[SECOND_GROUP] ?? ""))
    .map((found) => found[FIRST_GROUP] ?? "");

export const frontmatterComplaints = (file: string, text: string): readonly string[] =>
  unparseableKeys(text).map(
    (key) =>
      `${file}: the "${key}" line is not YAML — its value is unquoted and holds a ` +
      `colon followed by a space, which every parser reads as a nested mapping. ` +
      `GitHub renders the whole block as an error instead of the file, and the ` +
      `harness that loads this file may read no ${key} at all. Wrap the value in ` +
      `double quotes`
  );

export const frontmatterThatWillNotParse = (): readonly string[] => [
  ...installedSkills().flatMap((skill) =>
    frontmatterComplaints(skillFile(skill), read(skillFile(skill)))
  ),
  ...definedAgents().flatMap((agent) =>
    frontmatterComplaints(agentFile(agent), read(agentFile(agent)))
  ),
];
