import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#language/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandLanguage: "На каком языке бот говорит здесь",
  helpLanguage: "/language — выбрать язык, на котором бот говорит в этом чате",

  header: "<b>Язык</b>",
  ask: "На каком языке боту говорить в этом чате?",
  chosenBody: (language: string) => `Теперь бот говорит здесь так: ${language}.`,

  languageNames: { en: "English", ru: "Русский" },

  markChosen: "✅",

  tapChosen: (language: string) => `Выбрано: ${language}`,
  screenStale: "Экран устарел — отправь /language заново",
};
