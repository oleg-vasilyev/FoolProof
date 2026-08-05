import { DEFAULT_LOCALE, LOCALES, type Locale } from "#shared/locale/locales.ts";
import type { LocaleRepository } from "#shared/repository/repository-contract.ts";


export type LocaleReader = (chatId: number) => Locale;

export const localeFrom = (value: string | null): Locale | null =>
  LOCALES.find((locale) => locale === value) ?? null;

export const createLocaleReader =
  (repo: LocaleRepository): LocaleReader =>
  (chatId) =>
    localeFrom(repo.chatLocale(chatId)) ?? DEFAULT_LOCALE;
