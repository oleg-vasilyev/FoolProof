import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import { MIN_PLAYERS, type Seat } from "#live-game/domain/card-state.ts";
import { Problem } from "#live-game/domain/refusals.ts";


export type LeavingRefusal = typeof Problem.TooFew | typeof Problem.UnknownNames;

export interface LeavingPlan {
  readonly roster: readonly Seat[];
  readonly leaving: readonly number[];
}

export type LeavingAction =
  | { readonly kind: typeof ActionKind.Pick; readonly playerId: number }
  | { readonly kind: typeof ActionKind.Confirm }
  | { readonly kind: typeof ActionKind.Cancel };

export type LeavingTransition =
  | {
      readonly outcome: typeof Outcome.Updated;
      readonly plan: LeavingPlan;
      readonly toggled: Seat;
      readonly sittingOut: boolean;
    }
  | { readonly outcome: typeof Outcome.Seated; readonly seats: readonly Seat[] }
  | { readonly outcome: typeof Outcome.Cancelled }
  | { readonly outcome: typeof Outcome.Rejected; readonly problem: LeavingRefusal };

export const stayingIn = (plan: LeavingPlan): readonly Seat[] =>
  plan.roster.filter((seat) => !plan.leaving.includes(seat.playerId));

const marked = (plan: LeavingPlan, playerId: number): LeavingTransition => {
  const seat = plan.roster.find((one) => one.playerId === playerId);

  if (seat === undefined) {
    return { outcome: Outcome.Rejected, problem: Problem.UnknownNames };
  }

  const sittingOut = !plan.leaving.includes(playerId);
  const leaving = sittingOut
    ? [...plan.leaving, playerId]
    : plan.leaving.filter((one) => one !== playerId);

  return { outcome: Outcome.Updated, plan: { ...plan, leaving }, toggled: seat, sittingOut };
};

const confirmed = (plan: LeavingPlan): LeavingTransition => {
  const seats = stayingIn(plan);

  return seats.length < MIN_PLAYERS
    ? { outcome: Outcome.Rejected, problem: Problem.TooFew }
    : { outcome: Outcome.Seated, seats };
};

export const applyLeaving = (plan: LeavingPlan, action: LeavingAction): LeavingTransition => {
  switch (action.kind) {
    case ActionKind.Cancel:
      return { outcome: Outcome.Cancelled };

    case ActionKind.Confirm:
      return confirmed(plan);

    case ActionKind.Pick:
      return marked(plan, action.playerId);
  }
};
