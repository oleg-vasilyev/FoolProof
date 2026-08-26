export const Problem = {
  Empty: "empty",
  Duplicates: "duplicates",
  TooLong: "too_long",
  TooFew: "too_few",
  TooMany: "too_many",
  UnknownNames: "unknown_names",
  NothingYet: "nothing_yet",
} as const;

export type Problem = (typeof Problem)[keyof typeof Problem];
