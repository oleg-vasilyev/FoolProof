import type { MessageEntity, Update, UserFromGetMe } from "grammy/types";


export const BOT_ID = 424242;

export const BOT_USERNAME = "foolproof_bot";

export const CHAT_ID = -100777;

export const USER_ID = 777;

export const COMMAND_MESSAGE_ID = 10;

export const PROMPT_MESSAGE_ID = 11;

export const botInfoStub: UserFromGetMe = {
  id: BOT_ID,
  is_bot: true,
  first_name: "FoolProof",
  username: BOT_USERNAME,
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  can_manage_bots: false,
  supports_join_request_queries: false,
};

const sender = {
  id: USER_ID,
  is_bot: false,
  first_name: "Oleg",
};

const groupChat = { id: CHAT_ID, type: "group" as const, title: "Friday" };

const privateChat = { id: USER_ID, type: "private" as const, first_name: "Oleg" };

const commandEntities = (text: string): readonly MessageEntity[] | undefined => {
  const firstWord = text.split(" ")[0] ?? "";

  return text.startsWith("/")
    ? [{ type: "bot_command", offset: 0, length: firstWord.length }]
    : undefined;
};

let nextUpdateId = 1;

const messageIn = (
  chat: object,
  text: string,
  replyTo?: { messageId: number; text: string; fromBot: boolean }
): Update =>
  ({
    update_id: nextUpdateId++,
    message: {
      message_id: COMMAND_MESSAGE_ID,
      date: 0,
      chat,
      from: sender,
      text,
      entities: commandEntities(text),
      reply_to_message:
        replyTo === undefined
          ? undefined
          : {
              message_id: replyTo.messageId,
              date: 0,
              chat,
              from: replyTo.fromBot
                ? { id: BOT_ID, is_bot: true, first_name: "FoolProof" }
                : sender,
              text: replyTo.text,
            },
    },
  }) as unknown as Update;

export const groupMessageUpdate = (
  text: string,
  replyTo?: { messageId: number; text: string; fromBot: boolean }
): Update => messageIn(groupChat, text, replyTo);

export const privateMessageUpdate = (text: string): Update => messageIn(privateChat, text);

export const callbackUpdate = (data: string): Update =>
  ({
    update_id: nextUpdateId++,
    callback_query: {
      id: "callback-1",
      from: sender,
      chat_instance: "instance-1",
      data,
      message: {
        message_id: PROMPT_MESSAGE_ID,
        date: 0,
        chat: groupChat,
        from: { id: BOT_ID, is_bot: true, first_name: "FoolProof" },
        text: "card",
      },
    },
  }) as unknown as Update;
