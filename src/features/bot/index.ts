import { Bot, type Api, type CommandContext, type Context, type Filter } from "grammy";
import type { UserFromGetMe } from "grammy/types";
import type { Logger } from "../../shared/logger.ts";
import type { Repository } from "../../shared/repository/types.ts";
import { decodeCallback } from "../../integrations/telegram/callback.ts";
import { normalizeName, parseLineup, rotateToLowestId } from "../game/lineup.ts";
import type { Seat } from "../game/state.ts";
import { renderStats } from "../render/stats.ts";
import { strings } from "../render/strings.ts";
import { createCardService, type CardService } from "./cards.ts";


type Command = CommandContext<Context>;

type TextMessage = Filter<Context, "message:text">;

type CallbackTap = Filter<Context, "callback_query:data">;

type LineupProblem = Exclude<ReturnType<typeof parseLineup>, { ok: true }>;

export interface BotDeps {
  readonly repo: Repository;
  readonly log: Logger;
  readonly botInfo?: UserFromGetMe;
}

export interface BotBundle {
  readonly bot: Bot;
  readonly cards: CardService;
}

interface PromptRegistry {
  remember(chatId: number, messageId: number): void;
  forget(chatId: number): void;
  dropUnanswered(chatId: number): Promise<void>;
}

interface BotContext {
  readonly repo: Repository;
  readonly cards: CardService;
  readonly prompts: PromptRegistry;
}

const COMMAND_MENU = [
  { command: "game", description: strings.commandGame },
  { command: "next", description: strings.commandNext },
  { command: "stats", description: strings.commandStats },
  { command: "help", description: strings.commandHelp },
];

export async function publishCommandMenu(api: Api): Promise<void> {
  await api.setMyCommands(COMMAND_MENU);
}

const createPromptRegistry = (api: Api, log: Logger): PromptRegistry => {
  const open = new Map<number, number>();

  return {
    remember: (chatId, messageId) => void open.set(chatId, messageId),
    forget: (chatId) => void open.delete(chatId),
    async dropUnanswered(chatId) {
      const messageId = open.get(chatId);
      if (messageId === undefined) {
        return;
      }

      open.delete(chatId);

      try {
        await api.deleteMessage(chatId, messageId);
      } catch (error) {
        log.debug(`could not delete message ${messageId}: ${String(error)}`);
      }
    },
  };
};

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

const lineupProblemText = (result: LineupProblem): string => {
  switch (result.problem) {
    case "empty":
      return strings.lineupMissing;

    case "too_few":
      return strings.lineupTooFew;

    case "duplicates":
      return strings.lineupDuplicates(result.names);
  }
};

const refusedBecauseLive = async (context: BotContext, ctx: Command | TextMessage): Promise<boolean> => {
  const live = context.repo.liveCardInChat(ctx.chat.id);
  if (live === null) {
    return false;
  }

  await ctx.reply(strings.gameAlreadyRunning, {
    reply_parameters: { message_id: live.game.message_id },
  });

  return true;
};

const openFromNames = async (
  context: BotContext,
  ctx: Command | TextMessage,
  rawText: string
): Promise<void> => {
  const parsed = parseLineup(rawText);
  if (!parsed.ok) {
    await ctx.reply(lineupProblemText(parsed));

    return;
  }

  const chatId = ctx.chat.id;
  await context.cards.open(chatId, rotateToLowestId(resolveSeats(context.repo, chatId, parsed.names)));
};

const askForNames = async (context: BotContext, ctx: Command): Promise<void> => {
  const commandMessageId = ctx.msg?.message_id;

  const prompt = await ctx.reply(strings.lineupPrompt, {
    reply_parameters:
      commandMessageId === undefined ? undefined : { message_id: commandMessageId },
    reply_markup: {
      force_reply: true,
      selective: true,
      input_field_placeholder: strings.lineupPlaceholder,
    },
  });

  context.prompts.remember(ctx.chat.id, prompt.message_id);
};

const onGame = async (context: BotContext, ctx: Command): Promise<void> => {
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return;
  }

  const rawText = ctx.msg?.text ?? "";
  const parsed = parseLineup(rawText);

  if (!parsed.ok && parsed.problem === "empty") {
    await askForNames(context, ctx);

    return;
  }

  await openFromNames(context, ctx, rawText);
};

const onNext = async (context: BotContext, ctx: Command): Promise<void> => {
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return;
  }

  const lineup = context.repo.lastLineup(ctx.chat.id);
  if (lineup === null || lineup.length === 0) {
    await ctx.reply(strings.noLineupToRepeat);

    return;
  }

  await context.cards.open(
    ctx.chat.id,
    lineup.map((seat) => ({ playerId: seat.player_id, displayName: seat.display_name }))
  );
};

const onStats = async (context: BotContext, ctx: Command): Promise<void> => {
  await ctx.reply(renderStats(context.repo.seriesStats(ctx.chat.id)), { parse_mode: "HTML" });
};

const onHelp = async (ctx: Command): Promise<void> => {
  await ctx.reply(strings.helpBody);
};

const onNamesReply = async (context: BotContext, ctx: TextMessage): Promise<void> => {
  const prompt = ctx.message.reply_to_message;
  if (prompt?.from?.id !== ctx.me.id || prompt.text !== strings.lineupPrompt) {
    return;
  }

  context.prompts.forget(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return;
  }

  await openFromNames(context, ctx, ctx.message.text);
};

const onTap = async (context: BotContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeCallback(ctx.callbackQuery.data);
  if (payload === null) {
    await ctx.answerCallbackQuery(strings.cardStale);

    return;
  }

  await ctx.answerCallbackQuery(await context.cards.tap(payload, ctx.from.id));
};

export function createBot(token: string, deps: BotDeps): BotBundle {
  const { repo, log, botInfo } = deps;
  const bot = new Bot(token, botInfo === undefined ? {} : { botInfo });
  const cards = createCardService({ repo, api: bot.api, log });

  const context: BotContext = {
    repo,
    cards,
    prompts: createPromptRegistry(bot.api, log),
  };

  bot.command("game", (ctx) => onGame(context, ctx));
  bot.command("next", (ctx) => onNext(context, ctx));
  bot.command("stats", (ctx) => onStats(context, ctx));
  bot.command("help", (ctx) => onHelp(ctx));

  bot.on("message:text", (ctx) => onNamesReply(context, ctx));
  bot.on("callback_query:data", (ctx) => onTap(context, ctx));

  bot.catch((error) => {
    log.error(`update ${error.ctx.update.update_id} failed: ${String(error.error)}`);
  });

  return { bot, cards };
}
