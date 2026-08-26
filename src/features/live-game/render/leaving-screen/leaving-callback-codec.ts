import { ActionKind } from "#live-game/domain/card-states.ts";
import { fromBase62, toBase62 } from "#live-game/render/callback-data-codec.ts";
import type { LeavingAction } from "#live-game/domain/leaving-plan.ts";


export const LEAVING_TAPS =
  /^([wW]):([0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*):([0-9A-Za-z]*):([a-z]):(-|[0-9A-Za-z]+)$/;

const NOTHING = "-";

const BETWEEN_IDS = ".";

const PADDING = "0";

const NO_MARKS_AT_ALL = "";

const ALL_BASE_62 = /^[0-9A-Za-z]+$/;

const WHEN_MARKS_WERE_A_MASK = "w";

const MARKS_IN_ORDER = "W";

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

const NO_SEATS = 0;

const ONE_SEAT = 1;

const NARROWEST = 0;

const A_WIDTH_DIGIT = 1;

const FIRST = 0;

const NOT_AT_THE_TABLE = -1;

const toBase62Row = (ids: readonly number[]): string => {
  const written = ids.map(toBase62);
  const width = written.reduce((widest, one) => Math.max(widest, one.length), NARROWEST);

  return [toBase62(width), ...written.map((one) => one.padStart(width, PADDING))].join("");
};

const fromBase62Row = (row: string): readonly number[] | null => {
  const width = fromBase62(row.slice(FIRST, A_WIDTH_DIGIT));
  const ids = row.slice(A_WIDTH_DIGIT);
  const seats = ids.length / width;

  if (!ALL_BASE_62.test(row) || !Number.isInteger(seats) || seats === NO_SEATS) {
    return null;
  }

  return Array.from({ length: seats }, (_unused, at) =>
    fromBase62(ids.slice(at * width, at * width + width))
  );
};

const leavingIn = (order: readonly number[], mask: number): readonly number[] =>
  order.filter((_unused, seat) => (mask & (ONE_SEAT << seat)) !== NO_SEATS);

const seatsOf = (order: readonly number[], marks: string): readonly number[] | null => {
  const seats = [...marks].map((digit) => order[fromBase62(digit)]);
  const known = seats.every((playerId) => playerId !== undefined);

  return known && new Set(seats).size === seats.length ? seats : null;
};

const marksOf = (order: readonly number[], leaving: readonly number[]): string =>
  leaving
    .map((playerId) => order.indexOf(playerId))
    .filter((seat) => seat !== NOT_AT_THE_TABLE)
    .map(toBase62)
    .join("");

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
    MARKS_IN_ORDER,
    toBase62Row(payload.order),
    marksOf(payload.order, payload.leaving),
    ACTION_CODES[payload.action.kind],
    argOf(payload.action),
  ].join(":");

const readWhenMarksWereAMask = (
  rawOrder: string,
  rawMask: string
): Pick<LeavingPayload, "order" | "leaving"> | null => {
  if (rawMask === NO_MARKS_AT_ALL) {
    return null;
  }

  const order = rawOrder.split(BETWEEN_IDS).map(fromBase62);

  return { order, leaving: leavingIn(order, fromBase62(rawMask)) };
};

const readMarksInOrder = (
  rawOrder: string,
  rawMarks: string
): Pick<LeavingPayload, "order" | "leaving"> | null => {
  const order = fromBase62Row(rawOrder);

  if (order === null) {
    return null;
  }

  const leaving = seatsOf(order, rawMarks);

  return leaving === null ? null : { order, leaving };
};

export const decodeLeavingCallback = (data: string): LeavingPayload | null => {
  const match = LEAVING_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  const [, rawShape = "", rawOrder = "", rawMarks = "", rawCode = "", rawArg = ""] = match;

  const kind = KINDS_BY_CODE.get(rawCode);
  if (kind === undefined) {
    return null;
  }

  const action = actionOf(kind, rawArg);
  const seated =
    rawShape === WHEN_MARKS_WERE_A_MASK
      ? readWhenMarksWereAMask(rawOrder, rawMarks)
      : readMarksInOrder(rawOrder, rawMarks);

  return action === null || seated === null ? null : { ...seated, action };
};
