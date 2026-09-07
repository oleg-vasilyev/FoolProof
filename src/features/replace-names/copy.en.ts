import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  commandReplace: "Fix a name in the last evening",
  helpReplace:
    "/replace — somebody was written under the wrong name all evening; give the name written, then the one who really played: /replace Roma, Romani",

  header: "<b>Replacing a name</b>",
  askNames:
    "Two names: the one written down, then the one who really played. For example: /replace Roma, Romani",
  sameName: "That is the same name twice — nothing to replace.",
  nameTooLong: (longest: number, names: readonly string[]) =>
    `Too long for a name: ${names.join(", ")}. No longer than ${longest} characters.`,
  noEvening: "No evening recorded here yet — nothing to correct.",
  notThisEvening: (name: string, date: string) => `${name} is not in the games on ${date}.`,
  alsoPlayed: (leaving: string, arriving: string, date: string) =>
    `${arriving} is in the games on ${date} too, so ${leaving} is somebody else. Nothing was replaced.`,
  gameRunning: "A game is running. Confirm it first, then /replace.",

  plan: (leaving: string, arriving: string) => `${leaving} → <b>${arriving}</b>`,
  willRewrite: (games: string, date: string) => `${games} on ${date} will be rewritten.`,
  rewritten: (games: string, date: string) => `Rewritten: ${games} on ${date}.`,
  newName: (name: string) => `${name} is a new name here — check the spelling before confirming.`,

  cancelledBody: "Cancelled — nothing replaced.",

  gameForms: { one: "game", few: "games", many: "games" },

  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  eveningDate: (day: string, month: string) => `${day} ${month}`,

  buttonConfirm: "🟢 Replace",
  buttonCancel: "🔴 Cancel",

  replacedNotice: "Replaced",
  cancelledNotice: "Cancelled",
  screenStale: "Screen expired — send /replace again",
};

export type Copy = typeof copy;
