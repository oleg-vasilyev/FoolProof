import { Problem } from "#live-game/domain/refusals.ts";
import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import { parseLineup, rotateToLowestId } from "#live-game/domain/lineup-parsing.ts";
import { LONGEST_NAME, MOST_PLAYERS } from "#live-game/domain/card-state.ts";
import { namePreviews } from "#live-game/render/name-preview.ts";
import type { Copy } from "#live-game/copy.ts";
import { PICKED_BY_HAND } from "#live-game/bot/card/card-service.ts";
import {
  askForNames,
  commandText,
  copyFor,
  refusedBecauseLive,
  type CardContext,
} from "#live-game/bot/card-context.ts";
import { resolveSeats } from "#live-game/bot/lineup/seat-lookup.ts";


type LineupProblem = Exclude<ReturnType<typeof parseLineup>, { ok: true }>;

const lineupProblemText = (copy: Copy, result: LineupProblem): string => {
  switch (result.problem) {
    case Problem.Empty:
      return copy.lineupMissing;

    case Problem.TooFew:
      return copy.lineupTooFew;

    case Problem.TooMany:
      return copy.lineupTooMany(MOST_PLAYERS);

    case Problem.TooLong:
      return copy.nameTooLong(LONGEST_NAME, namePreviews(result.names));

    case Problem.Duplicates:
      return copy.lineupDuplicates(result.names);
  }
};

export const openFromNames = async (
  context: CardContext,
  ctx: Command | TextMessage,
  rawText: string
): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);
  const parsed = parseLineup(rawText);

  if (!parsed.ok) {
    await ctx.reply(lineupProblemText(copy, parsed));

    return;
  }

  const chatId = ctx.chat.id;
  await context.cards.open(
    copy,
    chatId,
    rotateToLowestId(resolveSeats(context.repo, chatId, parsed.names)),
    PICKED_BY_HAND
  );
};

export const onGame = async (context: CardContext, ctx: Command): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(copy, context, ctx)) {
    return;
  }

  const rawText = commandText(ctx);
  const parsed = parseLineup(rawText);

  if (!parsed.ok && parsed.problem === Problem.Empty) {
    await askForNames(context, ctx, copy.lineupPrompt, copy.lineupPlaceholder);

    return;
  }

  await openFromNames(context, ctx, rawText);
};
