const MONTHS: readonly string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const strings = {
  commandStats: "How tonight is going",

  helpStats: "/stats — how the current session is going",

  statsEmpty: "Nothing recorded yet. Start a game with /game.",

  sheetEyebrow: "SESSION LOG",
  sheetTitle: "CHRONOLOGY",
  sheetScoreLabel: "CUMULATIVE SCORE",
  sheetSubtitle: (games: number, players: number) =>
    `${games} ${games === 1 ? "game" : "games"} · ${players} ${players === 1 ? "player" : "players"}`,
  sheetOmitted: (games: number) => `earliest ${games} not shown`,
  sheetDate: (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    const name = month === undefined ? undefined : MONTHS[Number(month) - 1];

    return name === undefined || day === undefined || year === undefined
      ? isoDate
      : `${Number(day)} ${name} ${year}`;
  },
} as const;
