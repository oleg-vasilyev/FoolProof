import type { RosterRepository } from "#shared/repository/repository-contract.ts";
import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";
import {
  apply,
  MIN_TO_MERGE,
  roleOf,
  type Candidate,
  type Refusal,
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
import { copy } from "#merge-names/copy.en.ts";


export interface MergeContext {
  readonly repo: RosterRepository;
}

const NO_SELECTION: Selection = [];

const toMarkup = (rows: InlineKeyboardRows) => ({
  inline_keyboard: rows.map((row) => row.map((button) => ({ ...button }))),
});

const screenOptions = (roster: readonly Candidate[], selection: Selection) => ({
  parse_mode: "HTML" as const,
  reply_markup: toMarkup(renderMergeKeyboard(roster, selection)),
});

const noticeFor = (selection: Selection, touched: Candidate | null): string => {
  if (touched === null) {
    return copy.tapBack;
  }

  switch (roleOf(selection, touched.playerId)) {
    case "keeper":
      return copy.tapKeeper(touched.displayName);

    case "absorbed":
      return copy.tapAbsorbed(touched.displayName);

    case "free":
      return copy.tapDropped(touched.displayName);
  }
};

const refusalFor = (because: Refusal): string => {
  switch (because) {
    case "too_many":
      return copy.tapTooMany;

    case "unknown_name":
      return copy.screenStale;

    case "nothing_yet":
      return copy.tapNotAllowed;
  }
};

const redraw = async (
  ctx: CallbackTap,
  roster: readonly Candidate[],
  selection: Selection,
  touched: Candidate | null
): Promise<void> => {
  await ctx.editMessageText(renderMergeScreen(roster, selection), screenOptions(roster, selection));
  await ctx.answerCallbackQuery(noticeFor(selection, touched));
};

const merge = async (
  context: MergeContext,
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

  await ctx.editMessageText(renderMerged(keeper, absorbed), { parse_mode: "HTML" });
  await ctx.answerCallbackQuery(copy.mergedNotice);
};

const cancel = async (ctx: CallbackTap): Promise<void> => {
  await ctx.editMessageText(renderCancelled(), { parse_mode: "HTML" });
  await ctx.answerCallbackQuery(copy.cancelledNotice);
};

export const onMerge = async (context: MergeContext, ctx: Command): Promise<void> => {
  if (context.repo.liveCardInChat(ctx.chat.id) !== null) {
    await ctx.reply(copy.gameRunning);

    return;
  }

  const roster = context.repo.rosterInChat(ctx.chat.id);

  if (roster.length < MIN_TO_MERGE) {
    await ctx.reply(copy.nothingToMerge);

    return;
  }

  await ctx.reply(renderMergeScreen(roster, NO_SELECTION), screenOptions(roster, NO_SELECTION));
};

export const onTap = async (context: MergeContext, ctx: CallbackTap): Promise<void> => {
  const payload = decodeMergeCallback(ctx.callbackQuery.data);
  const chatId = ctx.chat?.id;

  if (payload === null || chatId === undefined) {
    await ctx.answerCallbackQuery(copy.screenStale);

    return;
  }

  const roster = context.repo.rosterInChat(chatId);
  const transition = apply(roster, payload.selection, payload.action);

  switch (transition.outcome) {
    case "updated":
      await redraw(ctx, roster, transition.selection, transition.touched);

      return;

    case "confirmed":
      await merge(context, ctx, chatId, transition.keeper, transition.absorbed);

      return;

    case "cancelled":
      await cancel(ctx);

      return;

    case "rejected":
      await ctx.answerCallbackQuery(refusalFor(transition.because));
  }
};
