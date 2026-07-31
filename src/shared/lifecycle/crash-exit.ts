import type { Logger } from "#shared/logging/logger.ts";


const CRASH_EXIT_CODE = 1;

const exitOn = (log: Logger, kind: string, cause: unknown): void => {
  log.error(`${kind}: ${String(cause)} — exiting so a fresh process can take over`);
  process.exit(CRASH_EXIT_CODE);
};

export const installCrashExit = (log: Logger): void => {
  process.once("uncaughtException", (error) => exitOn(log, "uncaught exception", error));
  process.once("unhandledRejection", (reason) => exitOn(log, "unhandled rejection", reason));
};
