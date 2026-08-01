import type { LastGame } from "#shared/repository/repository-contract.ts";
import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import { parseNames, rotateToLowestId, type NamesResult } from "#live-game/domain/lineup-parsing.ts";
import { starterAfterLoss } from "#live-game/domain/starter-rule.ts";
import { alreadySeated, tableWithout, type TableChange } from "#live-game/domain/table-change.ts";
import { copy } from "#live-game/copy.en.ts";
import { PICKED_BY_HAND } from "#live-game/bot/card-service.ts";
import {
  askForNames,
  commandText,
  refusedBecauseLive,
  type CardContext,
} from "#live-game/bot/card-context.ts";
import { resolveSeats, toSeats } from "#live-game/bot/seat-lookup.ts";
import { askSeating } from "#live-game/bot/seating-screen.ts";


type NamesProblem = Exclude<NamesResult, { ok: true }>;

interface Question {
  readonly asked: string;
  readonly placeholder: string;
  readonly missing: string;
}

const NO_SEATS = 0;

const NOBODY = 0;

const JOINERS: Question = {
  asked: copy.joinersPrompt,
  placeholder: copy.joinersPlaceholder,
  missing: copy.joinersMissing,
};

const LEAVERS: Question = {
  asked: copy.leaversPrompt,
  placeholder: copy.leaversPlaceholder,
  missing: copy.leaversMissing,
};

const tableProblemText = (change: Exclude<TableChange, { ok: true }>): string => {
  switch (change.problem) {
    case "unknown_names":
      return copy.notAtTable(change.names);

    case "too_few":
      return copy.lineupTooFew;
  }
};

const lastGameOr = async (
  context: CardContext,
  ctx: Command | TextMessage
): Promise<LastGame | null> => {
  const last = context.repo.lastGame(ctx.chat.id);
  if (last === null || last.seats.length === NO_SEATS) {
    await ctx.reply(copy.noLineupToRepeat);

    return null;
  }

  return last;
};

const beginNext = async (context: CardContext, ctx: Command): Promise<LastGame | null> => {
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(context, ctx)) {
    return null;
  }

  return lastGameOr(context, ctx);
};

const askedOrRefused = async (
  context: CardContext,
  ctx: Command,
  problem: NamesProblem,
  question: Question
): Promise<void> => {
  switch (problem.problem) {
    case "empty":
      await askForNames(context, ctx, question.asked, question.placeholder);

      return;

    case "duplicates":
      await ctx.reply(copy.lineupDuplicates(problem.names));
  }
};

const seatJoiners = async (
  context: CardContext,
  ctx: Command | TextMessage,
  last: LastGame,
  names: readonly string[]
): Promise<void> => {
  const seated = toSeats(last.seats);
  const repeats = alreadySeated(seated, names);

  if (repeats.length > NOBODY) {
    await ctx.reply(copy.alreadyAtTable(repeats));

    return;
  }

  const joining = resolveSeats(context.repo, ctx.chat.id, names);

  await askSeating(ctx, [...seated, ...joining]);
};

const seatWithout = async (
  context: CardContext,
  ctx: Command | TextMessage,
  last: LastGame,
  names: readonly string[]
): Promise<void> => {
  const change = tableWithout(toSeats(last.seats), names);

  if (!change.ok) {
    await ctx.reply(tableProblemText(change));

    return;
  }

  await context.cards.open(ctx.chat.id, rotateToLowestId(change.seats), PICKED_BY_HAND);
};

const namesProblemText = (problem: NamesProblem, missing: string): string => {
  switch (problem.problem) {
    case "empty":
      return missing;

    case "duplicates":
      return copy.lineupDuplicates(problem.names);
  }
};

interface Answer {
  readonly last: LastGame;
  readonly names: readonly string[];
}

const answeredNames = async (
  context: CardContext,
  ctx: TextMessage,
  question: Question
): Promise<Answer | null> => {
  const last = await lastGameOr(context, ctx);
  if (last === null) {
    return null;
  }

  const parsed = parseNames(ctx.message.text);
  if (!parsed.ok) {
    await ctx.reply(namesProblemText(parsed, question.missing));

    return null;
  }

  return { last, names: parsed.names };
};

export const onNext = async (context: CardContext, ctx: Command): Promise<void> => {
  const last = await beginNext(context, ctx);
  if (last === null) {
    return;
  }

  const seats = toSeats(last.seats);

  await context.cards.open(ctx.chat.id, seats, starterAfterLoss(seats, last.loserIds));
};

export const onNextWith = async (context: CardContext, ctx: Command): Promise<void> => {
  const last = await beginNext(context, ctx);
  if (last === null) {
    return;
  }

  const parsed = parseNames(commandText(ctx));
  if (!parsed.ok) {
    await askedOrRefused(context, ctx, parsed, JOINERS);

    return;
  }

  await seatJoiners(context, ctx, last, parsed.names);
};

export const onNextWithout = async (context: CardContext, ctx: Command): Promise<void> => {
  const last = await beginNext(context, ctx);
  if (last === null) {
    return;
  }

  const parsed = parseNames(commandText(ctx));
  if (!parsed.ok) {
    await askedOrRefused(context, ctx, parsed, LEAVERS);

    return;
  }

  await seatWithout(context, ctx, last, parsed.names);
};

export const joinFromNames = async (context: CardContext, ctx: TextMessage): Promise<void> => {
  const answer = await answeredNames(context, ctx, JOINERS);
  if (answer === null) {
    return;
  }

  await seatJoiners(context, ctx, answer.last, answer.names);
};

export const leaveFromNames = async (context: CardContext, ctx: TextMessage): Promise<void> => {
  const answer = await answeredNames(context, ctx, LEAVERS);
  if (answer === null) {
    return;
  }

  await seatWithout(context, ctx, answer.last, answer.names);
};
