import { secondsOf } from "./gate-verdict.ts";


export type Say = (line: string) => void;

export const TOOLS_DIR = "reports/tools";

export interface ToolVerdict {
  readonly verb: string;
  readonly args: readonly string[];
  readonly ok: boolean;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly said: readonly string[];
  readonly error: string | null;
}

export const toolLogPathOf = (verb: string): string => `${TOOLS_DIR}/${verb}.log`;

export const toolVerdictPathOf = (verb: string): string => `${TOOLS_DIR}/${verb}.json`;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const verdictOfRun = (
  verb: string,
  args: readonly string[],
  startedAt: Date,
  endedAt: Date,
  said: readonly string[],
  error: unknown
): ToolVerdict => ({
  verb,
  args,
  ok: error === null,
  startedAt: startedAt.toISOString(),
  durationMs: endedAt.getTime() - startedAt.getTime(),
  said,
  error: error === null ? null : messageOf(error),
});

export const closingLine = (verdict: ToolVerdict): string =>
  verdict.ok
    ? `${verdict.verb}: ${String(verdict.said.length)} lines in ${secondsOf(verdict.durationMs)} → ${toolVerdictPathOf(verdict.verb)}`
    : `${verdict.verb}: FAILED in ${secondsOf(verdict.durationMs)} — ${verdict.error ?? ""} → ${toolVerdictPathOf(verdict.verb)}`;
