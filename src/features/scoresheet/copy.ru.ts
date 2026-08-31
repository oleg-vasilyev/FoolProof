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

  statsEmpty: "Пока ничего не записано. Начните партию: /game.",
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
    teflon: "ДУРАК НЕ ЛИПНЕТ",
    hotSeat: "ГОРЯЧИЙ СТУЛ",
    theComeback: "ВОЗВРАЩЕНИЕ",
    theLadder: "ВОСХОЖДЕНИЕ",
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
    theViceroy: "ВИЦЕ-КОРОЛЬ",
    theKingslayer: "ОБИДЧИК КОРОЛЯ",
    theLastStand: "ПОСЛЕДНИЙ РУБЕЖ",
    theirHour: "СВОЙ ЧАС",
    theHalfNight: "НЕ ВЕСЬ ВЕЧЕР",
    personalBest: "ЛИЧНЫЙ РЕКОРД",
    firstCleanNight: "ВПЕРВЫЕ ЧИСТО",
    firstWin: "ПЕРВАЯ ПОБЕДА",
    newAtTheTable: "НОВИЧОК ЗА СТОЛОМ",
    foolOfTheNight: "ДУРАК ВЕЧЕРА",
  },

  kingReason: (percent: number, games: string) =>
    `${percent}% соперников позади за ${games} — лучший итог вечера.`,
  wireToWireReason: (games: string) =>
    `Впереди на графике весь вечер, партия за партией, все ${games}.`,
  favouriteReason: (firsts: number, games: string) =>
    `Первое место в ${firsts} из ${games}. Остальные играли за второе.`,
  hatTrickReason: (games: string) => `${games} подряд — и каждый раз первое место.`,
  homeAdvantageReason: (wins: number, opens: number) =>
    `Первых ходов — ${opens}, и в ${wins} из них первое место.`,
  untouchableReason: (games: string) => `${games} — и ни разу дураком.`,
  teflonReason: (streak: string) =>
    `Дураком ни разу за ${streak} подряд — лучшая серия вечера.`,
  hotSeatReason: (opens: number) => `Первых ходов — ${opens}, и дураком ни в одном из них.`,
  comebackReason: (sank: number, percent: number) =>
    `С ${sank}% в середине вечера до ${percent}% к концу. Ниже в тот момент не сидел никто.`,
  ladderReason: (games: string) => `${games} подряд — каждая следующая лучше предыдущей.`,
  sweetRevengeReason: (times: string, comebacks: string) =>
    `Дураком — ${times}, и ${comebacks} следом первое место.`,
  ironSeatReason: (games: string) =>
    `${games} от первой до последней. Никто больше не досидел.`,
  truceReason: (draws: number, games: string) => `${draws} из ${games}, где не проиграл никто.`,
  pacifistReason: (draws: string) =>
    `${draws} за вечер закончились ничьей — и ни одна без этого игрока.`,
  nemesisReason: (over: string) =>
    `${over} с одним и тем же соперником — и ни разу позади.`,
  doormanReason: (opens: number, games: string) =>
    `Первых ходов — ${opens} из ${games}. Ход всё возвращался.`,
  neverAskedReason: (games: string) => `${games} — и первый ход ни разу не выпал.`,
  latecomerReason: (joinedAt: number, percent: number) =>
    `В игре только с партии ${joinedAt} — и уже ${percent}% соперников позади.`,
  revolvingDoorReason: (missed: number, games: string) =>
    `Сыграно ${games} — и ${missed} пропущено в середине вечера.`,
  cameoReason: (games: string) => `Одна из ${games} — и всё.`,
  secondWindReason: (burnedBy: number, games: string) =>
    `Дураком в партии ${burnedBy} — и больше ни разу за ${games}.`,
  understudyReason: (times: string, games: string) =>
    `Второе место ${times} за ${games}, первое — ни разу.`,
  flatlineReason: (band: number, games: string) =>
    `Все ${games} — не дальше ${band}% от середины стола.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} из ${games} — ни верх, ни низ.`,
  groundhogReason: (place: number, games: string) =>
    `${games} подряд — место ${place}, и никакое другое.`,
  pendulumReason: (games: string) =>
    `${games} подряд — то верхняя половина, то нижняя, через раз.`,
  rollercoasterReason: (swing: number, games: string) =>
    `За ${games} качало на ${swing}% — между верхней и нижней точкой графика.`,
  allOrNothingReason: (edges: number, games: string) =>
    `${edges} из ${games} — первое место или дурак. Середина для трусов.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `Ушли раньше всех — после ${leftAfter}-й из ${games}.`,
  anchorReason: (games: string) => `${games} в нижней половине — и ни разу дураком.`,
  slideReason: (games: string) => `${games} подряд — каждая следующая хуже предыдущей.`,
  falseDawnReason: (ledAt: number, percent: number) =>
    `На партии ${ledAt} — во главе стола. К концу позади только ${percent}% соперников.`,
  openersCurseReason: (opens: number, burns: number) =>
    `Первых ходов — ${opens}, и дураком в ${burns} из них.`,
  encoreReason: (games: string) => `${games} подряд — дураком. На бис никто не просил.`,
  viceroyReason: (percent: number, games: string) =>
    `${percent}% соперников позади за ${games}. Выше — только король стола.`,
  kingslayerReason: (over: string, games: string) =>
    `Выше короля стола — ${over} из ${games}, чаще всех за столом.`,
  theirHourReason: (times: string, games: string) =>
    `Первое место ${times} из ${games} — при доле ниже средней за столом.`,
  lastStandReason: (duels: string, games: string) =>
    `Последняя пара — ${duels} из ${games}, и дураком всякий раз другой.`,
  halfNightReason: (games: string, rounds: number) =>
    `Всего ${games} из ${rounds} — и всё равно выше среднего по столу.`,
  personalBestReason: (percent: number, evenings: string) =>
    `${percent}% — рекорд за всё время. За плечами ${evenings}.`,
  firstCleanNightReason: (games: string, evenings: string) =>
    `${games} — и ни разу дураком. До этого ${evenings} без единого чистого.`,
  firstWinReason: (evenings: string) => `Первое место — впервые. До этого ${evenings} без единого.`,
  newAtTheTableReason: (games: string) => `Первый вечер за этим столом, и сразу ${games}.`,
  firstBloodReason: "Дурак первой партии вечера.",
  foolReason: (fools: number, games: string) =>
    `Дураком в ${fools} из ${games}. Чаще всех за вечер.`,
  curseFact: (burns: number, games: string, predicted: number) =>
    `первым ходил будущий дурак — ${burns} из ${games}, а рассадка даёт ${predicted}.`,

  sheetEyebrow: "ЖУРНАЛ ВЕЧЕРА",
  sheetTitle: "ХРОНОЛОГИЯ",
  sheetGridLabel: "ПАРТИЯ ЗА ПАРТИЕЙ",
  sheetGridHint: "колонки — в порядке рассадки · в клетке занятое место",
  sheetShareLabel: "ВЫШЕ СОПЕРНИКОВ",
  sheetShareHint: "0% — последнее место · 100% — первое место в каждой партии",
  sheetLegendLabel: "ОТ ЛУЧШИХ К ХУДШИМ",

  sheetGameForms: { one: "партия", few: "партии", many: "партий" },
  sheetGameOfForms: { one: "партии", few: "партий", many: "партий" },
  sheetGameAcrossForms: { one: "партию", few: "партии", many: "партий" },
  sheetPlayerForms: { one: "игрок", few: "игрока", many: "игроков" },

  sheetKeyDrawn: "ничья",
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
  tileFool: "ДУРАК",
  tileFirst: "ПЕРВОЕ МЕСТО",
  tileFirstMove: "ПЕРВЫЙ ХОД",
  tileOutOf: (part: number, whole: number) => `${part} из ${whole}`,
  tileExpectationNote:
    "отметка на полосе — ожидаемый % для стола такого размера",

  personalChartLabel: "ВЫШЕ СОПЕРНИКОВ ПО ВЕЧЕРАМ",
  personalChartArrives: (evenings: string) => `График появится через ${evenings}.`,
  personalBestEvening: "лучший вечер",
  personalWorstEvening: "худший вечер",
  personalShortNight: (least: string) =>
    `бледная точка · вечер короче, чем ${least} — ни лучший, ни худший`,

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
    openersCurse: "ПЕРВЫЙ ХОД НЕ К ДОБРУ",
    theHomecoming: "СНОВА ЗА СТОЛОМ",
    neverWentFirst: "БЕЗ ПЕРВОГО ХОДА",
    theHeadStart: "ВЕЧНО ПЕРВЫЙ ХОД",
    theBadPatch: "ЧЁРНАЯ ПОЛОСА",
    theCleanRun: "ЧИСТАЯ СЕРИЯ",
    theSurvivor: "СУХИМ ИЗ ВОДЫ",
    lightningRod: "ГРОМООТВОД",
    everPresent: "НИ ОДНОГО ПРОПУСКА",
    foundingMember: "С САМОГО НАЧАЛА",
    theNewcomer: "НОВИЧОК",
  },
  blinderReason: (times: string, games: string) =>
    `Первое место ${times} за ${games} — и всё это за один вечер.`,
  nightmareReason: (times: string, games: string) =>
    `Дурак ${times} за ${games}. Не шло ничего.`,
  alongsideReason: (burns: number, games: string, usual: number) =>
    `Вместе сыграно ${games}, дураком из них ${burns} — обычно выходит ${usual}.`,
  patsyReason: (won: number, duels: string) =>
    `Оставались в конце вдвоём ${duels} — и в ${won} из них верх был за этим игроком.`,
  bogeyReason: (lost: number, duels: string) =>
    `Оставались в конце вдвоём ${duels} — и в ${lost} из них верх был за соперником.`,
  atSizeReason: (burns: number, games: string, usual: number) =>
    `За столом такого размера сыграно ${games}, дураком из них ${burns} — обычно ${usual}.`,
  atTableOf: (seats: number) => `стол на ${seats}`,
  firstMoveGiftReason: (firsts: number) => `И первое место в ${firsts} из них.`,
  firstMoveCurseReason: (burns: number) => `И дурак в ${burns} из них.`,
  homecomingReason: (missed: string) => `Обратно за стол — ${missed} спустя.`,
  neverWentFirstHolder: (games: string) => `${games}, ни разу`,
  neverWentFirstReason: "Первый ход так ни разу и не достался.",
  headStartReason: (games: string) => `Из ${games} — куда чаще, чем даёт рассадка.`,
  badPatchHolder: (games: string) => `${games} подряд дураком`,
  betweenDates: (from: string, until: string) => `С ${from} по ${until}.`,
  cleanRunHolder: (games: string) => `${games} начисто`,
  againstTheSeatReason: (games: string, expected: string, actual: string) =>
    `Из ${games} рассадка отводит дураку ${expected} — а вышло ${actual}.`,
  everPresentReason: "Ни одного пропущенного вечера за этим столом.",
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
