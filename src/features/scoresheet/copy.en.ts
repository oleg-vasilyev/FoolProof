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
  everyWinner: "The whole table",

  awardTitles: {
    king: "KING OF THE TABLE",
    wireToWire: "WIRE TO WIRE",
    theFavourite: "THE FAVOURITE",
    hatTrick: "HAT TRICK",
    homeAdvantage: "HOME ADVANTAGE",
    untouchable: "UNTOUCHABLE",
    teflon: "TEFLON",
    hotSeat: "HOT SEAT",
    theComeback: "THE COMEBACK",
    theLadder: "THE LADDER",
    sweetRevenge: "SWEET REVENGE",
    ironSeat: "IRON SEAT",
    theTruce: "THE TRUCE",
    thePacifist: "THE PACIFIST",
    theNemesis: "THE NEMESIS",
    theDoorman: "THE DOORMAN",
    neverAsked: "NEVER ASKED",
    theLatecomer: "THE LATECOMER",
    revolvingDoor: "REVOLVING DOOR",
    theCameo: "THE CAMEO",
    secondWind: "SECOND WIND",
    theUnderstudy: "THE UNDERSTUDY",
    theFlatline: "THE FLATLINE",
    theInvisible: "THE INVISIBLE",
    groundhogDay: "GROUNDHOG DAY",
    thePendulum: "THE PENDULUM",
    theRollercoaster: "THE ROLLERCOASTER",
    allOrNothing: "ALL OR NOTHING",
    theIrishGoodbye: "THE IRISH GOODBYE",
    theAnchor: "THE ANCHOR",
    theSlide: "THE SLIDE",
    falseDawn: "FALSE DAWN",
    openersCurse: "OPENER'S CURSE",
    encore: "ENCORE",
    firstBlood: "FIRST BLOOD",
    foolOfTheNight: "FOOL OF THE NIGHT",
  },

  kingReason: (percent: number, games: string) =>
    `${percent}% table share across ${games}. Nobody sat higher.`,
  kingPassedReason: (percent: number, games: string) =>
    `${percent}% table share across ${games}. Only the fool of the night sat higher.`,
  wireToWireReason: (games: string) =>
    `In front on the chart after every game but the first, across ${games}.`,
  favouriteReason: (firsts: number, games: string) =>
    `Out first in ${firsts} of ${games}. The rest played for second.`,
  hatTrickReason: (run: number) => `${run} games running, out first every single time.`,
  homeAdvantageReason: (wins: number, opens: number) =>
    `Opened ${opens} games and went out first in ${wins} of them.`,
  untouchableReason: (games: string) => `${games}, never the fool. Untouched all evening.`,
  teflonReason: (streak: number) =>
    `${streak} straight games clean after being the fool. The longest run of the night.`,
  hotSeatReason: (opens: number) =>
    `Opened ${opens} games and was left the fool in none of them.`,
  comebackReason: (sank: number, percent: number) =>
    `Bottom of the chart at halfway on ${sank}%, back up to ${percent}% since.`,
  ladderReason: (run: number) => `Finished better than the game before, ${run} games running.`,
  sweetRevengeReason: (fools: number, comebacks: number) =>
    `Left the fool ${fools} times; came back to leave first in ${comebacks} of them.`,
  ironSeatReason: (games: string) => `The only one who sat through all ${games}.`,
  truceReason: (draws: number, games: string) => `${draws} of ${games} that nobody lost.`,
  pacifistReason: (draws: string) =>
    `In every one of the ${draws} that ended level. Never left holding it alone.`,
  nemesisReason: (over: string) =>
    `Finished above the same player in all ${over} the two of them shared.`,
  doormanReason: (opens: number, games: string) =>
    `Opened ${opens} of ${games}. The deal kept coming back round.`,
  neverAskedReason: (games: string) => `${games}, and not once the one to open.`,
  latecomerReason: (joinedAt: number, percent: number) =>
    `Arrived at game ${joinedAt} and is sitting on ${percent}% anyway.`,
  revolvingDoorReason: (missed: string, games: string) =>
    `Sat out ${missed} in the middle of the evening and came back for ${games}.`,
  cameoReason: (games: string) => `One game out of ${games}, and then gone.`,
  secondWindReason: (burnedBy: number, games: string) =>
    `The fool by game ${burnedBy} and never again across ${games}.`,
  understudyReason: (seconds: number, games: string) =>
    `Second out ${seconds} times in ${games}, and first out never.`,
  flatlineReason: (band: number, games: string) =>
    `Never more than ${band} points off mid-table across ${games}.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} of ${games} finished quietly in the middle.`,
  groundhogReason: (place: number, run: number) =>
    `The same place ${run} games running: number ${place}, every time.`,
  pendulumReason: (run: number) =>
    `${run} games running, top half then bottom half, turn and turn about.`,
  rollercoasterReason: (swing: number, games: string) =>
    `${swing} points between the best of it and the worst of it, across ${games}.`,
  allOrNothingReason: (edges: number, games: string) =>
    `${edges} of ${games} finished first out or fool. The middle is for cowards.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `Left after game ${leftAfter} of ${games} and was never the fool again.`,
  anchorReason: (games: string) => `${games} in the bottom half of the table, and never the fool.`,
  slideReason: (run: number) => `Finished worse than the game before, ${run} games running.`,
  falseDawnReason: (ledAt: number, percent: number) =>
    `Leading the chart at game ${ledAt}; down to ${percent}% since.`,
  openersCurseReason: (opens: number, burns: number) =>
    `Opened ${opens} games and was left the fool in ${burns} of them.`,
  encoreReason: (run: number) =>
    `${run} games running as the fool. An encore nobody asked for.`,
  firstBloodReason: (games: string) => `Fool of game 1 of ${games}. The evening opened badly.`,
  foolReason: (fools: number, games: string) =>
    `Left the fool in ${fools} of ${games}. Nobody managed worse.`,
  curseFact: (burns: number, games: string) =>
    `in ${burns} of ${games} whoever opened was left the fool.`,

  sheetEyebrow: "SESSION LOG",
  sheetTitle: "CHRONOLOGY",
  sheetGridLabel: "GAME BY GAME",
  sheetGridHint: "columns in seating order · every cell prints the place taken",
  sheetShareLabel: "TABLE SHARE",
  sheetShareHint: "50% is mid-table · 100% is winning every game",
  sheetLegendLabel: "SORTED BY SHARE",

  sheetGameForms: { one: "game", few: "games", many: "games" },
  sheetPlayerForms: { one: "player", few: "players", many: "players" },

  sheetKeyDrawn: "drew for last",
  sheetKeyFool: "left the fool",
  sheetKeyAbsent: "did not play",

  sheetSubtitle: (games: string, players: string) => `${games} · ${players}`,
  sheetTableShows: (tally: string) => `the table below shows the last ${tally}`,

  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  sheetDate: (day: string, month: string, year: string) => `${day} ${month} ${year}`,
};

export type Copy = typeof copy;
