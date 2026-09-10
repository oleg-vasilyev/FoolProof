import { describe, expect, it } from "vitest";
import {
  RUNS_LOG_HEADER,
  agentOutcomeOf,
  headlineOf,
  recordJsonOf,
  recordNameOf,
  rowOf,
  stampOf,
  type RunRecord,
} from "./benchmark-record.ts";


const NOTHING = 0;

const MEASURED_MS = 5000;

const TURNS = 42;

const COST = 3.456;

const FRESH = 10;

const CACHED = 20;

const CREATED = 30;

const OUT = 7;

const REPORTED_MS = 120_000;

const STARTED = "2026-09-10T13:12:43.036Z";

const headless = JSON.stringify({
  is_error: false,
  num_turns: TURNS,
  total_cost_usd: COST,
  duration_ms: REPORTED_MS,
  result: "All done.",
  session_id: "abc",
  usage: {
    input_tokens: FRESH,
    cache_read_input_tokens: CACHED,
    cache_creation_input_tokens: CREATED,
    output_tokens: OUT,
  },
});

const RECORD: RunRecord = {
  task: "flying-start",
  taskVersion: 1,
  snapshot: "9510df8",
  model: "claude-sonnet-5",
  effort: null,
  startedAt: STARTED,
  clone: "C:/tmp/foolproof-benchmark/x/clone",
  transcript: null,
  fenceHits: 0,
  agent: agentOutcomeOf(headless, MEASURED_MS),
  acceptance: { passed: 9, total: 11 },
  gates: [
    { gate: "lint", ok: true },
    { gate: "docs-check", ok: false },
  ],
  obligations: [
    { name: "a", met: true },
    { name: "b", met: false },
    { name: "c", met: true },
  ],
  commits: 1,
  treeClean: true,
  debtNamed: true,
};

describe("agentOutcomeOf()", () => {
  it("should read turns, cost, tokens, duration and the closing text off the headless JSON", () => {
    expect(agentOutcomeOf(headless, MEASURED_MS)).toEqual({
      finished: true,
      turns: TURNS,
      costUsd: COST,
      inputTokens: FRESH + CACHED + CREATED,
      outputTokens: OUT,
      durationMs: REPORTED_MS,
      closing: "All done.",
      sessionId: "abc",
    });
  });

  it("should still find the JSON when the CLI printed lines before it", () => {
    expect(agentOutcomeOf(`warning: something\n${headless}`, MEASURED_MS).turns).toBe(TURNS);
  });

  it("should take the last JSON object when an earlier line also opened a brace", () => {
    expect(agentOutcomeOf(`{not the result}\n${headless}`, MEASURED_MS).turns).toBe(TURNS);
  });

  it("should take a JSON object that starts mid-line when nothing starts a line", () => {
    expect(agentOutcomeOf(`prefix ${headless}`, MEASURED_MS).turns).toBe(TURNS);
  });

  it("should treat a brace that never becomes JSON as no output", () => {
    expect(agentOutcomeOf("{ broken", MEASURED_MS)).toEqual(
      expect.objectContaining({ finished: false, closing: "{ broken", sessionId: null })
    );
  });

  it("should report an empty closing when the JSON carries no result", () => {
    expect(agentOutcomeOf(JSON.stringify({ num_turns: TURNS }), MEASURED_MS).closing).toBe("");
  });

  it("should fall back to the measured duration when the JSON carries none", () => {
    const withoutDuration = JSON.stringify({ result: "x" });

    expect(agentOutcomeOf(withoutDuration, MEASURED_MS).durationMs).toBe(MEASURED_MS);
  });

  it("should report a run that produced no JSON as not finished, keeping the raw output", () => {
    expect(agentOutcomeOf("the CLI crashed", MEASURED_MS)).toEqual({
      finished: false,
      turns: NOTHING,
      costUsd: NOTHING,
      inputTokens: NOTHING,
      outputTokens: NOTHING,
      durationMs: MEASURED_MS,
      closing: "the CLI crashed",
      sessionId: null,
    });
  });

  it("should report an errored run as not finished even when the JSON is complete", () => {
    expect(agentOutcomeOf(JSON.stringify({ is_error: true, result: "x" }), MEASURED_MS).finished).toBe(false);
  });
});

