import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  commandHelp: "What the bot does",

  helpLead: "FoolProof keeps score for games of Durak.",
  helpSelf: "/help — this message",

  tapUnclaimed: "That button is from an older version of the bot",

  updateFailed: (updateId: number, reason: string) => `update ${updateId} failed: ${reason}`,
};

export type Copy = typeof copy;
