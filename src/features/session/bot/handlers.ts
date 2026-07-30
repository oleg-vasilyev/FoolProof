import { InputFile } from "grammy";
import type { SessionRepository } from "../../../shared/repository/types.ts";
import type { Command } from "../../../shared/telegram.ts";
import { renderScoresheet } from "../render/scoresheet.ts";
import { strings } from "../strings.ts";
import { rasterize } from "./image.ts";


const SHEET_FILENAME = "chronology.png";

export interface SessionContext {
  readonly repo: SessionRepository;
}

export const onStats = async (context: SessionContext, ctx: Command): Promise<void> => {
  const chronology = context.repo.seriesChronology(ctx.chat.id);

  if (chronology === null) {
    await ctx.reply(strings.statsEmpty);

    return;
  }

  await ctx.replyWithPhoto(new InputFile(rasterize(renderScoresheet(chronology)), SHEET_FILENAME), {
    caption: strings.sheetSubtitle(chronology.games.length, chronology.players.length),
  });
};
