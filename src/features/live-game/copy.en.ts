export const copy = {
  lineupMissing: "Who is playing? For example: /game Oleg, Anya, Roma",
  lineupPrompt: "Who is playing? Send the names in seating order.",
  lineupPlaceholder: "Oleg, Anya, Roma",
  lineupTooFew: "A game needs at least two players.",
  lineupDuplicates: (names: readonly string[]) =>
    `These names appear twice: ${names.join(", ")}. Give everyone a name of their own.`,
  gameAlreadyRunning: "A game is already in progress.",
  noLineupToRepeat: "No previous line-up here yet. Start with /game and the names.",
  joinersPrompt: "Who is joining? Send their names.",
  joinersPlaceholder: "Zhenya, Sasha",
  joinersMissing: "Who is joining? For example: /next_with Zhenya, Sasha",
  leaversPrompt: "Who is sitting out? Send their names.",
  leaversPlaceholder: "Oleg",
  leaversMissing: "Who is sitting out? For example: /next_without Oleg",
  alreadyAtTable: (names: readonly string[]) =>
    `Already at the table: ${names.join(", ")}. Name only the players joining.`,
  notAtTable: (names: readonly string[]) =>
    `Not at the table: ${names.join(", ")}. Name only the players who were playing.`,

  seatingHeader: "<b>Taking seats</b>",
  seatingAsk: "Tap everyone in the order they sit around the table.",
  seatedBody: (ring: string) => `Seated: ${ring}`,
  betweenSeats: " → ",
  seatingCancelledBody: "Cancelled — no game started.",
  seatingStale: "This seating is out of date — start again",

  commandGame: "Open a game — /game Oleg, Anya, Roma",
  commandNext: "Another game, same line-up",
  commandNextWith: "Another game, plus more players — /next_with Zhenya",
  commandNextWithout: "Another game, minus some players — /next_without Oleg",

  helpGame: "/game Oleg, Anya, Roma — open a game; the list is the seating order around the table",
  helpNext:
    "/next — another game with the same line-up; the fool is attacked first, so their neighbour deals",
  helpNextWith:
    "/next_with Zhenya, Sasha — the same line-up plus these; you then tap everyone in seating order, and the deal is picked by hand",
  helpNextWithout:
    "/next_without Oleg — the same line-up minus these; deal is picked by hand",
  helpCard: [
    "Tap a name to record who dealt first, then tap players in the order they go out.",
    "The last one left is the fool and gets marked for you. Draw appears once two players",
    "are left. Back undoes one step at a time, and nothing is recorded until you tap Confirm.",
  ],

  header: (gameNumber: number) => `<b>Game ${gameNumber}</b>`,
  askStarter: "Who dealt first?",
  dealtFirst: (name: string) => `Dealt first: <b>${name}</b>`,

  resultPlace: (position: number, name: string) => `${position} · ${name}`,
  resultFool: (position: number, name: string) => `${position} · <b>${name}</b> — fool`,
  resultDraw: (position: number, name: string) => `${position} · <b>${name}</b> — draw`,

  markExit: "✅",
  markFool: "💀",
  markDraw: "🤝",
  markSeat: "🪑",

  buttonDraw: "🤝 Draw",
  buttonConfirm: "✅ Confirm",
  buttonBack: "↩️ Back",
  buttonCancel: "❌ Cancel",

  tapSeated: (name: string, seat: number) => `${name} — seat ${seat}`,
  tapRecorded: (name: string, position: number) => `${name} — ${position}`,
  tapStarter: (name: string) => `${name} dealt first`,
  tapDraw: "Draw",
  tapBack: "Undone",
  tapNotAllowed: "Not available right now",
  cardStale: "Card updated — look again",
  cardGone: "This game is already over",

  seatedNotice: "Seated",
  confirmedNotice: "Recorded",
  cancelledNotice: "Cancelled",
  cancelledBody: "Cancelled — nothing recorded.",
  abandonedBody: "Abandoned after three quiet hours — nothing recorded.",
} as const;
