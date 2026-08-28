import { ActionKind } from "#live-game/domain/card-states.ts";
import {
  enoughToPlay,
  type LeavingAction,
  type LeavingPlan,
} from "#live-game/domain/leaving-plan.ts";
import { encodeLeavingCallback } from "#live-game/render/leaving-screen/leaving-callback-codec.ts";
import { controlRow } from "#shared/telegram/control-row.ts";
import type { InlineButton, InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { Copy } from "#live-game/copy.ts";


const NOTHING_MARKED = 0;

const captionFor = (copy: Copy, plan: LeavingPlan, playerId: number, name: string): string =>
  plan.leaving.includes(playerId) ? `${copy.markLeaving} ${name}` : name;

const buttonFor = (
  plan: LeavingPlan,
  order: readonly number[],
  text: string,
  action: LeavingAction
): InlineButton => ({
  text,
  callback_data: encodeLeavingCallback({ order, leaving: plan.leaving, action }),
});

const controlsFor = (
  copy: Copy,
  plan: LeavingPlan,
  order: readonly number[]
): readonly InlineButton[] =>
  controlRow({
    cancel: buttonFor(plan, order, copy.buttonCancel, { kind: ActionKind.Cancel }),
    back: buttonFor(plan, order, copy.buttonBack, { kind: ActionKind.Back }),
    wayOn: enoughToPlay(plan)
      ? buttonFor(plan, order, copy.buttonPlay, { kind: ActionKind.Confirm })
      : null,
    anythingToUndo: plan.leaving.length > NOTHING_MARKED,
  });

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

  return [...seatRows, controlsFor(copy, plan, order)];
};
