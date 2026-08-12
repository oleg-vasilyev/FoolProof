import type { BotConfig, Context } from "grammy";
import type { Logger } from "#shared/logging/logger.ts";
import { optionalEnv } from "#shared/config/env.ts";


export const botClientOptions = (
  env: Record<string, string>,
  log: Logger
): BotConfig<Context> | undefined => {
  const apiRoot = optionalEnv(env, "BOT_API_ROOT");

  if (apiRoot === null) {
    return undefined;
  }

  log.warn(`Bot API is ${apiRoot}, not Telegram — nothing sent from here reaches a real chat`);

  return { client: { apiRoot } };
};
