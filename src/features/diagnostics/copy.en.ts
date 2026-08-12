import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  commandStatus: "How the bot itself is doing",

  helpStatus: "/status — which database, how long it has been up, what went wrong",

  reportTitle: "Bot status",

  database: (file: string, size: string) => `Database: ${file} (${size})`,

  contents: (players: string, games: string, liveCards: number) =>
    `Recorded: ${players}, ${games}, ${liveCards} live`,

  lastGame: (at: string) => `Last game: ${at} UTC`,

  noGamesYet: "Last game: none yet",

  chats: (all: number, played: number, fresh: number) =>
    `Chats: ${all} in all, ${played} played in the last week, ${fresh} first seen in it`,

  games: (day: number, week: number) =>
    `Games: ${day} in the last day, ${week} in the last week`,

  languages: (russian: number, english: number, silent: number) =>
    `Language: ${russian} chose Russian, ${english} chose English, ${silent} never asked`,

  version: (version: string) => `Version: ${version}`,

  versionUnknown: "Version: unreadable",

  uptime: (duration: string) => `Up for ${duration}`,

  firstStart: "This is the first start since the supervisor came up",

  restarted: (attempt: number, previousExit: string) =>
    `Start #${attempt} — the one before it ended with ${previousExit}`,

  problemTally: (warnings: string, errors: string) => `Since this start: ${warnings}, ${errors}`,

  noProblems: "Since this start: nothing went wrong",

  callTally: (retries: string, limits: string, refusals: string) =>
    `Telegram: ${retries}, ${limits}, ${refusals}`,

  noCallTrouble: "Telegram: nothing needed retrying",

  slowestPoster: (seconds: string) => `Slowest poster: ${seconds}`,

  recentProblems: "Latest:",

  playerForms: { one: "player", few: "players", many: "players" },
  gameForms: { one: "game", few: "games", many: "games" },
  warningForms: { one: "warning", few: "warnings", many: "warnings" },
  errorForms: { one: "error", few: "errors", many: "errors" },
  retryForms: { one: "retry", few: "retries", many: "retries" },
  limitForms: { one: "rate limit", few: "rate limits", many: "rate limits" },
  refusalForms: { one: "refusal", few: "refusals", many: "refusals" },

  units: {
    days: "d",
    hours: "h",
    minutes: "m",
    seconds: "s",
    kilobytes: "KB",
    megabytes: "MB",
    decimal: ".",
  },
};

export type Copy = typeof copy;
