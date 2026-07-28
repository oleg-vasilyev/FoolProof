export const strings = {
  lineupMissing: "Who is playing? For example: /game Oleg, Anya, Roma",
  lineupTooFew: "A game needs at least two players.",
  lineupDuplicates: (names: readonly string[]) =>
    `These names appear twice: ${names.join(", ")}. Give everyone a name of their own.`,
  gameAlreadyRunning: "A game is already in progress.",
  noLineupToRepeat: "No previous line-up here yet. Start with /game and the names.",

  commandGame: "Open a game — /game Oleg, Anya, Roma",
  commandNext: "Another game, same line-up",
  commandHelp: "How the card works",

  helpBody: [
    "FoolProof keeps score for games of Durak.",
    "",
    "/game Oleg, Anya, Roma — open a game; the list is the seating order around the table",
    "/next — another game with the same line-up",
    "/help — this message",
    "",
    "Tap a name to record who dealt first, then tap players in the order they go out.",
    "The last one left is the fool and gets marked for you. Draw appears once two players",
    "are left. Back undoes one step at a time, and nothing is recorded until you tap Confirm.",
  ].join("\n"),

  header: (gameNumber: number, tableSize: number) =>
    `<b>Game ${gameNumber}</b> · ${tableSize} at the table`,
  askStarter: "Who dealt first?",
  dealtFirst: (name: string) => `Dealt first: <b>${name}</b>`,
  progress: (out: number, total: number) => `<i>${out} of ${total} out</i>`,
  readyToConfirm: "<i>All places are in — tap Confirm.</i>",

  resultPlace: (position: number, name: string) => `${position} · ${name}`,
  resultFool: (position: number, name: string) => `${position} · <b>${name}</b> — fool`,
  resultDraw: (position: number, name: string) => `${position} · <b>${name}</b> — draw`,

  markExit: "✅",
  markFool: "💀",
  markDraw: "🤝",

  buttonDraw: "🤝 Draw",
  buttonConfirm: "✅ Confirm",
  buttonBack: "↩️ Back",
  buttonCancel: "❌ Cancel",

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
