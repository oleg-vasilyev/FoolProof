import { NameProblem } from "#shared/table/name-problems.ts";


export const Problem = {
  ...NameProblem,
  TooFew: "too_few",
  TooMany: "too_many",
  UnknownNames: "unknown_names",
  NothingYet: "nothing_yet",
} as const;

export type Problem = (typeof Problem)[keyof typeof Problem];
