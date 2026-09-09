import { namesIn } from "../markdown-text.ts";
import {
  DOCUMENTS,
  FLOW_DOCUMENT,
  agentDocuments,
  everyReadme,
  read,
  skillDocuments,
} from "../document-files.ts";
import { packageScripts } from "../source-files.ts";
import { GATE_RUNNER } from "../../gates/gate-list.ts";


export const A_NAMED_COMMAND = /npm run ([a-z][a-z0-9:-]*[a-z0-9])/g;

export const TOOLS_SCRIPT = "scripts/tools/tools.ts";

export const GATE_LIST = "scripts/gates/gate-list.ts";

const A_NAMED_TOOL_VERB = /scripts\/tools\/tools\.ts ([a-z][a-z-]*[a-z])/g;

const A_TOOL_USAGE = /usage: "node scripts\/tools\/tools\.ts ([a-z][a-z-]*[a-z])/g;

const A_DOT = /\./g;

const A_NAMED_GATE = new RegExp(`node ${GATE_RUNNER.replace(A_DOT, "\\.")} ([a-z][a-z0-9:-]*[a-z0-9])`, "g");

const A_GATE_RUN_BY_HAND = /(npm test(?![a-z:-])|npx (?:--no-install )?(?:eslint|tsc|vitest|stryker)(?![a-z-]))/g;

export const toolVerbsIn = (source: string): readonly string[] => namesIn(source, A_TOOL_USAGE);

export interface CommandTargets {
  readonly scripts: ReadonlySet<string>;
  readonly verbs: ReadonlySet<string>;
  readonly gates: ReadonlySet<string>;
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
  ...[...new Set(namesIn(text, A_NAMED_GATE))]
    .filter((gate) => !targets.gates.has(gate))
    .map(
      (gate) =>
        `${file}: names "${GATE_RUNNER} ${gate}", which the runner does not know — ` +
        `the gates are the table in ${GATE_LIST}, and a gate renamed there is renamed nowhere else`
    ),
  ...[...new Set(namesIn(text, A_GATE_RUN_BY_HAND))].map(
    (command) =>
      `${file}: runs "${command}" by hand — a gate runs only through ${GATE_RUNNER}, so its ` +
      `verdict lands under reports/gates/ and its config is the one the runner names`
  ),
];

const everyDocument = (): readonly string[] => [
  ...new Set([
    ...DOCUMENTS,
    FLOW_DOCUMENT,
    ...skillDocuments(),
    ...agentDocuments(),
    ...everyReadme(),
  ]),
];

export const commandsNobodyHas = (
  verbs: ReadonlySet<string>,
  gates: ReadonlySet<string>
): readonly string[] => {
  const targets = { scripts: packageScripts(), verbs, gates };

  return everyDocument().flatMap((file) => namedCommandComplaints(file, read(file), targets));
};
