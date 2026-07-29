import type { CommandContext, Context, Filter } from "grammy";
import type { Repository } from "../../shared/repository/types.ts";
import { normalizeName, parseLineup, rotateToLowestId } from "../game/lineup.ts";
import type { Seat } from "../game/state.ts";
import { decodeCallback } from "../render/callback.ts";
import { renderStats } from "../render/stats.ts";
import { strings } from "../render/strings.ts";
import type { CardService } from "./cards.ts";
import type { PromptRegistry } from "./prompts.ts";


export type Command = CommandContext<Context>;

export type TextMessage = Filter<Context, "message:text">;

export type CallbackTap = Filter<Context, "callback_query:data">;

type LineupProblem = Exclude<ReturnType<typeof parseLineup>, { ok: true }>;

export interface BotContext {
  readonly repo: Repository;
  readonly cards: CardService;
  readonly prompts: PromptRegistry;
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

const refusedBecauseLive = async (
  context: BotContext,
  ctx: Command | TextMessage
): Promise<boolean> => {
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
  await context.cards.open(
    chatId,
    rotateToLowestId(resolveSeats(context.repo, chatId, parsed.names))
  );
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

export const onGame = async (context: BotContext, ctx: Command): Promise<void> => {
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

export const onNext = async (context: BotContext, ctx: Command): Promise<void> => {
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

export const onStats = async (context: BotContext, ctx: Command): Promise<void> => {
  await ctx.reply(renderStats(context.repo.seriesStats(ctx.chat.id)), { parse_mode: "HTML" });
};

export const onHelp = async (ctx: Command): Promise<void> => {
  await ctx.reply(strings.helpBody);
};

export const onNamesReply = async (context: BotContext, ctx: TextMessage): Promise<void> => {
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

export const onTap = async (context: BotContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeCallback(ctx.callbackQuery.data);
  if (payload === null) {
    await ctx.answerCallbackQuery(strings.cardStale);

    return;
  }

  await ctx.answerCallbackQuery(await context.cards.tap(payload, ctx.from.id));
};
