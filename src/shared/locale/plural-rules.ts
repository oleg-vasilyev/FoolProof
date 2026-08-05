import { Locale } from "#shared/locale/locales.ts";


export interface WordForms {
  readonly one: string;
  readonly few: string;
  readonly many: string;
}

const ONE = 1;

const FEW_FROM = 2;

const FEW_TO = 4;

const TEENS_FROM = 11;

const TEENS_TO = 14;

const LAST_DIGIT = 10;

const LAST_TWO_DIGITS = 100;

const russianForm = (count: number, forms: WordForms): string => {
  const lastTwo = count % LAST_TWO_DIGITS;

  if (lastTwo >= TEENS_FROM && lastTwo <= TEENS_TO) {
    return forms.many;
  }

  const last = count % LAST_DIGIT;

  if (last === ONE) {
    return forms.one;
  }

  return last >= FEW_FROM && last <= FEW_TO ? forms.few : forms.many;
};

export const wordFor = (locale: Locale, count: number, forms: WordForms): string => {
  switch (locale) {
    case Locale.En:
      return count === ONE ? forms.one : forms.many;

    case Locale.Ru:
      return russianForm(count, forms);
  }
};

export const counted = (locale: Locale, count: number, forms: WordForms): string =>
  `${String(count)} ${wordFor(locale, count, forms)}`;
