export const Standing = {
  Better: "better",
  Worse: "worse",
  Level: "level",
  Unproven: "unproven",
} as const;

export type Standing = (typeof Standing)[keyof typeof Standing];
