import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import { EVENING_MINIMUM } from "#scoresheet/domain/awards/award-catalogue.ts";
import { foolCount, sessionAppearances } from "#scoresheet/domain/session-appearances.ts";
import type { CareerGame, CareerHistory } from "#shared/repository/repository-contract.ts";
import type {
  PlayerAppearances,
  SessionAppearances,
} from "#scoresheet/domain/session-appearances.ts";


const NONE = 0;

const ALL_BUT_LATEST = -1;

export interface PastEvening {
  readonly share: number;
  readonly fools: number;
  readonly firsts: number;
  readonly games: number;
}

export interface PlayerPast {
  readonly playerId: number;
  readonly evenings: readonly PastEvening[];
}

export interface EveningPast {
  readonly players: readonly PlayerPast[];
}

export const NO_PAST: EveningPast = { players: [] };

const seriesInOrder = (history: CareerHistory): readonly number[] =>
  [...new Set(history.games.map((game) => game.seriesNo))].sort((one, other) => one - other);

const gamesIn = (history: CareerHistory, seriesNo: number): readonly CareerGame[] =>
  history.games.filter((game) => game.seriesNo === seriesNo);

const scored = (history: CareerHistory, seriesNo: number): SessionAppearances =>
  sessionAppearances({
    players: history.players,
    games: gamesIn(history, seriesNo).map((game) => ({
      placements: game.placements,
      starterId: game.starterId,
    })),
  });

const firstPlaces = (player: PlayerAppearances): number =>
  player.appearances.filter((appearance) => appearance.finish === Finish.First).length;

const eveningOf = (player: PlayerAppearances): PastEvening => ({
  share: player.share,
  fools: foolCount(player),
  firsts: firstPlaces(player),
  games: player.appearances.length,
});

const seatIn = (evening: SessionAppearances, playerId: number): PlayerAppearances | undefined =>
  evening.players.find((player) => player.playerId === playerId);

const eveningsPlayedBy = (
  earlier: readonly SessionAppearances[],
  playerId: number
): readonly PastEvening[] =>
  earlier.flatMap((evening) => {
    const seat = seatIn(evening, playerId);

    return seat === undefined || seat.appearances.length < EVENING_MINIMUM
      ? []
      : [eveningOf(seat)];
  });

export const pastBefore = (history: CareerHistory | null): EveningPast => {
  if (history === null) {
    return NO_PAST;
  }

  const earlier = seriesInOrder(history)
    .slice(NONE, ALL_BUT_LATEST)
    .map((seriesNo) => scored(history, seriesNo));

  return {
    players: history.players.map((player) => ({
      playerId: player.playerId,
      evenings: eveningsPlayedBy(earlier, player.playerId),
    })),
  };
};

export const pastOf = (past: EveningPast, playerId: number): readonly PastEvening[] =>
  past.players.find((player) => player.playerId === playerId)?.evenings ?? [];
