import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  commandLanguage: "Which language the bot speaks here",
  helpLanguage: "/language — pick the language this chat is played in",

  header: "<b>Language</b>",
  ask: "Which language should the bot speak in this chat?",
  chosenBody: (language: string) => `The bot now speaks ${language} here.`,

  languageNames: { en: "English", ru: "Русский" },

  markChosen: "✅",

  tapChosen: (language: string) => `${language} it is`,
  screenStale: "Screen expired — send /language again",
};

export type Copy = typeof copy;
