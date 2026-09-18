import { describe, expect, it } from "vitest";
import { GATE } from "./gate-names.ts";
import {
  BATTERY_PATH,
  CHECK_DOCS_COMPLAINTS,
  COVERAGE_SUMMARY,
  E2E_RESULTS,
  GATES_DIR,
  HARNESS_RESULTS,
  LINT_FINDINGS,
  PARAGRAPH_PATH,
  TESTS_RESULTS,
  botLogPathOf,
  fileStemOf,
  logPathOf,
  verdictPathOf,
} from "./gate-paths.ts";


describe("the folder", () => {
  it("should be reports/gates, which tidy-reports reads off this very file", () => {
    expect(GATES_DIR).toBe("reports/gates");
  });

  it("should hold the paragraph and the battery name beside the verdicts", () => {
    expect(PARAGRAPH_PATH).toBe("reports/gates/gates-paragraph.txt");
    expect(BATTERY_PATH).toBe("reports/gates/battery.txt");
  });
});

describe("fileStemOf()", () => {
  it("should turn the colons a file name may not carry into dashes", () => {
    expect(fileStemOf(GATE.mutationChanged)).toBe("test-mutation-changed");
  });
});

describe("a gate's own files", () => {
  it("should put a gate's log and verdict side by side, named after it", () => {
    expect(logPathOf(GATE.e2eChanged)).toBe("reports/gates/e2e-changed.log");
    expect(verdictPathOf(GATE.e2eChanged)).toBe("reports/gates/e2e-changed.json");
  });
});

describe("a named run's own files", () => {
  it("should sit beside the bare gate's, marked named, so neither overwrites the other", () => {
    expect(fileStemOf(GATE.test, true)).toBe("test.named");
    expect(logPathOf(GATE.mutationChanged, true)).toBe("reports/gates/test-mutation-changed.named.log");
    expect(verdictPathOf(GATE.test, true)).toBe("reports/gates/test.named.json");
  });
});

describe("the report paths", () => {
  it("should be the files the reporters were configured to write, the harness apart from the suite", () => {
    expect(TESTS_RESULTS).toBe("reports/tests/results.json");
    expect(HARNESS_RESULTS).toBe("reports/tests/harness-results.json");
    expect(COVERAGE_SUMMARY).toBe("reports/coverage/coverage-summary.json");
    expect(E2E_RESULTS).toBe("reports/e2e/results.json");
  });

  it("should name the complaints file under the gate's own name, not the folder's", () => {
    expect(CHECK_DOCS_COMPLAINTS).toBe("reports/check-docs/complaints.json");
  });
});

describe("botLogPathOf()", () => {
  it("should name a scenario's log by the scenario, punctuation folded to single dashes", () => {
    expect(botLogPathOf("A card, opened twice!")).toBe("reports/e2e/bot/a-card-opened-twice.log");
  });
});

describe("the lint findings path", () => {
  it("should be the file ESLint is told to write, which the lint gate reads back", () => {
    expect(LINT_FINDINGS).toBe("reports/lint/findings.json");
  });
});
