import { Level, THRESHOLDS } from "#shared/logging/log-levels.ts";
import { recordProblem } from "#shared/logging/log-history.ts";


const LEVEL_NAME_WIDTH = 5;

const configured = (process.env.LOG_LEVEL ?? Level.Info).toLowerCase() as Level;
const threshold = THRESHOLDS[configured] ?? THRESHOLDS[Level.Info];

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(scope: string): Logger {
  const emit = (level: Level, message: string): void => {
    if (level === Level.Warn || level === Level.Error) {
      recordProblem(level, `${scope}: ${message}`);
    }

    if (THRESHOLDS[level] < threshold) {
      return;
    }

    const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(LEVEL_NAME_WIDTH)} ${scope}: ${message}`;
    const sink = level === Level.Error ? console.error : level === Level.Warn ? console.warn : console.log;
    sink(line);
  };

  return {
    debug: (message) => emit("debug", message),
    info: (message) => emit("info", message),
    warn: (message) => emit("warn", message),
    error: (message) => emit("error", message),
  };
}
