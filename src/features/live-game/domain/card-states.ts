export const Phase = {
  PickStarter: "PICK_STARTER",
  Recording: "RECORDING",
  Ready: "READY",
} as const;

export type Phase = (typeof Phase)[keyof typeof Phase];

export const ActionKind = {
  Pick: "pick",
  Draw: "draw",
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
  SteppedBack: "stepped_back",
  Seated: "seated",
} as const;

export type Outcome = (typeof Outcome)[keyof typeof Outcome];
