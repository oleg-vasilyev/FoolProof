import type { CardRepository } from "#shared/repository/repository-contract.ts";
import type { CallbackTap, Command, TextMessage } from "#shared/telegram-contexts.ts";
import { normalizeName, parseLineup, rotateToLowestId } from "#live-game/domain/lineup-parsing.ts";
import type { Seat } from "#live-game/domain/card-state.ts";
import { decodeCallback } from "#live-game/render/callback-data-codec.ts";
import { copy } from "#live-game/copy.en.ts";
import type { CardService } from "#live-game/bot/card-service.ts";
import type { PromptRegistry } from "#live-game/bot/prompt-registry.ts";


type LineupProblem = Exclude<ReturnType<typeof parseLineup>, { ok: true }>;

export interface CardContext {
  readonly repo: CardRepository;
  readonly cards: CardService;
  readonly prompts: PromptRegistry;
}

const resolveSeats = (
  repo: CardRepository,
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
      return copy.lineupMissing;

    case "too_few":
      return copy.lineupTooFew;

    case "duplicates":
      return copy.lineupDuplicates(result.names);
  }
};

const refusedBecauseLive = async (
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

const openFromNames = async (
  context: CardContext,
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

const askForNames = async (context: CardContext, ctx: Command): Promise<void> => {
  const commandMessageId = ctx.msg?.message_id;

  const prompt = await ctx.reply(copy.lineupPrompt, {
    reply_parameters:
      commandMessageId === undefined ? undefined : { message_id: commandMessageId },
    reply_markup: {
      force_reply: true,
      selective: true,
      input_field_placeholder: copy.lineupPlaceholder,
    },
  });

  context.prompts.remember(ctx.chat.id, prompt.message_id);
};

export const onGame = async (context: CardContext, ctx: Command): Promise<void> => {
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

export const onNext = async (context: CardContext, ctx: Command): Promise<void> => {
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return;
  }

  const lineup = context.repo.lastLineup(ctx.chat.id);
  if (lineup === null || lineup.length === 0) {
    await ctx.reply(copy.noLineupToRepeat);

    return;
  }

  await context.cards.open(
    ctx.chat.id,
    lineup.map((seat) => ({ playerId: seat.player_id, displayName: seat.display_name }))
  );
};

export const onNamesReply = async (context: CardContext, ctx: TextMessage): Promise<void> => {
  const prompt = ctx.message.reply_to_message;
  if (prompt?.from?.id !== ctx.me.id || prompt.text !== copy.lineupPrompt) {
    return;
  }

  context.prompts.forget(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return;
  }

  await openFromNames(context, ctx, ctx.message.text);
};

export const onTap = async (context: CardContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeCallback(ctx.callbackQuery.data);
  if (payload === null) {
    await ctx.answerCallbackQuery(copy.cardStale);

    return;
  }

  await ctx.answerCallbackQuery(await context.cards.tap(payload, ctx.from.id));
};
