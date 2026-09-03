import { namesIn } from "../markdown-text.ts";
import { agentDocuments, everyReadme, read, skillDocuments } from "../document-files.ts";
import { packageScripts } from "../source-files.ts";


export const A_NAMED_COMMAND = /npm run ([a-z][a-z0-9:-]*[a-z0-9])/g;

export const TOOLS_SCRIPT = "scripts/tools.ts";

const A_NAMED_TOOL_VERB = /scripts\/tools\.ts ([a-z][a-z-]*[a-z])/g;

const A_TOOL_USAGE = /usage: "node scripts\/tools\.ts ([a-z][a-z-]*[a-z])/g;

export const toolVerbsIn = (source: string): readonly string[] => namesIn(source, A_TOOL_USAGE);

export interface CommandTargets {
  readonly scripts: ReadonlySet<string>;
  readonly verbs: ReadonlySet<string>;
}

export const namedCommandComplaints = (
  file: string,
  text: string,
  targets: CommandTargets
): readonly string[] => [
  ...[...new Set(namesIn(text, A_NAMED_COMMAND))]
    .filter((command) => !targets.scripts.has(command))
    .map(
      (command) =>
        `${file}: names "npm run ${command}", which package.json does not have — a command ` +
        `a reader is told to run and cannot is a broken link with a verb in it`
    ),
  ...[...new Set(namesIn(text, A_NAMED_TOOL_VERB))]
    .filter((verb) => !targets.verbs.has(verb))
    .map(
      (verb) =>
        `${file}: names "${TOOLS_SCRIPT} ${verb}", which ${TOOLS_SCRIPT} does not offer — ` +
        `run it with no arguments for the list, since a verb renamed there is renamed nowhere else`
    ),
];

export const commandsNobodyHas = (verbs: ReadonlySet<string>): readonly string[] => {
  const targets = { scripts: packageScripts(), verbs };

  return [...skillDocuments(), ...agentDocuments(), ...everyReadme()].flatMap((file) =>
    namedCommandComplaints(file, read(file), targets)
  );
};
