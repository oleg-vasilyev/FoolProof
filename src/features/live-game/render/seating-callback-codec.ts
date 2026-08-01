import { fromBase62, toBase62 } from "#live-game/render/callback-data-codec.ts";
import type { SeatingAction } from "#live-game/domain/seating-plan.ts";


export const SEATING_TAPS = /^s:([0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*):([0-9]+):([a-z]):(-|[0-9A-Za-z]+)$/;

const NOTHING = "-";

const BETWEEN_IDS = ".";

const ACTION_CODES = {
  pick: "p",
  back: "b",
  cancel: "x",
} as const;

type ActionKind = SeatingAction["kind"];

const KINDS_BY_CODE = new Map<string, ActionKind>(
  Object.entries(ACTION_CODES).map(([kind, code]) => [code, kind as ActionKind])
);

export interface SeatingPayload {
  readonly order: readonly number[];
  readonly placed: number;
  readonly action: SeatingAction;
}

const argOf = (action: SeatingAction): string =>
  action.kind === "pick" ? toBase62(action.playerId) : NOTHING;

const actionOf = (kind: ActionKind, arg: string): SeatingAction | null => {
  if (kind !== "pick") {
    return { kind };
  }

  return arg === NOTHING ? null : { kind, playerId: fromBase62(arg) };
};

export const encodeSeatingCallback = (payload: SeatingPayload): string =>
  [
    "s",
    payload.order.map(toBase62).join(BETWEEN_IDS),
    String(payload.placed),
    ACTION_CODES[payload.action.kind],
    argOf(payload.action),
  ].join(":");

export const decodeSeatingCallback = (data: string): SeatingPayload | null => {
  const match = SEATING_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  const [, rawOrder = "", rawPlaced = "", rawCode = "", rawArg = ""] = match;

  const kind = KINDS_BY_CODE.get(rawCode);
  if (kind === undefined) {
    return null;
  }

  const action = actionOf(kind, rawArg);

  return action === null
    ? null
    : {
        order: rawOrder.split(BETWEEN_IDS).map(fromBase62),
        placed: Number(rawPlaced),
        action,
      };
};
