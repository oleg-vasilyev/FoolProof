import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#diagnostics/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandStatus: "Как себя чувствует сам бот",

  helpStatus: "/status — какая база, сколько работает, что ломалось",

  reportTitle: "Состояние бота",

  database: (file: string, size: string) => `База: ${file} (${size})`,

  contents: (players: string, games: string, liveCards: number) =>
    `Записано: ${players}, ${games}; на столе ещё ${liveCards}`,

  lastGame: (at: string) => `Последняя партия: ${at} UTC`,

  noGamesYet: "Последняя партия: пока ни одной",

  chats: (all: number, played: number, fresh: number) =>
    `Чаты: ${all} всего, ${played} играли за неделю, новых — ${fresh}`,

  games: (day: number, week: number) => `Партии: ${day} за сутки, ${week} за неделю`,

  languages: (russian: number, english: number, silent: number) =>
    `Язык: русский — ${russian}, английский — ${english}, не выбирали — ${silent}`,

  version: (version: string) => `Версия: ${version}`,

  versionUnknown: "Версия: не читается",

  uptime: (duration: string) => `В строю ${duration}`,

  firstStart: "Это первый запуск с тех пор, как поднялся супервизор",

  restarted: (attempt: number, previousExit: string) =>
    `Запуск №${attempt} — предыдущий закончился так: ${previousExit}`,

  problemTally: (warnings: string, errors: string) => `С этого запуска: ${warnings}, ${errors}`,

  noProblems: "С этого запуска: ничего не сломалось",

  callTally: (retries: string, limits: string, refusals: string) =>
    `Телеграм: ${retries}, ${limits}, ${refusals}`,

  noCallTrouble: "Телеграм: ничего не пришлось повторять",

  slowestPoster: (seconds: string) => `Самый долгий постер: ${seconds}`,

  recentProblems: "Последнее:",

  playerForms: { one: "игрок", few: "игрока", many: "игроков" },
  gameForms: { one: "партия", few: "партии", many: "партий" },
  warningForms: { one: "предупреждение", few: "предупреждения", many: "предупреждений" },
  errorForms: { one: "ошибка", few: "ошибки", many: "ошибок" },
  retryForms: { one: "повтор", few: "повтора", many: "повторов" },
  limitForms: { one: "лимит", few: "лимита", many: "лимитов" },
  refusalForms: { one: "отказ", few: "отказа", many: "отказов" },

  units: {
    days: "д",
    hours: "ч",
    minutes: "мин",
    seconds: "с",
    kilobytes: "КБ",
    megabytes: "МБ",
    decimal: ",",
  },
};
