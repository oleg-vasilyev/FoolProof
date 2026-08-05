import { ActionKind, Outcome, Refusal, Role } from "#merge-names/domain/merge-states.ts";


export interface Candidate {
  readonly playerId: number;
  readonly displayName: string;
  readonly games: number;
}

export type Selection = readonly number[];

export type Action =
  | { readonly kind: typeof ActionKind.Pick; readonly playerId: number }
  | { readonly kind: typeof ActionKind.Back }
  | { readonly kind: typeof ActionKind.Confirm }
  | { readonly kind: typeof ActionKind.Cancel };

export type Transition =
  | {
      readonly outcome: typeof Outcome.Updated;
      readonly selection: Selection;
      readonly touched: Candidate | null;
    }
  | {
      readonly outcome: typeof Outcome.Confirmed;
      readonly keeper: Candidate;
      readonly absorbed: readonly Candidate[];
    }
  | { readonly outcome: typeof Outcome.Cancelled }
  | { readonly outcome: typeof Outcome.Rejected; readonly because: Refusal };

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
    return Role.Free;
  }

  return place === FIRST ? Role.Keeper : Role.Absorbed;
};

export const gamesAfterMerge = (keeper: Candidate, absorbed: readonly Candidate[]): number =>
  absorbed.reduce((total, candidate) => total + candidate.games, keeper.games);

export const chosen = (roster: readonly Candidate[], selection: Selection): readonly Candidate[] =>
  selection.flatMap((playerId) => {
    const candidate = candidateOf(roster, playerId);

    return candidate === undefined ? [] : [candidate];
  });

const toggled = (selection: Selection, touched: Candidate): Transition => {
  if (roleOf(selection, touched.playerId) !== Role.Free) {
    return {
      outcome: Outcome.Updated,
      selection: selection.filter((playerId) => playerId !== touched.playerId),
      touched,
    };
  }

  if (selection.length >= MOST_NAMES_AT_ONCE) {
    return { outcome: Outcome.Rejected, because: Refusal.TooMany };
  }

  return { outcome: Outcome.Updated, selection: [...selection, touched.playerId], touched };
};

const picked = (
  roster: readonly Candidate[],
  selection: Selection,
  playerId: number
): Transition => {
  const touched = candidateOf(roster, playerId);

  return touched === undefined
    ? { outcome: Outcome.Rejected, because: Refusal.UnknownName }
    : toggled(selection, touched);
};

const confirmed = (roster: readonly Candidate[], selection: Selection): Transition => {
  const known = chosen(roster, selection);
  const [keeper, ...absorbed] = known;

  if (keeper === undefined || known.length !== selection.length) {
    return { outcome: Outcome.Rejected, because: Refusal.UnknownName };
  }

  return { outcome: Outcome.Confirmed, keeper, absorbed };
};

export const apply = (
  roster: readonly Candidate[],
  selection: Selection,
  action: Action
): Transition => {
  switch (action.kind) {
    case ActionKind.Pick:
      return picked(roster, selection, action.playerId);

    case ActionKind.Back:
      return selection.length === NOTHING_PICKED
        ? { outcome: Outcome.Rejected, because: Refusal.NothingYet }
        : { outcome: Outcome.Updated, selection: selection.slice(FIRST, LAST), touched: null };

    case ActionKind.Confirm:
      return selection.length < MIN_TO_MERGE
        ? { outcome: Outcome.Rejected, because: Refusal.NothingYet }
        : confirmed(roster, selection);

    case ActionKind.Cancel:
      return { outcome: Outcome.Cancelled };
  }
};
