import type { ObligationVerdict } from "./benchmark-task.ts";


const NOTHING = 0;

const JSON_INDENT = 2;

const MS_IN_A_MINUTE = 60_000;

const ONE_DECIMAL = 1;

const NOT_A_TIMESTAMP = /[-:.]/g;

const STAMP_LENGTH = "YYYYMMDDTHHMMSS".length;

export interface AgentOutcome {
  readonly finished: boolean;
  readonly turns: number;
  readonly costUsd: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly durationMs: number;
  readonly closing: string;
  readonly sessionId: string | null;
  readonly aborted: string | null;
}

export interface GateOutcome {
  readonly gate: string;
  readonly ok: boolean;
}

export interface RunRecord {
  readonly task: string;
  readonly taskVersion: number;
  readonly snapshot: string;
  readonly model: string;
  readonly effort: string | null;
  readonly startedAt: string;
  readonly clone: string;
  readonly transcript: string | null;
  readonly agent: AgentOutcome;
  readonly acceptance: { readonly passed: number; readonly total: number };
  readonly gates: readonly GateOutcome[];
  readonly obligations: readonly ObligationVerdict[];
  readonly fenceHits: number;
  readonly commits: number;
  readonly treeClean: boolean;
  readonly debtNamed: boolean;
}

interface HeadlessOutput {
  readonly is_error?: boolean;
  readonly num_turns?: number;
  readonly total_cost_usd?: number;
  readonly duration_ms?: number;
  readonly result?: string;
  readonly session_id?: string;
  readonly terminal_reason?: string;
  readonly api_error_status?: number;
  readonly usage?: {
    readonly input_tokens?: number;
    readonly cache_creation_input_tokens?: number;
    readonly cache_read_input_tokens?: number;
    readonly output_tokens?: number;
  };
}

const lastJsonObjectIn = (text: string): HeadlessOutput | null => {
  const opens = text.lastIndexOf("\n{");
  const from = opens < NOTHING ? text.indexOf("{") : opens;

  if (from < NOTHING) {
    return null;
  }

  try {
    return JSON.parse(text.slice(from)) as HeadlessOutput;
  } catch {
    return null;
  }
};

const API_ERROR = "api_error";

const abortedBy = (parsed: HeadlessOutput): string | null =>
  parsed.terminal_reason === API_ERROR
    ? `api error ${parsed.api_error_status === undefined ? "" : String(parsed.api_error_status)}`.trim()
    : null;

export const agentOutcomeOf = (stdout: string, durationMs: number): AgentOutcome => {
  const parsed = lastJsonObjectIn(stdout);

  if (parsed === null) {
    return {
      finished: false,
      turns: NOTHING,
      costUsd: NOTHING,
      inputTokens: NOTHING,
      outputTokens: NOTHING,
      durationMs,
      closing: stdout,
      sessionId: null,
      aborted: null,
    };
  }

  const usage = parsed.usage ?? {};

  return {
    finished: parsed.is_error !== true,
    turns: parsed.num_turns ?? NOTHING,
    costUsd: parsed.total_cost_usd ?? NOTHING,
    inputTokens:
      (usage.input_tokens ?? NOTHING) +
      (usage.cache_creation_input_tokens ?? NOTHING) +
      (usage.cache_read_input_tokens ?? NOTHING),
    outputTokens: usage.output_tokens ?? NOTHING,
    durationMs,
    closing: parsed.result ?? "",
    sessionId: parsed.session_id ?? null,
    aborted: abortedBy(parsed),
  };
};

export const stampOf = (startedAt: string): string =>
  startedAt.replaceAll(NOT_A_TIMESTAMP, "").slice(NOTHING, STAMP_LENGTH);

export const recordNameOf = (record: RunRecord): string =>
  `${stampOf(record.startedAt)}-${record.task}-${record.model}`;

export const recordJsonOf = (record: RunRecord): string =>
  `${JSON.stringify(record, null, JSON_INDENT)}\n`;

const metOf = (verdicts: readonly ObligationVerdict[]): string =>
  `${String(verdicts.filter((verdict) => verdict.met).length)}/${String(verdicts.length)}`;

const gatesOf = (gates: readonly GateOutcome[]): string =>
  gates.every((gate) => gate.ok)
    ? "green"
    : `red: ${gates.filter((gate) => !gate.ok).map((gate) => gate.gate).join(", ")}`;

const minutesOf = (ms: number): string => (ms / MS_IN_A_MINUTE).toFixed(ONE_DECIMAL);

const yesOrNo = (fact: boolean): string => (fact ? "yes" : "no");

const endedOf = (agent: AgentOutcome): string =>
  agent.aborted === null ? yesOrNo(agent.finished) : `void (${agent.aborted})`;

const headlineEndOf = (agent: AgentOutcome): string => {
  if (agent.aborted !== null) {
    return `VOID, ${agent.aborted}`;
  }

  return agent.finished ? "finished" : "DID NOT FINISH";
};

export const RUNS_LOG_HEADER =
  "| started | task | snapshot | model | effort | finished | acceptance | gates | obligations " +
  "| debt named | fence hits | commits | turns | minutes | cost $ | record |\n" +
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n";

export const rowOf = (record: RunRecord): string =>
  `| ${record.startedAt} | ${record.task} v${String(record.taskVersion)} | ${record.snapshot} ` +
  `| ${record.model} | ${record.effort ?? "default"} | ${endedOf(record.agent)} ` +
  `| ${String(record.acceptance.passed)}/${String(record.acceptance.total)} ` +
  `| ${gatesOf(record.gates)} | ${metOf(record.obligations)} | ${yesOrNo(record.debtNamed)} ` +
  `| ${String(record.fenceHits)} | ${String(record.commits)} | ${String(record.agent.turns)} ` +
  `| ${minutesOf(record.agent.durationMs)} | ${record.agent.costUsd.toFixed(JSON_INDENT)} ` +
  `| ${recordNameOf(record)}.json |\n`;

export const headlineOf = (record: RunRecord): string =>
  `${record.task} on ${record.model}: ${headlineEndOf(record.agent)}, ` +
  `acceptance ${String(record.acceptance.passed)}/${String(record.acceptance.total)}, ` +
  `gates ${gatesOf(record.gates)}, obligations ${metOf(record.obligations)}, ` +
  `fence hits ${String(record.fenceHits)}, ` +
  `${String(record.agent.turns)} turns in ${minutesOf(record.agent.durationMs)} min`;
