import { finalPlacements, nameAt, remainingSlots, type CardState } from "#live-game/domain/card-state.ts";
import { escapeHtml } from "#shared/text/html-escape.ts";
import type { Copy } from "#live-game/copy.ts";


const nameOf = (state: CardState, slot: number): string => escapeHtml(nameAt(state, slot));

const heading = (copy: Copy, state: CardState, gameNumber: number): readonly string[] => [
  copy.header(gameNumber),
  copy.wentFirst(nameOf(state, state.starterSlot ?? 0)),
];

const placeLines = (copy: Copy, state: CardState): readonly string[] => {
  const lastPosition = state.exits.length + 1;
  const shared = remainingSlots(state).length > 1;

  return finalPlacements(state).map(({ slot, position }) => {
    const name = nameOf(state, slot);

    if (position !== lastPosition) {
      return copy.resultPlace(position, name);
    }

    return shared ? copy.resultDraw(position, name) : copy.resultFool(position, name);
  });
};

export const renderCard = (copy: Copy, state: CardState, gameNumber: number): string => {
  if (state.starterSlot === null) {
    return [copy.header(gameNumber), copy.askStarter].join("\n");
  }

  return heading(copy, state, gameNumber).join("\n");
};

export const renderResult = (copy: Copy, state: CardState, gameNumber: number): string =>
  [...heading(copy, state, gameNumber), "", ...placeLines(copy, state)].join("\n");
