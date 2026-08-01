import type { Seat } from "#live-game/domain/card-state.ts";


export interface SeatingPlan {
  readonly roster: readonly Seat[];
  readonly placed: number;
}

export type SeatingAction =
  | { readonly kind: "pick"; readonly playerId: number }
  | { readonly kind: "back" }
  | { readonly kind: "cancel" };

export type SeatingTransition =
  | {
      readonly outcome: "updated";
      readonly plan: SeatingPlan;
      readonly seated: Seat;
      readonly seat: number;
    }
  | { readonly outcome: "stepped_back"; readonly plan: SeatingPlan }
  | { readonly outcome: "seated"; readonly seats: readonly Seat[] }
  | { readonly outcome: "cancelled" }
  | { readonly outcome: "rejected" };

const NONE_PLACED = 0;

const ONE_SEAT = 1;

const LAST_IS_FORCED = 1;

const seatNumber = (slot: number): number => slot + ONE_SEAT;

export const seatNumberOf = (plan: SeatingPlan, slot: number): number | null =>
  slot < plan.placed ? seatNumber(slot) : null;

const seatedNext = (plan: SeatingPlan, playerId: number): SeatingTransition => {
  const unplaced = plan.roster.slice(plan.placed);
  const among = unplaced.findIndex((seat) => seat.playerId === playerId);
  const picked = unplaced[among];

  if (picked === undefined) {
    return { outcome: "rejected" };
  }

  const roster = [
    ...plan.roster.slice(NONE_PLACED, plan.placed),
    picked,
    ...unplaced.filter((_, slot) => slot !== among),
  ];
  const placed = plan.placed + ONE_SEAT;

  return placed >= roster.length - LAST_IS_FORCED
    ? { outcome: "seated", seats: roster }
    : {
        outcome: "updated",
        plan: { roster, placed },
        seated: picked,
        seat: seatNumber(plan.placed),
      };
};

const steppedBack = (plan: SeatingPlan): SeatingTransition =>
  plan.placed === NONE_PLACED
    ? { outcome: "rejected" }
    : { outcome: "stepped_back", plan: { ...plan, placed: plan.placed - ONE_SEAT } };

export const applySeating = (plan: SeatingPlan, action: SeatingAction): SeatingTransition => {
  switch (action.kind) {
    case "cancel":
      return { outcome: "cancelled" };

    case "back":
      return steppedBack(plan);

    case "pick":
      return seatedNext(plan, action.playerId);
  }
};
