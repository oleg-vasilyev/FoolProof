const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const BASE = 62;

const BASE62_ONLY = /^[0-9A-Za-z]+$/;

const DIGITS_ONLY = /^[0-9]+$/;

const NO_SLOT = "-";

const CALLBACK_FIELDS = 4;

export type CallbackAction = "pick" | "draw" | "back" | "confirm" | "cancel";

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
  const parts = data.split(":");
  if (parts.length !== CALLBACK_FIELDS) {
    return null;
  }

  const [rawGameId, rawAction, rawSlot, rawVersion] = parts;
  if (
    rawGameId === undefined ||
    rawAction === undefined ||
    rawSlot === undefined ||
    rawVersion === undefined
  ) {
    return null;
  }

  const action = ACTIONS_BY_CODE.get(rawAction);
  if (action === undefined || !BASE62_ONLY.test(rawGameId) || !DIGITS_ONLY.test(rawVersion)) {
    return null;
  }

  if (rawSlot !== NO_SLOT && !DIGITS_ONLY.test(rawSlot)) {
    return null;
  }

  return {
    gameId: fromBase62(rawGameId),
    action,
    slot: rawSlot === NO_SLOT ? null : Number(rawSlot),
    version: Number(rawVersion),
  };
};
