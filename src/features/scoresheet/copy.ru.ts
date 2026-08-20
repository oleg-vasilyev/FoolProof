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
    wireToWire: "ОТ ФЛАЖКА ДО ФЛАЖКА",
    theFavourite: "ФАВОРИТ",
    hatTrick: "ХЕТ-ТРИК",
    homeAdvantage: "СВОЁ ПОЛЕ",
    untouchable: "ЧИСТЫЙ ЛИСТ",
    teflon: "ТЕФЛОН",
    hotSeat: "ГОРЯЧИЙ СТУЛ",
    theComeback: "ВОЗВРАЩЕНИЕ",
    theLadder: "ЛЕСТНИЦА",
    sweetRevenge: "СЛАДКАЯ МЕСТЬ",
    ironSeat: "ЖЕЛЕЗНЫЙ СТУЛ",
    theTruce: "ПЕРЕМИРИЕ",
    thePacifist: "ПАЦИФИСТ",
    theNemesis: "ЛИЧНЫЙ КОШМАР",
    theDoorman: "ШВЕЙЦАР",
    neverAsked: "НИ РАЗУ НЕ СПРОСИЛИ",
    theLatecomer: "ОПОЗДАВШИЙ",
    revolvingDoor: "ВЕРТУШКА",
    theCameo: "КАМЕО",
    secondWind: "ВТОРОЕ ДЫХАНИЕ",
    theUnderstudy: "ВЕЧНЫЙ ДУБЛЁР",
    theFlatline: "РОВНАЯ ЛИНИЯ",
    theInvisible: "НЕВИДИМКА",
    groundhogDay: "ДЕНЬ СУРКА",
    thePendulum: "МАЯТНИК",
    theRollercoaster: "АМЕРИКАНСКИЕ ГОРКИ",
    allOrNothing: "ВСЁ ИЛИ НИЧЕГО",
    theIrishGoodbye: "АНГЛИЙСКИЙ УХОД",
    theAnchor: "ЯКОРЬ",
    theSlide: "СКОЛЬЗЯЩИЙ ВНИЗ",
    falseDawn: "ЛОЖНЫЙ РАССВЕТ",
    openersCurse: "ПРОКЛЯТИЕ ПЕРВОГО ХОДА",
    encore: "НА БИС",
    firstBlood: "ПЕРВАЯ КРОВЬ",
    foolOfTheNight: "ДУРАК ВЕЧЕРА",
  },

  kingReason: (percent: number, games: string) =>
    `${percent}% стола за ${games}. Выше не сидел никто.`,
  kingPassedReason: (percent: number, games: string) =>
    `${percent}% стола за ${games}. Выше сидел только дурак вечера.`,
  wireToWireReason: (games: string) =>
    `Впереди на графике после каждой партии, кроме первой, все ${games}.`,
  favouriteReason: (firsts: number, games: string) =>
    `Первым вышел в ${firsts} из ${games}. Остальные играли за второе место.`,
  hatTrickReason: (run: number) => `${run} подряд — и каждый раз первым.`,
  homeAdvantageReason: (wins: number, opens: number) =>
    `Ходил первым ${opens} раз и в ${wins} из них вышел первым.`,
  untouchableReason: (games: string) => `${games} — и ни разу дураком. Ни единого пятна.`,
  teflonReason: (streak: number) =>
    `${streak} подряд начисто — уже побывав дураком. Лучшая серия вечера.`,
  hotSeatReason: (opens: number) => `Ходил первым ${opens} раз и ни разу за это не поплатился.`,
  comebackReason: (sank: number, percent: number) =>
    `К середине — дно графика и ${sank}%, сейчас — ${percent}%.`,
  ladderReason: (run: number) => `${run} партий подряд — каждая следующая лучше предыдущей.`,
  sweetRevengeReason: (fools: number, comebacks: number) =>
    `Дураком — ${fools}, и в ${comebacks} из них следом вышел первым.`,
  ironSeatReason: (games: string) => `Ни одной пропущенной партии из ${games}. Никто больше не досидел.`,
  truceReason: (draws: number, games: string) => `${draws} из ${games}, где не проиграл никто.`,
  pacifistReason: (draws: string) =>
    `Во всех ${draws}, которые кончились вничью. Один за всё не отвечал ни разу.`,
  nemesisReason: (over: string) =>
    `Финишировал выше одного и того же соперника во всех ${over} на двоих.`,
  doormanReason: (opens: number, games: string) =>
    `Ходил первым ${opens} раз из ${games}. Ход всё возвращался.`,
  neverAskedReason: (games: string) => `${games} — и ни разу не выпало ходить первым.`,
  latecomerReason: (joinedAt: number, percent: number) =>
    `Пришёл к партии ${joinedAt} — и всё равно ${percent}%.`,
  revolvingDoorReason: (missed: string, games: string) =>
    `Сыграл ${games}, пропустив ${missed} в середине вечера.`,
  cameoReason: (games: string) => `Одна партия из ${games} — и всё.`,
  secondWindReason: (burnedBy: number, games: string) =>
    `Дураком к партии ${burnedBy} — и больше ни разу за ${games}.`,
  understudyReason: (seconds: number, games: string) =>
    `Вторым вышел ${seconds} раз за ${games}, первым — ни разу.`,
  flatlineReason: (band: number, games: string) =>
    `Ни разу не отошёл от середины стола дальше чем на ${band} пунктов за ${games}.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} из ${games} — ни верх, ни низ.`,
  groundhogReason: (place: number, run: number) =>
    `${run} партий подряд — одно и то же место: ${place}.`,
  pendulumReason: (run: number) =>
    `${run} подряд — то верхняя половина, то нижняя, через раз.`,
  rollercoasterReason: (swing: number, games: string) =>
    `${swing} пунктов между лучшим и худшим за ${games}.`,
  allOrNothingReason: (edges: number, games: string) =>
    `${edges} из ${games} — либо первым, либо дураком. Середина для трусов.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `Ушёл на партии ${leftAfter} из ${games} — и дураком больше ни разу.`,
  anchorReason: (games: string) => `${games} в нижней половине стола — и ни разу дураком.`,
  slideReason: (run: number) => `${run} партий подряд — каждая следующая хуже предыдущей.`,
  falseDawnReason: (ledAt: number, percent: number) =>
    `Вёл график на партии ${ledAt}; с тех пор — ${percent}%.`,
  openersCurseReason: (opens: number, burns: number) =>
    `Первых ходов — ${opens}, и дураком в ${burns} из них.`,
  encoreReason: (run: number) => `${run} подряд — дураком. На бис никто не просил.`,
  firstBloodReason: (games: string) => `Дурак первой партии из ${games}. Вечер начался плохо.`,
  foolReason: (fools: number, games: string) =>
    `Дураком в ${fools} из ${games}. Хуже не сыграл никто.`,
  curseFact: (burns: number, games: string) =>
    `в ${burns} из ${games} дураком оставался ходивший первым.`,

  sheetEyebrow: "ЖУРНАЛ ВЕЧЕРА",
  sheetTitle: "ХРОНОЛОГИЯ",
  sheetGridLabel: "ПАРТИЯ ЗА ПАРТИЕЙ",
  sheetGridHint: "колонки — в порядке рассадки · в клетке занятое место",
  sheetShareLabel: "ДОЛЯ СТОЛА",
  sheetShareHint: "50% — середина стола · 100% — победа в каждой партии",
  sheetLegendLabel: "ПО ДОЛЕ СТОЛА",

  sheetGameForms: { one: "партия", few: "партии", many: "партий" },
  sheetPlayerForms: { one: "игрок", few: "игрока", many: "игроков" },

  sheetKeyDrawn: "ничья",
  sheetKeyFool: "дурак",
  sheetKeyAbsent: "пропуск",

  sheetSubtitle: (games: string, players: string) => `${games} · ${players}`,
  sheetTableShows: (tally: string) => `таблица ниже показывает последние ${tally}`,
  moreGamesForAwards: (games: string) => `Отыграйте ещё ${games} — и у вечера будут награды.`,

  commandPersonal: "Карточка одного игрока",
  helpPersonal: "/personal — карточка игрока за всё время, что он играл",

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

  tileGames: "ПАРТИЙ",
  tileEvenings: "ВЕЧЕРОВ",
  tileShare: "ДОЛЯ СТОЛА",
  tileShareNote: "50% — середина стола",
  tileFool: "ОСТАВАЛСЯ ДУРАКОМ",
  tileFirst: "ВЫХОДИЛ ПЕРВЫМ",
  tileDealt: "ПЕРВЫЙ ХОД",
  tileTimesExpected: (times: string, expected: string) => `${times} · ожидаемо ${expected}`,

  personalChartLabel: "ДОЛЯ СТОЛА ПО ВЕЧЕРАМ",
  personalChartArrives: (evenings: string) => `появится через ${evenings}`,
  personalBestEvening: "лучший вечер",
  personalWorstEvening: "худший вечер",

  personalFactsLabel: "ЧТО ЗАПОМНИЛОСЬ",
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
    neverDealt: "НИ РАЗУ НЕ ХОДИЛ ПЕРВЫМ",
    theHeadStart: "ВЕЧНО ХОДИТ ПЕРВЫМ",
    theBadPatch: "ЧЁРНАЯ ПОЛОСА",
    theCleanRun: "ЧИСТАЯ СЕРИЯ",
    theSurvivor: "ВЫХОДИТ СУХИМ",
    lightningRod: "ГРОМООТВОД",
    everPresent: "НЕ ПРОПУСТИЛ НИ ОДНОГО",
    foundingMember: "С САМОГО НАЧАЛА",
    theNewcomer: "НОВИЧОК",
  },
  blinderReason: (firsts: number, games: string) =>
    `Вышел первым ${firsts} раз за ${games} — лучший вечер в карьере.`,
  nightmareReason: (burns: number, games: string) =>
    `Дурак ${burns} раз за ${games}. Не шло ничего.`,
  charmReason: (burns: number, games: string, usual: string) =>
    `Всего ${burns} пожаров за ${games} рядом с ним; обычно у тебя ${usual}.`,
  jinxReason: (burns: number, games: string, usual: string) =>
    `${burns} пожаров за ${games} рядом с ним; обычно у тебя ${usual}.`,
  patsyReason: (won: number, duels: string) =>
    `Оставались в конце вдвоём ${duels} — ты ушёл сухим из ${won}.`,
  bogeyReason: (lost: number, duels: string) =>
    `Оставались в конце вдвоём ${duels} — ты сгорел в ${lost}.`,
  tableCharmReason: (burns: number, games: string) =>
    `${burns} пожаров за ${games} таким составом. Большой стол тебе к лицу.`,
  tableCurseReason: (burns: number, games: string) =>
    `${burns} пожаров за ${games} таким составом. Больше, чем просит место.`,
  atTableOf: (seats: number) => `стол на ${seats}`,
  dealtGiftReason: (firsts: number) => `И вышел первым в ${firsts} из них.`,
  dealtCurseReason: (burns: number) => `И сгорел в ${burns} из них.`,
  homecomingReason: (missed: string) => `Вернулся за стол, пропустив ${missed}.`,
  neverDealtHolder: (games: string) => `${games}, ни разу`,
  neverDealtReason: "Первый ход так ни разу тебе и не достался.",
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
