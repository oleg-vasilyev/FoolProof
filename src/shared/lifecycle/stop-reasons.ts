export const StopReason = {
  Stopped: "stopped",
  CannotStart: "cannot-start",
} as const;

export type StopReason = (typeof StopReason)[keyof typeof StopReason];
