import { ActionKind, Refusal } from "#replace-names/domain/replace-states.ts";
import type { ReplaceRepository } from "#shared/repository/repository-contract.ts";
import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { DEFAULT_LOCALE } from "#shared/locale/locales.ts";
import { parseNameList, type NamesResult } from "#shared/table/name-list.ts";
import { NameProblem } from "#shared/table/name-problems.ts";
import { LONGEST_NAME } from "#shared/table/table-limits.ts";
import { toMarkup } from "#shared/telegram/inline-keyboard.ts";
import {
  planReplacement,
  recheck,
  type Payload,
  type PlanResult,
  type Replacement,
} from "#replace-names/domain/replace-plan.ts";
import { decodeReplaceCallback } from "#replace-names/render/replace-callback-codec.ts";
import { renderReplaceKeyboard } from "#replace-names/render/replace-keyboard.ts";
import {
  renderCancelled,
  renderProposal,
  renderReplaced,
} from "#replace-names/render/replace-message.ts";
import { eveningDate } from "#replace-names/render/evening-date.ts";
import { copyIn, type Copy } from "#replace-names/copy.ts";


export interface ReplaceContext {
  readonly repo: ReplaceRepository;
  readonly localeIn: LocaleReader;
}

type NamesProblem = Exclude<NamesResult, { ok: true }>;

type PlanRefusal = Exclude<PlanResult, { ok: true }>;

const problemReply = (copy: Copy, parsed: NamesProblem): string => {
  switch (parsed.problem) {
    case NameProblem.Empty:
      return copy.askNames;

    case NameProblem.Duplicates:
      return copy.sameName;

    case NameProblem.TooLong:
      return copy.nameTooLong(LONGEST_NAME, parsed.names);
  }
};

const refusalReply = (copy: Copy, result: PlanRefusal): string => {
  switch (result.because) {
    case Refusal.NotTwoNames:
      return copy.askNames;

    case Refusal.NoEvening:
      return copy.noEvening;

    case Refusal.NotThisEvening:
      return copy.notThisEvening(result.written, eveningDate(copy, result.evening.startedOn));

    case Refusal.AlsoPlayed:
      return copy.alsoPlayed(
        result.written,
        result.played,
        eveningDate(copy, result.evening.startedOn)
      );
  }
};

const proposeOn = async (
  context: ReplaceContext,
  copy: Copy,
  ctx: Command,
  plan: Replacement
): Promise<void> => {
  const toId =
    plan.arriving.playerId ??
    context.repo.createPlayer(ctx.chat.id, plan.arriving.displayName).id;
  const payload: Payload = {
    firstGameId: plan.evening.firstGameId,
    fromId: plan.leaving.playerId,
    toId,
  };

  await ctx.reply(renderProposal(copy, plan), {
    parse_mode: "HTML",
    reply_markup: toMarkup(renderReplaceKeyboard(copy, payload)),
  });
};

export const onReplace = async (context: ReplaceContext, ctx: Command): Promise<void> => {
  const chatId = ctx.chat.id;
  const copy = copyIn(context.localeIn(chatId));

  if (context.repo.liveCardInChat(chatId) !== null) {
    await ctx.reply(copy.gameRunning);

    return;
  }

  const parsed = parseNameList(ctx.match);

  if (!parsed.ok) {
    await ctx.reply(problemReply(copy, parsed));

    return;
  }

  const result = planReplacement(
    context.repo.latestEvening(chatId),
    context.repo.playersInChat(chatId),
    parsed.names
  );

  if (!result.ok) {
    await ctx.reply(refusalReply(copy, result));

    return;
  }

  await proposeOn(context, copy, ctx, result.plan);
};

const cancel = async (
  context: ReplaceContext,
  copy: Copy,
  ctx: CallbackTap,
  chatId: number
): Promise<void> => {
  context.repo.forgetUnplayedPlayers(chatId);
  await ctx.editMessageText(renderCancelled(copy), { parse_mode: "HTML" });
  await ctx.answerCallbackQuery(copy.cancelledNotice);
};

const confirm = async (
  context: ReplaceContext,
  copy: Copy,
  ctx: CallbackTap,
  chatId: number,
  payload: Payload
): Promise<void> => {
  if (context.repo.liveCardInChat(chatId) !== null) {
    await ctx.answerCallbackQuery({ text: copy.gameRunning, show_alert: true });

    return;
  }

  const checked = recheck(
    context.repo.latestEvening(chatId),
    context.repo.playersInChat(chatId),
    payload
  );

  if (!checked.ok) {
    await ctx.answerCallbackQuery(copy.screenStale);

    return;
  }

  context.repo.replaceInGames(
    chatId,
    checked.evening.gameIds,
    checked.leaving.playerId,
    checked.arriving.id
  );

  const done: Replacement = {
    evening: checked.evening,
    leaving: checked.leaving,
    arriving: { playerId: checked.arriving.id, displayName: checked.arriving.display_name },
  };

  await ctx.editMessageText(renderReplaced(copy, done), { parse_mode: "HTML" });
  await ctx.answerCallbackQuery(copy.replacedNotice);
};

export const onTap = async (context: ReplaceContext, ctx: CallbackTap): Promise<void> => {
  const decoded = decodeReplaceCallback(ctx.callbackQuery.data);
  const chatId = ctx.chat?.id;
  const copy = copyIn(chatId === undefined ? DEFAULT_LOCALE : context.localeIn(chatId));

  if (decoded === null || chatId === undefined) {
    await ctx.answerCallbackQuery(copy.screenStale);

    return;
  }

  switch (decoded.action) {
    case ActionKind.Cancel:
      await cancel(context, copy, ctx, chatId);

      return;

    case ActionKind.Confirm:
      await confirm(context, copy, ctx, chatId, decoded.payload);
  }
};
