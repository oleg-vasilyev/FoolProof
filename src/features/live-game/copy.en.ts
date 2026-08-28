import { Locale } from "#shared/locale/locales.ts";


export const copy = {
  locale: Locale.En as Locale,

  lineupMissing: "Who is playing? For example: /game Oleg, Anya, Roma",
  lineupPrompt: "Who is playing? Send the names in seating order.",
  lineupPlaceholder: "Oleg, Anya, Roma",
  lineupTooFew: "A game needs at least two players.",
  lineupTooMany: (most: number) => `A table seats at most ${most} players.`,
  nameTooLong: (longest: number, names: readonly string[]) =>
    `Too long for a button: ${names.join(", ")}. Keep a name under ${longest} characters.`,
  lineupDuplicates: (names: readonly string[]) =>
    `These names appear twice: ${names.join(", ")}. Give everyone a name of their own.`,
  gameAlreadyRunning: "A game is already in progress.",
  noLineupToRepeat: "No previous line-up here yet. Start with /game and the names.",
  joinersPrompt: "Who is joining? Send their names.",
  joinersPlaceholder: "Zhenya, Sasha",
  joinersMissing: "Who is joining? For example: /next_with Zhenya, Sasha",
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

  leavingHeader: "<b>Who is sitting this one out?</b>",
  leavingAsk: "Tap whoever is not playing, then Play.",
  playingBody: (ring: string) => `Playing: ${ring}`,
  leavingCancelledBody: "Cancelled — the table is unchanged.",
  leavingStale: "That line-up has moved on — run /next_without again",

  commandGame: "Open a game — /game Oleg, Anya, Roma",
  commandNext: "Another game, same line-up",
  commandNextWith: "Another game, plus more players — /next_with Zhenya",
  commandNextWithout: "Another game, minus whoever taps out",

  helpGame: "/game Oleg, Anya, Roma — open a game; the list is the seating order around the table",
  helpNext:
    "/next — another game with the same line-up; the fool is attacked first, so their neighbour goes first",
  helpNextWith:
    "/next_with Zhenya, Sasha — the same line-up plus these; you then tap everyone in seating order, and who goes first is picked by hand",
  helpNextWithout:
    "/next_without — tap whoever is sitting out, or name them: /next_without Oleg",
  helpCard: [
    "Tap a name to record who went first, then tap players in the order they go out.",
    "The last one left is the fool and gets marked for you. Draw appears once two players are left.",
    "Back undoes one step at a time, and nothing is recorded until you tap Confirm.",
  ],

  header: (gameNumber: number) => `<b>Game ${gameNumber}</b>`,
  askStarter: "Who went first?",
  wentFirst: (name: string) => `Went first: <b>${name}</b>`,

  resultPlace: (position: number, name: string) => `${position} · ${name}`,
  resultFool: (position: number, name: string) => `${position} · <b>${name}</b> — fool`,
  resultDraw: (position: number, name: string) => `${position} · <b>${name}</b> — draw`,

  markExit: "✅",
  markFool: "💀",
  markDraw: "🤝",
  markSeat: "🏷️",
  markLeaving: "⏸️",

  buttonDraw: "🟢 Draw",
  buttonConfirm: "🟢 Confirm",
  buttonBack: "↩️ Back",
  buttonCancel: "🔴 Cancel",
  buttonPlay: "🟢 Play",

  tapSeated: (name: string, seat: number) => `${name} — seat ${seat}`,
  tapRecorded: (name: string, position: number) => `${name} — ${position}`,
  tapStarter: (name: string) => `${name} went first`,
  tapDraw: "Draw",
  tapSittingOut: (name: string) => `${name} sits this one out`,
  tapPlayingAgain: (name: string) => `${name} is playing after all`,
  tapBack: "Undone",
  tapNotAllowed: "Not available right now",
  cardStale: "Card updated — look again",
  cardGone: "This game is already over",

  seatedNotice: "Seated",
  leftNotice: "Table set",
  confirmedNotice: "Recorded",
  cancelledNotice: "Cancelled",
  cancelledBody: "Cancelled — nothing recorded.",
  abandonedBody: "Abandoned after three quiet hours — nothing recorded.",
};

export type Copy = typeof copy;
