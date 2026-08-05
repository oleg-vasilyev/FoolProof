export const Role = {
  Keeper: "keeper",
  Absorbed: "absorbed",
  Free: "free",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Refusal = {
  UnknownName: "unknown_name",
  TooMany: "too_many",
  NothingYet: "nothing_yet",
} as const;

export type Refusal = (typeof Refusal)[keyof typeof Refusal];

export const ActionKind = {
  Pick: "pick",
  Back: "back",
  Confirm: "confirm",
  Cancel: "cancel",
} as const;

export type ActionKind = (typeof ActionKind)[keyof typeof ActionKind];

export const Outcome = {
  Updated: "updated",
  Confirmed: "confirmed",
  Cancelled: "cancelled",
  Rejected: "rejected",
} as const;

export type Outcome = (typeof Outcome)[keyof typeof Outcome];
