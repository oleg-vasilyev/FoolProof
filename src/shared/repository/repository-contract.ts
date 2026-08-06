export interface PlayerRecord {
  id: number;
  chat_id: number;
  display_name: string;
}

export interface GameRecord {
  id: number;
  chat_id: number;
  message_id: number;
  state: string;
  state_version: number;
  starter_player_id: number | null;
  started_at: string;
  confirmed_at: string | null;
}

export interface SeatRecord {
  player_id: number;
  seat_index: number;
  display_name: string;
}

export interface ExitRecord {
  player_id: number;
  position: number;
}

export interface CardRecord {
  game: GameRecord;
  seats: readonly SeatRecord[];
  exits: readonly ExitRecord[];
}

export interface LastGame {
  seats: readonly SeatRecord[];
  loserIds: readonly number[];
}

export interface Finalist {
  playerId: number;
  position: number;
}

export interface PlayerTally {
  playerId: number;
  displayName: string;
  games: number;
}

export interface PlayerColumn {
  playerId: number;
  displayName: string;
}

export interface ChronologyGame {
  gameId: number;
  starterId: number | null;
  placements: readonly Finalist[];
}

export interface SeriesChronology {
  startedOn: string;
  players: readonly PlayerColumn[];
  games: readonly ChronologyGame[];
}

export interface CardRepository {
  playersInChat(chatId: number): readonly PlayerRecord[];
  createPlayer(chatId: number, displayName: string): PlayerRecord;
  forgetUnplayedPlayers(chatId: number): void;

  liveCardInChat(chatId: number): CardRecord | null;
  liveCards(): readonly CardRecord[];
  cardById(gameId: number): CardRecord | null;
  lastGame(chatId: number): LastGame | null;

  openGame(chatId: number, playerIds: readonly number[]): number;
  attachMessage(gameId: number, messageId: number): void;

  updateCard(gameId: number, phase: string, version: number, starterPlayerId: number | null): void;
  appendExit(gameId: number, playerId: number, position: number, actorTgId: number): void;
  dropLastExit(gameId: number): void;

  confirmGame(gameId: number, finalists: readonly Finalist[], actorTgId: number, version: number): void;
  discardGame(gameId: number): void;

  idleCards(idleSeconds: number): readonly GameRecord[];
  gameNumberInSeries(chatId: number): number;
}

export interface RosterRepository {
  liveCardInChat(chatId: number): CardRecord | null;
  rosterInChat(chatId: number): readonly PlayerTally[];
  playedTogether(playerIds: readonly number[]): boolean;
  mergePlayers(keeperId: number, absorbedIds: readonly number[]): void;
}

export interface ScoresheetRepository {
  seriesChronology(chatId: number): SeriesChronology | null;
}

export interface StorageSummary {
  file: string;
  sizeBytes: number;
  players: number;
  games: number;
  liveCards: number;
  lastGameAt: string | null;
}

export interface DiagnosticsRepository {
  storageSummary(): StorageSummary;
}

export interface ChatLocaleChoice {
  chatId: number;
  locale: string;
}

export interface LocaleRepository {
  chatLocale(chatId: number): string | null;
  rememberChatLocale(chatId: number, locale: string): void;
  rememberedChatLocales(): readonly ChatLocaleChoice[];
}

export interface Repository
  extends CardRepository,
    RosterRepository,
    ScoresheetRepository,
    DiagnosticsRepository,
    LocaleRepository {}
