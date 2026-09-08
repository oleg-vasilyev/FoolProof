import type { Message } from "grammy/types";
import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";


export const askAsReply = async (
  ctx: Command,
  question: string,
  placeholder: string
): Promise<Message.TextMessage> => {
  const commandMessageId = ctx.msg?.message_id;

  return ctx.reply(question, {
    reply_parameters:
      commandMessageId === undefined ? undefined : { message_id: commandMessageId },
    reply_markup: {
      force_reply: true,
      selective: true,
      input_field_placeholder: placeholder,
    },
  });
};

export const answeredPromptText = (ctx: TextMessage): string | null => {
  const prompt = ctx.message.reply_to_message;
  if (prompt?.from?.id !== ctx.me.id) {
    return null;
  }

  return prompt.text ?? null;
};
