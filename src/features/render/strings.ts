export const strings = {
  lineupMissing: "Who is playing? For example: /game Oleg, Anya, Roma",
  lineupTooFew: "A game needs at least two players.",
  lineupDuplicates: (names: readonly string[]) =>
    `These names appear twice: ${names.join(", ")}. Give everyone a name of their own.`,
  gameAlreadyRunning: "A game is already in progress.",
  noLineupToRepeat: "No previous line-up here yet. Start with /game and the names.",

  header: (gameNumber: number, tableSize: number) => `Game ${gameNumber} · ${tableSize} at the table`,
  askStarter: "Who dealt first?",
  dealtFirst: (name: string) => `Dealt first: ${name}`,
  stillIn: (names: readonly string[]) => `— still in: ${names.join(", ")}`,

  markExit: "✅",
  markFool: "💀",
  markDraw: "🤝",

  buttonDraw: "🤝 Draw",
  buttonConfirm: "✔️ Confirm",
  buttonBack: "↩️ Back",
  buttonCancel: "✖️ Cancel",

  tapRecorded: (name: string, position: number) => `${name} — ${position}`,
  tapStarter: (name: string) => `${name} dealt first`,
  tapDraw: "Draw",
  tapBack: "Undone",
  tapNotAllowed: "Not available right now",
  cardStale: "Card updated — look again",
  cardGone: "This game is already over",

  confirmedNotice: "Recorded",
  cancelledNotice: "Cancelled",
  cancelledBody: "Cancelled — nothing recorded.",
  abandonedBody: "Abandoned after three quiet hours — nothing recorded.",
} as const;
