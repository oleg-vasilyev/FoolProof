import {
  buttonWithCaption,
  captionsOf,
  emptyLog,
  liveCard,
  messagesIn,
  messageWithId,
  visibleMessages,
  withDeletion,
  withEdit,
  withEditAttempt,
  withMessage,
  type ButtonRows,
  type ChatMessage,
} from "./chat-log.ts";
import { createUpdateQueue, type UpdateQueue } from "./update-queue.ts";
import type { UploadedFile } from "./multipart-body.ts";


const BOT_ID = 424242;

const BOT_USERNAME = "foolproof_e2e_bot";

const CHAT_ID = -1002000000001;

const FIRST_PHOTO_ID = 1;

const MS_PER_SECOND = 1000;

const LONGEST_POLL_MS = 2000;

const NOTHING = 0;

export interface Person {
  readonly id: number;
  readonly first_name: string;
}

export const OPERATOR: Person = { id: 777, first_name: "Oleg" };

export interface PublishedCommand {
  readonly command: string;
  readonly description: string;
}

export interface Prompt {
  readonly messageId: number;
  readonly placeholder: string;
}

export interface Snapshot {
  readonly messages: readonly ChatMessage[];
  readonly answers: readonly string[];
  readonly commands: readonly PublishedCommand[];
  readonly prompt: Prompt | null;
  readonly scenarios: readonly string[];
  readonly scenario: number;
}

export type ApiResult =
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error_code: number; readonly description: string };

export interface FakeTelegram {
  call(
    method: string,
    payload: Record<string, unknown>,
    file: UploadedFile | null
  ): Promise<ApiResult>;
  photoBytes(photo: number): Buffer | undefined;
  say(text: string, options?: { readonly replyTo?: number; readonly from?: Person }): void;
  tap(messageId: number, data: string, from?: Person): void;
  snapshot(): Snapshot;
  beginScenario(name: string): void;
  thisScenario(): readonly ChatMessage[];
  card(): ChatMessage | undefined;
  captions(): readonly string[];
  dataFor(caption: string): string | undefined;
  pendingUpdates(): number;
  msSinceLastEffect(): number;
  polling(): boolean;
  forgetPolling(): void;
  botId(): number;
  chatId(): number;
}

const botInfo = {
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

const chat = { id: CHAT_ID, type: "group", title: "Friday" };

const asObject = (value: unknown): Record<string, unknown> =>
  typeof value === "string" ? (JSON.parse(value) as Record<string, unknown>) : (value ?? {}) as Record<string, unknown>;

const buttonRowsOf = (replyMarkup: unknown): ButtonRows => {
  const markup = asObject(replyMarkup);
  const rows = markup.inline_keyboard;

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row: unknown) =>
    (row as readonly Record<string, string>[]).map((button) => ({
      text: button.text ?? "",
      data: button.callback_data ?? "",
    }))
  );
};

const placeholderOf = (replyMarkup: unknown): string | null => {
  const markup = asObject(replyMarkup);

  return markup.force_reply === true ? String(markup.input_field_placeholder ?? "") : null;
};

const commandEntities = (text: string): readonly unknown[] | undefined =>
  text.startsWith("/")
    ? [{ type: "bot_command", offset: 0, length: (text.split(" ")[0] ?? "").length }]
    : undefined;

const nowSeconds = (): number => Math.floor(Date.now() / MS_PER_SECOND);

const BAD_REQUEST = 400;

const good = (result: unknown): ApiResult => ({ ok: true, result });

const refused = (description: string): ApiResult => ({
  ok: false,
  error_code: BAD_REQUEST,
  description: `Bad Request: ${description}`,
});

const sameKeyboard = (before: ButtonRows, after: ButtonRows): boolean =>
  JSON.stringify(before) === JSON.stringify(after);

// Two limits the real Bot API enforces and this fake used not to, so a bot that
// grew past either of them kept passing here and would have failed in a real chat.
// Text is counted in characters, callback data in bytes, which is how Telegram
// counts them.
const LONGEST_TEXT = 4096;

const LONGEST_CALLBACK_DATA = 64;

const overBudget = (buttons: ButtonRows): boolean =>
  buttons.some((row) =>
    row.some((button) => Buffer.byteLength(button.data) > LONGEST_CALLBACK_DATA)
  );

const tooBig = (text: string, buttons: ButtonRows): ApiResult | null => {
  if ([...text].length > LONGEST_TEXT) {
    return refused("message is too long");
  }

  return overBudget(buttons) ? refused("BUTTON_DATA_INVALID") : null;
};

