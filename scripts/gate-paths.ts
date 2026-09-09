import type { Gate } from "./gate-list.ts";


export const GATES_DIR = "reports/gates";

export const PARAGRAPH_PATH = `${GATES_DIR}/gates-paragraph.txt`;

export const BATTERY_PATH = `${GATES_DIR}/battery.txt`;

export const fileStemOf = (gate: Gate): string => gate.replaceAll(":", "-");

export const logPathOf = (gate: Gate): string => `${GATES_DIR}/${fileStemOf(gate)}.log`;

export const verdictPathOf = (gate: Gate): string => `${GATES_DIR}/${fileStemOf(gate)}.json`;
