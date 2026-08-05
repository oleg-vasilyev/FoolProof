import { counted } from "#shared/locale/plural-rules.ts";
import type { Copy } from "#merge-names/copy.ts";


export const gameTally = (copy: Copy, games: number): string =>
  counted(copy.locale, games, copy.gameForms);
