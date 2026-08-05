import { counted } from "#shared/locale/plural-rules.ts";
import type { Copy } from "#scoresheet/copy.ts";


export const gameTally = (copy: Copy, games: number): string =>
  counted(copy.locale, games, copy.sheetGameForms);

export const playerTally = (copy: Copy, players: number): string =>
  counted(copy.locale, players, copy.sheetPlayerForms);
