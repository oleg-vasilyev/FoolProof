import type { Feature } from "#shared/telegram/feature-contract.ts";
import type { Logger } from "#shared/logging/logger.ts";
import type { DiagnosticsRepository } from "#shared/repository/repository-contract.ts";
import { copy } from "#diagnostics/copy.en.ts";
import { takeHealthSnapshot } from "#diagnostics/bot/health-snapshot.ts";
import { onStatus, type StatusContext } from "#diagnostics/bot/status-handler.ts";


export interface DiagnosticsDeps {
  readonly repo: DiagnosticsRepository;
  readonly log: Logger;
  readonly logLevel: string;
  readonly startAttempt: number;
  readonly previousExit: string | null;
  readonly operatorTgId: string | null;
}

export const createDiagnosticsFeature = (deps: DiagnosticsDeps): Feature => {
  const context: StatusContext = {
    takeSnapshot: () =>
      takeHealthSnapshot({
        repo: deps.repo,
        logLevel: deps.logLevel,
        startAttempt: deps.startAttempt,
        previousExit: deps.previousExit,
      }),
    operatorTgId: deps.operatorTgId,
    log: deps.log,
  };

  return {
    commands: [
      {
        command: "status",
        menuDescription: copy.commandStatus,
        help: copy.helpStatus,
        hidden: true,
        run: (ctx) => onStatus(context, ctx),
      },
    ],
  };
};
