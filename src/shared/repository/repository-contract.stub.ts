import { vi } from "vitest";
import type {
  CardRecord,
  ChatLocaleChoice,
  ChatSummary,
  Finalist,
  ForgottenChat,
  GameRecord,
  LastGame,
  PlayerRecord,
  PlayerTally,
  Repository,
  SeriesChronology,
  StorageSummary,
} from "#shared/repository/repository-contract.ts";


const FIRST_GAME_NUMBER = 1;

const NOTHING = 0;

const EMPTY_STORAGE: StorageSummary = {
  file: "/repo/data/stub.db",
  sizeBytes: NOTHING,
  players: NOTHING,
  games: NOTHING,
  liveCards: NOTHING,
  lastGameAt: null,
};

const QUIET_CHATS: ChatSummary = {
  chats: NOTHING,
  chatsNewInWeek: NOTHING,
  chatsPlayedInWeek: NOTHING,
  gamesInDay: NOTHING,
  gamesInWeek: NOTHING,
  choseRussian: NOTHING,
  choseEnglish: NOTHING,
};

export class RepositoryStub implements Repository {
  public playersInChatSpy = vi.fn();
  public createPlayerSpy = vi.fn();
  public forgetUnplayedPlayersSpy = vi.fn();
  public liveCardInChatSpy = vi.fn();
  public rosterInChatSpy = vi.fn();
  public playedTogetherSpy = vi.fn();
  public mergePlayersSpy = vi.fn();
  public liveCardsSpy = vi.fn();
  public cardByIdSpy = vi.fn();
  public lastGameSpy = vi.fn();
  public openGameSpy = vi.fn();
  public attachMessageSpy = vi.fn();
  public updateCardSpy = vi.fn();
  public appendExitSpy = vi.fn();
  public dropLastExitSpy = vi.fn();
  public confirmGameSpy = vi.fn();
  public discardGameSpy = vi.fn();
  public idleCardsSpy = vi.fn();
  public gameNumberInSeriesSpy = vi.fn();
  public seriesChronologySpy = vi.fn();
  public storageSummarySpy = vi.fn();
  public chatSummarySpy = vi.fn();
  public chatLocaleSpy = vi.fn();
  public rememberChatLocaleSpy = vi.fn();
  public rememberedChatLocalesSpy = vi.fn();
  public forgetChatSpy = vi.fn();

  public constructor() {
    this.playersInChatSpy.mockReturnValue([]);
    this.createPlayerSpy.mockImplementation((chatId: number, displayName: string) => ({
      id: 1,
      chat_id: chatId,
      display_name: displayName,
    }));
    this.liveCardInChatSpy.mockReturnValue(null);
    this.rosterInChatSpy.mockReturnValue([]);
    this.playedTogetherSpy.mockReturnValue(false);
    this.liveCardsSpy.mockReturnValue([]);
    this.cardByIdSpy.mockReturnValue(null);
    this.lastGameSpy.mockReturnValue(null);
    this.openGameSpy.mockReturnValue(1);
    this.idleCardsSpy.mockReturnValue([]);
    this.gameNumberInSeriesSpy.mockReturnValue(FIRST_GAME_NUMBER);
    this.seriesChronologySpy.mockReturnValue(null);
    this.storageSummarySpy.mockReturnValue(EMPTY_STORAGE);
    this.chatSummarySpy.mockReturnValue(QUIET_CHATS);
    this.chatLocaleSpy.mockReturnValue(null);
    this.rememberedChatLocalesSpy.mockReturnValue([]);
    this.forgetChatSpy.mockReturnValue({ players: NOTHING, games: NOTHING });
  }

  public playersInChat(chatId: number): readonly PlayerRecord[] {
    return this.playersInChatSpy(chatId);
  }

  public createPlayer(chatId: number, displayName: string): PlayerRecord {
    return this.createPlayerSpy(chatId, displayName);
  }

  public forgetUnplayedPlayers(chatId: number): void {
    this.forgetUnplayedPlayersSpy(chatId);
  }

  public liveCardInChat(chatId: number): CardRecord | null {
    return this.liveCardInChatSpy(chatId);
  }

  public rosterInChat(chatId: number): readonly PlayerTally[] {
    return this.rosterInChatSpy(chatId);
  }

  public playedTogether(playerIds: readonly number[]): boolean {
    return this.playedTogetherSpy(playerIds);
  }

  public mergePlayers(keeperId: number, absorbedIds: readonly number[]): void {
    this.mergePlayersSpy(keeperId, absorbedIds);
  }

  public liveCards(): readonly CardRecord[] {
    return this.liveCardsSpy();
  }

  public cardById(gameId: number): CardRecord | null {
    return this.cardByIdSpy(gameId);
  }

  public lastGame(chatId: number): LastGame | null {
    return this.lastGameSpy(chatId);
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

  public discardGame(gameId: number): void {
    this.discardGameSpy(gameId);
  }

  public idleCards(idleSeconds: number): readonly GameRecord[] {
    return this.idleCardsSpy(idleSeconds);
  }

  public storageSummary(): StorageSummary {
    return this.storageSummarySpy();
  }

  public chatSummary(): ChatSummary {
    return this.chatSummarySpy();
  }

  public gameNumberInSeries(chatId: number): number {
    return this.gameNumberInSeriesSpy(chatId);
  }

  public seriesChronology(chatId: number): SeriesChronology | null {
    return this.seriesChronologySpy(chatId);
  }

  public chatLocale(chatId: number): string | null {
    return this.chatLocaleSpy(chatId);
  }

  public rememberChatLocale(chatId: number, locale: string): void {
    this.rememberChatLocaleSpy(chatId, locale);
  }

  public rememberedChatLocales(): readonly ChatLocaleChoice[] {
    return this.rememberedChatLocalesSpy();
  }

  public forgetChat(chatId: number): ForgottenChat {
    return this.forgetChatSpy(chatId);
  }
}
