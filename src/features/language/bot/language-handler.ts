import type { CallbackTap, Command } from "#shared/telegram/telegram-contexts.ts";
import type { LocaleRepository } from "#shared/repository/repository-contract.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { DEFAULT_LOCALE, type Locale } from "#shared/locale/locales.ts";
import { decodeLanguageCallback } from "#language/render/language-callback-codec.ts";
import {
  renderLanguageKeyboard,
  type InlineKeyboardRows,
} from "#language/render/language-keyboard.ts";
import {
  renderLanguageChosen,
  renderLanguageScreen,
} from "#language/render/language-message.ts";
import { copyIn, type Copy } from "#language/copy.ts";


export interface LanguageContext {
  readonly repo: LocaleRepository;
  readonly localeIn: LocaleReader;
  readonly publishMenu: (chatId: number, locale: Locale) => Promise<void>;
}

const toMarkup = (rows: InlineKeyboardRows) => ({
  inline_keyboard: rows.map((row) => row.map((button) => ({ ...button }))),
});

const screenOptions = (copy: Copy, spoken: Locale) => ({
  parse_mode: "HTML" as const,
  reply_markup: toMarkup(renderLanguageKeyboard(copy, spoken)),
});

export const onLanguage = async (context: LanguageContext, ctx: Command): Promise<void> => {
  const spoken = context.localeIn(ctx.chat.id);
  const copy = copyIn(spoken);

  await ctx.reply(renderLanguageScreen(copy), screenOptions(copy, spoken));
};

export const onTap = async (context: LanguageContext, ctx: CallbackTap): Promise<void> => {
  const chosen = decodeLanguageCallback(ctx.callbackQuery.data);
  const chatId = ctx.chat?.id;

  if (chosen === null || chatId === undefined) {
    await ctx.answerCallbackQuery(copyIn(DEFAULT_LOCALE).screenStale);

    return;
  }

  context.repo.rememberChatLocale(chatId, chosen);

  const copy = copyIn(chosen);

  await ctx.editMessageText(renderLanguageChosen(copy, chosen), { parse_mode: "HTML" });
  await ctx.answerCallbackQuery(copy.tapChosen(copy.languageNames[chosen]));
  await context.publishMenu(chatId, chosen);
};