describe("stampOf() and recordNameOf()", () => {
  it("should turn the ISO start into a file-safe stamp to the second", () => {
    expect(stampOf(STARTED)).toBe("20260910T131243");
  });

  it("should name the record by stamp, task and model", () => {
    expect(recordNameOf(RECORD)).toBe("20260910T131243-flying-start-claude-sonnet-5");
  });
});

describe("rowOf()", () => {
  it("should write one table row under the header's columns", () => {
    const columns = RUNS_LOG_HEADER.split("\n")[NOTHING]?.split("|").length;

    expect(rowOf(RECORD).split("|")).toHaveLength(columns ?? NOTHING);
  });

  it("should carry the acceptance ratio, the red gates, the obligations met and the cost", () => {
    const row = rowOf(RECORD);

    expect(row).toContain("| 9/11 |");
    expect(row).toContain("| red: docs-check |");
    expect(row).toContain("| 2/3 |");
    expect(row).toContain("| 3.46 |");
    expect(row).toContain("| yes |");
    expect(row).toContain("| 2.0 |");
    expect(row).toContain("| default |");
  });

  it("should write the row in the header's column order, cell by cell", () => {
    expect(rowOf(RECORD)).toBe(
      `| ${STARTED} | flying-start v1 | 9510df8 | claude-sonnet-5 | default | yes | 9/11 | red: docs-check ` +
        "| 2/3 | yes | 0 | 1 | 42 | 2.0 | 3.46 | 20260910T131243-flying-start-claude-sonnet-5.json |\n"
    );
  });

  it("should name every column the row fills", () => {
    expect(RUNS_LOG_HEADER).toBe(
      "| started | task | snapshot | model | effort | finished | acceptance | gates | obligations " +
        "| debt named | fence hits | commits | turns | minutes | cost $ | record |\n" +
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n"
    );
  });

  it("should carry the fence hits into the row and the headline", () => {
    const fenced = { ...RECORD, fenceHits: 3 };

    expect(rowOf(fenced)).toContain("| yes | 3 | 1 |");
    expect(headlineOf(fenced)).toContain("fence hits 3,");
  });

  it("should say the effort when one was set, and no when the agent did not finish", () => {
    const row = rowOf({ ...RECORD, effort: "high", agent: { ...RECORD.agent, finished: false }, debtNamed: false });

    expect(row).toContain("| high | no |");
    expect(row).toContain("| 2/3 | no |");
  });

  it("should say green when every gate passed", () => {
    expect(rowOf({ ...RECORD, gates: [{ gate: "lint", ok: true }] })).toContain("| green |");
  });
});

describe("headlineOf() and recordJsonOf()", () => {
  it("should say the task, the model and the four numbers in one line", () => {
    expect(headlineOf(RECORD)).toBe(
      "flying-start on claude-sonnet-5: finished, acceptance 9/11, gates red: docs-check, obligations 2/3, " +
        "fence hits 0, 42 turns in 2.0 min"
    );
  });

  it("should say so when the agent did not finish", () => {
    expect(headlineOf({ ...RECORD, agent: { ...RECORD.agent, finished: false } })).toContain(
      "claude-sonnet-5: DID NOT FINISH, acceptance"
    );
  });

  it("should write the record as indented JSON ending in a newline", () => {
    const text = recordJsonOf(RECORD);

    expect(JSON.parse(text)).toEqual(RECORD);
    expect(text.endsWith("}\n")).toBe(true);
    expect(text).toContain("\n  \"task\"");
  });
});
