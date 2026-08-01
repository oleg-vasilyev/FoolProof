import type { CallbackTap, Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import type { Seat } from "#live-game/domain/card-state.ts";
import { rotateToLowestId } from "#live-game/domain/lineup-parsing.ts";
import { applySeating, type SeatingPlan } from "#live-game/domain/seating-plan.ts";
import { decodeSeatingCallback } from "#live-game/render/seating-callback-codec.ts";
import { renderSeatingKeyboard } from "#live-game/render/seating-keyboard.ts";
import {
  renderSeated,
  renderSeatingCancelled,
  renderSeatingScreen,
} from "#live-game/render/seating-message.ts";
import { toMarkup } from "#live-game/bot/inline-markup.ts";
import { PICKED_BY_HAND } from "#live-game/bot/card-service.ts";
import type { CardContext } from "#live-game/bot/card-context.ts";
import { copy } from "#live-game/copy.en.ts";


const NOTHING_PLACED = 0;

const AS_HTML = { parse_mode: "HTML" } as const;

const screenOptions = (plan: SeatingPlan) => ({
  ...AS_HTML,
  reply_markup: toMarkup(renderSeatingKeyboard(plan)),
});

const planOf = (
  context: CardContext,
  chatId: number,
  order: readonly number[],
  placed: number
): SeatingPlan | null => {
  const named = new Map(
    context.repo.playersInChat(chatId).map((player) => [player.id, player.display_name])
  );

  const roster = order.flatMap((playerId) => {
    const displayName = named.get(playerId);

    return displayName === undefined ? [] : [{ playerId, displayName }];
  });

  return roster.length === order.length ? { roster, placed } : null;
};

const redraw = async (ctx: CallbackTap, plan: SeatingPlan, notice: string): Promise<void> => {
  await ctx.editMessageText(renderSeatingScreen(), screenOptions(plan));
  await ctx.answerCallbackQuery(notice);
};

const openSeatedCard = async (
  context: CardContext,
  ctx: CallbackTap,
  chatId: number,
  seats: readonly Seat[]
): Promise<void> => {
  if (context.repo.liveCardInChat(chatId) !== null) {
    await ctx.answerCallbackQuery({ text: copy.gameAlreadyRunning, show_alert: true });

    return;
  }

  await ctx.editMessageText(renderSeated(seats), AS_HTML);
  await ctx.answerCallbackQuery(copy.seatedNotice);
  await context.cards.open(chatId, rotateToLowestId(seats), PICKED_BY_HAND);
};

const cancelSeating = async (ctx: CallbackTap): Promise<void> => {
  await ctx.editMessageText(renderSeatingCancelled(), AS_HTML);
  await ctx.answerCallbackQuery(copy.cancelledNotice);
};

export const askSeating = async (
  ctx: Command | TextMessage,
  seats: readonly Seat[]
): Promise<void> => {
  const plan: SeatingPlan = { roster: seats, placed: NOTHING_PLACED };

  await ctx.reply(renderSeatingScreen(), screenOptions(plan));
};

export const onSeatingTap = async (context: CardContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeSeatingCallback(ctx.callbackQuery.data);
  const chatId = ctx.chat?.id;

  if (payload === null || chatId === undefined) {
    await ctx.answerCallbackQuery(copy.seatingStale);

    return;
  }

  const plan = planOf(context, chatId, payload.order, payload.placed);
  if (plan === null) {
    await ctx.answerCallbackQuery(copy.seatingStale);

    return;
  }

  const transition = applySeating(plan, payload.action);

  switch (transition.outcome) {
    case "updated":
      await redraw(ctx, transition.plan, copy.tapSeated(transition.seated.displayName, transition.plan.placed));

      return;

    case "stepped_back":
      await redraw(ctx, transition.plan, copy.tapBack);

      return;

    case "seated":
      await openSeatedCard(context, ctx, chatId, transition.seats);

      return;

    case "cancelled":
      await cancelSeating(ctx);

      return;

    case "rejected":
      await ctx.answerCallbackQuery(copy.tapNotAllowed);
  }
};
