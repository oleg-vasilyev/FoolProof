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
    wireToWire: "AHEAD ALL NIGHT",
    theFavourite: "THE FAVOURITE",
    hatTrick: "HAT TRICK",
    homeAdvantage: "FROM THE OFF",
    untouchable: "UNTOUCHABLE",
    teflon: "TEFLON",
    hotSeat: "HOT SEAT",
    theComeback: "THE COMEBACK",
    theLadder: "THE CLIMB",
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
    `${percent}% of the table below them over ${games}. Nobody sat higher.`,
  kingPassedReason: (percent: number, games: string) =>
    `${percent}% of the table below them over ${games}. Only the fool sat higher.`,
  wireToWireReason: (games: string) =>
    `In front on the chart, game after game, all ${games}.`,
  favouriteReason: (firsts: number, games: string) =>
    `Out first in ${firsts} of ${games}. The rest played for second.`,
  hatTrickReason: (games: string) => `${games} running, out first every single time.`,
  homeAdvantageReason: (wins: number, opens: number) =>
    `Opened ${opens} of the games and went out first in ${wins} of them.`,
  untouchableReason: (games: string) => `${games}, never the fool. Untouched all evening.`,
  teflonReason: (streak: string) =>
    `${streak} in a row and never the fool — the night's longest.`,
  hotSeatReason: (opens: number) =>
    `Opened ${opens} of the games and was left the fool in none of them.`,
  comebackReason: (sank: number, percent: number) =>
    `Last at halfway, only ${sank}% of the field behind. ${percent}% by the end.`,
  ladderReason: (games: string) => `A climb of ${games} — each one better than the one before.`,
  sweetRevengeReason: (times: string, comebacks: string) =>
    `Left the fool ${times}, and ${comebacks} came straight back out first.`,
  ironSeatReason: (games: string) => `The only one who sat through all ${games}.`,
  truceReason: (draws: number, games: string) => `${draws} of ${games} that nobody lost.`,
  pacifistReason: (draws: string) => `${draws} ended level, and not one of them without this player.`,
  nemesisReason: (over: string) =>
    `${over} with one opponent, who never once finished higher.`,
  doormanReason: (opens: number, games: string) =>
    `Opened ${opens} of ${games}. The first move kept coming back round.`,
  neverAskedReason: (games: string) => `${games}, and not once the one to open.`,
  latecomerReason: (joinedAt: number, percent: number) =>
    `Arrived only at game ${joinedAt}, and ${percent}% of the field is already behind.`,
  revolvingDoorReason: (missed: number, games: string) =>
    `${games} played, and ${missed} sat out in the middle of the evening.`,
  cameoReason: (games: string) => `One out of ${games}, and then gone.`,
  secondWindReason: (burnedBy: number, games: string) =>
    `The fool in game ${burnedBy} and never again across ${games}.`,
  understudyReason: (times: string, games: string) =>
    `Second out ${times} in ${games}, and first out never.`,
  flatlineReason: (band: number, games: string) =>
    `Never more than ${band}% off mid-table across ${games}.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} of ${games} — neither the top nor the bottom.`,
  groundhogReason: (place: number, games: string) =>
    `The same place ${games} running: number ${place}, every time.`,
  pendulumReason: (games: string) =>
    `${games} running, top half then bottom half, turn and turn about.`,
  rollercoasterReason: (swing: number, games: string) =>
    `Swung ${swing}% over ${games}, from its high on the chart to its low.`,
  allOrNothingReason: (edges: number, games: string) =>
    `First out or the fool in ${edges} of ${games}. The middle is for cowards.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `The earliest to go — ${games} played, gone after game ${leftAfter}.`,
  anchorReason: (games: string) => `${games} in the bottom half of the table, and never the fool.`,
  slideReason: (games: string) => `A slide of ${games} — each one falling short of the one before.`,
  falseDawnReason: (ledAt: number, percent: number) =>
    `Top at game ${ledAt} — and only ${percent}% of the field behind by the end.`,
  openersCurseReason: (opens: number, burns: number) =>
    `Opened ${opens} of the games and was left the fool in ${burns} of them.`,
  encoreReason: (games: string) =>
    `${games} running as the fool. An encore nobody asked for.`,
  firstBloodReason: "Fool of the evening's first game.",
  foolReason: (fools: number, games: string) =>
    `Left the fool in ${fools} of ${games} — more often than anybody else.`,
  curseFact: (burns: number, games: string, predicted: number) =>
    `the fool opened ${burns} of ${games}; the seats predict ${predicted} of them.`,

  sheetEyebrow: "SESSION LOG",
  sheetTitle: "CHRONOLOGY",
  sheetGridLabel: "GAME BY GAME",
  sheetGridHint: "columns in seating order · every cell prints the place taken",
  sheetShareLabel: "OPPONENTS BEATEN",
  sheetShareHint: "50% is half the table · 100% is first in every game",
  sheetLegendLabel: "BEST FIRST",

  sheetGameForms: { one: "game", few: "games", many: "games" },
  sheetGameOfForms: { one: "game", few: "games", many: "games" },
  sheetGameAcrossForms: { one: "game", few: "games", many: "games" },
  sheetPlayerForms: { one: "player", few: "players", many: "players" },

  sheetKeyDrawn: "drew for last",
  sheetKeyFool: "left the fool",
  sheetKeyAbsent: "did not play",

  sheetSubtitle: (games: string, players: string) => `${games} · ${players}`,
  sheetTableShows: (tally: string) => `the table below shows the last ${tally}`,
  moreGamesForAwards: (games: string) => `Another ${games} tonight and the awards follow.`,

  commandPersonal: "One player's card",
  helpPersonal: "/personal — one player's card, across everything played in this chat",

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

  tileShare: "OPPONENTS BEATEN",
  tileShareScale: "0% is last, 100% is first",
  tileFool: "THE FOOL",
  tileFirst: "FIRST PLACE",
  tileFirstMove: "THE FIRST MOVE",
  tileOutOf: (part: number, whole: number) => `${part} of ${whole}`,
  tileSeatPredicts: (expected: string) => `seat predicts ${expected}`,

  personalChartLabel: "OPPONENTS BEATEN BY EVENING",
  personalChartArrives: (evenings: string) => `The chart arrives after ${evenings}.`,
  personalBestEvening: "best evening",
  personalWorstEvening: "worst evening",
  personalShortNight: (least: string) =>
    `faint dot · an evening shorter than ${least} is neither best nor worst`,

  personalFactsLabel: "WHAT STUCK",
  personalFactsAwait: "Nothing has stuck yet — it takes more games.",
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
    neverWentFirst: "NEVER ONCE WENT FIRST",
    theHeadStart: "ALWAYS GOING FIRST",
    theBadPatch: "THE BAD PATCH",
    theCleanRun: "THE CLEAN RUN",
    theSurvivor: "THE SURVIVOR",
    lightningRod: "THE LIGHTNING ROD",
    everPresent: "NEVER MISSED ONE",
    foundingMember: "THERE FROM THE START",
    theNewcomer: "THE NEWCOMER",
  },
  blinderReason: (times: string, games: string) =>
    `Out first ${times} in ${games} — all of it in one night.`,
  nightmareReason: (times: string, games: string) =>
    `The fool ${times} in ${games}. Nothing went right.`,
  alongsideReason: (burns: number, games: string, usual: number) =>
    `${games} together, the fool in ${burns} of them — their usual would be ${usual}.`,
  patsyReason: (won: number, duels: string) =>
    `Left at the end together ${duels} — the rival came off worse in ${won}.`,
  bogeyReason: (lost: number, duels: string) =>
    `Left at the end together ${duels} — the rival came off better in ${lost}.`,
  atSizeReason: (burns: number, games: string, usual: number) =>
    `${games} at a table that size, the fool in ${burns} of them — the usual would be ${usual}.`,
  atTableOf: (seats: number) => `${seats} at the table`,
  firstMoveGiftReason: (firsts: number) => `Went out first in ${firsts} of them.`,
  firstMoveCurseReason: (burns: number) => `The fool in ${burns} of them.`,
  homecomingReason: (missed: string) => `Back at the table, ${missed} later.`,
  neverWentFirstHolder: (games: string) => `${games}, never once`,
  neverWentFirstReason: "The first move has never come round.",
  headStartReason: (games: string) => `Out of ${games} — far more than the seat gives.`,
  badPatchHolder: (games: string) => `${games} running as the fool`,
  betweenDates: (from: string, until: string) => `From ${from} to ${until}.`,
  cleanRunHolder: (games: string) => `${games} clean`,
  againstTheSeatReason: (games: string, expected: string, actual: string) =>
    `Out of ${games} the seat alone predicts the fool in ${expected}; it came out at ${actual}.`,
  everPresentReason: "Not one evening at this table missed.",
  foundingReason: (evenings: string) => `The first evening on record, ${evenings} ago.`,
  newcomerReason: (evenings: string) => `${evenings} in. The table is still working them out.`,

  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  sheetDate: (day: string, month: string, year: string) => `${day} ${month} ${year}`,
};

export type Copy = typeof copy;
