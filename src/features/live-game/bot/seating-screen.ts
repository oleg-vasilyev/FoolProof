import { Outcome } from "#live-game/domain/card-states.ts";
import type { CallbackTap, Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import type { Seat } from "#live-game/domain/card-state.ts";
import { rotateToLowestId } from "#live-game/domain/lineup-parsing.ts";
import { applySeating, type SeatingPlan } from "#live-game/domain/seating-plan.ts";
import { decodeSeatingCallback } from "#live-game/render/seating-screen/seating-callback-codec.ts";
import { renderSeatingKeyboard } from "#live-game/render/seating-screen/seating-keyboard.ts";
import {
  renderSeated,
  renderSeatingCancelled,
  renderSeatingScreen,
} from "#live-game/render/seating-screen/seating-message.ts";
import { toMarkup } from "#live-game/bot/inline-markup.ts";
import { PICKED_BY_HAND } from "#live-game/bot/card/card-service.ts";
import { DEFAULT_LOCALE } from "#shared/locale/locales.ts";
import { copyIn, type Copy } from "#live-game/copy.ts";
import { copyFor, type CardContext } from "#live-game/bot/card-context.ts";


const NOTHING_PLACED = 0;

const AS_HTML = { parse_mode: "HTML" } as const;

const screenOptions = (copy: Copy, plan: SeatingPlan) => ({
  ...AS_HTML,
  reply_markup: toMarkup(renderSeatingKeyboard(copy, plan)),
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

const redraw = async (
  copy: Copy,
  ctx: CallbackTap,
  plan: SeatingPlan,
  notice: string
): Promise<void> => {
  await ctx.editMessageText(renderSeatingScreen(copy), screenOptions(copy, plan));
  await ctx.answerCallbackQuery(notice);
};

const openSeatedCard = async (
  copy: Copy,
  context: CardContext,
  ctx: CallbackTap,
  chatId: number,
  seats: readonly Seat[]
): Promise<void> => {
  if (context.repo.liveCardInChat(chatId) !== null) {
    await ctx.answerCallbackQuery({ text: copy.gameAlreadyRunning, show_alert: true });

    return;
  }

  await ctx.editMessageText(renderSeated(copy, seats), AS_HTML);
  await ctx.answerCallbackQuery(copy.seatedNotice);
  await context.cards.open(copy, chatId, rotateToLowestId(seats), PICKED_BY_HAND);
};

const cancelSeating = async (
  copy: Copy,
  context: CardContext,
  ctx: CallbackTap,
  chatId: number
): Promise<void> => {
  context.repo.forgetUnplayedPlayers(chatId);
  await ctx.editMessageText(renderSeatingCancelled(copy), AS_HTML);
  await ctx.answerCallbackQuery(copy.cancelledNotice);
};

export const askSeating = async (
  copy: Copy,
  ctx: Command | TextMessage,
  seats: readonly Seat[]
): Promise<void> => {
  const plan: SeatingPlan = { roster: seats, placed: NOTHING_PLACED };

  await ctx.reply(renderSeatingScreen(copy), screenOptions(copy, plan));
};

export const onSeatingTap = async (context: CardContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeSeatingCallback(ctx.callbackQuery.data);
  const chatId = ctx.chat?.id;
  const copy = chatId === undefined ? copyIn(DEFAULT_LOCALE) : copyFor(context, chatId);

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
    case Outcome.Updated:
      await redraw(
        copy,
        ctx,
        transition.plan,
        copy.tapSeated(transition.seated.displayName, transition.seat)
      );

      return;

    case Outcome.SteppedBack:
      await redraw(copy, ctx, transition.plan, copy.tapBack);

      return;

    case Outcome.Seated:
      await openSeatedCard(copy, context, ctx, chatId, transition.seats);

      return;

    case Outcome.Cancelled:
      await cancelSeating(copy, context, ctx, chatId);

      return;

    case Outcome.Rejected:
      await ctx.answerCallbackQuery(copy.tapNotAllowed);
  }
};
