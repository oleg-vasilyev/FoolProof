import { Outcome, Refusal, Role } from "#merge-names/domain/merge-states.ts";
import type { RosterRepository } from "#shared/repository/repository-contract.ts";
import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { DEFAULT_LOCALE } from "#shared/locale/locales.ts";
import {
  apply,
  MIN_TO_MERGE,
  roleOf,
  type Candidate,
  type Selection,
} from "#merge-names/domain/merge-selection.ts";
import { decodeMergeCallback } from "#merge-names/render/merge-callback-codec.ts";
import {
  renderMergeKeyboard,
  type InlineKeyboardRows,
} from "#merge-names/render/merge-keyboard.ts";
import {
  joinedNames,
  renderCancelled,
  renderMerged,
  renderMergeScreen,
} from "#merge-names/render/merge-message.ts";
import { copyIn, type Copy } from "#merge-names/copy.ts";


export interface MergeContext {
  readonly repo: RosterRepository;
  readonly localeIn: LocaleReader;
}

const NO_SELECTION: Selection = [];

const toMarkup = (rows: InlineKeyboardRows) => ({
  inline_keyboard: rows.map((row) => row.map((button) => ({ ...button }))),
});

const screenOptions = (copy: Copy, roster: readonly Candidate[], selection: Selection) => ({
  parse_mode: "HTML" as const,
  reply_markup: toMarkup(renderMergeKeyboard(copy, roster, selection)),
});

const noticeFor = (copy: Copy, selection: Selection, touched: Candidate | null): string => {
  if (touched === null) {
    return copy.tapBack;
  }

  switch (roleOf(selection, touched.playerId)) {
    case Role.Keeper:
      return copy.tapKeeper(touched.displayName);

    case Role.Absorbed:
      return copy.tapAbsorbed(touched.displayName);

    case Role.Free:
      return copy.tapDropped(touched.displayName);
  }
};

const refusalFor = (copy: Copy, because: Refusal): string => {
  switch (because) {
    case Refusal.TooMany:
      return copy.tapTooMany;

    case Refusal.UnknownName:
      return copy.screenStale;

    case Refusal.NothingYet:
      return copy.tapNotAllowed;
  }
};

const redraw = async (
  copy: Copy,
  ctx: CallbackTap,
  roster: readonly Candidate[],
  selection: Selection,
  touched: Candidate | null
): Promise<void> => {
  await ctx.editMessageText(
    renderMergeScreen(copy, roster, selection),
    screenOptions(copy, roster, selection)
  );
  await ctx.answerCallbackQuery(noticeFor(copy, selection, touched));
};

const merge = async (
  context: MergeContext,
  copy: Copy,
  ctx: CallbackTap,
  chatId: number,
  keeper: Candidate,
  absorbed: readonly Candidate[]
): Promise<void> => {
  const everyone = [keeper, ...absorbed];

  if (context.repo.playedTogether(everyone.map((candidate) => candidate.playerId))) {
    await ctx.answerCallbackQuery({
      text: copy.playedTogether(joinedNames(everyone)),
      show_alert: true,
    });

    return;
  }

  if (context.repo.liveCardInChat(chatId) !== null) {
    await ctx.answerCallbackQuery({ text: copy.gameRunning, show_alert: true });

    return;
  }

  context.repo.mergePlayers(
    keeper.playerId,
    absorbed.map((candidate) => candidate.playerId)
  );

  await ctx.editMessageText(renderMerged(copy, keeper, absorbed), { parse_mode: "HTML" });
  await ctx.answerCallbackQuery(copy.mergedNotice);
};

const cancel = async (copy: Copy, ctx: CallbackTap): Promise<void> => {
  await ctx.editMessageText(renderCancelled(copy), { parse_mode: "HTML" });
  await ctx.answerCallbackQuery(copy.cancelledNotice);
};

export const onMerge = async (context: MergeContext, ctx: Command): Promise<void> => {
  const copy = copyIn(context.localeIn(ctx.chat.id));

  if (context.repo.liveCardInChat(ctx.chat.id) !== null) {
    await ctx.reply(copy.gameRunning);

    return;
  }

  const roster = context.repo.rosterInChat(ctx.chat.id);

  if (roster.length < MIN_TO_MERGE) {
    await ctx.reply(copy.nothingToMerge);

    return;
  }

  await ctx.reply(
    renderMergeScreen(copy, roster, NO_SELECTION),
    screenOptions(copy, roster, NO_SELECTION)
  );
};

export const onTap = async (context: MergeContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeMergeCallback(ctx.callbackQuery.data);
  const chatId = ctx.chat?.id;
  const copy = copyIn(chatId === undefined ? DEFAULT_LOCALE : context.localeIn(chatId));

  if (payload === null || chatId === undefined) {
    await ctx.answerCallbackQuery(copy.screenStale);

    return;
  }

  const roster = context.repo.rosterInChat(chatId);
  const transition = apply(roster, payload.selection, payload.action);

  switch (transition.outcome) {
    case Outcome.Updated:
      await redraw(copy, ctx, roster, transition.selection, transition.touched);

      return;

    case Outcome.Confirmed:
      await merge(context, copy, ctx, chatId, transition.keeper, transition.absorbed);

      return;

    case Outcome.Cancelled:
      await cancel(copy, ctx);

      return;

    case Outcome.Rejected:
      await ctx.answerCallbackQuery(refusalFor(copy, transition.because));
  }
};
