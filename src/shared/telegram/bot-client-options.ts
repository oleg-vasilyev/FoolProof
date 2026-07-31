import type { BotConfig, Context } from "grammy";
import type { Logger } from "#shared/logging/logger.ts";


export const botClientOptions = (
  env: Record<string, string>,
  log: Logger
): BotConfig<Context> | undefined => {
  const apiRoot = env.BOT_API_ROOT;

  if (apiRoot === undefined) {
    return undefined;
  }

  log.warn(`Bot API is ${apiRoot}, not Telegram — nothing sent from here reaches a real chat`);

  return { client: { apiRoot } };
};
