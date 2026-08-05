import type { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#language/copy.ts";


const BETWEEN_LINES = "\n";

export const renderLanguageScreen = (copy: Copy): string =>
  [copy.header, copy.ask].join(BETWEEN_LINES);

export const renderLanguageChosen = (copy: Copy, chosen: Locale): string =>
  [copy.header, copy.chosenBody(copy.languageNames[chosen])].join(BETWEEN_LINES);
