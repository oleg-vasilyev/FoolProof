import { ActionKind, Outcome, Phase } from "#live-game/domain/card-states.ts";


export { LONGEST_NAME, MIN_PLAYERS, MOST_PLAYERS } from "#shared/table/table-limits.ts";

export interface Seat {
  readonly playerId: number;
  readonly displayName: string;
}

export interface CardState {
  readonly seats: readonly Seat[];
  readonly starterSlot: number | null;
  readonly exits: readonly number[];
  readonly drawAccepted: boolean;
}

export type Action =
  | { readonly kind: typeof ActionKind.Pick; readonly slot: number }
  | { readonly kind: typeof ActionKind.Draw }
  | { readonly kind: typeof ActionKind.Back }
  | { readonly kind: typeof ActionKind.Confirm }
  | { readonly kind: typeof ActionKind.Cancel };

export type Transition =
  | { readonly outcome: typeof Outcome.Updated; readonly state: CardState }
  | { readonly outcome: typeof Outcome.Confirmed; readonly state: CardState }
  | { readonly outcome: typeof Outcome.Cancelled }
  | { readonly outcome: typeof Outcome.Rejected };

export interface Placement {
  readonly slot: number;
  readonly position: number;
}

const PLAYERS_SHARING_A_DRAW = 2;

export const seatAt = (state: CardState, slot: number): Seat | undefined => state.seats[slot];

export const nameAt = (state: CardState, slot: number): string => seatAt(state, slot)?.displayName ?? "";

export const remainingSlots = (state: CardState): readonly number[] =>
  state.seats.map((_, slot) => slot).filter((slot) => !state.exits.includes(slot));

export const isReady = (state: CardState): boolean => {
  if (state.starterSlot === null) {
    return false;
  }

  return remainingSlots(state).length === 1 || state.drawAccepted;
};

export const phaseOf = (state: CardState): Phase => {
  if (state.starterSlot === null) {
    return Phase.PickStarter;
  }

  return isReady(state) ? Phase.Ready : Phase.Recording;
};

export const drawAvailable = (state: CardState): boolean =>
  phaseOf(state) === Phase.Recording && remainingSlots(state).length === PLAYERS_SHARING_A_DRAW;

export const recordedPlacements = (state: CardState): readonly Placement[] =>
  state.exits.map((slot, index) => ({ slot, position: index + 1 }));

export const finalPlacements = (state: CardState): readonly Placement[] => {
  const lastPosition = state.exits.length + 1;

  return [
    ...recordedPlacements(state),
    ...remainingSlots(state).map((slot) => ({ slot, position: lastPosition })),
  ];
};

export const starterPlayerId = (state: CardState): number | null =>
  state.starterSlot === null ? null : (seatAt(state, state.starterSlot)?.playerId ?? null);

export const cancelHonoured = (state: CardState): boolean =>
  state.exits.length === 0 && !state.drawAccepted;

const isSlot = (state: CardState, slot: number): boolean =>
  Number.isInteger(slot) && slot >= 0 && slot < state.seats.length;

const steppedBack = (state: CardState): CardState => {
  if (state.drawAccepted) {
    return { ...state, drawAccepted: false };
  }

  if (state.exits.length > 0) {
    return { ...state, exits: state.exits.slice(0, state.exits.length - 1) };
  }

  return { ...state, starterSlot: null };
};

const picked = (state: CardState, phase: Phase, slot: number): Transition => {
  if (!isSlot(state, slot)) {
    return { outcome: Outcome.Rejected };
  }

  switch (phase) {
    case Phase.PickStarter:
      return { outcome: Outcome.Updated, state: { ...state, starterSlot: slot } };

    case Phase.Recording:
      return state.exits.includes(slot)
        ? { outcome: Outcome.Rejected }
        : { outcome: Outcome.Updated, state: { ...state, exits: [...state.exits, slot] } };

    case Phase.Ready:
      return { outcome: Outcome.Rejected };
  }
};

export const apply = (state: CardState, action: Action): Transition => {
  const phase = phaseOf(state);

  switch (action.kind) {
    case ActionKind.Cancel:
      return cancelHonoured(state) ? { outcome: Outcome.Cancelled } : { outcome: Outcome.Rejected };

    case ActionKind.Confirm:
      return phase === Phase.Ready ? { outcome: Outcome.Confirmed, state } : { outcome: Outcome.Rejected };

    case ActionKind.Back:
      return phase === Phase.PickStarter
        ? { outcome: Outcome.Rejected }
        : { outcome: Outcome.Updated, state: steppedBack(state) };

    case ActionKind.Draw:
      return drawAvailable(state)
        ? { outcome: Outcome.Updated, state: { ...state, drawAccepted: true } }
        : { outcome: Outcome.Rejected };

    case ActionKind.Pick:
      return picked(state, phase, action.slot);
  }
};

