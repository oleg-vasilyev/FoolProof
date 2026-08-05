import type { CallbackTap } from "#shared/telegram/telegram-contexts.ts";
import { decodeCallback } from "#live-game/render/callback-data-codec.ts";
import { DEFAULT_LOCALE } from "#shared/locale/locales.ts";
import { copyIn } from "#live-game/copy.ts";
import { copyFor, type CardContext } from "#live-game/bot/card-context.ts";


export const onTap = async (context: CardContext, ctx: CallbackTap): Promise<void> => {
  const chatId = ctx.chat?.id;
  const copy = chatId === undefined ? copyIn(DEFAULT_LOCALE) : copyFor(context, chatId);
  const payload = decodeCallback(ctx.callbackQuery.data);

  if (payload === null) {
    await ctx.answerCallbackQuery(copy.cardStale);

    return;
  }

  await ctx.answerCallbackQuery(await context.cards.tap(copy, payload, ctx.from.id));
};
