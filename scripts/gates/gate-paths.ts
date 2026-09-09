import type { Gate } from "./gate-list.ts";


export const GATES_DIR = "reports/gates";

export const PARAGRAPH_PATH = `${GATES_DIR}/gates-paragraph.txt`;

export const BATTERY_PATH = `${GATES_DIR}/battery.txt`;

const NAMED = ".named";

export const fileStemOf = (gate: Gate, named = false): string =>
  `${gate.replaceAll(":", "-")}${named ? NAMED : ""}`;

export const logPathOf = (gate: Gate, named = false): string =>
  `${GATES_DIR}/${fileStemOf(gate, named)}.log`;

export const verdictPathOf = (gate: Gate, named = false): string =>
  `${GATES_DIR}/${fileStemOf(gate, named)}.json`;
