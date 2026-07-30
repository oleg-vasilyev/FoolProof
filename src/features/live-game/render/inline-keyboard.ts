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
import { copy } from "#live-game/copy.en.ts";


export interface InlineButton {
  readonly text: string;
  readonly callback_data: string;
}

export type InlineKeyboardRows = readonly (readonly InlineButton[])[];

const captionFor = (
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

const controlRow = (state: CardState, gameId: number, version: number): readonly InlineButton[] => {
  const phase = phaseOf(state);

  if (phase === "PICK_STARTER") {
    return [
      { text: copy.buttonCancel, callback_data: encodeCallback({ gameId, action: "cancel", slot: null, version }) },
    ];
  }

  const back: InlineButton = {
    text: copy.buttonBack,
    callback_data: encodeCallback({ gameId, action: "back", slot: null, version }),
  };

  if (phase === "READY") {
    return [
      back,
      { text: copy.buttonConfirm, callback_data: encodeCallback({ gameId, action: "confirm", slot: null, version }) },
    ];
  }

  if (drawAvailable(state)) {
    return [
      back,
      { text: copy.buttonDraw, callback_data: encodeCallback({ gameId, action: "draw", slot: null, version }) },
    ];
  }

  return [back];
};

export const renderKeyboard = (
  state: CardState,
  gameId: number,
  version: number
): InlineKeyboardRows => {
  const positions = new Map(finalPlacements(state).map(({ slot, position }) => [slot, position]));
  const sharedFinish = isReady(state) && remainingSlots(state).length > 1;

  const playerRows = state.seats.map((_, slot) => [
    {
      text: captionFor(state, slot, positions, sharedFinish),
      callback_data: encodeCallback({ gameId, action: "pick", slot, version }),
    },
  ]);

  return [...playerRows, controlRow(state, gameId, version)];
};
