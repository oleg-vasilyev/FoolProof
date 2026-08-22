import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import { Problem } from "#live-game/domain/refusals.ts";
import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";
import type { Seat } from "#live-game/domain/card-state.ts";
import { rotateToLowestId } from "#live-game/domain/lineup-parsing.ts";
import { applyLeaving, type LeavingPlan } from "#live-game/domain/leaving-plan.ts";
import { decodeLeavingCallback } from "#live-game/render/leaving-screen/leaving-callback-codec.ts";
import { renderLeavingKeyboard } from "#live-game/render/leaving-screen/leaving-keyboard.ts";
import {
  renderLeavingCancelled,
  renderLeavingScreen,
  renderLeft,
} from "#live-game/render/leaving-screen/leaving-message.ts";
import { toSeats } from "#live-game/bot/lineup/seat-lookup.ts";
import { toMarkup } from "#shared/telegram/inline-keyboard.ts";
import { PICKED_BY_HAND } from "#live-game/bot/card/card-service.ts";
import { DEFAULT_LOCALE } from "#shared/locale/locales.ts";
import { copyIn, type Copy } from "#live-game/copy.ts";
import { copyFor, type CardContext } from "#live-game/bot/card-context.ts";


const NOBODY_LEAVING: readonly number[] = [];

const AS_HTML = { parse_mode: "HTML" } as const;

const screenOptions = (copy: Copy, plan: LeavingPlan) => ({
  ...AS_HTML,
  reply_markup: toMarkup(renderLeavingKeyboard(copy, plan)),
});

const stillTheLastGame = (
  context: CardContext,
  chatId: number,
  order: readonly number[]
): readonly Seat[] | null => {
  const last = context.repo.lastGame(chatId);

  if (last === null) {
    return null;
  }

  const seats = toSeats(last.seats);
  const sameTable = seats.every((seat, at) => seat.playerId === order[at]);

  return seats.length === order.length && sameTable ? seats : null;
};

const refusalText = (copy: Copy, problem: Problem): string =>
  problem === Problem.TooFew ? copy.lineupTooFew : copy.leavingStale;

const closeScreen = async (copy: Copy, ctx: CallbackTap): Promise<void> => {
  await ctx.editMessageText(renderLeavingCancelled(copy), AS_HTML);
  await ctx.answerCallbackQuery(copy.cancelledNotice);
};

const redraw = async (
  copy: Copy,
  ctx: CallbackTap,
  plan: LeavingPlan,
  notice: string
): Promise<void> => {
  await ctx.editMessageText(renderLeavingScreen(copy), screenOptions(copy, plan));
  await ctx.answerCallbackQuery(notice);
};

const openTableWithout = async (
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

  await ctx.editMessageText(renderLeft(copy, seats), AS_HTML);
  await ctx.answerCallbackQuery(copy.leftNotice);
  await context.cards.open(copy, chatId, rotateToLowestId(seats), PICKED_BY_HAND);
};

export const askLeaving = async (
  copy: Copy,
  ctx: Command,
  seats: readonly Seat[]
): Promise<void> => {
  const plan: LeavingPlan = { roster: seats, leaving: NOBODY_LEAVING };

  await ctx.reply(renderLeavingScreen(copy), screenOptions(copy, plan));
};

export const onLeavingTap = async (context: CardContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeLeavingCallback(ctx.callbackQuery.data);
  const chatId = ctx.chat?.id;
  const copy = chatId === undefined ? copyIn(DEFAULT_LOCALE) : copyFor(context, chatId);

  if (payload === null || chatId === undefined) {
    await ctx.answerCallbackQuery(copy.leavingStale);

    return;
  }

  if (payload.action.kind === ActionKind.Cancel) {
    await closeScreen(copy, ctx);

    return;
  }

  const roster = stillTheLastGame(context, chatId, payload.order);
  if (roster === null) {
    await ctx.answerCallbackQuery(copy.leavingStale);

    return;
  }

  const transition = applyLeaving({ roster, leaving: payload.leaving }, payload.action);

  switch (transition.outcome) {
    case Outcome.Updated:
      await redraw(
        copy,
        ctx,
        transition.plan,
        transition.sittingOut
          ? copy.tapSittingOut(transition.toggled.displayName)
          : copy.tapPlayingAgain(transition.toggled.displayName)
      );

      return;

    case Outcome.Seated:
      await openTableWithout(copy, context, ctx, chatId, transition.seats);

      return;

    case Outcome.Cancelled:
      await closeScreen(copy, ctx);

      return;

    case Outcome.Rejected:
      await ctx.answerCallbackQuery(refusalText(copy, transition.problem));
  }
};
