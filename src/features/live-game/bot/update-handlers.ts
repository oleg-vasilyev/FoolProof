import type { CardRepository, LastGame, SeatRecord } from "#shared/repository/repository-contract.ts";
import type { CallbackTap, Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import {
  normalizeName,
  parseLineup,
  parseNames,
  rotateToLowestId,
  type NamesResult,
} from "#live-game/domain/lineup-parsing.ts";
import type { Seat } from "#live-game/domain/card-state.ts";
import { starterAfterLoss } from "#live-game/domain/starter-rule.ts";
import { alreadySeated, tableWithout, type TableChange } from "#live-game/domain/table-change.ts";
import { decodeCallback } from "#live-game/render/callback-data-codec.ts";
import { copy } from "#live-game/copy.en.ts";
import type { CardService } from "#live-game/bot/card-service.ts";
import type { PromptRegistry } from "#live-game/bot/prompt-registry.ts";


type LineupProblem = Exclude<ReturnType<typeof parseLineup>, { ok: true }>;

type NamesProblem = Exclude<NamesResult, { ok: true }>;

type NextStart = { readonly ok: true; readonly last: LastGame } | { readonly ok: false };

const NO_SEATS = 0;

const NOBODY = 0;

const PICKED_BY_HAND = null;

export interface CardContext {
  readonly repo: CardRepository;
  readonly cards: CardService;
  readonly prompts: PromptRegistry;
}

const toSeats = (records: readonly SeatRecord[]): readonly Seat[] =>
  records.map((record) => ({ playerId: record.player_id, displayName: record.display_name }));

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

const tableProblemText = (change: Exclude<TableChange, { ok: true }>): string => {
  switch (change.problem) {
    case "unknown_names":
      return copy.notAtTable(change.names);

    case "too_few":
      return copy.lineupTooFew;
  }
};

const namesProblemText = (result: NamesProblem, missing: string): string => {
  switch (result.problem) {
    case "empty":
      return missing;

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
    rotateToLowestId(resolveSeats(context.repo, chatId, parsed.names)),
    PICKED_BY_HAND
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

const beginNext = async (context: CardContext, ctx: Command): Promise<NextStart> => {
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return { ok: false };
  }

  const last = context.repo.lastGame(ctx.chat.id);
  if (last === null || last.seats.length === NO_SEATS) {
    await ctx.reply(copy.noLineupToRepeat);

    return { ok: false };
  }

  return { ok: true, last };
};

const namesGiven = async (ctx: Command, missing: string): Promise<readonly string[] | null> => {
  const parsed = parseNames(ctx.msg?.text ?? "");

  if (!parsed.ok) {
    await ctx.reply(namesProblemText(parsed, missing));

    return null;
  }

  return parsed.names;
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
  const start = await beginNext(context, ctx);
  if (!start.ok) {
    return;
  }

  const seats = toSeats(start.last.seats);

  await context.cards.open(ctx.chat.id, seats, starterAfterLoss(seats, start.last.loserIds));
};

export const onNextWith = async (context: CardContext, ctx: Command): Promise<void> => {
  const start = await beginNext(context, ctx);
  if (!start.ok) {
    return;
  }

  const names = await namesGiven(ctx, copy.joinersMissing);
  if (names === null) {
    return;
  }

  const seated = toSeats(start.last.seats);
  const repeats = alreadySeated(seated, names);

  if (repeats.length > NOBODY) {
    await ctx.reply(copy.alreadyAtTable(repeats));

    return;
  }

  const chatId = ctx.chat.id;
  const joining = resolveSeats(context.repo, chatId, names);

  await context.cards.open(chatId, rotateToLowestId([...seated, ...joining]), PICKED_BY_HAND);
};

export const onNextWithout = async (context: CardContext, ctx: Command): Promise<void> => {
  const start = await beginNext(context, ctx);
  if (!start.ok) {
    return;
  }

  const names = await namesGiven(ctx, copy.leaversMissing);
  if (names === null) {
    return;
  }

  const change = tableWithout(toSeats(start.last.seats), names);

  if (!change.ok) {
    await ctx.reply(tableProblemText(change));

    return;
  }

  await context.cards.open(ctx.chat.id, rotateToLowestId(change.seats), PICKED_BY_HAND);
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
