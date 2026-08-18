import { counted } from "#shared/locale/plural-rules.ts";
import type { Copy } from "#scoresheet/copy.ts";


export const gameTally = (copy: Copy, games: number): string =>
  counted(copy.locale, games, copy.sheetGameForms);

export const playerTally = (copy: Copy, players: number): string =>
  counted(copy.locale, players, copy.sheetPlayerForms);

export const eveningTally = (copy: Copy, evenings: number): string =>
  counted(copy.locale, evenings, copy.sheetEveningForms);

export const timeTally = (copy: Copy, times: number): string =>
  counted(copy.locale, times, copy.sheetTimeForms);
