import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#scoresheet/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandStats: "Как идёт сегодняшний вечер",
  commandChronology: "Только хронология",
  commandAwards: "Награды вечера",

  helpStats: "/stats — как идёт вечер: сначала хронология, потом награды",
  helpChronology: "/stats_chronology — только хронология",
  helpAwards: "/stats_awards — только награды",

  statsEmpty: "Пока ничего не записано. Начни партию: /game.",
  awardsTooSoon: (games: string) =>
    `Ещё ${games} — и награды появятся. Хронология уже готова: /stats_chronology`,

  awardsTitle: "НАГРАДЫ",
  awardsCurseLabel: "ПРОКЛЯТИЕ СТОЛА",
  betweenWinners: " и ",
  everyWinner: "Весь стол",

  awardTitles: {
    king: "КОРОЛЬ СТОЛА",
    wireToWire: "ВПЕРЕДИ ВЕСЬ ВЕЧЕР",
    theFavourite: "ФАВОРИТ",
    hatTrick: "ХЕТ-ТРИК",
    homeAdvantage: "С ПЕРВОГО ХОДА",
    untouchable: "ЧИСТЫЙ ЛИСТ",
    teflon: "НЕ ГОРИТ",
    hotSeat: "ГОРЯЧИЙ СТУЛ",
    theComeback: "ВОЗВРАЩЕНИЕ",
    theLadder: "В ГОРУ",
    sweetRevenge: "СЛАДКАЯ МЕСТЬ",
    ironSeat: "ЖЕЛЕЗНЫЙ СТУЛ",
    theTruce: "ПЕРЕМИРИЕ",
    thePacifist: "ПАЦИФИСТ",
    theNemesis: "ЛИЧНЫЙ КОШМАР",
    theDoorman: "ШВЕЙЦАР",
    neverAsked: "НИ РАЗУ НЕ СПРОСИЛИ",
    theLatecomer: "С ОПОЗДАНИЕМ",
    revolvingDoor: "ТО ЕСТЬ, ТО НЕТ",
    theCameo: "КАМЕО",
    secondWind: "ВТОРОЕ ДЫХАНИЕ",
    theUnderstudy: "ВЕЧНЫЙ ДУБЛЁР",
    theFlatline: "БЕЗ ПРИКЛЮЧЕНИЙ",
    theInvisible: "НИ РЫБА НИ МЯСО",
    groundhogDay: "ДЕНЬ СУРКА",
    thePendulum: "МАЯТНИК",
    theRollercoaster: "АМЕРИКАНСКИЕ ГОРКИ",
    allOrNothing: "ВСЁ ИЛИ НИЧЕГО",
    theIrishGoodbye: "АНГЛИЙСКИЙ УХОД",
    theAnchor: "У САМОГО ДНА",
    theSlide: "ПОД ГОРУ",
    falseDawn: "РАНО РАДОВАТЬСЯ",
    openersCurse: "ПРОКЛЯТИЕ ПЕРВОГО ХОДА",
    encore: "НА БИС",
    firstBlood: "ПЕРВАЯ КРОВЬ",
    foolOfTheNight: "ДУРАК ВЕЧЕРА",
  },

  kingReason: (percent: number, games: string) =>
    `${percent}% соперников позади за ${games}. Выше не сидел никто.`,
  kingPassedReason: (percent: number, games: string) =>
    `${percent}% соперников позади за ${games}. Выше сидел только дурак вечера.`,
  wireToWireReason: (games: string) =>
    `Впереди на графике после каждой партии, кроме первой, за ${games}.`,
  favouriteReason: (firsts: number, games: string) =>
    `Первое место в ${firsts} из ${games}. Остальные играли за второе.`,
  hatTrickReason: (games: string) => `${games} подряд — и каждый раз первым.`,
  homeAdvantageReason: (wins: number, opens: number) =>
    `Первых ходов — ${opens}, и в ${wins} из них первое место.`,
  untouchableReason: (games: string) => `${games} — и ни разу дураком. Ни единого пятна.`,
  teflonReason: (streak: string) =>
    `После дурака — ${streak} подряд начисто. Лучшая серия вечера.`,
  hotSeatReason: (opens: number) => `Первых ходов — ${opens}, и ни одного проигранного.`,
  comebackReason: (sank: number, percent: number) =>
    `К середине — дно графика и ${sank}%, сейчас — ${percent}%.`,
  ladderReason: (games: string) => `${games} подряд — каждая следующая лучше предыдущей.`,
  sweetRevengeReason: (times: string, comebacks: number) =>
    `Дураком — ${times}, и в ${comebacks} следом первое место.`,
  ironSeatReason: (games: string) => `Ни одной пропущенной партии из ${games}. Никто больше не досидел.`,
  truceReason: (draws: number, games: string) => `${draws} из ${games}, где не проиграл никто.`,
  pacifistReason: (draws: string) =>
    `Во всех ${draws}, которые кончились вничью. Ни одного проигравшего в одиночку.`,
  nemesisReason: (over: string) =>
    `Выше одного и того же соперника во всех ${over} на двоих.`,
  doormanReason: (opens: number, games: string) =>
    `Первых ходов — ${opens} из ${games}. Ход всё возвращался.`,
  neverAskedReason: (games: string) => `${games} — и ни разу не выпало ходить первым.`,
  latecomerReason: (joinedAt: number, percent: number) =>
    `В игре с партии ${joinedAt} — и всё равно ${percent}%.`,
  revolvingDoorReason: (missed: string, games: string) =>
    `Партий — ${games}, пропущено ${missed} в середине вечера.`,
  cameoReason: (games: string) => `Одна партия из ${games} — и всё.`,
  secondWindReason: (burnedBy: number, games: string) =>
    `Дураком в партии ${burnedBy} — и больше ни разу за ${games}.`,
  understudyReason: (times: string, games: string) =>
    `Второе место ${times} за ${games}, первое — ни разу.`,
  flatlineReason: (band: number, games: string) =>
    `От середины стола — не дальше ${band}% за ${games}.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} из ${games} — ни верх, ни низ.`,
  groundhogReason: (place: number, games: string) =>
    `${games} подряд — одно и то же место: ${place}.`,
  pendulumReason: (games: string) =>
    `${games} подряд — то верхняя половина, то нижняя, через раз.`,
  rollercoasterReason: (swing: number, games: string) =>
    `За ${games} качало на ${swing}% — от лучшего к худшему и обратно.`,
  allOrNothingReason: (edges: number, games: string) =>
    `${edges} из ${games} — либо первым, либо дураком. Середина для трусов.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `Уход на партии ${leftAfter} из ${games} — и дураком больше ни разу.`,
  anchorReason: (games: string) => `${games} в нижней половине — и ни разу дураком.`,
  slideReason: (games: string) => `${games} подряд — каждая следующая хуже предыдущей.`,
  falseDawnReason: (ledAt: number, percent: number) =>
    `Во главе графика на партии ${ledAt}; с тех пор — ${percent}%.`,
  openersCurseReason: (opens: number, burns: number) =>
    `Первых ходов — ${opens}, и дураком в ${burns} из них.`,
  encoreReason: (games: string) => `${games} подряд — дураком. На бис никто не просил.`,
  firstBloodReason: (games: string) => `Дурак первой партии из ${games}. Вечер начался плохо.`,
  foolReason: (fools: number, games: string) =>
    `Дураком в ${fools} из ${games}. Чаще всех за вечер.`,
  curseFact: (burns: number, games: string, predicted: number) =>
    `в ${burns} из ${games} дураком оставался тот, кто ходил первым — место предсказывает ${predicted}.`,

  sheetEyebrow: "ЖУРНАЛ ВЕЧЕРА",
  sheetTitle: "ХРОНОЛОГИЯ",
  sheetGridLabel: "ПАРТИЯ ЗА ПАРТИЕЙ",
  sheetGridHint: "колонки — в порядке рассадки · в клетке занятое место",
  sheetShareLabel: "ВЫШЕ СОПЕРНИКОВ",
  sheetShareHint: "50% — половина стола · 100% — первым в каждой партии",
  sheetLegendLabel: "ЛУЧШИЕ СВЕРХУ",

  sheetGameForms: { one: "партия", few: "партии", many: "партий" },
  sheetPlayerForms: { one: "игрок", few: "игрока", many: "игроков" },

  sheetKeyDrawn: "ничья за последнее",
  sheetKeyFool: "дурак",
  sheetKeyAbsent: "пропуск",

  sheetSubtitle: (games: string, players: string) => `${games} · ${players}`,
  sheetTableShows: (tally: string) => `таблица ниже показывает последние ${tally}`,
  moreGamesForAwards: (games: string) => `Отыграйте ещё ${games} — и у вечера будут награды.`,

  commandPersonal: "Карточка одного игрока",
  helpPersonal: "/personal — карточка игрока за всё время в этом чате",

  personalPick: "Чья карточка?",
  personalNobody: "Здесь ещё не доиграли ни одной партии. Начните с /game.",
  personalStale: "Этот экран остался от старой версии бота",
  personalPicked: (name: string) => `Карточка: ${name}`,

  personalEyebrow: "КАРТОЧКА ИГРОКА",
  personalSince: (date: string) => `с ${date}`,
  personalSubtitle: (games: string, evenings: string) => `${games} · ${evenings}`,
  sheetEveningForms: { one: "вечер", few: "вечера", many: "вечеров" },
  sheetEveningsOwedForms: { one: "вечер", few: "вечера", many: "вечеров" },
  sheetTimeForms: { one: "раз", few: "раза", many: "раз" },

  tileShare: "ВЫШЕ СОПЕРНИКОВ",
  tileShareFloor: "0% — последним в каждой партии",
  tileShareCeiling: "100% — первым в каждой партии",
  tileFool: "ДУРАК",
  tileFirst: "ПЕРВОЕ МЕСТО",
  tileFirstMove: "ПЕРВЫЙ ХОД",
  tileOutOf: (part: number, whole: number) => `${part} из ${whole}`,
  tileOutOfDecided: (part: number, decided: number) =>
    `${part} из ${decided}, где был дурак`,
  tileSeatPredicts: (expected: string) => `место предсказывает ${expected}`,

  personalChartLabel: "ВЫШЕ СОПЕРНИКОВ ПО ВЕЧЕРАМ",
  personalChartArrives: (evenings: string) => `График появится через ${evenings}.`,
  personalBestEvening: "лучший вечер",
  personalWorstEvening: "худший вечер",

  personalFactsLabel: "ЧТО ЗАПОМНИЛОСЬ",
  personalFactsAwait: "Пока ничего — нужно больше партий.",
  factTitles: {
    theBlinder: "ВЕЧЕР В УДАРЕ",
    theNightmare: "КОШМАРНЫЙ ВЕЧЕР",
    theCharm: "СЧАСТЛИВЫЙ ТАЛИСМАН",
    theJinx: "ЧЁРНАЯ КОШКА",
    thePatsy: "ЛЁГКАЯ ДОБЫЧА",
    theBogey: "НЕУДОБНЫЙ СОПЕРНИК",
    bigTableCharm: "ЕСТЬ ГДЕ РАЗВЕРНУТЬСЯ",
    bigTableCurse: "ТЕРЯЕТСЯ В ТОЛПЕ",
    openersGift: "ДАР ПЕРВОГО ХОДА",
    openersCurse: "ПРОКЛЯТИЕ ПЕРВОГО ХОДА",
    theHomecoming: "ВОЗВРАЩЕНИЕ",
    neverWentFirst: "НИ РАЗУ НЕ ХОДИЛ ПЕРВЫМ",
    theHeadStart: "ВЕЧНО ХОДИТ ПЕРВЫМ",
    theBadPatch: "ЧЁРНАЯ ПОЛОСА",
    theCleanRun: "ЧИСТАЯ СЕРИЯ",
    theSurvivor: "ВЫХОДИТ СУХИМ",
    lightningRod: "ГРОМООТВОД",
    everPresent: "НИ ОДНОГО ПРОПУСКА",
    foundingMember: "С САМОГО НАЧАЛА",
    theNewcomer: "НОВИЧОК",
  },
  blinderReason: (times: string, games: string) =>
    `Первое место ${times} за ${games} — лучший вечер в карьере.`,
  nightmareReason: (times: string, games: string) =>
    `Дурак ${times} за ${games}. Не шло ничего.`,
  charmReason: (burns: number, games: string, usual: string) =>
    `Всего ${burns} пожаров за ${games} вместе; обычно у тебя ${usual}.`,
  jinxReason: (burns: number, games: string, usual: string) =>
    `${burns} пожаров за ${games} вместе; обычно у тебя ${usual}.`,
  patsyReason: (won: number, duels: string) =>
    `Оставались в конце вдвоём ${duels} — и в ${won} дурак был не твой.`,
  bogeyReason: (lost: number, duels: string) =>
    `Оставались в конце вдвоём ${duels} — и в ${lost} дурак был твой.`,
  tableCharmReason: (burns: number, games: string) =>
    `${burns} пожаров за ${games} таким составом. Большой стол тебе к лицу.`,
  tableCurseReason: (burns: number, games: string) =>
    `${burns} пожаров за ${games} таким составом. Больше, чем просит место.`,
  atTableOf: (seats: number) => `стол на ${seats}`,
  firstMoveGiftReason: (firsts: number) => `И первое место в ${firsts} из них.`,
  firstMoveCurseReason: (burns: number) => `И дурак в ${burns} из них.`,
  homecomingReason: (missed: string) => `Возвращение за стол после ${missed}.`,
  neverWentFirstHolder: (games: string) => `${games}, ни разу`,
  neverWentFirstReason: "Первый ход так ни разу тебе и не достался.",
  headStartReason: (games: string) => `Из ${games} — куда чаще, чем даёт место за столом.`,
  badPatchHolder: (games: string) => `${games} в огне`,
  betweenDates: (from: string, until: string) => `С ${from} по ${until}.`,
  cleanRunHolder: (games: string) => `${games} начисто`,
  survivorReason: (games: string, expected: string) =>
    `За ${games} одно только место предсказывает ${expected}. У тебя вышло меньше.`,
  lightningRodReason: (games: string, expected: string) =>
    `За ${games} одно только место предсказывает ${expected}. У тебя вышло больше.`,
  everPresentReason: "За этим столом не было ни одного вечера без тебя.",
  foundingReason: (evenings: string) => `Первый вечер в записях, ${evenings} назад.`,
  newcomerReason: (evenings: string) => `${evenings} за плечами. Стол ещё присматривается.`,

  months: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
  sheetDate: (day: string, month: string, year: string) => `${day} ${month} ${year}`,
};
