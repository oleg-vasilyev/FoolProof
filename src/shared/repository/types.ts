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

export interface Finalist {
  playerId: number;
  position: number;
}

export interface PlayerTally {
  playerId: number;
  displayName: string;
  games: number;
  wins: number;
  fools: number;
}

export interface SeriesStats {
  games: number;
  players: readonly PlayerTally[];
}

export interface Repository {
  playersInChat(chatId: number): readonly PlayerRecord[];
  createPlayer(chatId: number, displayName: string): PlayerRecord;

  liveCardInChat(chatId: number): CardRecord | null;
  cardById(gameId: number): CardRecord | null;
  lastLineup(chatId: number): readonly SeatRecord[] | null;

  openGame(chatId: number, playerIds: readonly number[]): number;
  attachMessage(gameId: number, messageId: number): void;

  updateCard(gameId: number, phase: string, version: number, starterPlayerId: number | null): void;
  appendExit(gameId: number, playerId: number, position: number, actorTgId: number): void;
  dropLastExit(gameId: number): void;

  confirmGame(gameId: number, finalists: readonly Finalist[], actorTgId: number, version: number): void;
  deleteGame(gameId: number): void;

  idleCards(idleSeconds: number): readonly GameRecord[];
  gameNumberInSeries(chatId: number): number;
  seriesStats(chatId: number): SeriesStats;
}
