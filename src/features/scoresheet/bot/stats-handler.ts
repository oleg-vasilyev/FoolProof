import { InputFile } from "grammy";
import type {
  ScoresheetRepository,
  SeriesChronology,
} from "#shared/repository/repository-contract.ts";
import type { Command } from "#shared/telegram/telegram-contexts.ts";
import type { Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import { EVENING_MINIMUM, honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { gameTally, playerTally } from "#scoresheet/render/session-tally.ts";
import { rasterize } from "#scoresheet/bot/rasterizer.ts";


const SHEET_FILENAME = "chronology.png";

const AWARDS_FILENAME = "awards.png";

export interface ScoresheetContext {
  readonly repo: ScoresheetRepository;
}

const sendChronology = async (ctx: Command, chronology: SeriesChronology): Promise<void> => {
  await ctx.replyWithPhoto(new InputFile(rasterize(renderScoresheet(chronology)), SHEET_FILENAME), {
    caption: copy.sheetSubtitle(
      gameTally(chronology.games.length),
      playerTally(chronology.players.length)
    ),
  });
};

const sendAwards = async (
  ctx: Command,
  chronology: SeriesChronology,
  honours: Honours
): Promise<void> => {
  await ctx.replyWithPhoto(
    new InputFile(rasterize(renderAwards(chronology, honours)), AWARDS_FILENAME)
  );
};

const withSession = async (
  context: ScoresheetContext,
  ctx: Command,
  draw: (chronology: SeriesChronology) => Promise<void>
): Promise<void> => {
  const chronology = context.repo.seriesChronology(ctx.chat.id);

  if (chronology === null) {
    await ctx.reply(copy.statsEmpty);

    return;
  }

  await draw(chronology);
};

export const onStats = async (context: ScoresheetContext, ctx: Command): Promise<void> =>
  withSession(context, ctx, async (chronology) => {
    await sendChronology(ctx, chronology);

    const honours = honoursFor(chronology);

    if (honours !== null) {
      await sendAwards(ctx, chronology, honours);
    }
  });

export const onChronology = async (context: ScoresheetContext, ctx: Command): Promise<void> =>
  withSession(context, ctx, (chronology) => sendChronology(ctx, chronology));

export const onAwards = async (context: ScoresheetContext, ctx: Command): Promise<void> =>
  withSession(context, ctx, async (chronology) => {
    const honours = honoursFor(chronology);

    if (honours === null) {
      await ctx.reply(copy.awardsTooSoon(gameTally(EVENING_MINIMUM)));

      return;
    }

    await sendAwards(ctx, chronology, honours);
  });
