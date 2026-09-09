import type { Command } from "#shared/telegram/telegram-contexts.ts";
import { copyFor, refusedBecauseLive, type CardContext } from "#live-game/bot/card-context.ts";


export const onReopen = async (context: CardContext, ctx: Command): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);

  if (await refusedBecauseLive(copy, context, ctx)) {
    return;
  }

  const actorTgId = ctx.from?.id;

  if (actorTgId === undefined) {
    return;
  }

  const reopened = await context.cards.reopenLatest(copy, ctx.chat.id, actorTgId);

  if (!reopened) {
    await ctx.reply(copy.nothingToReopen);
  }
};
