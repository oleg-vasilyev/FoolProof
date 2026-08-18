import { InputFile } from "grammy";
import type {
  ScoresheetRepository,
  SeriesChronology,
} from "#shared/repository/repository-contract.ts";
import type { Command } from "#shared/telegram/telegram-contexts.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import type { Honours } from "#scoresheet/domain/awards/award-catalogue.ts";
import { EVENING_MINIMUM, honoursFor } from "#scoresheet/domain/awards/awards.ts";
import { renderScoresheet } from "#scoresheet/render/chronology/chronology-svg.ts";
import { renderAwards } from "#scoresheet/render/awards/awards-svg.ts";
import { copyIn, type Copy } from "#scoresheet/copy.ts";
import { gameTally, playerTally } from "#scoresheet/render/tally-phrases.ts";
import { rasterize } from "#scoresheet/bot/rasterizer.ts";


const SHEET_FILENAME = "chronology.png";

const AWARDS_FILENAME = "awards.png";

export interface ScoresheetContext {
  readonly repo: ScoresheetRepository;
  readonly localeIn: LocaleReader;
}

const sendChronology = async (
  copy: Copy,
  ctx: Command,
  chronology: SeriesChronology
): Promise<void> => {
  await ctx.replyWithPhoto(
    new InputFile(await rasterize(renderScoresheet(copy, chronology)), SHEET_FILENAME),
    {
      caption: copy.sheetSubtitle(
        gameTally(copy, chronology.games.length),
        playerTally(copy, chronology.players.length)
      ),
    }
  );
};

const sendAwards = async (
  copy: Copy,
  ctx: Command,
  chronology: SeriesChronology,
  honours: Honours
): Promise<void> => {
  await ctx.replyWithPhoto(
    new InputFile(await rasterize(renderAwards(copy, chronology, honours)), AWARDS_FILENAME)
  );
};

const withSession = async (
  context: ScoresheetContext,
  ctx: Command,
  draw: (copy: Copy, chronology: SeriesChronology) => Promise<void>
): Promise<void> => {
  const copy = copyIn(context.localeIn(ctx.chat.id));
  const chronology = context.repo.seriesChronology(ctx.chat.id);

  if (chronology === null) {
    await ctx.reply(copy.statsEmpty);

    return;
  }

  await draw(copy, chronology);
};

export const onStats = async (context: ScoresheetContext, ctx: Command): Promise<void> =>
  withSession(context, ctx, async (copy, chronology) => {
    await sendChronology(copy, ctx, chronology);

    const honours = honoursFor(chronology);

    if (honours !== null) {
      await sendAwards(copy, ctx, chronology, honours);
    }
  });

export const onChronology = async (context: ScoresheetContext, ctx: Command): Promise<void> =>
  withSession(context, ctx, (copy, chronology) => sendChronology(copy, ctx, chronology));

export const onAwards = async (context: ScoresheetContext, ctx: Command): Promise<void> =>
  withSession(context, ctx, async (copy, chronology) => {
    const honours = honoursFor(chronology);

    if (honours === null) {
      await ctx.reply(copy.awardsTooSoon(gameTally(copy, EVENING_MINIMUM)));

      return;
    }

    await sendAwards(copy, ctx, chronology, honours);
  });
