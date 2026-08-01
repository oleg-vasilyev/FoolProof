import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import { parseLineup, rotateToLowestId } from "#live-game/domain/lineup-parsing.ts";
import { copy } from "#live-game/copy.en.ts";
import { PICKED_BY_HAND } from "#live-game/bot/card-service.ts";
import {
  askForNames,
  commandText,
  refusedBecauseLive,
  type CardContext,
} from "#live-game/bot/card-context.ts";
import { resolveSeats } from "#live-game/bot/seat-lookup.ts";


type LineupProblem = Exclude<ReturnType<typeof parseLineup>, { ok: true }>;

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

export const openFromNames = async (
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
    rotateToLowestId(resolveSeats(context.repo, chatId, parsed.names)),
    PICKED_BY_HAND
  );
};

export const onGame = async (context: CardContext, ctx: Command): Promise<void> => {
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return;
  }

  const rawText = commandText(ctx);
  const parsed = parseLineup(rawText);

  if (!parsed.ok && parsed.problem === "empty") {
    await askForNames(context, ctx, copy.lineupPrompt, copy.lineupPlaceholder);

    return;
  }

  await openFromNames(context, ctx, rawText);
};
