import { Finish } from "#scoresheet/domain/game-outcomes.ts";
import type {
  Appearance,
  PlayerAppearances,
  SessionAppearances,
} from "#scoresheet/domain/session-appearances.ts";


const A_FULL_TABLE = 5;

const WENT_OUT_FIRST = 1;

const MID_TABLE = 3;

const NO_SHARE = 0;

const FIRST_ROUND = 0;

const placeFor = (finish: Finish, tableSize: number): number => {
  switch (finish) {
    case Finish.First:
      return WENT_OUT_FIRST;

    case Finish.Middle:
      return MID_TABLE;

    case Finish.Drawn:
    case Finish.Fool:
      return tableSize;
  }
};

export const appearanceOf = (
  round: number,
  finish: Finish,
  position?: number,
  tableSize: number = A_FULL_TABLE
): Appearance => ({
  round,
  finish,
  position: position ?? placeFor(finish, tableSize),
  tableSize,
});

export const playerAppearing = (
  playerId: number,
  appearances: readonly Appearance[],
  share: number = NO_SHARE,
  running: readonly number[] = []
): PlayerAppearances => ({ playerId, share, running, appearances });

export const appearingAs = (playerId: number, ...finishes: readonly Finish[]): PlayerAppearances =>
  playerAppearing(
    playerId,
    finishes.map((finish, round) => appearanceOf(round + FIRST_ROUND, finish))
  );

export const eveningOf = (
  rounds: number,
  players: readonly PlayerAppearances[],
  starters: readonly (number | null)[] = []
): SessionAppearances => ({ rounds, players, starters });
