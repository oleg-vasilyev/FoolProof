import {
  isReady,
  nameAt,
  recordedPlacements,
  remainingSlots,
  type CardState,
} from "../game/state.ts";
import { strings } from "./strings.ts";


const finishLines = (state: CardState): readonly string[] => {
  const rest = remainingSlots(state);
  const lastPosition = state.exits.length + 1;
  const mark = rest.length > 1 ? strings.markDraw : strings.markFool;

  return rest.map((slot) => `${lastPosition}. ${nameAt(state, slot)} ${mark}`);
};

export const renderCard = (state: CardState, gameNumber: number): string => {
  const header = strings.header(gameNumber, state.seats.length);

  if (state.starterSlot === null) {
    return [header, strings.askStarter].join("\n");
  }

  const exitLines = recordedPlacements(state).map(
    ({ slot, position }) => `${position}. ${nameAt(state, slot)}`
  );

  const tail = isReady(state)
    ? finishLines(state)
    : [strings.stillIn(remainingSlots(state).map((slot) => nameAt(state, slot)))];

  return [
    header,
    strings.dealtFirst(nameAt(state, state.starterSlot)),
    "",
    ...exitLines,
    ...tail,
  ].join("\n");
};
