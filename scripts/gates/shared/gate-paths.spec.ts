import { describe, expect, it } from "vitest";
import { BATTERY, GATE, LOCK } from "./gate-names.ts";
import {
  BATTERY_PATH,
  BOT_LOGS,
  CHECK_DOCS_COMPLAINTS,
  COVERAGE_FOLDER,
  COVERAGE_SUMMARY,
  E2E_SELECTION,
  GATES_DIR,
  LINT_FINDINGS,
  LOG_FILE,
  PARAGRAPH_PATH,
  RESULTS,
  RUNS_DIR,
  SOURCE_MUTATION_REPORT,
  TOOLING_MUTATION_REPORT,
  TYPECHECK_FINDINGS,
  VERDICT_FILE,
  botLogPathOf,
  fileStemOf,
  inRun,
  lockPathOf,
  runFolderOf,
  runsFolderOf,
} from "./gate-paths.ts";


const A_RUN = "reports/runs/x/a-run";

const A_RUN_ID = "20260925-abc";

describe("the folders", () => {
  it("should be reports/gates and reports/runs, the names tidy-reports reads off this very file", () => {
    expect(GATES_DIR).toBe("reports/gates");
    expect(RUNS_DIR).toBe("reports/runs");
  });

  it("should hold the paragraph and the battery's record in reports/gates, outside any run", () => {
    expect(PARAGRAPH_PATH).toBe("reports/gates/gates-paragraph.txt");
    expect(BATTERY_PATH).toBe("reports/gates/battery.json");
  });

  it("should keep the bot's scenario logs where the e2e worlds write them", () => {
    expect(BOT_LOGS).toBe("reports/e2e/bot");
  });
});

describe("fileStemOf()", () => {
  it("should turn the colons a file name may not carry into dashes, for a gate", () => {
    expect(fileStemOf(GATE.mutationChanged)).toBe("test-mutation-changed");
  });

  it("should do the same for a battery", () => {
    expect(fileStemOf(BATTERY.release)).toBe("check-release");
  });
});

describe("runsFolderOf() and runFolderOf()", () => {
  it("should give each gate a folder of runs under reports/runs, named by its stem", () => {
    expect(runsFolderOf(GATE.mutationChanged)).toBe("reports/runs/test-mutation-changed");
  });

  it("should give each run its own folder inside the gate's, named by the run id", () => {
    expect(runFolderOf(GATE.e2eChanged, A_RUN_ID)).toBe("reports/runs/e2e-changed/20260925-abc");
  });
});

describe("inRun()", () => {
  it("should put a file inside the run folder it is given", () => {
    expect(inRun(A_RUN, RESULTS)).toBe("reports/runs/x/a-run/results.json");
  });
});

describe("lockPathOf()", () => {
  it("should put a lock in reports/gates, outside every run, so two runs see the same one", () => {
    expect(lockPathOf(LOCK.e2eWorlds)).toBe("reports/gates/e2e-worlds.lock");
  });
});

describe("the files inside a run", () => {
  it("should name the verdict and the log the runner writes into every run", () => {
    expect(VERDICT_FILE).toBe("verdict.json");
    expect(LOG_FILE).toBe("gate.log");
  });

  it("should name what the suites and coverage write, the summary inside the coverage folder", () => {
    expect(RESULTS).toBe("results.json");
    expect(COVERAGE_FOLDER).toBe("coverage");
    expect(COVERAGE_SUMMARY).toBe("coverage/coverage-summary.json");
  });

  it("should name each gate's findings file apart from the others", () => {
    expect(LINT_FINDINGS).toBe("lint-findings.json");
    expect(TYPECHECK_FINDINGS).toBe("typecheck-findings.json");
    expect(CHECK_DOCS_COMPLAINTS).toBe("complaints.json");
    expect(E2E_SELECTION).toBe("selection.json");
  });

  it("should name one mutation report per family, so the full run's two do not collide", () => {
    expect(SOURCE_MUTATION_REPORT).toBe("mutation-source.json");
    expect(TOOLING_MUTATION_REPORT).toBe("mutation-tooling.json");
  });
});

describe("botLogPathOf()", () => {
  it("should name a scenario's log by the scenario, punctuation folded to single dashes", () => {
    expect(botLogPathOf("A card, opened twice!")).toBe("reports/e2e/bot/a-card-opened-twice.log");
  });
});
