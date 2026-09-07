import { ActionKind } from "#replace-names/domain/replace-states.ts";
import type { Payload } from "#replace-names/domain/replace-plan.ts";
import { encodeReplaceCallback } from "#replace-names/render/replace-callback-codec.ts";
import { controlRow } from "#shared/telegram/control-row.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#replace-names/copy.ts";


const NOTHING_TO_UNDO = false;

const buttonFor = (text: string, payload: Payload, action: ActionKind): InlineButton => ({
  text,
  callback_data: encodeReplaceCallback(payload, action),
});

const controlsFor = (copy: Copy, payload: Payload): readonly InlineButton[] =>
  controlRow({
    cancel: buttonFor(copy.buttonCancel, payload, ActionKind.Cancel),
    back: buttonFor(copy.buttonCancel, payload, ActionKind.Cancel),
    wayOn: buttonFor(copy.buttonConfirm, payload, ActionKind.Confirm),
    anythingToUndo: NOTHING_TO_UNDO,
  });

export const renderReplaceKeyboard = (copy: Copy, payload: Payload): InlineKeyboardRows => [
  controlsFor(copy, payload),
];
