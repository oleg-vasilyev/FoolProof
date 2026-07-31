export const copy = {
  commandStatus: "How the bot itself is doing",

  helpStatus: "/status — which database, how long it has been up, what went wrong",

  reportTitle: "Bot status",

  database: (file: string, size: string) => `Database: ${file} (${size})`,

  contents: (players: string, games: string, liveCards: number) =>
    `Recorded: ${players}, ${games}, ${liveCards} live`,

  lastGame: (at: string) => `Last game: ${at} UTC`,

  noGamesYet: "Last game: none yet",

  uptime: (duration: string) => `Up for ${duration}`,

  firstStart: "This is the first start since the supervisor came up",

  restarted: (attempt: number, previousExit: string) =>
    `Start #${attempt} — the one before it ended with ${previousExit}`,

  logLevel: (level: string) => `Log level: ${level}`,

  problemTally: (warnings: string, errors: string) => `Since this start: ${warnings}, ${errors}`,

  noProblems: "Since this start: nothing went wrong",

  recentProblems: "Latest:",
} as const;
