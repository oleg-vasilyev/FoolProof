import { ActionKind } from "#live-game/domain/card-states.ts";
import type { LeavingPlan } from "#live-game/domain/leaving-plan.ts";
import { encodeLeavingCallback } from "#live-game/render/leaving-screen/leaving-callback-codec.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#live-game/copy.ts";


const captionFor = (copy: Copy, plan: LeavingPlan, playerId: number, name: string): string =>
  plan.leaving.includes(playerId) ? `${copy.markLeaving} ${name}` : name;

const NOTHING_MARKED = 0;

const backOrCancel = (
  copy: Copy,
  plan: LeavingPlan,
  order: readonly number[]
): InlineButton =>
  plan.leaving.length === NOTHING_MARKED
    ? {
        text: copy.buttonCancel,
        callback_data: encodeLeavingCallback({
          order,
          leaving: plan.leaving,
          action: { kind: ActionKind.Cancel },
        }),
      }
    : {
        text: copy.buttonBack,
        callback_data: encodeLeavingCallback({
          order,
          leaving: plan.leaving,
          action: { kind: ActionKind.Back },
        }),
      };

const controlRow = (
  copy: Copy,
  plan: LeavingPlan,
  order: readonly number[]
): readonly InlineButton[] => [
  backOrCancel(copy, plan, order),
  {
    text: copy.buttonPlay,
    callback_data: encodeLeavingCallback({
      order,
      leaving: plan.leaving,
      action: { kind: ActionKind.Confirm },
    }),
  },
];

export const renderLeavingKeyboard = (copy: Copy, plan: LeavingPlan): InlineKeyboardRows => {
  const order = plan.roster.map((seat) => seat.playerId);

  const seatRows = plan.roster.map((seat) => [
    {
      text: captionFor(copy, plan, seat.playerId, seat.displayName),
      callback_data: encodeLeavingCallback({
        order,
        leaving: plan.leaving,
        action: { kind: ActionKind.Pick, playerId: seat.playerId },
      }),
    },
  ]);

  return [...seatRows, controlRow(copy, plan, order)];
};
