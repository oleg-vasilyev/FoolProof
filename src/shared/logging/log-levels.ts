export const Level = {
  Debug: "debug",
  Info: "info",
  Warn: "warn",
  Error: "error",
} as const;

export type Level = (typeof Level)[keyof typeof Level];

export const THRESHOLDS: Readonly<Record<Level, number>> = {
  [Level.Debug]: 10,
  [Level.Info]: 20,
  [Level.Warn]: 30,
  [Level.Error]: 40,
};
