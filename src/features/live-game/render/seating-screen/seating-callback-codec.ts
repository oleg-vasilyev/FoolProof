import { ActionKind } from "#live-game/domain/card-states.ts";
import { fromBase62, toBase62 } from "#live-game/render/callback-data-codec.ts";
import { fromBase62Row, marksOf, seatsOf, toBase62Row } from "#live-game/render/roster-codec.ts";
import type { SeatingAction } from "#live-game/domain/seating-plan.ts";


export const SEATING_TAPS = /^S:([0-9A-Za-z]+):([0-9A-Za-z]*):([a-z]):(-|[0-9A-Za-z]+)$/;

const THE_SCREEN = "S";

const NOTHING = "-";

const ACTION_CODES = {
  pick: "p",
  back: "b",
  confirm: "k",
  cancel: "x",
} as const;

type SeatingActionKind = SeatingAction["kind"];

const KINDS_BY_CODE = new Map<string, SeatingActionKind>(
  Object.entries(ACTION_CODES).map(([kind, code]) => [code, kind as SeatingActionKind])
);

export interface SeatingPayload {
  readonly order: readonly number[];
  readonly seated: readonly number[];
  readonly action: SeatingAction;
}

const argOf = (action: SeatingAction): string =>
  action.kind === ActionKind.Pick ? toBase62(action.playerId) : NOTHING;

const actionOf = (kind: SeatingActionKind, arg: string): SeatingAction | null => {
  if (kind !== ActionKind.Pick) {
    return { kind };
  }

  return arg === NOTHING ? null : { kind, playerId: fromBase62(arg) };
};

export const encodeSeatingCallback = (payload: SeatingPayload): string =>
  [
    THE_SCREEN,
    toBase62Row(payload.order),
    marksOf(payload.order, payload.seated),
    ACTION_CODES[payload.action.kind],
    argOf(payload.action),
  ].join(":");

export const decodeSeatingCallback = (data: string): SeatingPayload | null => {
  const match = SEATING_TAPS.exec(data);
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
  const seated = order === null ? null : seatsOf(order, rawMarks);

  return order === null || action === null || seated === null ? null : { order, seated, action };
};
