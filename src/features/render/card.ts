import { escapeHtml, quoteBlock } from "../../integrations/telegram/html.ts";
import {
  finalPlacements,
  isReady,
  nameAt,
  recordedPlacements,
  remainingSlots,
  type CardState,
} from "../game/state.ts";
import { strings } from "./strings.ts";


const nameOf = (state: CardState, slot: number): string => escapeHtml(nameAt(state, slot));

const badgeFor = (position: number): string => strings.medals[position - 1] ?? `${position}.`;

const runningLines = (state: CardState): readonly string[] => {
  const exits = recordedPlacements(state).map(
    ({ slot, position }) => `${position}. ${nameOf(state, slot)}`
  );

  const rest = strings.stillIn(remainingSlots(state).map((slot) => nameOf(state, slot)));

  return exits.length === 0 ? [rest] : [...exits, "", rest];
};

const finishedLines = (state: CardState): readonly string[] => {
  const lastPosition = state.exits.length + 1;
  const shared = remainingSlots(state).length > 1;

  return finalPlacements(state).map(({ slot, position }) => {
    const badge =
      position === lastPosition ? (shared ? strings.markDraw : strings.markFool) : badgeFor(position);

    return `${badge} ${nameOf(state, slot)}`;
  });
};

export const renderCard = (state: CardState, gameNumber: number): string => {
  const header = strings.header(gameNumber, state.seats.length);

  if (state.starterSlot === null) {
    return [header, strings.askStarter].join("\n");
  }

  return [
    header,
    strings.dealtFirst(nameOf(state, state.starterSlot)),
    "",
    quoteBlock(isReady(state) ? finishedLines(state) : runningLines(state)),
  ].join("\n");
};
