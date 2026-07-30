import type { Api, Bot } from "grammy";
import type { Feature, Listeners } from "#shared/feature-contract.ts";
import type { Logger } from "#shared/logger.ts";
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

export const publishCommandMenu = async (api: Api, features: readonly Feature[]): Promise<void> => {
  await api.setMyCommands([
    ...routesOf(features).map((route) => ({
      command: route.command,
      description: route.menuDescription,
    })),
    { command: HELP, description: copy.commandHelp },
  ]);
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
