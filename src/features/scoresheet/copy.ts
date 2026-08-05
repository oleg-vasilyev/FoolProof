import { Locale } from "#shared/locale/locales.ts";
import { copy as english, type Copy } from "#scoresheet/copy.en.ts";
import { copy as russian } from "#scoresheet/copy.ru.ts";


export type { Copy };

export const copyIn = (locale: Locale): Copy => {
  switch (locale) {
    case Locale.En:
      return english;

    case Locale.Ru:
      return russian;
  }
};
