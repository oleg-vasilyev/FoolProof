import { escapeHtml } from "../../integrations/telegram/html.ts";
import { finalPlacements, nameAt, remainingSlots, type CardState } from "../game/state.ts";
import { strings } from "./strings.ts";


const nameOf = (state: CardState, slot: number): string => escapeHtml(nameAt(state, slot));

const heading = (state: CardState, gameNumber: number): readonly string[] => [
  strings.header(gameNumber),
  strings.dealtFirst(nameOf(state, state.starterSlot ?? 0)),
];

const placeLines = (state: CardState): readonly string[] => {
  const lastPosition = state.exits.length + 1;
  const shared = remainingSlots(state).length > 1;

  return finalPlacements(state).map(({ slot, position }) => {
    const name = nameOf(state, slot);

    if (position !== lastPosition) {
      return strings.resultPlace(position, name);
    }

    return shared ? strings.resultDraw(position, name) : strings.resultFool(position, name);
  });
};

export const renderCard = (state: CardState, gameNumber: number): string => {
  if (state.starterSlot === null) {
    return [strings.header(gameNumber), strings.askStarter].join("\n");
  }

  return heading(state, gameNumber).join("\n");
};

export const renderResult = (state: CardState, gameNumber: number): string =>
  [...heading(state, gameNumber), "", ...placeLines(state)].join("\n");
