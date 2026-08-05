import { LOCALES, type Locale } from "#shared/locale/locales.ts";
import { encodeLanguageCallback } from "#language/render/language-callback-codec.ts";
import type { Copy } from "#language/copy.ts";


export interface InlineButton {
  readonly text: string;
  readonly callback_data: string;
}

export type InlineKeyboardRows = readonly (readonly InlineButton[])[];

const captionFor = (copy: Copy, offered: Locale, spoken: Locale): string => {
  const name = copy.languageNames[offered];

  return offered === spoken ? `${copy.markChosen} ${name}` : name;
};

export const renderLanguageKeyboard = (copy: Copy, spoken: Locale): InlineKeyboardRows =>
  LOCALES.map((offered) => [
    {
      text: captionFor(copy, offered, spoken),
      callback_data: encodeLanguageCallback(offered),
    },
  ]);