export const createFakeTelegram = (): FakeTelegram => {
  const updates: UpdateQueue = createUpdateQueue();
  const photos = new Map<number, Buffer>();

  let log = emptyLog;
  let answers: readonly string[] = [];
  let commands: readonly PublishedCommand[] = [];
  let prompt: Prompt | null = null;
  let nextPhotoId = FIRST_PHOTO_ID;
  let scenario = NOTHING;
  let scenarios: readonly string[] = [];
  let lastEffectAt = Date.now();
  let everPolled = false;

  const post = (
    text: string,
    buttons: ButtonRows,
    photo: number | null
  ): { readonly message_id: number; readonly date: number; readonly chat: unknown; readonly text: string } => {
    log = withMessage(log, { scenario, author: botInfo.first_name, fromBot: true, text, buttons, photo });
    const posted = log[log.length - 1];

    return { message_id: posted?.messageId ?? NOTHING, date: nowSeconds(), chat, text };
  };

  const messageFrom = (
    person: Person,
    text: string,
    replyTo: number | undefined
  ): Record<string, unknown> => {
    log = withMessage(log, { scenario, author: person.first_name, fromBot: false, text });
    const sent = log[log.length - 1];
    const answered = replyTo === undefined ? undefined : messageWithId(log, replyTo);

    return {
      message_id: sent?.messageId ?? NOTHING,
      date: nowSeconds(),
      chat,
      from: { ...person, is_bot: false },
      text,
      entities: commandEntities(text),
      reply_to_message:
        answered === undefined
          ? undefined
          : {
              message_id: answered.messageId,
              date: nowSeconds(),
              chat,
              from: answered.fromBot ? { ...botInfo } : { id: person.id, is_bot: false },
              text: answered.text,
            },
    };
  };

  const effect = (): void => {
    lastEffectAt = Date.now();
  };

  const call = async (
    method: string,
    payload: Record<string, unknown>,
    file: UploadedFile | null
  ): Promise<ApiResult> => {
    switch (method) {
      case "getMe":
        return good(botInfo);

      case "deleteWebhook":
        return good(true);

      case "setMyCommands":
        commands = payload.commands as readonly PublishedCommand[];

        return good(true);

      case "getUpdates": {
        everPolled = true;

        return good(await updates.take(LONGEST_POLL_MS));
      }

      case "sendMessage": {
        effect();

        const wanted = String(payload.text);
        const keyboard = buttonRowsOf(payload.reply_markup);
        const refusal = tooBig(wanted, keyboard);

        if (refusal !== null) {
          return refusal;
        }

        const sent = post(wanted, keyboard, null);
        const placeholder = placeholderOf(payload.reply_markup);

        if (placeholder !== null) {
          prompt = { messageId: sent.message_id, placeholder };
        }

        return good(sent);
      }

      case "sendPhoto": {
        effect();

        const photo = nextPhotoId++;
        photos.set(photo, file?.bytes ?? Buffer.alloc(NOTHING));

        return good(post(String(payload.caption ?? ""), [], photo));
      }

      case "editMessageText": {
        effect();

        const messageId = Number(payload.message_id);
        const target = messageWithId(log, messageId);
        const text = String(payload.text);
        const buttons = buttonRowsOf(payload.reply_markup);

        if (target === undefined || target.deleted) {
          return refused("message to edit not found");
        }

        const refusal = tooBig(text, buttons);

        if (refusal !== null) {
          return refusal;
        }

        log = withEditAttempt(log, messageId);

        if (target.text === text && sameKeyboard(target.buttons, buttons)) {
          return refused("message is not modified");
        }

        log = withEdit(log, messageId, text, buttons);

        return good(true);
      }

      case "deleteMessage": {
        effect();

        const messageId = Number(payload.message_id);

        if (messageWithId(log, messageId) === undefined) {
          return refused("message to delete not found");
        }

        log = withDeletion(log, messageId);
        prompt = null;

        return good(true);
      }

      case "answerCallbackQuery": {
        answers = [...answers, String(payload.text ?? "")];

        return good(true);
      }

      default:
        return good(true);
    }
  };

  return {
    call,

    photoBytes: (photo) => photos.get(photo),

    say: (text, options) => {
      prompt = null;
      updates.push({ message: messageFrom(options?.from ?? OPERATOR, text, options?.replyTo) });
    },

    tap: (messageId, data, from) => {
      const tapped = messageWithId(log, messageId);

      updates.push({
        callback_query: {
          id: `tap-${String(Date.now())}`,
          from: { ...(from ?? OPERATOR), is_bot: false },
          chat_instance: "e2e",
          data,
          message: {
            message_id: messageId,
            date: nowSeconds(),
            chat,
            from: { ...botInfo },
            text: tapped?.text ?? "",
          },
        },
      });
    },

    snapshot: () => ({
      messages: visibleMessages(log),
      answers,
      commands,
      prompt,
      scenarios,
      scenario,
    }),

    beginScenario: (name) => {
      scenario += 1;
      scenarios = [...scenarios, name];
      answers = [];
      prompt = null;
      everPolled = false;
    },

    thisScenario: () => messagesIn(log, scenario),

    card: () => liveCard(log, scenario),

    captions: () => captionsOf(liveCard(log, scenario)),

    dataFor: (caption) => buttonWithCaption(liveCard(log, scenario), caption)?.data,

    pendingUpdates: () => updates.pending(),

    msSinceLastEffect: () => Date.now() - lastEffectAt,

    polling: () => everPolled,

    forgetPolling: () => {
      everPolled = false;
    },

    botId: () => botInfo.id,

    chatId: () => chat.id,
  };
};
