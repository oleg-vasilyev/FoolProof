import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import type { Seat } from "#live-game/domain/card-state.ts";


export interface SeatingPlan {
  readonly roster: readonly Seat[];
  readonly placed: number;
}

export type SeatingAction =
  | { readonly kind: typeof ActionKind.Pick; readonly playerId: number }
  | { readonly kind: typeof ActionKind.Back }
  | { readonly kind: typeof ActionKind.Confirm }
  | { readonly kind: typeof ActionKind.Cancel };

export type SeatingTransition =
  | {
      readonly outcome: typeof Outcome.Updated;
      readonly plan: SeatingPlan;
      readonly seated: Seat;
      readonly seat: number;
    }
  | { readonly outcome: typeof Outcome.SteppedBack; readonly plan: SeatingPlan }
  | { readonly outcome: typeof Outcome.Seated; readonly seats: readonly Seat[] }
  | { readonly outcome: typeof Outcome.Cancelled }
  | { readonly outcome: typeof Outcome.Rejected };

const NONE_PLACED = 0;

const ONE_SEAT = 1;

const LAST_IS_FORCED = 1;

const seatNumber = (slot: number): number => slot + ONE_SEAT;

export const everyoneSeated = (plan: SeatingPlan): boolean =>
  plan.placed >= plan.roster.length - LAST_IS_FORCED;

export const seatNumberOf = (plan: SeatingPlan, slot: number): number | null =>
  slot < plan.placed || everyoneSeated(plan) ? seatNumber(slot) : null;

const seatedNext = (plan: SeatingPlan, playerId: number): SeatingTransition => {
  if (everyoneSeated(plan)) {
    return { outcome: Outcome.Rejected };
  }

  const unplaced = plan.roster.slice(plan.placed);
  const among = unplaced.findIndex((seat) => seat.playerId === playerId);
  const picked = unplaced[among];

  if (picked === undefined) {
    return { outcome: Outcome.Rejected };
  }

  const roster = [
    ...plan.roster.slice(NONE_PLACED, plan.placed),
    picked,
    ...unplaced.filter((_, slot) => slot !== among),
  ];
  return {
    outcome: Outcome.Updated,
    plan: { roster, placed: plan.placed + ONE_SEAT },
    seated: picked,
    seat: seatNumber(plan.placed),
  };
};

const steppedBack = (plan: SeatingPlan): SeatingTransition =>
  plan.placed === NONE_PLACED
    ? { outcome: Outcome.Rejected }
    : { outcome: Outcome.SteppedBack, plan: { ...plan, placed: plan.placed - ONE_SEAT } };

export const applySeating = (plan: SeatingPlan, action: SeatingAction): SeatingTransition => {
  switch (action.kind) {
    case ActionKind.Cancel:
      return { outcome: Outcome.Cancelled };

    case ActionKind.Back:
      return steppedBack(plan);

    case ActionKind.Confirm:
      return everyoneSeated(plan)
        ? { outcome: Outcome.Seated, seats: plan.roster }
        : { outcome: Outcome.Rejected };

    case ActionKind.Pick:
      return seatedNext(plan, action.playerId);
  }
};
