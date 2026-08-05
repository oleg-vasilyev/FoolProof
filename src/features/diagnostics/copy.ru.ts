import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#diagnostics/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandStatus: "Как себя чувствует сам бот",

  helpStatus: "/status — какая база, сколько работает, что ломалось",

  reportTitle: "Состояние бота",

  database: (file: string, size: string) => `База: ${file} (${size})`,

  contents: (players: string, games: string, liveCards: number) =>
    `Записано: ${players}, ${games}, на столе: ${liveCards}`,

  lastGame: (at: string) => `Последняя партия: ${at} UTC`,

  noGamesYet: "Последняя партия: пока ни одной",

  uptime: (duration: string) => `В строю ${duration}`,

  firstStart: "Это первый запуск с тех пор, как поднялся супервизор",

  restarted: (attempt: number, previousExit: string) =>
    `Запуск №${attempt} — предыдущий закончился так: ${previousExit}`,

  logLevel: (level: string) => `Уровень логов: ${level}`,

  problemTally: (warnings: string, errors: string) => `С этого запуска: ${warnings}, ${errors}`,

  noProblems: "С этого запуска: ничего не сломалось",

  recentProblems: "Последнее:",

  playerForms: { one: "игрок", few: "игрока", many: "игроков" },
  gameForms: { one: "партия", few: "партии", many: "партий" },
  warningForms: { one: "предупреждение", few: "предупреждения", many: "предупреждений" },
  errorForms: { one: "ошибка", few: "ошибки", many: "ошибок" },

  units: { days: "д", hours: "ч", minutes: "мин", kilobytes: "КБ", megabytes: "МБ" },
};
