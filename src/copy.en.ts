import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  commandHelp: "What the bot does",

  botLead: "FoolProof keeps score for games of Durak.",
  helpSelf: "/help — this message",

  startInvite: "Add me to the chat where your table plays, then send /game with the names.",
  startHelp: "/help — what every command does",
  buttonAddToGroup: "➕ Add me to a group",

  tapUnclaimed: "That button is from an older version of the bot",

  updateFailed: (updateId: number, reason: string) => `update ${updateId} failed: ${reason}`,
};

export type Copy = typeof copy;
