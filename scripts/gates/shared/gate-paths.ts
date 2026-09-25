import type { Battery, Gate, Lock } from "./gate-names.ts";


export const GATES_DIR = "reports/gates";

export const RUNS_DIR = "reports/runs";

export const PARAGRAPH_PATH = `${GATES_DIR}/gates-paragraph.txt`;

export const BATTERY_PATH = `${GATES_DIR}/battery.json`;

export const VERDICT_FILE = "verdict.json";

export const LOG_FILE = "gate.log";

export const RESULTS = "results.json";

export const COVERAGE_FOLDER = "coverage";

export const COVERAGE_SUMMARY = `${COVERAGE_FOLDER}/coverage-summary.json`;

export const E2E_SELECTION = "selection.json";

export const TYPECHECK_FINDINGS = "typecheck-findings.json";

export const LINT_FINDINGS = "lint-findings.json";

export const CHECK_DOCS_COMPLAINTS = "complaints.json";

export const SOURCE_MUTATION_REPORT = "mutation-source.json";

export const TOOLING_MUTATION_REPORT = "mutation-tooling.json";

export const BOT_LOGS = "reports/e2e/bot";

export const ESLINT_CONFIG = "scripts/gates/lint/eslint.config.js";

export const VITEST_CONFIG = "scripts/gates/test/vitest.config.ts";

export const HARNESS_CONFIG = "scripts/gates/e2e/vitest.harness.config.ts";

export const E2E_CONFIG = "scripts/gates/e2e/vitest.e2e.config.ts";

export const SOURCE_STRYKER_CONFIG = "scripts/gates/mutation/stryker.config.json";

export const TOOLING_STRYKER_CONFIG = "scripts/gates/mutation/stryker.scripts.json";

const NOT_A_FILE_NAME = /[^a-z0-9]+/g;

const A_DASH_AT_AN_END = /^-|-$/g;

export const fileStemOf = (name: Gate | Battery): string => name.replaceAll(":", "-");

export const runsFolderOf = (gate: Gate): string => `${RUNS_DIR}/${fileStemOf(gate)}`;

export const runFolderOf = (gate: Gate, runId: string): string => `${runsFolderOf(gate)}/${runId}`;

export const inRun = (folder: string, file: string): string => `${folder}/${file}`;

export const lockPathOf = (lock: Lock): string => `${GATES_DIR}/${lock}.lock`;

export const botLogPathOf = (scenario: string): string =>
  `${BOT_LOGS}/${scenario.toLowerCase().replace(NOT_A_FILE_NAME, "-").replace(A_DASH_AT_AN_END, "")}.log`;
