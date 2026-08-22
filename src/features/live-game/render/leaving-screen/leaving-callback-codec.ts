import { ActionKind } from "#live-game/domain/card-states.ts";
import { fromBase62, toBase62 } from "#live-game/render/callback-data-codec.ts";
import type { LeavingAction } from "#live-game/domain/leaving-plan.ts";


export const LEAVING_TAPS =
  /^w:([0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*):([0-9A-Za-z]+):([a-z]):(-|[0-9A-Za-z]+)$/;

const NOTHING = "-";

const BETWEEN_IDS = ".";

const ACTION_CODES = {
  pick: "p",
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

const NO_SEATS = 0;

const ONE_SEAT = 1;

const maskOf = (order: readonly number[], leaving: readonly number[]): number =>
  order.reduce(
    (mask, playerId, seat) => (leaving.includes(playerId) ? mask + (ONE_SEAT << seat) : mask),
    NO_SEATS
  );

const leavingIn = (order: readonly number[], mask: number): readonly number[] =>
  order.filter((_unused, seat) => (mask & (ONE_SEAT << seat)) !== NO_SEATS);

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
    "w",
    payload.order.map(toBase62).join(BETWEEN_IDS),
    toBase62(maskOf(payload.order, payload.leaving)),
    ACTION_CODES[payload.action.kind],
    argOf(payload.action),
  ].join(":");

export const decodeLeavingCallback = (data: string): LeavingPayload | null => {
  const match = LEAVING_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  const [, rawOrder = "", rawMask = "", rawCode = "", rawArg = ""] = match;

  const kind = KINDS_BY_CODE.get(rawCode);
  if (kind === undefined) {
    return null;
  }

  const action = actionOf(kind, rawArg);
  const order = rawOrder.split(BETWEEN_IDS).map(fromBase62);

  return action === null ? null : { order, leaving: leavingIn(order, fromBase62(rawMask)), action };
};
