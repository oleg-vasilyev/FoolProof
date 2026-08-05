import { Problem } from "#live-game/domain/refusals.ts";
import type { LastGame } from "#shared/repository/repository-contract.ts";
import type { Command, TextMessage } from "#shared/telegram/telegram-contexts.ts";
import { parseNames, rotateToLowestId, type NamesResult } from "#live-game/domain/lineup-parsing.ts";
import { starterAfterLoss } from "#live-game/domain/starter-rule.ts";
import {
  alreadySeated,
  tableWith,
  tableWithout,
  type TableChange,
} from "#live-game/domain/table-change.ts";
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
import { resolveSeats, toSeats } from "#live-game/bot/lineup/seat-lookup.ts";
import { askSeating } from "#live-game/bot/seating-screen.ts";


type NamesProblem = Exclude<NamesResult, { ok: true }>;

interface Question {
  readonly asked: string;
  readonly placeholder: string;
  readonly missing: string;
}

const NO_SEATS = 0;

const NOBODY = 0;

const joinersAsked = (copy: Copy): Question => ({
  asked: copy.joinersPrompt,
  placeholder: copy.joinersPlaceholder,
  missing: copy.joinersMissing,
});

const leaversAsked = (copy: Copy): Question => ({
  asked: copy.leaversPrompt,
  placeholder: copy.leaversPlaceholder,
  missing: copy.leaversMissing,
});

const namesProblemText = (copy: Copy, problem: NamesProblem, missing: string): string => {
  switch (problem.problem) {
    case Problem.Empty:
      return missing;

    case Problem.TooLong:
      return copy.nameTooLong(LONGEST_NAME, namePreviews(problem.names));

    case Problem.Duplicates:
      return copy.lineupDuplicates(problem.names);
  }
};

const tableProblemText = (copy: Copy, change: Exclude<TableChange, { ok: true }>): string => {
  switch (change.problem) {
    case Problem.UnknownNames:
      return copy.notAtTable(change.names);

    case Problem.TooFew:
      return copy.lineupTooFew;

    case Problem.TooMany:
      return copy.lineupTooMany(MOST_PLAYERS);
  }
};

const lastGameOr = async (
  copy: Copy,
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

const beginNext = async (
  copy: Copy,
  context: CardContext,
  ctx: Command
): Promise<LastGame | null> => {
  await context.prompts.dropUnanswered(ctx.chat.id);

  if (await refusedBecauseLive(copy, context, ctx)) {
    return null;
  }

  return lastGameOr(copy, context, ctx);
};

const askedOrRefused = async (
  copy: Copy,
  context: CardContext,
  ctx: Command,
  problem: NamesProblem,
  question: Question
): Promise<void> => {
  if (problem.problem === Problem.Empty) {
    await askForNames(context, ctx, question.asked, question.placeholder);

    return;
  }

  await ctx.reply(namesProblemText(copy, problem, question.missing));
};

const seatJoiners = async (
  copy: Copy,
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
  const change = tableWith(seated, joining);

  if (!change.ok) {
    await ctx.reply(tableProblemText(copy, change));

    return;
  }

  await askSeating(copy, ctx, change.seats);
};

const seatWithout = async (
  copy: Copy,
  context: CardContext,
  ctx: Command | TextMessage,
  last: LastGame,
  names: readonly string[]
): Promise<void> => {
  const change = tableWithout(toSeats(last.seats), names);

  if (!change.ok) {
    await ctx.reply(tableProblemText(copy, change));

    return;
  }

  await context.cards.open(copy, ctx.chat.id, rotateToLowestId(change.seats), PICKED_BY_HAND);
};

interface Answer {
  readonly last: LastGame;
  readonly names: readonly string[];
}

const answeredNames = async (
  copy: Copy,
  context: CardContext,
  ctx: TextMessage,
  question: Question
): Promise<Answer | null> => {
  const last = await lastGameOr(copy, context, ctx);
  if (last === null) {
    return null;
  }

  const parsed = parseNames(ctx.message.text);
  if (!parsed.ok) {
    await ctx.reply(namesProblemText(copy, parsed, question.missing));

    return null;
  }

  return { last, names: parsed.names };
};

export const onNext = async (context: CardContext, ctx: Command): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);
  const last = await beginNext(copy, context, ctx);

  if (last === null) {
    return;
  }

  const seats = toSeats(last.seats);

  await context.cards.open(copy, ctx.chat.id, seats, starterAfterLoss(seats, last.loserIds));
};

export const onNextWith = async (context: CardContext, ctx: Command): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);
  const last = await beginNext(copy, context, ctx);

  if (last === null) {
    return;
  }

  const parsed = parseNames(commandText(ctx));
  if (!parsed.ok) {
    await askedOrRefused(copy, context, ctx, parsed, joinersAsked(copy));

    return;
  }

  await seatJoiners(copy, context, ctx, last, parsed.names);
};

export const onNextWithout = async (context: CardContext, ctx: Command): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);
  const last = await beginNext(copy, context, ctx);

  if (last === null) {
    return;
  }

  const parsed = parseNames(commandText(ctx));
  if (!parsed.ok) {
    await askedOrRefused(copy, context, ctx, parsed, leaversAsked(copy));

    return;
  }

  await seatWithout(copy, context, ctx, last, parsed.names);
};

export const joinFromNames = async (context: CardContext, ctx: TextMessage): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);
  const answer = await answeredNames(copy, context, ctx, joinersAsked(copy));

  if (answer === null) {
    return;
  }

  await seatJoiners(copy, context, ctx, answer.last, answer.names);
};

export const leaveFromNames = async (context: CardContext, ctx: TextMessage): Promise<void> => {
  const copy = copyFor(context, ctx.chat.id);
  const answer = await answeredNames(copy, context, ctx, leaversAsked(copy));

  if (answer === null) {
    return;
  }

  await seatWithout(copy, context, ctx, answer.last, answer.names);
};
