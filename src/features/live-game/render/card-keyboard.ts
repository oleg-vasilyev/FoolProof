import { ActionKind, Phase } from "#live-game/domain/card-states.ts";
import {
  drawAvailable,
  finalPlacements,
  isReady,
  nameAt,
  phaseOf,
  remainingSlots,
  type CardState,
} from "#live-game/domain/card-state.ts";
import { encodeCallback } from "#live-game/render/callback-data-codec.ts";
import { controlRow } from "#shared/telegram/control-row.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#live-game/copy.ts";


interface CardTap {
  readonly gameId: number;
  readonly version: number;
}

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

const buttonFor = (tap: CardTap, text: string, action: ActionKind): InlineButton => ({
  text,
  callback_data: encodeCallback({ gameId: tap.gameId, action, slot: null, version: tap.version }),
});

const controlsFor = (copy: Copy, state: CardState, tap: CardTap): readonly InlineButton[] => {
  const phase = phaseOf(state);

  return controlRow({
    cancel: buttonFor(tap, copy.buttonCancel, ActionKind.Cancel),
    back: buttonFor(tap, copy.buttonBack, ActionKind.Back),
    wayOn:
      phase === Phase.Ready
        ? buttonFor(tap, copy.buttonConfirm, ActionKind.Confirm)
        : drawAvailable(state)
          ? buttonFor(tap, copy.buttonDraw, ActionKind.Draw)
          : null,
    anythingToUndo: phase !== Phase.PickStarter,
  });
};

export const renderKeyboard = (
  copy: Copy,
  state: CardState,
  gameId: number,
  version: number
): InlineKeyboardRows => {
  const tap = { gameId, version };
  const positions = new Map(finalPlacements(state).map(({ slot, position }) => [slot, position]));
  const sharedFinish = isReady(state) && remainingSlots(state).length > 1;

  const playerRows = state.seats.map((_, slot) => [
    {
      text: captionFor(copy, state, slot, positions, sharedFinish),
      callback_data: encodeCallback({ gameId, action: ActionKind.Pick, slot, version }),
    },
  ]);

  return [...playerRows, controlsFor(copy, state, tap)];
};
