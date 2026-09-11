import type { ObligationVerdict } from "./benchmark-task.ts";


const NOTHING = 0;

const JSON_INDENT = 2;

const TWO_DECIMALS = 2;

const MS_IN_A_MINUTE = 60_000;

const ONE_DECIMAL = 1;

const NOT_A_TIMESTAMP = /[-:.]/g;

const STAMP_LENGTH = "YYYYMMDDTHHMMSS".length;

export interface AgentOutcome {
  readonly finished: boolean;
  readonly turns: number;
  readonly costUsd: number;
  readonly costByModel: Readonly<Record<string, number>>;
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

export interface TranscriptTally {
  readonly assistantMessages: number;
  readonly toolCalls: number;
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
  readonly transcriptTally: TranscriptTally | null;
  readonly budgetUsd: number;
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
  readonly modelUsage?: Readonly<Record<string, { readonly costUSD?: number }>>;
}

interface TranscriptEntry {
  readonly type?: string;
  readonly uuid?: string;
  readonly message?: {
    readonly id?: string;
    readonly content?: readonly { readonly type?: string }[] | string;
  };
}

const ASSISTANT = "assistant";

const TOOL_USE = "tool_use";

const entryOf = (line: string): TranscriptEntry | null => {
  try {
    return JSON.parse(line) as TranscriptEntry;
  } catch {
    return null;
  }
};

const toolCallsIn = (entry: TranscriptEntry): number => {
  const content = entry.message?.content;

  return Array.isArray(content) ? content.filter((block) => block.type === TOOL_USE).length : NOTHING;
};

export const transcriptTallyOf = (jsonl: string | null): TranscriptTally | null => {
  if (jsonl === null) {
    return null;
  }

  const entries = jsonl
    .split("\n")
    .map(entryOf)
    .filter((entry): entry is TranscriptEntry => entry !== null && entry.type === ASSISTANT);

  return {
    assistantMessages: new Set(entries.map((entry, index) => entry.message?.id ?? entry.uuid ?? String(index))).size,
    toolCalls: entries.reduce((sum, entry) => sum + toolCallsIn(entry), NOTHING),
  };
};

const costByModelOf = (parsed: HeadlessOutput): Readonly<Record<string, number>> =>
  Object.fromEntries(
    Object.entries(parsed.modelUsage ?? {}).map(([model, usage]) => [model, usage.costUSD ?? NOTHING])
  );

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
      costByModel: {},
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
    costByModel: costByModelOf(parsed),
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

const NOT_COUNTED = "n/a";

const PERCENT = 100;

const tallyOf = (tally: TranscriptTally | null, pick: (tally: TranscriptTally) => number): string =>
  tally === null ? NOT_COUNTED : String(pick(tally));

const costCellOf = (agent: AgentOutcome): string =>
  Object.entries(agent.costByModel)
    .map(([model, cost]) => `${model} ${cost.toFixed(TWO_DECIMALS)}`)
    .join(", ") || NOT_COUNTED;

const budgetShareOf = (record: RunRecord): string =>
  record.budgetUsd > NOTHING
    ? `${String(Math.round((record.agent.costUsd / record.budgetUsd) * PERCENT))}% of ${String(record.budgetUsd)}`
    : NOT_COUNTED;

export const RUNS_LOG_HEADER =
  "| started | task | snapshot | model | effort | finished | acceptance | gates | obligations " +
  "| debt named | fence hits | commits | turns (CLI) | assistant messages | tool calls | minutes " +
  "| cost $ | cost by model | budget | record |\n" +
  "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n";

export const rowOf = (record: RunRecord): string =>
  `| ${record.startedAt} | ${record.task} v${String(record.taskVersion)} | ${record.snapshot} ` +
  `| ${record.model} | ${record.effort ?? "default"} | ${endedOf(record.agent)} ` +
  `| ${String(record.acceptance.passed)}/${String(record.acceptance.total)} ` +
  `| ${gatesOf(record.gates)} | ${metOf(record.obligations)} | ${yesOrNo(record.debtNamed)} ` +
  `| ${String(record.fenceHits)} | ${String(record.commits)} | ${String(record.agent.turns)} ` +
  `| ${tallyOf(record.transcriptTally, (tally) => tally.assistantMessages)} ` +
  `| ${tallyOf(record.transcriptTally, (tally) => tally.toolCalls)} ` +
  `| ${minutesOf(record.agent.durationMs)} | ${record.agent.costUsd.toFixed(TWO_DECIMALS)} ` +
  `| ${costCellOf(record.agent)} | ${budgetShareOf(record)} ` +
  `| ${recordNameOf(record)}.json |\n`;

export const headlineOf = (record: RunRecord): string =>
  `${record.task} on ${record.model}: ${headlineEndOf(record.agent)}, ` +
  `acceptance ${String(record.acceptance.passed)}/${String(record.acceptance.total)}, ` +
  `gates ${gatesOf(record.gates)}, obligations ${metOf(record.obligations)}, ` +
  `fence hits ${String(record.fenceHits)}, ` +
  `${String(record.agent.turns)} turns in ${minutesOf(record.agent.durationMs)} min`;
