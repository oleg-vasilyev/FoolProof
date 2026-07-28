import { Bot, type Api } from "grammy";
import type { Logger } from "../../shared/logger.ts";
import type { Repository } from "../../shared/repository/types.ts";
import { decodeCallback } from "../../integrations/telegram/callback.ts";
import { normalizeName, parseLineup, rotateToLowestId } from "../game/lineup.ts";
import type { Seat } from "../game/state.ts";
import { strings } from "../render/strings.ts";
import { createCardService, type CardService } from "./cards.ts";


export interface BotDeps {
  readonly repo: Repository;
  readonly log: Logger;
}

export interface BotBundle {
  readonly bot: Bot;
  readonly cards: CardService;
}

type ReplyFn = (text: string, replyTo: number) => Promise<void>;

const COMMAND_MENU = [
  { command: "game", description: strings.commandGame },
  { command: "next", description: strings.commandNext },
  { command: "help", description: strings.commandHelp },
];

export async function publishCommandMenu(api: Api): Promise<void> {
  await api.setMyCommands(COMMAND_MENU);
}

const resolveSeats = (
  repo: Repository,
  chatId: number,
  names: readonly string[]
): readonly Seat[] => {
  const known = new Map(
    repo.playersInChat(chatId).map((player) => [normalizeName(player.display_name), player])
  );

  return names.map((name) => {
    const key = normalizeName(name);
    const found = known.get(key);

    if (found !== undefined) {
      return { playerId: found.id, displayName: found.display_name };
    }

    const created = repo.createPlayer(chatId, name);
    known.set(key, created);

    return { playerId: created.id, displayName: created.display_name };
  });
};

const lineupProblemText = (result: Exclude<ReturnType<typeof parseLineup>, { ok: true }>): string => {
  if (result.problem === "empty") {
    return strings.lineupMissing;
  }

  if (result.problem === "too_few") {
    return strings.lineupTooFew;
  }

  return strings.lineupDuplicates(result.names);
};

export function createBot(token: string, deps: BotDeps): BotBundle {
  const { repo, log } = deps;
  const bot = new Bot(token);
  const cards = createCardService({ repo, api: bot.api, log });
  const openPrompts = new Map<number, number>();

  const removeMessage = async (chatId: number, messageId: number): Promise<void> => {
    try {
      await bot.api.deleteMessage(chatId, messageId);
    } catch (error) {
      log.debug(`could not delete message ${messageId}: ${String(error)}`);
    }
  };

  const dropPrompt = async (chatId: number): Promise<void> => {
    const messageId = openPrompts.get(chatId);
    if (messageId === undefined) {
      return;
    }

    openPrompts.delete(chatId);
    await removeMessage(chatId, messageId);
  };

  const refuseWhenLive = async (chatId: number, reply: ReplyFn): Promise<boolean> => {
    const live = repo.liveCardInChat(chatId);
    if (live === null) {
      return false;
    }

    await reply(strings.gameAlreadyRunning, live.game.message_id);

    return true;
  };

  const openFromNames = async (
    chatId: number,
    rawText: string,
    say: (text: string) => Promise<unknown>
  ): Promise<void> => {
    const parsed = parseLineup(rawText);
    if (!parsed.ok) {
      await say(lineupProblemText(parsed));

      return;
    }

    await cards.open(chatId, rotateToLowestId(resolveSeats(repo, chatId, parsed.names)));
  };

  bot.command("game", async (ctx) => {
    const chatId = ctx.chat.id;
    const reply: ReplyFn = (text, replyTo) =>
      ctx.reply(text, { reply_parameters: { message_id: replyTo } }).then(() => undefined);

    await dropPrompt(chatId);

    if (await refuseWhenLive(chatId, reply)) {
      return;
    }

    const commandMessageId = ctx.msg?.message_id;
    const rawText = ctx.msg?.text ?? "";
    const parsed = parseLineup(rawText);

    if (!parsed.ok && parsed.problem === "empty") {
      const prompt = await ctx.reply(strings.lineupPrompt, {
        reply_parameters:
          commandMessageId === undefined ? undefined : { message_id: commandMessageId },
        reply_markup: {
          force_reply: true,
          selective: true,
          input_field_placeholder: strings.lineupPlaceholder,
        },
      });

      openPrompts.set(chatId, prompt.message_id);

      return;
    }

    await openFromNames(chatId, rawText, (text) => ctx.reply(text));
  });

  bot.command("next", async (ctx) => {
    const chatId = ctx.chat.id;
    const reply: ReplyFn = (text, replyTo) =>
      ctx.reply(text, { reply_parameters: { message_id: replyTo } }).then(() => undefined);

    await dropPrompt(chatId);

    if (await refuseWhenLive(chatId, reply)) {
      return;
    }

    const lineup = repo.lastLineup(chatId);
    if (lineup === null || lineup.length === 0) {
      await ctx.reply(strings.noLineupToRepeat);

      return;
    }

    await cards.open(
      chatId,
      lineup.map((seat) => ({ playerId: seat.player_id, displayName: seat.display_name }))
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(strings.helpBody);
  });

  bot.on("message:text", async (ctx) => {
    const prompt = ctx.message.reply_to_message;
    if (prompt?.from?.id !== ctx.me.id || prompt.text !== strings.lineupPrompt) {
      return;
    }

    const chatId = ctx.chat.id;
    const reply: ReplyFn = (text, replyTo) =>
      ctx.reply(text, { reply_parameters: { message_id: replyTo } }).then(() => undefined);

    openPrompts.delete(chatId);
    await removeMessage(chatId, prompt.message_id);

    if (await refuseWhenLive(chatId, reply)) {
      return;
    }

    await openFromNames(chatId, ctx.message.text, (text) => ctx.reply(text));
  });

  bot.on("callback_query:data", async (ctx) => {
    const payload = decodeCallback(ctx.callbackQuery.data);
    if (payload === null) {
      await ctx.answerCallbackQuery(strings.cardStale);

      return;
    }

    await ctx.answerCallbackQuery(await cards.tap(payload, ctx.from.id));
  });

  bot.catch((error) => {
    log.error(`update ${error.ctx.update.update_id} failed: ${String(error.error)}`);
  });

  return { bot, cards };
}
