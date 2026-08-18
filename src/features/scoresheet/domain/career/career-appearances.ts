import type { CareerHistory } from "#shared/repository/repository-contract.ts";
import { sessionAppearances, type Appearance } from "#scoresheet/domain/session-appearances.ts";


const NOTHING = 0;

export interface CareerAppearance extends Appearance {
  readonly seriesNo: number;
  readonly playedOn: string;
  readonly opened: boolean;
}

export interface Career {
  readonly playerId: number;
  readonly displayName: string;
  readonly share: number;
  readonly appearances: readonly CareerAppearance[];
}

const datedBy = (
  history: CareerHistory,
  playerId: number,
  appearance: Appearance
): readonly CareerAppearance[] => {
  const game = history.games[appearance.round];

  return game === undefined
    ? []
    : [
        {
          ...appearance,
          seriesNo: game.seriesNo,
          playedOn: game.playedOn,
          opened: game.starterId === playerId,
        },
      ];
};

export const careerOf = (history: CareerHistory, playerId: number): Career | null => {
  const named = history.players.find((player) => player.playerId === playerId);
  const played = sessionAppearances(history).players.find(
    (player) => player.playerId === playerId
  );

  if (named === undefined || played === undefined || played.appearances.length === NOTHING) {
    return null;
  }

  return {
    playerId,
    displayName: named.displayName,
    share: played.share,
    appearances: played.appearances.flatMap((appearance) =>
      datedBy(history, playerId, appearance)
    ),
  };
};
