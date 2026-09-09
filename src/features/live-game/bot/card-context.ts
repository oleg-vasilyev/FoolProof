import type { CardRepository } from "#shared/repository/repository-contract.ts";
import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { askAsReply } from "#shared/telegram/force-reply-prompt.ts";
import { copyIn, type Copy } from "#live-game/copy.ts";
import type { CardService } from "#live-game/bot/card/card-service.ts";
import type { PromptRegistry } from "#shared/telegram/prompt-registry.ts";


export interface CardContext {
  readonly repo: CardRepository;
  readonly cards: CardService;
  readonly prompts: PromptRegistry;
  readonly localeIn: LocaleReader;
}

export const copyFor = (context: CardContext, chatId: number): Copy =>
  copyIn(context.localeIn(chatId));

export const commandText = (ctx: Command): string => ctx.msg?.text ?? "";

export const refusedBecauseLive = async (
  copy: Copy,
  context: CardContext,
  ctx: Command | TextMessage
): Promise<boolean> => {
  const live = context.repo.liveCardInChat(ctx.chat.id);
  if (live === null) {
    return false;
  }

  await ctx.reply(copy.gameAlreadyRunning, {
    reply_parameters: { message_id: live.game.message_id },
  });

  return true;
};

export const askForNames = async (
  context: CardContext,
  ctx: Command,
  question: string,
  placeholder: string
): Promise<void> => {
  const prompt = await askAsReply(ctx, question, placeholder);

  context.prompts.remember(ctx.chat.id, prompt.message_id);
};
