import { Phase } from "#live-game/domain/card-states.ts";
import { ActionKind } from "#live-game/domain/card-states.ts";
import {
  cancelAvailable,
  drawAvailable,
  finalPlacements,
  isReady,
  nameAt,
  phaseOf,
  remainingSlots,
  type CardState,
} from "#live-game/domain/card-state.ts";
import { encodeCallback } from "#live-game/render/callback-data-codec.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#live-game/copy.ts";


const captionFor = (
  copy: Copy,
  state: CardState,
  slot: number,
  positions: ReadonlyMap<number, number>,
  sharedFinish: boolean
): string => {
  const name = nameAt(state, slot);
  const position = positions.get(slot) ?? 0;

  if (state.exits.includes(slot)) {
    return `${copy.markExit} ${position} ${name}`;
  }

  if (!isReady(state)) {
    return name;
  }

  return `${sharedFinish ? copy.markDraw : copy.markFool} ${name}`;
};

const controlRow = (
  copy: Copy,
  state: CardState,
  gameId: number,
  version: number
): readonly InlineButton[] => {
  const phase = phaseOf(state);

  const cancel: InlineButton = {
    text: copy.buttonCancel,
    callback_data: encodeCallback({ gameId, action: ActionKind.Cancel, slot: null, version }),
  };

  const back: InlineButton = {
    text: copy.buttonBack,
    callback_data: encodeCallback({ gameId, action: ActionKind.Back, slot: null, version }),
  };

  switch (phase) {
    case Phase.PickStarter:
      return [cancel];

    case Phase.Ready:
      return [
        back,
        { text: copy.buttonConfirm, callback_data: encodeCallback({ gameId, action: ActionKind.Confirm, slot: null, version }) },
      ];

    case Phase.Recording:
      return [
        back,
        ...(drawAvailable(state)
          ? [{ text: copy.buttonDraw, callback_data: encodeCallback({ gameId, action: ActionKind.Draw, slot: null, version }) }]
          : []),
        ...(cancelAvailable(state) ? [cancel] : []),
      ];
  }
};

export const renderKeyboard = (
  copy: Copy,
  state: CardState,
  gameId: number,
  version: number
): InlineKeyboardRows => {
  const positions = new Map(finalPlacements(state).map(({ slot, position }) => [slot, position]));
  const sharedFinish = isReady(state) && remainingSlots(state).length > 1;

  const playerRows = state.seats.map((_, slot) => [
    {
      text: captionFor(copy, state, slot, positions, sharedFinish),
      callback_data: encodeCallback({ gameId, action: ActionKind.Pick, slot, version }),
    },
  ]);

  return [...playerRows, controlRow(copy, state, gameId, version)];
};
