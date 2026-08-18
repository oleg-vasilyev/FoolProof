import { ActionKind } from "#live-game/domain/card-states.ts";
import { seatNumberOf, type SeatingPlan } from "#live-game/domain/seating-plan.ts";
import { encodeSeatingCallback } from "#live-game/render/seating-screen/seating-callback-codec.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#live-game/copy.ts";


const NONE_PLACED = 0;

const captionFor = (copy: Copy, plan: SeatingPlan, slot: number, name: string): string => {
  const seat = seatNumberOf(plan, slot);

  return seat === null ? name : `${copy.markSeat} ${seat} ${name}`;
};

const controlRow = (
  copy: Copy,
  plan: SeatingPlan,
  order: readonly number[]
): readonly InlineButton[] => {
  const cancel: InlineButton = {
    text: copy.buttonCancel,
    callback_data: encodeSeatingCallback({ order, placed: plan.placed, action: { kind: ActionKind.Cancel } }),
  };

  if (plan.placed === NONE_PLACED) {
    return [cancel];
  }

  return [
    {
      text: copy.buttonBack,
      callback_data: encodeSeatingCallback({ order, placed: plan.placed, action: { kind: ActionKind.Back } }),
    },
    cancel,
  ];
};

export const renderSeatingKeyboard = (copy: Copy, plan: SeatingPlan): InlineKeyboardRows => {
  const order = plan.roster.map((seat) => seat.playerId);

  const seatRows = plan.roster.map((seat, slot) => [
    {
      text: captionFor(copy, plan, slot, seat.displayName),
      callback_data: encodeSeatingCallback({
        order,
        placed: plan.placed,
        action: { kind: ActionKind.Pick, playerId: seat.playerId },
      }),
    },
  ]);

  return [...seatRows, controlRow(copy, plan, order)];
};
