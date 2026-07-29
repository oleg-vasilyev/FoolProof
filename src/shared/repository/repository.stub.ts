import { vi } from "vitest";
import type {
  CardRecord,
  Finalist,
  GameRecord,
  PlayerRecord,
  Repository,
  SeatRecord,
  SeriesStats,
} from "./types.ts";


const FIRST_GAME_NUMBER = 1;

export class RepositoryStub implements Repository {
  public playersInChatSpy = vi.fn();
  public createPlayerSpy = vi.fn();
  public liveCardInChatSpy = vi.fn();
  public cardByIdSpy = vi.fn();
  public lastLineupSpy = vi.fn();
  public openGameSpy = vi.fn();
  public attachMessageSpy = vi.fn();
  public updateCardSpy = vi.fn();
  public appendExitSpy = vi.fn();
  public dropLastExitSpy = vi.fn();
  public confirmGameSpy = vi.fn();
  public deleteGameSpy = vi.fn();
  public idleCardsSpy = vi.fn();
  public gameNumberInSeriesSpy = vi.fn();
  public seriesStatsSpy = vi.fn();

  public constructor() {
    this.playersInChatSpy.mockReturnValue([]);
    this.createPlayerSpy.mockImplementation((chatId: number, displayName: string) => ({
      id: 1,
      chat_id: chatId,
      display_name: displayName,
    }));
    this.liveCardInChatSpy.mockReturnValue(null);
    this.cardByIdSpy.mockReturnValue(null);
    this.lastLineupSpy.mockReturnValue(null);
    this.openGameSpy.mockReturnValue(1);
    this.idleCardsSpy.mockReturnValue([]);
    this.gameNumberInSeriesSpy.mockReturnValue(FIRST_GAME_NUMBER);
    this.seriesStatsSpy.mockReturnValue({ games: 0, players: [] });
  }

  public playersInChat(chatId: number): readonly PlayerRecord[] {
    return this.playersInChatSpy(chatId);
  }

  public createPlayer(chatId: number, displayName: string): PlayerRecord {
    return this.createPlayerSpy(chatId, displayName);
  }

  public liveCardInChat(chatId: number): CardRecord | null {
    return this.liveCardInChatSpy(chatId);
  }

  public cardById(gameId: number): CardRecord | null {
    return this.cardByIdSpy(gameId);
  }

  public lastLineup(chatId: number): readonly SeatRecord[] | null {
    return this.lastLineupSpy(chatId);
  }

  public openGame(chatId: number, playerIds: readonly number[]): number {
    return this.openGameSpy(chatId, playerIds);
  }

  public attachMessage(gameId: number, messageId: number): void {
    this.attachMessageSpy(gameId, messageId);
  }

  public updateCard(
    gameId: number,
    phase: string,
    version: number,
    starterPlayerId: number | null
  ): void {
    this.updateCardSpy(gameId, phase, version, starterPlayerId);
  }

  public appendExit(
    gameId: number,
    playerId: number,
    position: number,
    actorTgId: number
  ): void {
    this.appendExitSpy(gameId, playerId, position, actorTgId);
  }

  public dropLastExit(gameId: number): void {
    this.dropLastExitSpy(gameId);
  }

  public confirmGame(
    gameId: number,
    finalists: readonly Finalist[],
    actorTgId: number,
    version: number
  ): void {
    this.confirmGameSpy(gameId, finalists, actorTgId, version);
  }

  public deleteGame(gameId: number): void {
    this.deleteGameSpy(gameId);
  }

  public idleCards(idleSeconds: number): readonly GameRecord[] {
    return this.idleCardsSpy(idleSeconds);
  }

  public gameNumberInSeries(chatId: number): number {
    return this.gameNumberInSeriesSpy(chatId);
  }

  public seriesStats(chatId: number): SeriesStats {
    return this.seriesStatsSpy(chatId);
  }
}
