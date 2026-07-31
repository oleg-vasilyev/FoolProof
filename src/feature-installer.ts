import type { Api, Bot } from "grammy";
import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { Logger } from "#shared/logging/logger.ts";
import { copy } from "#app/copy.en.ts";


const HELP = "help";

const routesOf = (features: readonly Feature[]) => features.flatMap((feature) => feature.commands);

const helpBody = (features: readonly Feature[]): string =>
  [
    copy.helpLead,
    "",
    ...routesOf(features).map((route) => route.help),
    copy.helpSelf,
    "",
    ...features.flatMap((feature) => feature.notes ?? []),
  ].join("\n");

const listenersOn = (bot: Bot): Listeners => ({
  onText: (run) => {
    bot.on("message:text", (ctx) => run(ctx));
  },
  onTap: (run) => {
    bot.on("callback_query:data", (ctx) => run(ctx));
  },
});

export const publishCommandMenu = async (
  api: Api,
  features: readonly Feature[],
  log: Logger
): Promise<void> => {
  try {
    await api.setMyCommands([
      ...routesOf(features).map((route) => ({
        command: route.command,
        description: route.menuDescription,
      })),
      { command: HELP, description: copy.commandHelp },
    ]);
  } catch (error) {
    log.warn(`could not publish the command menu: ${String(error)}`);
  }
};

export const resumeFeatures = async (
  features: readonly Feature[],
  log: Logger
): Promise<void> => {
  for (const feature of features) {
    try {
      await feature.resume?.();
    } catch (error) {
      log.warn(`a feature could not pick up where it left off: ${String(error)}`);
    }
  }
};

export const installFeatures = (
  bot: Bot,
  features: readonly Feature[],
  log: Logger
): readonly (() => Promise<void>)[] => {
  for (const route of routesOf(features)) {
    bot.command(route.command, (ctx) => route.run(ctx));
  }

  const help = helpBody(features);
  bot.command(HELP, async (ctx) => {
    await ctx.reply(help);
  });

  for (const feature of features) {
    feature.listen?.(listenersOn(bot));
  }

  bot.catch((error) => {
    log.error(copy.updateFailed(error.ctx.update.update_id, String(error.error)));
  });

  return features.flatMap((feature) => (feature.stop === undefined ? [] : [feature.stop]));
};
