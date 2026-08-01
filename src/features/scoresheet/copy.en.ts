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

export const copy = {
  commandStats: "How tonight is going",

  helpStats: "/stats — how the current session is going",

  statsEmpty: "Nothing recorded yet. Start a game with /game.",

  sheetEyebrow: "SESSION LOG",
  sheetTitle: "CHRONOLOGY",
  sheetShareLabel: "TABLE SHARE",
  sheetShareHint: "50% is mid-table · 100% is winning every game",

  sheetGameSingular: "game",
  sheetGamePlural: "games",
  sheetPlayerSingular: "player",
  sheetPlayerPlural: "players",

  sheetKeyPlaced: "went out",
  sheetKeyDrawn: "drew for last",
  sheetKeyFool: "left the fool",
  sheetKeyAbsent: "did not play",

  sheetSubtitle: (games: string, players: string) => `${games} · ${players}`,
  sheetOmitted: (games: number) => `earliest ${games} not shown`,
  sheetDate: (isoDate: string) => {
    const [year, month, day] = isoDate.split("-");
    const name = month === undefined ? undefined : MONTHS[Number(month) - 1];

    return name === undefined || day === undefined || year === undefined
      ? isoDate
      : `${Number(day)} ${name} ${year}`;
  },
} as const;
