import type { Gate } from "./gate-names.ts";


export const GATES_DIR = "reports/gates";

export const PARAGRAPH_PATH = `${GATES_DIR}/gates-paragraph.txt`;

export const BATTERY_PATH = `${GATES_DIR}/battery.txt`;

export const TESTS_RESULTS = "reports/tests/results.json";

export const HARNESS_RESULTS = "reports/tests/harness-results.json";

export const COVERAGE_SUMMARY = "reports/coverage/coverage-summary.json";

export const E2E_RESULTS = "reports/e2e/results.json";

export const E2E_SELECTION = "reports/e2e/selection.json";

export const TYPECHECK_FINDINGS = "reports/typecheck/findings.json";

export const E2E_TYPECHECK_FINDINGS = "reports/typecheck/e2e-findings.json";

export const LINT_FINDINGS = "reports/lint/findings.json";

export const CHECK_DOCS_COMPLAINTS = "reports/check-docs/complaints.json";

export const BOT_LOGS = "reports/e2e/bot";

export const SOURCE_MUTATION_REPORT = "reports/mutation/mutation.json";

export const TOOLING_MUTATION_REPORT = "reports/mutation-scripts/mutation.json";

export const ESLINT_CONFIG = "scripts/gates/lint/eslint.config.js";

export const VITEST_CONFIG = "scripts/gates/test/vitest.config.ts";

export const HARNESS_CONFIG = "scripts/gates/e2e/vitest.harness.config.ts";

export const E2E_CONFIG = "scripts/gates/e2e/vitest.e2e.config.ts";

export const SOURCE_STRYKER_CONFIG = "scripts/gates/mutation/stryker.config.json";

export const TOOLING_STRYKER_CONFIG = "scripts/gates/mutation/stryker.scripts.json";

const NAMED = ".named";

const NOT_A_FILE_NAME = /[^a-z0-9]+/g;

const A_DASH_AT_AN_END = /^-|-$/g;

export const fileStemOf = (gate: Gate, named = false): string =>
  `${gate.replaceAll(":", "-")}${named ? NAMED : ""}`;

export const logPathOf = (gate: Gate, named = false): string =>
  `${GATES_DIR}/${fileStemOf(gate, named)}.log`;

export const verdictPathOf = (gate: Gate, named = false): string =>
  `${GATES_DIR}/${fileStemOf(gate, named)}.json`;

export const botLogPathOf = (scenario: string): string =>
  `${BOT_LOGS}/${scenario.toLowerCase().replace(NOT_A_FILE_NAME, "-").replace(A_DASH_AT_AN_END, "")}.log`;
