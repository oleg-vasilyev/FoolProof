import { InputFile } from "grammy";
import { toMarkup } from "#shared/telegram/inline-keyboard.ts";
import type { ScoresheetRepository } from "#shared/repository/repository-contract.ts";
import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { DEFAULT_LOCALE } from "#shared/locale/locales.ts";
import { careerCard } from "#scoresheet/domain/career/career-card.ts";
import { decodePersonalCallback } from "#scoresheet/render/personal/personal-callback-codec.ts";
import { colourColumnOf } from "#scoresheet/render/personal/colour-column.ts";
import { renderPersonalCard } from "#scoresheet/render/personal/personal-svg.ts";
import { renderRosterKeyboard } from "#scoresheet/render/personal/roster-keyboard.ts";
import { copyIn } from "#scoresheet/copy.ts";
import { handleOf } from "#scoresheet/render/poster-baseboard.ts";
import { rasterize } from "#shared/drawing/rasterize.ts";


const CARD_FILENAME = "player-card.png";

export interface PersonalContext {
  readonly repo: ScoresheetRepository;
  readonly localeIn: LocaleReader;
}

export const onPersonal = async (context: PersonalContext, ctx: Command): Promise<void> => {
  const copy = copyIn(context.localeIn(ctx.chat.id));
  const history = context.repo.careerHistory(ctx.chat.id);

  if (history === null) {
    await ctx.reply(copy.personalNobody);

    return;
  }

  await ctx.reply(copy.personalPick, {
    reply_markup: toMarkup(renderRosterKeyboard(history.players)),
  });
};

const refuse = async (ctx: CallbackTap, notice: string): Promise<void> => {
  await ctx.answerCallbackQuery(notice);
};

export const onPersonalTap = async (context: PersonalContext, ctx: CallbackTap): Promise<void> => {
  const chatId = ctx.chat?.id;
  const copy = copyIn(chatId === undefined ? DEFAULT_LOCALE : context.localeIn(chatId));

  if (chatId === undefined) {
    return refuse(ctx, copy.personalStale);
  }

  const playerId = decodePersonalCallback(ctx.callbackQuery.data);
  const history = context.repo.careerHistory(chatId);

  if (history === null || playerId === null) {
    return refuse(ctx, copy.personalStale);
  }

  const card = careerCard(history, playerId);

  if (card === null) {
    return refuse(ctx, copy.personalStale);
  }

  await ctx.editMessageText(copy.personalPicked(card.displayName));
  await ctx.answerCallbackQuery();

  const column = colourColumnOf(context.repo.seriesChronology(chatId), history.players, card.playerId);
  const drawn = await rasterize(renderPersonalCard(copy, card, column, handleOf(ctx.me.username)));

  await ctx.replyWithPhoto(new InputFile(drawn, CARD_FILENAME));
};
