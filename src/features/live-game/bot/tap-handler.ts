import type { CallbackTap } from "#shared/telegram/telegram-contexts.ts";
import { decodeCallback } from "#live-game/render/callback-data-codec.ts";
import { copy } from "#live-game/copy.en.ts";
import type { CardContext } from "#live-game/bot/card-context.ts";


export const onTap = async (context: CardContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeCallback(ctx.callbackQuery.data);
  if (payload === null) {
    await ctx.answerCallbackQuery(copy.cardStale);

    return;
  }

  await ctx.answerCallbackQuery(await context.cards.tap(payload, ctx.from.id));
};
