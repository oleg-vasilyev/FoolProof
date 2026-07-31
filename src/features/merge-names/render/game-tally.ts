import { copy } from "#merge-names/copy.en.ts";


const ONE = 1;

export const gameTally = (games: number): string =>
  `${games} ${games === ONE ? copy.gameOne : copy.gameMany}`;
