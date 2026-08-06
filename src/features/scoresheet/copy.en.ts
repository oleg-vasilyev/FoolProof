import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  commandStats: "How tonight is going",
  commandChronology: "The chronology on its own",
  commandAwards: "Tonight's awards",

  helpStats: "/stats — how the current session is going, chronology then awards",
  helpChronology: "/stats_chronology — the chronology on its own",
  helpAwards: "/stats_awards — the awards on their own",

  statsEmpty: "Nothing recorded yet. Start a game with /game.",
  awardsTooSoon: (games: string) =>
    `Too early for awards — they need ${games}. The chronology is ready though: /stats_chronology`,

  awardsTitle: "AWARDS",
  awardsCurseLabel: "TABLE CURSE",
  betweenWinners: " & ",

  awardTitles: {
    king: "KING OF THE TABLE",
    untouchable: "UNTOUCHABLE",
    teflon: "TEFLON",
    sweetRevenge: "SWEET REVENGE",
    ironSeat: "IRON SEAT",
    theTruce: "THE TRUCE",
    allOrNothing: "ALL OR NOTHING",
    theInvisible: "THE INVISIBLE",
    theIrishGoodbye: "THE IRISH GOODBYE",
    encore: "ENCORE",
    openersCurse: "OPENER'S CURSE",
    firstBlood: "FIRST BLOOD",
    foolOfTheNight: "FOOL OF THE NIGHT",
  },

  kingReason: (percent: number, games: string) =>
    `${percent}% table share across ${games}. Nobody sat higher.`,
  untouchableReason: (games: string) => `${games}, never the fool. Untouched all evening.`,
  teflonReason: (streak: number) =>
    `${streak} straight games without being the fool. The longest clean run of the night.`,
  sweetRevengeReason: (fools: number, comebacks: number) =>
    `Left the fool ${fools} times; came back to leave first in ${comebacks} of them.`,
  ironSeatReason: (games: string) => `The only one who sat through all ${games}.`,
  truceReason: (draws: string, games: string) => `${draws} of ${games} that nobody lost.`,
  allOrNothingReason: (edges: number, games: string) =>
    `${edges} of ${games} finished first out or fool. The middle is for cowards.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} of ${games} finished quietly in the middle.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `Left after game ${leftAfter} of ${games} and was never the fool again.`,
  encoreReason: (run: number) =>
    `${run} games running as the fool. An encore nobody asked for.`,
  openersCurseReason: (opens: number, burns: number) =>
    `Opened ${opens} games and was left the fool in ${burns} of them.`,
  firstBloodReason: (games: string) => `Fool of game 1 of ${games}. The evening opened badly.`,
  foolReason: (fools: number, games: string) =>
    `Left the fool in ${fools} of ${games}. Nobody managed worse.`,
  curseFact: (burns: number, games: string) =>
    `in ${burns} of ${games} whoever opened was left the fool.`,

  sheetEyebrow: "SESSION LOG",
  sheetTitle: "CHRONOLOGY",
  sheetShareLabel: "TABLE SHARE",
  sheetShareHint: "50% is mid-table · 100% is winning every game",

  sheetGameForms: { one: "game", few: "games", many: "games" },
  sheetPlayerForms: { one: "player", few: "players", many: "players" },

  sheetKeyPlaced: "went out",
  sheetKeyDrawn: "drew for last",
  sheetKeyFool: "left the fool",
  sheetKeyAbsent: "did not play",

  sheetSubtitle: (games: string, players: string) => `${games} · ${players}`,
  sheetOmitted: (games: number) => `earliest ${games} not shown`,

  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  sheetDate: (day: string, month: string, year: string) => `${day} ${month} ${year}`,
};

export type Copy = typeof copy;
