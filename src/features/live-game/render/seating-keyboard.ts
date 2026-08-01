import { seatNumberOf, type SeatingPlan } from "#live-game/domain/seating-plan.ts";
import { encodeSeatingCallback } from "#live-game/render/seating-callback-codec.ts";
import type { InlineButton, InlineKeyboardRows } from "#live-game/render/inline-keyboard.ts";
import { copy } from "#live-game/copy.en.ts";


const NONE_PLACED = 0;

const captionFor = (plan: SeatingPlan, slot: number, name: string): string => {
  const seat = seatNumberOf(plan, slot);

  return seat === null ? name : `${copy.markSeat} ${seat} ${name}`;
};

const controlRow = (plan: SeatingPlan, order: readonly number[]): readonly InlineButton[] => {
  const cancel: InlineButton = {
    text: copy.buttonCancel,
    callback_data: encodeSeatingCallback({ order, placed: plan.placed, action: { kind: "cancel" } }),
  };

  if (plan.placed === NONE_PLACED) {
    return [cancel];
  }

  return [
    {
      text: copy.buttonBack,
      callback_data: encodeSeatingCallback({ order, placed: plan.placed, action: { kind: "back" } }),
    },
    cancel,
  ];
};

export const renderSeatingKeyboard = (plan: SeatingPlan): InlineKeyboardRows => {
  const order = plan.roster.map((seat) => seat.playerId);

  const seatRows = plan.roster.map((seat, slot) => [
    {
      text: captionFor(plan, slot, seat.displayName),
      callback_data: encodeSeatingCallback({
        order,
        placed: plan.placed,
        action: { kind: "pick", playerId: seat.playerId },
      }),
    },
  ]);

  return [...seatRows, controlRow(plan, order)];
};
