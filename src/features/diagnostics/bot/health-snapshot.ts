import { appVersion } from "#diagnostics/bot/app-version.ts";
import { problemsSeen, problemTally } from "#shared/logging/log-history.ts";
import { callTally } from "#shared/telegram/api-call-tally.ts";
import { slowestRenderMs } from "#shared/timing/slowest-render.ts";
import type { DiagnosticsRepository } from "#shared/repository/repository-contract.ts";
import type { HealthSnapshot } from "#diagnostics/render/health-report.ts";


const MS_PER_SECOND = 1000;

export interface HealthDeps {
  readonly repo: DiagnosticsRepository;
  readonly startAttempt: number;
  readonly previousExit: string | null;
}

export const takeHealthSnapshot = (deps: HealthDeps): HealthSnapshot => {
  const tally = problemTally();

  return {
    storage: deps.repo.storageSummary(),
    chats: deps.repo.chatSummary(),
    version: appVersion(),
    uptimeMs: process.uptime() * MS_PER_SECOND,
    startAttempt: deps.startAttempt,
    previousExit: deps.previousExit,
    warnings: tally.warn,
    errors: tally.error,
    problems: problemsSeen(),
    calls: callTally(),
    slowestRenderMs: slowestRenderMs(),
  };
};
