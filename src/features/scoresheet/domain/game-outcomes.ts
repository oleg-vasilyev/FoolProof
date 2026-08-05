export const CellKind = {
  Absent: "absent",
  Placed: "placed",
  Drawn: "drawn",
  Fool: "fool",
} as const;

export type CellKind = (typeof CellKind)[keyof typeof CellKind];

export const Finish = {
  First: "first",
  Middle: "middle",
  Drawn: "drawn",
  Fool: "fool",
} as const;

export type Finish = (typeof Finish)[keyof typeof Finish];
