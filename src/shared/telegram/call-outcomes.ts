export const FailureKind = {
  Unreachable: "unreachable",
  Refused: "refused",
} as const;

export type FailureKind = (typeof FailureKind)[keyof typeof FailureKind];

export const SettledKind = {
  Response: "response",
  Error: "error",
  Retry: "retry",
} as const;

export type SettledKind = (typeof SettledKind)[keyof typeof SettledKind];
