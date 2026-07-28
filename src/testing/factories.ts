import type { CardState, Seat } from "../features/game/state.ts";
import type { CardRecord, GameRecord, SeatRecord } from "../shared/repository/types.ts";


const FIRST_PLAYER_ID = 10;

const DEFAULT_CHAT_ID = -100777;

const DEFAULT_MESSAGE_ID = 500;

export const seatsOf = (...names: readonly string[]): readonly Seat[] =>
  names.map((displayName, index) => ({ playerId: FIRST_PLAYER_ID + index, displayName }));

export const cardStateOf = (
  names: readonly string[],
  overrides: Partial<CardState> = {}
): CardState => ({
  seats: seatsOf(...names),
  starterSlot: null,
  exits: [],
  drawAccepted: false,
  ...overrides,
});

export const gameRecordOf = (overrides: Partial<GameRecord> = {}): GameRecord => ({
  id: 1,
  chat_id: DEFAULT_CHAT_ID,
  message_id: DEFAULT_MESSAGE_ID,
  state: "PICK_STARTER",
  state_version: 0,
  starter_player_id: null,
  started_at: "2026-07-29 20:00:00",
  confirmed_at: null,
  ...overrides,
});

export const seatRecordsOf = (...names: readonly string[]): readonly SeatRecord[] =>
  names.map((display_name, seat_index) => ({
    player_id: FIRST_PLAYER_ID + seat_index,
    seat_index,
    display_name,
  }));

export const cardRecordOf = (
  names: readonly string[],
  game: Partial<GameRecord> = {},
  exits: readonly number[] = []
): CardRecord => ({
  game: gameRecordOf(game),
  seats: seatRecordsOf(...names),
  exits: exits.map((slot, index) => ({
    player_id: FIRST_PLAYER_ID + slot,
    position: index + 1,
  })),
});

export const playerIdOf = (slot: number): number => FIRST_PLAYER_ID + slot;
