import { gamesShortOfAwards } from "#scoresheet/domain/awards/awards.ts";
import type { Copy } from "#scoresheet/copy.ts";
import { gamesAcross } from "#scoresheet/render/tally-phrases.ts";


const NOT_SHORT = 0;

export const chronologyCaption = (copy: Copy, played: number): string | undefined => {
  const short = gamesShortOfAwards(played);

  return short === NOT_SHORT ? undefined : copy.moreGamesForAwards(gamesAcross(copy, short));
};
