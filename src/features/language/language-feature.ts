import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { LocaleRepository } from "#shared/repository/repository-contract.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import type { Locale } from "#shared/locale/locales.ts";
import { copyIn } from "#language/copy.ts";
import { onLanguage, onTap, type LanguageContext } from "#language/bot/language-handler.ts";
import { LANGUAGE_TAPS } from "#language/render/language-callback-codec.ts";


export interface LanguageDeps {
  readonly repo: LocaleRepository;
  readonly localeIn: LocaleReader;
  readonly publishMenu: (chatId: number, locale: Locale) => Promise<void>;
}

export const createLanguageFeature = (deps: LanguageDeps): Feature => {
  const context: LanguageContext = {
    repo: deps.repo,
    localeIn: deps.localeIn,
    publishMenu: deps.publishMenu,
  };

  return {
    commands: [
      {
        command: "language",
        menuDescription: (locale) => copyIn(locale).commandLanguage,
        help: (locale) => copyIn(locale).helpLanguage,
        run: (ctx) => onLanguage(context, ctx),
      },
    ],

    listen: (listeners: Listeners) => {
      listeners.onTap(LANGUAGE_TAPS, (ctx) => onTap(context, ctx));
    },
  };
};
