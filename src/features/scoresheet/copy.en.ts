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
    `${percent}% of the table finished below them across ${games}. Nobody sat higher.`,
  kingPassedReason: (percent: number, games: string) =>
    `${percent}% of the table finished below them across ${games}. Only the fool of the night sat higher.`,
  wireToWireReason: (games: string) =>
    `In front on the chart after every game but the first, across ${games}.`,
  favouriteReason: (firsts: number, games: string) =>
    `Out first in ${firsts} of ${games}. The rest played for second.`,
  hatTrickReason: (games: string) => `${games} running, out first every single time.`,
  homeAdvantageReason: (wins: number, opens: number) =>
    `Opened ${opens} of the games and went out first in ${wins} of them.`,
  untouchableReason: (games: string) => `${games}, never the fool. Untouched all evening.`,
  teflonReason: (streak: string) =>
    `Was the fool, and then came ${streak} without another. The longest clean run of the night.`,
  hotSeatReason: (opens: number) =>
    `Opened ${opens} of the games and was left the fool in none of them.`,
  comebackReason: (sank: number, percent: number) =>
    `Bottom of the chart at halfway on ${sank}%, back up to ${percent}% since.`,
  ladderReason: (games: string) => `A climb of ${games} — each one after the first bettered the last.`,
  sweetRevengeReason: (times: string, comebacks: number) =>
    `Left the fool ${times}; came back to leave first in ${comebacks} of them.`,
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
    `Swung ${swing}% across ${games}, from the best of it to the worst and back.`,
  allOrNothingReason: (edges: number, games: string) =>
    `${edges} of ${games} finished first out or fool. The middle is for cowards.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `Left after game ${leftAfter} of ${games} and was never the fool again.`,
  anchorReason: (games: string) => `${games} in the bottom half of the table, and never the fool.`,
  slideReason: (games: string) => `A slide of ${games} — each one after the first fell short of the last.`,
  falseDawnReason: (ledAt: number, percent: number) =>
    `Leading the chart at game ${ledAt}; down to ${percent}% since.`,
  openersCurseReason: (opens: number, burns: number) =>
    `Opened ${opens} of the games and was left the fool in ${burns} of them.`,
  encoreReason: (games: string) =>
    `${games} running as the fool. An encore nobody asked for.`,
  firstBloodReason: (games: string) => `Fool of game 1 of ${games}. The evening opened badly.`,
  foolReason: (fools: number, games: string) =>
    `Left the fool in ${fools} of ${games}. Nobody was left it more often.`,
  curseFact: (burns: number, games: string, predicted: number) =>
    `whoever opened was left the fool in ${burns} of ${games} — the seats predict ${predicted}.`,

  sheetEyebrow: "SESSION LOG",
  sheetTitle: "CHRONOLOGY",
  sheetGridLabel: "GAME BY GAME",
  sheetGridHint: "columns in seating order · every cell prints the place taken",
  sheetShareLabel: "OPPONENTS BEATEN",
  sheetShareHint: "50% is half the table · 100% is first in every game",
  sheetLegendLabel: "BEST FIRST",

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

  tileShare: "OPPONENTS BEATEN",
  tileShareFloor: "0% — last in every game",
  tileShareCeiling: "100% — first in every game",
  tileFool: "THE FOOL",
  tileFirst: "FIRST PLACE",
  tileFirstMove: "THE FIRST MOVE",
  tileOutOf: (part: number, whole: number) => `${part} of ${whole}`,
  tileOutOfDecided: (part: number, decided: number) =>
    `${part} of the ${decided} that had a fool`,
  tileSeatPredicts: (expected: string) => `seat predicts ${expected}`,

  personalChartLabel: "OPPONENTS BEATEN BY EVENING",
  personalChartArrives: (evenings: string) => `The chart arrives after ${evenings}.`,
  personalBestEvening: "best evening",
  personalWorstEvening: "worst evening",

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
    `Out first ${times} in ${games} — the best night you have had.`,
  nightmareReason: (times: string, games: string) =>
    `The fool ${times} in ${games}. Nothing went right.`,
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
  firstMoveGiftReason: (firsts: number) => `Went out first in ${firsts} of them.`,
  firstMoveCurseReason: (burns: number) => `Burned in ${burns} of them.`,
  homecomingReason: (missed: string) => `Back at the table after ${missed} away.`,
  neverWentFirstHolder: (games: string) => `${games}, never once`,
  neverWentFirstReason: "The first move has never come round to you.",
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
