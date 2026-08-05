import type { Command } from "#shared/telegram/telegram-contexts.ts";
import type { Logger } from "#shared/logging/logger.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import type { HealthSnapshot } from "#diagnostics/render/health-report.ts";
import { renderHealthReport } from "#diagnostics/render/health-report.ts";
import { copyIn } from "#diagnostics/copy.ts";


export interface StatusContext {
  readonly takeSnapshot: () => HealthSnapshot;
  readonly operatorTgId: string | null;
  readonly log: Logger;
  readonly localeIn: LocaleReader;
}

const askedByOperator = (operatorTgId: string | null, askedBy: number | undefined): boolean =>
  operatorTgId === null || operatorTgId === String(askedBy);

export const onStatus = async (context: StatusContext, ctx: Command): Promise<void> => {
  if (!askedByOperator(context.operatorTgId, ctx.from?.id)) {
    context.log.info(`someone other than the operator asked for the status: ${String(ctx.from?.id)}`);

    return;
  }

  await ctx.reply(renderHealthReport(copyIn(context.localeIn(ctx.chat.id)), context.takeSnapshot()));
};
