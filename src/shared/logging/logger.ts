import { recordProblem } from "#shared/logging/log-history.ts";


const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;

type Level = keyof typeof LEVELS;

const LEVEL_NAME_WIDTH = 5;

const configured = (process.env.LOG_LEVEL ?? "info").toLowerCase() as Level;
const threshold = LEVELS[configured] ?? LEVELS.info;

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(scope: string): Logger {
  const emit = (level: Level, message: string): void => {
    if (level === "warn" || level === "error") {
      recordProblem(level, `${scope}: ${message}`);
    }

    if (LEVELS[level] < threshold) {
      return;
    }

    const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(LEVEL_NAME_WIDTH)} ${scope}: ${message}`;
    const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    sink(line);
  };

  return {
    debug: (message) => emit("debug", message),
    info: (message) => emit("info", message),
    warn: (message) => emit("warn", message),
    error: (message) => emit("error", message),
  };
}
