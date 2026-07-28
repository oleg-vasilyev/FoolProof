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

export type Phase = "PICK_STARTER" | "RECORDING" | "READY";

export type Action =
  | { readonly kind: "pick"; readonly slot: number }
  | { readonly kind: "draw" }
  | { readonly kind: "back" }
  | { readonly kind: "confirm" }
  | { readonly kind: "cancel" };

export type Transition =
  | { readonly outcome: "updated"; readonly state: CardState }
  | { readonly outcome: "confirmed"; readonly state: CardState }
  | { readonly outcome: "cancelled" }
  | { readonly outcome: "rejected" };

export interface Placement {
  readonly slot: number;
  readonly position: number;
}

const PLAYERS_SHARING_A_DRAW = 2;

export const MIN_PLAYERS = 2;

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
    return "PICK_STARTER";
  }

  return isReady(state) ? "READY" : "RECORDING";
};

export const drawAvailable = (state: CardState): boolean =>
  phaseOf(state) === "RECORDING" && remainingSlots(state).length === PLAYERS_SHARING_A_DRAW;

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

const isSlot = (state: CardState, slot: number): boolean =>
  Number.isInteger(slot) && slot >= 0 && slot < state.seats.length;

const steppedBack = (state: CardState): CardState => {
  if (state.drawAccepted) {
    return { ...state, drawAccepted: false };
  }

  if (state.exits.length > 0) {
    return { ...state, exits: state.exits.slice(0, -1) };
  }

  return { ...state, starterSlot: null };
};

export const apply = (state: CardState, action: Action): Transition => {
  const phase = phaseOf(state);

  if (action.kind === "cancel") {
    return phase === "PICK_STARTER" ? { outcome: "cancelled" } : { outcome: "rejected" };
  }

  if (action.kind === "confirm") {
    return phase === "READY" ? { outcome: "confirmed", state } : { outcome: "rejected" };
  }

  if (action.kind === "back") {
    return phase === "PICK_STARTER"
      ? { outcome: "rejected" }
      : { outcome: "updated", state: steppedBack(state) };
  }

  if (action.kind === "draw") {
    return drawAvailable(state)
      ? { outcome: "updated", state: { ...state, drawAccepted: true } }
      : { outcome: "rejected" };
  }

  if (!isSlot(state, action.slot)) {
    return { outcome: "rejected" };
  }

  if (phase === "PICK_STARTER") {
    return { outcome: "updated", state: { ...state, starterSlot: action.slot } };
  }

  if (phase !== "RECORDING" || state.exits.includes(action.slot)) {
    return { outcome: "rejected" };
  }

  return { outcome: "updated", state: { ...state, exits: [...state.exits, action.slot] } };
};
