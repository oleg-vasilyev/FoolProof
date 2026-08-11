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
    `Для наград ещё рано — нужно ${games}. Хронология уже готова: /stats_chronology`,

  awardsTitle: "НАГРАДЫ",
  awardsCurseLabel: "ПРОКЛЯТИЕ СТОЛА",
  betweenWinners: " и ",
  everyWinner: "весь стол",

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
    fullHouse: "ПОЛНЫЙ СОСТАВ",
    ironSeat: "ЖЕЛЕЗНЫЙ СТУЛ",
    theRotation: "КРУГ ЗАМКНУЛСЯ",
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
  ladderReason: (run: number) => `${run} партий подряд — каждая лучше предыдущей.`,
  sweetRevengeReason: (fools: number, comebacks: number) =>
    `Дураком — ${fools}, и в ${comebacks} из них следом вышел первым.`,
  fullHouseReason: (players: string, games: string) =>
    `Все ${players} отсидели все ${games}. Не пропустил никто.`,
  ironSeatReason: (games: string) => `Ни одной пропущенной партии из ${games}. Никто больше не досидел.`,
  rotationReason: (players: string, games: string) =>
    `За ${games} дураком успел побывать каждый из ${players}.`,
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
    `Пропустил ${missed} в середине вечера и вернулся ещё на ${games}.`,
  cameoReason: (games: string) => `Одна партия из ${games} — и всё.`,
  secondWindReason: (burnedBy: number, games: string) =>
    `Дураком к партии ${burnedBy} — и больше ни разу за ${games}.`,
  understudyReason: (seconds: number, games: string) =>
    `Вторым вышел ${seconds} раз за ${games}, первым — ни разу.`,
  flatlineReason: (band: number, games: string) =>
    `Ни разу не отошёл от середины стола дальше чем на ${band} пунктов за ${games}.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} из ${games} — тихо, в середине.`,
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
  slideReason: (run: number) => `${run} партий подряд — каждая хуже предыдущей.`,
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
  sheetOmitted: (games: number) => `первые ${games} не показаны`,

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
