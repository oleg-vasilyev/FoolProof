import { ALL_GATES, COMMANDS, GATE_RUNNER } from "../gates/gate-list.ts";
import type { Gate } from "../gates/gate-names.ts";


const THE_WHOLE_MATCH = 0;

const NOTHING = 0;

const gateOffered = (gate: Gate): string =>
  COMMANDS[gate].takesFiles ? `${gate} [files]` : gate;

const A_TOOL_THROUGH_NPX = /(?:^|[\s;&|(])npx\s+(?:--no-install\s+)?(?:eslint|tsc|vitest|stryker)(?![\w-])/g;

const A_TOOL_FROM_DOT_BIN = /node_modules\/\.bin\/(?:eslint|tsc|vitest|stryker)(?![\w-])/g;

const A_TOOL_BY_ITS_ENTRY_FILE =
  /node_modules\/(?:eslint\/bin\/eslint\.js|typescript\/bin\/tsc|vitest\/vitest\.mjs|@stryker-mutator\/core\/bin\/stryker\.js)/g;

const NPM_TEST = /(?:^|[\s;&|(])npm\s+test(?![\w:-])/g;

const RUNS_A_GATE_BY_HAND = [A_TOOL_THROUGH_NPX, A_TOOL_FROM_DOT_BIN, A_TOOL_BY_ITS_ENTRY_FILE, NPM_TEST];

export const toolsRunByHandIn = (command: string): readonly string[] =>
  RUNS_A_GATE_BY_HAND.flatMap((pattern) =>
    [...command.matchAll(pattern)].map((match) => match[THE_WHOLE_MATCH].trim())
  );

export const gateRunByHand = (command: string): string | null => {
  if (command.includes(GATE_RUNNER)) {
    return null;
  }

  const found = toolsRunByHandIn(command);

  if (found.length === NOTHING) {
    return null;
  }

  return [
    `Refused: ${found.join(", ")} runs a gate by hand.`,
    `Every gate runs through node ${GATE_RUNNER} <gate> — ${ALL_GATES.map(gateOffered).join(", ")} —`,
    "which leaves the log and the verdict under",
    "reports/gates/ and names the config, now that the configs live in scripts/gates/config/",
    "and the tool's bare name finds none.",
  ].join("\n");
};
