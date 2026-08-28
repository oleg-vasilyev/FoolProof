import { ActionKind } from "#live-game/domain/card-states.ts";
import {
  everyoneSeated,
  seatNumberOf,
  type SeatingAction,
  type SeatingPlan,
} from "#live-game/domain/seating-plan.ts";
import { encodeSeatingCallback } from "#live-game/render/seating-screen/seating-callback-codec.ts";
import { controlRow } from "#shared/telegram/control-row.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#live-game/copy.ts";


const NONE_SEATED = 0;

const captionFor = (copy: Copy, plan: SeatingPlan, slot: number, name: string): string => {
  const seat = seatNumberOf(plan, slot);

  return seat === null ? name : `${copy.markSeat} ${seat} ${name}`;
};

const buttonFor = (
  plan: SeatingPlan,
  order: readonly number[],
  text: string,
  action: SeatingAction
): InlineButton => ({
  text,
  callback_data: encodeSeatingCallback({ order, seated: plan.seated, action }),
});

const controlsFor = (
  copy: Copy,
  plan: SeatingPlan,
  order: readonly number[]
): readonly InlineButton[] =>
  controlRow({
    cancel: buttonFor(plan, order, copy.buttonCancel, { kind: ActionKind.Cancel }),
    back: buttonFor(plan, order, copy.buttonBack, { kind: ActionKind.Back }),
    wayOn: everyoneSeated(plan)
      ? buttonFor(plan, order, copy.buttonPlay, { kind: ActionKind.Confirm })
      : null,
    anythingToUndo: plan.seated.length > NONE_SEATED,
  });

export const renderSeatingKeyboard = (copy: Copy, plan: SeatingPlan): InlineKeyboardRows => {
  const order = plan.roster.map((seat) => seat.playerId);

  const seatRows = plan.roster.map((seat, slot) => [
    {
      text: captionFor(copy, plan, slot, seat.displayName),
      callback_data: encodeSeatingCallback({
        order,
        seated: plan.seated,
        action: { kind: ActionKind.Pick, playerId: seat.playerId },
      }),
    },
  ]);

  return [...seatRows, controlsFor(copy, plan, order)];
};
