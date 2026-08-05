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

  awardTitles: {
    king: "КОРОЛЬ СТОЛА",
    untouchable: "ЧИСТЫЙ ЛИСТ",
    teflon: "ТЕФЛОН",
    sweetRevenge: "СЛАДКАЯ МЕСТЬ",
    ironSeat: "ЖЕЛЕЗНЫЙ СТУЛ",
    theTruce: "ПЕРЕМИРИЕ",
    allOrNothing: "ВСЁ ИЛИ НИЧЕГО",
    theInvisible: "НЕВИДИМКА",
    theIrishGoodbye: "АНГЛИЙСКИЙ УХОД",
    encore: "НА БИС",
    dealersCurse: "ПРОКЛЯТИЕ РАЗДАЧИ",
    firstBlood: "ПЕРВАЯ КРОВЬ",
    foolOfTheNight: "ДУРАК ВЕЧЕРА",
  },

  kingReason: (percent: number, games: string) =>
    `${percent}% стола за ${games}. Выше не сидел никто.`,
  untouchableReason: (games: string) => `${games} — и ни разу дураком. Ни единого пятна.`,
  teflonReason: (streak: number) =>
    `${streak} подряд — и ни разу дураком. Лучшая чистая серия вечера.`,
  sweetRevengeReason: (fools: number, comebacks: number) =>
    `Дураком — ${fools}, и в ${comebacks} из них следом вышел первым.`,
  ironSeatReason: (games: string) => `Ни одной пропущенной партии из ${games}. Никто больше не досидел.`,
  truceReason: (draws: string, games: string) => `${draws} из ${games}, где не проиграл никто.`,
  allOrNothingReason: (edges: number, games: string) =>
    `${edges} из ${games} — либо первым, либо дураком. Середина для трусов.`,
  invisibleReason: (middles: number, games: string) =>
    `${middles} из ${games} — тихо, в середине.`,
  irishGoodbyeReason: (leftAfter: number, games: string) =>
    `Ушёл на партии ${leftAfter} из ${games} — и дураком больше ни разу.`,
  encoreReason: (run: number) => `${run} подряд — дураком. На бис никто не просил.`,
  dealersCurseReason: (deals: number, burns: number) =>
    `Раздач — ${deals}, и дураком в ${burns} из них.`,
  firstBloodReason: (games: string) => `Дурак первой партии из ${games}. Вечер начался плохо.`,
  foolReason: (fools: number, games: string) =>
    `Дураком в ${fools} из ${games}. Хуже не сыграл никто.`,
  curseFact: (burns: number, games: string) =>
    `в ${burns} из ${games} дураком оставался раздающий.`,

  sheetEyebrow: "ЖУРНАЛ ВЕЧЕРА",
  sheetTitle: "ХРОНОЛОГИЯ",
  sheetShareLabel: "ДОЛЯ СТОЛА",
  sheetShareHint: "50% — середина стола · 100% — победа в каждой партии",

  sheetGameForms: { one: "партия", few: "партии", many: "партий" },
  sheetPlayerForms: { one: "игрок", few: "игрока", many: "игроков" },

  sheetKeyPlaced: "выход",
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
