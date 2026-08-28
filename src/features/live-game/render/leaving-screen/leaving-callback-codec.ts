import { ActionKind } from "#live-game/domain/card-states.ts";
import { fromBase62, toBase62 } from "#live-game/render/callback-data-codec.ts";
import { fromBase62Row, marksOf, seatsOf, toBase62Row } from "#live-game/render/roster-codec.ts";
import type { LeavingAction } from "#live-game/domain/leaving-plan.ts";


export const LEAVING_TAPS = /^W:([0-9A-Za-z]+):([0-9A-Za-z]*):([a-z]):(-|[0-9A-Za-z]+)$/;

const THE_SCREEN = "W";

const NOTHING = "-";

const ACTION_CODES = {
  pick: "p",
  back: "b",
  confirm: "k",
  cancel: "x",
} as const;

type LeavingActionKind = LeavingAction["kind"];

const KINDS_BY_CODE = new Map<string, LeavingActionKind>(
  Object.entries(ACTION_CODES).map(([kind, code]) => [code, kind as LeavingActionKind])
);

export interface LeavingPayload {
  readonly order: readonly number[];
  readonly leaving: readonly number[];
  readonly action: LeavingAction;
}

const argOf = (action: LeavingAction): string =>
  action.kind === ActionKind.Pick ? toBase62(action.playerId) : NOTHING;

const actionOf = (kind: LeavingActionKind, arg: string): LeavingAction | null => {
  if (kind !== ActionKind.Pick) {
    return { kind };
  }

  return arg === NOTHING ? null : { kind, playerId: fromBase62(arg) };
};

export const encodeLeavingCallback = (payload: LeavingPayload): string =>
  [
    THE_SCREEN,
    toBase62Row(payload.order),
    marksOf(payload.order, payload.leaving),
    ACTION_CODES[payload.action.kind],
    argOf(payload.action),
  ].join(":");

export const decodeLeavingCallback = (data: string): LeavingPayload | null => {
  const match = LEAVING_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  const [, rawOrder = "", rawMarks = "", rawCode = "", rawArg = ""] = match;

  const kind = KINDS_BY_CODE.get(rawCode);
  if (kind === undefined) {
    return null;
  }

  const order = fromBase62Row(rawOrder);
  const action = actionOf(kind, rawArg);
  const leaving = order === null ? null : seatsOf(order, rawMarks);

  return order === null || action === null || leaving === null ? null : { order, leaving, action };
};
