import { InputFile } from "grammy";
import type { ScoresheetRepository } from "#shared/repository/repository-contract.ts";
import type { Command } from "#shared/telegram-contexts.ts";
import { renderScoresheet } from "#scoresheet/render/scoresheet-svg.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { rasterize } from "#scoresheet/bot/rasterizer.ts";


const SHEET_FILENAME = "chronology.png";

export interface ScoresheetContext {
  readonly repo: ScoresheetRepository;
}

export const onStats = async (context: ScoresheetContext, ctx: Command): Promise<void> => {
  const chronology = context.repo.seriesChronology(ctx.chat.id);

  if (chronology === null) {
    await ctx.reply(copy.statsEmpty);

    return;
  }

  await ctx.replyWithPhoto(new InputFile(rasterize(renderScoresheet(chronology)), SHEET_FILENAME), {
    caption: copy.sheetSubtitle(chronology.games.length, chronology.players.length),
  });
};
