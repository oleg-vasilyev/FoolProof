import { copy } from "#scoresheet/copy.en.ts";


const ALONE = 1;

export const gameTally = (games: number): string =>
  `${String(games)} ${games === ALONE ? copy.sheetGameSingular : copy.sheetGamePlural}`;

export const playerTally = (players: number): string =>
  `${String(players)} ${players === ALONE ? copy.sheetPlayerSingular : copy.sheetPlayerPlural}`;
