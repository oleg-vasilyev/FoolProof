import { LOCALES, type Locale } from "#shared/locale/locales.ts";


export const LANGUAGE_TAPS = /^l:([a-z]+)$/;

const PREFIX = "l";

const BETWEEN_PARTS = ":";

export const encodeLanguageCallback = (locale: Locale): string =>
  [PREFIX, locale].join(BETWEEN_PARTS);

export const decodeLanguageCallback = (data: string): Locale | null => {
  const match = LANGUAGE_TAPS.exec(data);
  if (match === null) {
    return null;
  }

  return LOCALES.find((locale) => locale === match[1]) ?? null;
};
