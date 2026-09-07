export const NameProblem = {
  Empty: "empty",
  Duplicates: "duplicates",
  TooLong: "too_long",
} as const;

export type NameProblem = (typeof NameProblem)[keyof typeof NameProblem];
