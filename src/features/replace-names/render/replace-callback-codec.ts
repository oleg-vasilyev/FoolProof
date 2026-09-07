import { ActionKind } from "#replace-names/domain/replace-states.ts";
import type { Payload } from "#replace-names/domain/replace-plan.ts";


export const REPLACE_TAPS = /^r:([0-9]+):([0-9]+):([0-9]+):([kx])$/;

const SCREEN = "r";

const BETWEEN_PARTS = ":";

const ACTION_CODES = {
  confirm: "k",
  cancel: "x",
} as const;

export interface DecodedTap {
  readonly payload: Payload;
  readonly action: ActionKind;
}

export const encodeReplaceCallback = (payload: Payload, action: ActionKind): string =>
  [
    SCREEN,
    String(payload.firstGameId),
    String(payload.fromId),
    String(payload.toId),
    ACTION_CODES[action],
  ].join(BETWEEN_PARTS);

export const decodeReplaceCallback = (data: string): DecodedTap | null => {
  const match = REPLACE_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  const [, rawFirstGameId, rawFromId, rawToId, rawCode] = match;

  return {
    payload: {
      firstGameId: Number(rawFirstGameId),
      fromId: Number(rawFromId),
      toId: Number(rawToId),
    },
    action: rawCode === ACTION_CODES.confirm ? ActionKind.Confirm : ActionKind.Cancel,
  };
};
