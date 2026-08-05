import { ActionKind } from "#live-game/domain/card-states.ts";


const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const BASE = 62;

export const CARD_TAPS = /^([0-9A-Za-z]+):([a-z]):(-|[0-9]+):([0-9]+)$/;

const NO_SLOT = "-";

export type CallbackAction = ActionKind;

const ACTION_CODES: Record<CallbackAction, string> = {
  pick: "p",
  draw: "d",
  back: "b",
  confirm: "k",
  cancel: "x",
};

const ACTIONS_BY_CODE = new Map<string, CallbackAction>(
  Object.entries(ACTION_CODES).map(([action, code]) => [code, action as CallbackAction])
);

export interface CallbackPayload {
  readonly gameId: number;
  readonly action: CallbackAction;
  readonly slot: number | null;
  readonly version: number;
}

export const toBase62 = (value: number): string =>
  value < BASE
    ? (ALPHABET[value] ?? "0")
    : toBase62(Math.floor(value / BASE)) + (ALPHABET[value % BASE] ?? "0");

export const fromBase62 = (encoded: string): number =>
  [...encoded].reduce((total, char) => total * BASE + ALPHABET.indexOf(char), 0);

export const encodeCallback = (payload: CallbackPayload): string =>
  [
    toBase62(payload.gameId),
    ACTION_CODES[payload.action],
    payload.slot === null ? NO_SLOT : String(payload.slot),
    String(payload.version),
  ].join(":");

export const decodeCallback = (data: string): CallbackPayload | null => {
  const match = CARD_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  const [, rawGameId = "", rawAction = "", rawSlot = "", rawVersion = ""] = match;

  const action = ACTIONS_BY_CODE.get(rawAction);
  if (action === undefined) {
    return null;
  }

  return {
    gameId: fromBase62(rawGameId),
    action,
    slot: rawSlot === NO_SLOT ? null : Number(rawSlot),
    version: Number(rawVersion),
  };
};
