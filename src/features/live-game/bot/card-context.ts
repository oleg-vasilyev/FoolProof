import type { CardRepository } from "#shared/repository/repository-contract.ts";
import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { copyIn, type Copy } from "#live-game/copy.ts";
import type { CardService } from "#live-game/bot/card/card-service.ts";
import type { PromptRegistry } from "#live-game/bot/prompt-registry.ts";


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
  const commandMessageId = ctx.msg?.message_id;

  const prompt = await ctx.reply(question, {
    reply_parameters:
      commandMessageId === undefined ? undefined : { message_id: commandMessageId },
    reply_markup: {
      force_reply: true,
      selective: true,
      input_field_placeholder: placeholder,
    },
  });

  context.prompts.remember(ctx.chat.id, prompt.message_id);
};
