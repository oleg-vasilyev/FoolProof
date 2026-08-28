import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  commandMerge: "Fix one player written under two names",
  helpMerge:
    "/merge — one player written under two names; tap the name to keep first, then the ones to fold into it",

  header: "<b>Merging names</b>",
  askKeeper: "Tap the name to keep first. The number is games played.",
  keeperChosen: (keeper: string) => `<b>${keeper}</b> keeps its name. Now tap the ones to fold in.`,
  plan: (absorbed: string, keeper: string) => `${absorbed} → <b>${keeper}</b>`,
  willHave: (keeper: string, games: string) => `${keeper} will have ${games}.`,
  nowHas: (keeper: string, games: string) => `${keeper} now has ${games}.`,

  betweenNames: ", ",
  beforeLastName: " and ",

  gameForms: { one: "game", few: "games", many: "games" },

  nothingToMerge: "Only one name here so far — nothing to merge.",
  gameRunning: "A game is running. Confirm it first, then /merge.",
  playedTogether: (names: string) =>
    `${names} sat in the same game, so they are not one person. Nothing was merged.`,

  cancelledBody: "Cancelled — nothing merged.",

  markKeeper: "👑",
  markAbsorbed: "➕",

  buttonConfirm: "🟢 Confirm",
  buttonBack: "↩️ Back",
  buttonCancel: "🔴 Cancel",

  candidate: (name: string, games: number) => `${name} · ${games}`,

  tapKeeper: (name: string) => `${name} keeps its name`,
  tapAbsorbed: (name: string) => `${name} folds in`,
  tapDropped: (name: string) => `${name} — left alone`,
  tapBack: "Undone",
  tapNotAllowed: "Not available right now",
  tapTooMany: "That is as many names as one merge can carry",
  screenStale: "Screen expired — send /merge again",

  mergedNotice: "Merged",
  cancelledNotice: "Cancelled",
};

export type Copy = typeof copy;
