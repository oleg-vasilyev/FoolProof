export interface Candidate {
  readonly playerId: number;
  readonly displayName: string;
  readonly games: number;
}

export type Selection = readonly number[];

export type Role = "keeper" | "absorbed" | "free";

export type Refusal = "unknown_name" | "too_many" | "nothing_yet";

export type Action =
  | { readonly kind: "pick"; readonly playerId: number }
  | { readonly kind: "back" }
  | { readonly kind: "confirm" }
  | { readonly kind: "cancel" };

export type Transition =
  | {
      readonly outcome: "updated";
      readonly selection: Selection;
      readonly touched: Candidate | null;
    }
  | {
      readonly outcome: "confirmed";
      readonly keeper: Candidate;
      readonly absorbed: readonly Candidate[];
    }
  | { readonly outcome: "cancelled" }
  | { readonly outcome: "rejected"; readonly because: Refusal };

export const MIN_TO_MERGE = 2;

export const MOST_NAMES_AT_ONCE = 6;

const NOTHING_PICKED = 0;

const FIRST = 0;

const LAST = -1;

const NOT_PICKED = -1;

export const candidateOf = (
  roster: readonly Candidate[],
  playerId: number
): Candidate | undefined => roster.find((candidate) => candidate.playerId === playerId);

export const roleOf = (selection: Selection, playerId: number): Role => {
  const place = selection.indexOf(playerId);

  if (place === NOT_PICKED) {
    return "free";
  }

  return place === FIRST ? "keeper" : "absorbed";
};

export const gamesAfterMerge = (keeper: Candidate, absorbed: readonly Candidate[]): number =>
  absorbed.reduce((total, candidate) => total + candidate.games, keeper.games);

export const chosen = (roster: readonly Candidate[], selection: Selection): readonly Candidate[] =>
  selection.flatMap((playerId) => {
    const candidate = candidateOf(roster, playerId);

    return candidate === undefined ? [] : [candidate];
  });

const toggled = (selection: Selection, touched: Candidate): Transition => {
  if (roleOf(selection, touched.playerId) !== "free") {
    return {
      outcome: "updated",
      selection: selection.filter((playerId) => playerId !== touched.playerId),
      touched,
    };
  }

  if (selection.length >= MOST_NAMES_AT_ONCE) {
    return { outcome: "rejected", because: "too_many" };
  }

  return { outcome: "updated", selection: [...selection, touched.playerId], touched };
};

const picked = (
  roster: readonly Candidate[],
  selection: Selection,
  playerId: number
): Transition => {
  const touched = candidateOf(roster, playerId);

  return touched === undefined
    ? { outcome: "rejected", because: "unknown_name" }
    : toggled(selection, touched);
};

const confirmed = (roster: readonly Candidate[], selection: Selection): Transition => {
  const known = chosen(roster, selection);
  const [keeper, ...absorbed] = known;

  if (keeper === undefined || known.length !== selection.length) {
    return { outcome: "rejected", because: "unknown_name" };
  }

  return { outcome: "confirmed", keeper, absorbed };
};

export const apply = (
  roster: readonly Candidate[],
  selection: Selection,
  action: Action
): Transition => {
  switch (action.kind) {
    case "pick":
      return picked(roster, selection, action.playerId);

    case "back":
      return selection.length === NOTHING_PICKED
        ? { outcome: "rejected", because: "nothing_yet" }
        : { outcome: "updated", selection: selection.slice(FIRST, LAST), touched: null };

    case "confirm":
      return selection.length < MIN_TO_MERGE
        ? { outcome: "rejected", because: "nothing_yet" }
        : confirmed(roster, selection);

    case "cancel":
      return { outcome: "cancelled" };
  }
};
