import { ActionKind } from "#merge-names/domain/merge-states.ts";
import type { Action, Selection } from "#merge-names/domain/merge-selection.ts";


export const MERGE_TAPS = /^m:(-|[0-9]+(?:\.[0-9]+)*):([a-z]):(-|[0-9]+)$/;

const NOTHING = "-";

const BETWEEN_IDS = ".";

const ACTION_CODES = {
  pick: "p",
  back: "b",
  confirm: "k",
  cancel: "x",
} as const;

const KINDS_BY_CODE = new Map<string, ActionKind>(
  Object.entries(ACTION_CODES).map(([kind, code]) => [code, kind as ActionKind])
);

export interface MergePayload {
  readonly selection: Selection;
  readonly action: Action;
}

const codeOf = (action: Action): string => ACTION_CODES[action.kind];

const argOf = (action: Action): string =>
  action.kind === ActionKind.Pick ? String(action.playerId) : NOTHING;

const encodeSelection = (selection: Selection): string =>
  selection.length === 0 ? NOTHING : selection.join(BETWEEN_IDS);

const decodeSelection = (encoded: string): Selection =>
  encoded === NOTHING ? [] : encoded.split(BETWEEN_IDS).map(Number);

const actionOf = (kind: ActionKind, arg: string): Action | null => {
  if (kind !== ActionKind.Pick) {
    return { kind };
  }

  return arg === NOTHING ? null : { kind, playerId: Number(arg) };
};

export const encodeMergeCallback = (payload: MergePayload): string =>
  ["m", encodeSelection(payload.selection), codeOf(payload.action), argOf(payload.action)].join(":");

export const decodeMergeCallback = (data: string): MergePayload | null => {
  const match = MERGE_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  const [, rawSelection = "", rawCode = "", rawArg = ""] = match;

  const kind = KINDS_BY_CODE.get(rawCode);
  if (kind === undefined) {
    return null;
  }

  const action = actionOf(kind, rawArg);

  return action === null ? null : { selection: decodeSelection(rawSelection), action };
};
