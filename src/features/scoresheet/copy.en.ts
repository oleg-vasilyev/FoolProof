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
    `Another ${games} and the awards appear. The chronology is ready though: /stats_chronology`,

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
    `Was the fool, and still put ${streak} straight games together clean. The longest run of the night.`,
  hotSeatReason: (opens: number) =>
    `Opened ${opens} games and was left the fool in none of them.`,
  comebackReason: (sank: number, percent: number) =>
    `Bottom of the chart at halfway on ${sank}%, back up to ${percent}% since.`,
  ladderReason: (run: number) => `A climb of ${run} games — each one after the first bettered the last.`,
  sweetRevengeReason: (fools: number, comebacks: number) =>
    `Left the fool ${fools} times; came back to leave first in ${comebacks} of them.`,
  ironSeatReason: (games: string) => `The only one who sat through all ${games}.`,
  truceReason: (draws: number, games: string) => `${draws} of ${games} that nobody lost.`,
  pacifistReason: (draws: string) =>
    `In every one of the ${draws} that ended level. Never left holding it alone.`,
  nemesisReason: (over: string) =>
    `Finished above the same player in all ${over} the two of them shared.`,
  doormanReason: (opens: number, games: string) =>
    `Opened ${opens} of ${games}. The first move kept coming back round.`,
  neverAskedReason: (games: string) => `${games}, and not once the one to open.`,
  latecomerReason: (joinedAt: number, percent: number) =>
    `Arrived at game ${joinedAt} and is sitting on ${percent}% anyway.`,
  revolvingDoorReason: (missed: string, games: string) =>
    `Played ${games}, sitting out ${missed} in the middle of the evening.`,
  cameoReason: (games: string) => `One game out of ${games}, and then gone.`,
  secondWindReason: (burnedBy: number, games: string) =>
    `The fool by game ${burnedBy} and never again across ${games}.`,
  understudyReason: (seconds: number, games: string) =>
    `Second out ${seconds} times in ${games}, and first out never.`,
  flatlineReason: (band: number, games: string) =>
    `Never more than ${band} points off mid-table across ${games}.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} of ${games} — neither the top nor the bottom.`,
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
  slideReason: (run: number) => `A slide of ${run} games — each one after the first fell short of the last.`,
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
  moreGamesForAwards: (games: string) => `Another ${games} tonight and the awards follow.`,

  commandPersonal: "One player's card",
  helpPersonal: "/personal — one player's card, across everything they have played",

  personalPick: "Whose card?",
  personalNobody: "Nobody has finished a game here yet. Start one with /game.",
  personalStale: "That screen is from an older version of the bot",
  personalPicked: (name: string) => `${name}'s card`,

  personalEyebrow: "PLAYER CARD",
  personalSince: (date: string) => `since ${date}`,
  personalSubtitle: (games: string, evenings: string) => `${games} · ${evenings}`,
  sheetEveningForms: { one: "evening", few: "evenings", many: "evenings" },
  sheetEveningsOwedForms: { one: "more evening", few: "more evenings", many: "more evenings" },
  sheetTimeForms: { one: "time", few: "times", many: "times" },

  tileGames: "GAMES",
  tileEvenings: "EVENINGS",
  tileShare: "TABLE SHARE",
  tileShareNote: "50% is mid-table",
  tileFool: "LEFT THE FOOL",
  tileFirst: "OUT FIRST",
  tileDealt: "THE FIRST MOVE",
  tileTimesExpected: (times: string, expected: string) => `${times} · expected ${expected}`,
  tileFoolNote: (fools: number, decided: number, expected: string) =>
    `${fools} of the ${decided} that had a fool · expected ${expected}`,

  personalChartLabel: "TABLE SHARE BY EVENING",
  personalChartArrives: (evenings: string) => `appears after ${evenings}`,
  personalBestEvening: "best evening",
  personalWorstEvening: "worst evening",

  personalFactsLabel: "WHAT STUCK",
  factTitles: {
    theBlinder: "THE BLINDER",
    theNightmare: "THE NIGHTMARE",
    theCharm: "THE LUCKY CHARM",
    theJinx: "THE JINX",
    thePatsy: "THE PATSY",
    theBogey: "THE BOGEY",
    bigTableCharm: "ROOM TO BREATHE",
    bigTableCurse: "LOST IN THE CROWD",
    openersGift: "THE FIRST MOVE'S GIFT",
    openersCurse: "THE FIRST MOVE'S CURSE",
    theHomecoming: "THE HOMECOMING",
    neverDealt: "NEVER ONCE WENT FIRST",
    theHeadStart: "ALWAYS GOING FIRST",
    theBadPatch: "THE BAD PATCH",
    theCleanRun: "THE CLEAN RUN",
    theSurvivor: "THE SURVIVOR",
    lightningRod: "THE LIGHTNING ROD",
    everPresent: "NEVER MISSED ONE",
    foundingMember: "THERE FROM THE START",
    theNewcomer: "THE NEWCOMER",
  },
  blinderReason: (firsts: number, games: string) =>
    `Out first ${firsts} times in ${games} — the best night you have had.`,
  nightmareReason: (burns: number, games: string) =>
    `The fool ${burns} times in ${games}. Nothing went right.`,
  charmReason: (burns: number, games: string, usual: string) =>
    `Only ${burns} fires in ${games} at their table; ${usual} is your usual.`,
  jinxReason: (burns: number, games: string, usual: string) =>
    `${burns} fires in ${games} at their table; ${usual} is your usual.`,
  patsyReason: (won: number, duels: string) =>
    `Left at the end together ${duels} — you walked away from ${won}.`,
  bogeyReason: (lost: number, duels: string) =>
    `Left at the end together ${duels} — you burned in ${lost}.`,
  tableCharmReason: (burns: number, games: string) =>
    `${burns} fires in ${games} that size. The big table suits you.`,
  tableCurseReason: (burns: number, games: string) =>
    `${burns} fires in ${games} that size. More than the seat asks for.`,
  atTableOf: (seats: number) => `${seats} at the table`,
  dealtGiftReason: (firsts: number) => `Went out first in ${firsts} of them.`,
  dealtCurseReason: (burns: number) => `Burned in ${burns} of them.`,
  homecomingReason: (missed: string) => `Back at the table after ${missed} away.`,
  neverDealtHolder: (games: string) => `${games}, never once`,
  neverDealtReason: "The first move has never come round to you.",
  headStartReason: (games: string) => `Out of ${games} — far more than the seat gives.`,
  badPatchHolder: (games: string) => `${games} on fire`,
  betweenDates: (from: string, until: string) => `From ${from} to ${until}.`,
  cleanRunHolder: (games: string) => `${games} clean`,
  survivorReason: (games: string, expected: string) =>
    `In ${games} the seat alone predicts ${expected}. You come in under it.`,
  lightningRodReason: (games: string, expected: string) =>
    `In ${games} the seat alone predicts ${expected}. You come in over it.`,
  everPresentReason: "Not one evening at this table without you.",
  foundingReason: (evenings: string) => `The first evening on record, ${evenings} ago.`,
  newcomerReason: (evenings: string) => `${evenings} in. The table is still working you out.`,

  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  sheetDate: (day: string, month: string, year: string) => `${day} ${month} ${year}`,
};

export type Copy = typeof copy;
