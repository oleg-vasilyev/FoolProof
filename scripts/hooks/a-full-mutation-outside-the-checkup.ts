import { GATE_RUNNER, THE_FULL_MUTATION, rerunCommandFor } from "../gates/shared/gate-list.ts";
import { GATE } from "../gates/shared/gate-names.ts";


export const THE_CHECKUP_AGENT = "deep-checkup";

const A_REGEX_METACHARACTER = /[.*+?^${}()|[\]\\]/g;

const literally = (text: string): string => text.replace(A_REGEX_METACHARACTER, "\\$&");

const EITHER_SLASH = String.raw`[/\\]`;

const aPathInEitherSlashes = (path: string): string => path.split("/").map(literally).join(EITHER_SLASH);

const BETWEEN_SCRIPT_AND_GATE = String.raw`['"]?(?:\s*,\s*|\s+)['"]?`;

const THE_FULL_MUTATION_RUN = new RegExp(
  `${aPathInEitherSlashes(GATE_RUNNER)}${BETWEEN_SCRIPT_AND_GATE}${literally(THE_FULL_MUTATION)}(?![\\w:-])`
);

export const runsTheFullMutation = (command: string): boolean => THE_FULL_MUTATION_RUN.test(command);

export const fullMutationOutsideTheCheckup = (command: string, agentType: string | undefined): string | null => {
  if (agentType === THE_CHECKUP_AGENT || !runsTheFullMutation(command)) {
    return null;
  }

  return [
    `Refused: ${THE_FULL_MUTATION} is the ${THE_CHECKUP_AGENT} agent's run and nobody else's.`,
    "A phase mutates its own diff and a tag what changed since the previous tag:",
    `${rerunCommandFor(GATE.mutationChanged)} [files].`,
  ].join("\n");
};
