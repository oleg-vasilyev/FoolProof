import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import type { Seat } from "#live-game/domain/card-state.ts";


export interface SeatingPlan {
  readonly roster: readonly Seat[];
  readonly seated: readonly number[];
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

const NONE_SEATED = 0;

const ONE_SEAT = 1;

const LAST_IS_FORCED = 1;

const NOT_SEATED = -1;

const seatNumber = (at: number): number => at + ONE_SEAT;

const seatIn = (plan: SeatingPlan, playerId: number): readonly Seat[] => {
  const found = plan.roster.find((seat) => seat.playerId === playerId);

  return found === undefined ? [] : [found];
};

export const everyoneSeated = (plan: SeatingPlan): boolean =>
  plan.seated.length >= plan.roster.length - LAST_IS_FORCED;

export const seatNumberOf = (plan: SeatingPlan, slot: number): number | null => {
  const seat = plan.roster[slot];

  if (seat === undefined) {
    return null;
  }

  const at = plan.seated.indexOf(seat.playerId);

  if (at !== NOT_SEATED) {
    return seatNumber(at);
  }

  return everyoneSeated(plan) ? seatNumber(plan.seated.length) : null;
};

const ringOf = (plan: SeatingPlan): readonly Seat[] => [
  ...plan.seated.flatMap((playerId) => seatIn(plan, playerId)),
  ...plan.roster.filter((seat) => !plan.seated.includes(seat.playerId)),
];

const seatedNext = (plan: SeatingPlan, playerId: number): SeatingTransition => {
  if (everyoneSeated(plan) || plan.seated.includes(playerId)) {
    return { outcome: Outcome.Rejected };
  }

  const [picked] = seatIn(plan, playerId);

  if (picked === undefined) {
    return { outcome: Outcome.Rejected };
  }

  return {
    outcome: Outcome.Updated,
    plan: { ...plan, seated: [...plan.seated, playerId] },
    seated: picked,
    seat: seatNumber(plan.seated.length),
  };
};

const steppedBack = (plan: SeatingPlan): SeatingTransition =>
  plan.seated.length === NONE_SEATED
    ? { outcome: Outcome.Rejected }
    : {
        outcome: Outcome.SteppedBack,
        plan: { ...plan, seated: plan.seated.slice(NONE_SEATED, plan.seated.length - ONE_SEAT) },
      };

export const applySeating = (plan: SeatingPlan, action: SeatingAction): SeatingTransition => {
  switch (action.kind) {
    case ActionKind.Cancel:
      return { outcome: Outcome.Cancelled };

    case ActionKind.Back:
      return steppedBack(plan);

    case ActionKind.Confirm:
      return everyoneSeated(plan)
        ? { outcome: Outcome.Seated, seats: ringOf(plan) }
        : { outcome: Outcome.Rejected };

    case ActionKind.Pick:
      return seatedNext(plan, action.playerId);
  }
};
