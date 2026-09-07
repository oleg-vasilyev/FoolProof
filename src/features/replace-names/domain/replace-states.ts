export const Refusal = {
  NotTwoNames: "not_two_names",
  NoEvening: "no_evening",
  NotThisEvening: "not_this_evening",
  AlsoPlayed: "also_played",
  ScreenStale: "screen_stale",
} as const;

export type Refusal = (typeof Refusal)[keyof typeof Refusal];

export const ActionKind = {
  Confirm: "confirm",
  Cancel: "cancel",
} as const;

export type ActionKind = (typeof ActionKind)[keyof typeof ActionKind];
