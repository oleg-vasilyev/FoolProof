import type { Api, Bot } from "grammy";
import type { Feature, Listeners } from "#shared/telegram/feature-contract.ts";
import type { Logger } from "#shared/logging/logger.ts";
import type { ChatLocaleChoice } from "#shared/repository/repository-contract.ts";
import { localeFrom, type LocaleReader } from "#shared/locale/chat-locale.ts";
import { DEFAULT_LOCALE, type Locale } from "#shared/locale/locales.ts";
import { copyIn, type Copy } from "#app/copy.ts";


const HELP = "help";

const START = "start";

export interface ChatMenu {
  readonly chatId: number;
  readonly locale: Locale;
}

const routesOf = (features: readonly Feature[]) => features.flatMap((feature) => feature.commands);

const listedRoutesOf = (features: readonly Feature[]) =>
  routesOf(features).filter((route) => route.hidden !== true);

const helpBody = (features: readonly Feature[], locale: Locale): string => {
  const copy = copyIn(locale);

  return [
    copy.botLead,
    "",
    ...listedRoutesOf(features).map((route) => route.help(locale)),
    copy.helpSelf,
    "",
    ...features.flatMap((feature) => feature.notes?.(locale) ?? []),
  ].join("\n");
};

const startBody = (locale: Locale, alone: boolean): string => {
  const copy = copyIn(locale);

  return alone
    ? [copy.botLead, "", copy.startInvite, copy.startHelp].join("\n")
    : [copy.botLead, "", copy.startHelp].join("\n");
};

const addToGroupMarkup = (copy: Copy, username: string) => ({
  inline_keyboard: [
    [{ text: copy.buttonAddToGroup, url: `https://t.me/${username}?startgroup=true` }],
  ],
});

const listenersOn = (bot: Bot): Listeners => ({
  onText: (run) => {
    bot.on("message:text", (ctx) => run(ctx));
  },
  onTap: (owns, run) => {
    bot.callbackQuery(owns, (ctx) => run(ctx));
  },
});

const menuIn = (features: readonly Feature[], locale: Locale) => [
  ...listedRoutesOf(features).map((route) => ({
    command: route.command,
    description: route.menuDescription(locale),
  })),
  { command: HELP, description: copyIn(locale).commandHelp },
];

export const publishCommandMenu = async (
  api: Api,
  features: readonly Feature[],
  log: Logger,
  chat: ChatMenu | null = null
): Promise<void> => {
  try {
    await api.setMyCommands(
      menuIn(features, chat === null ? DEFAULT_LOCALE : chat.locale),
      chat === null ? undefined : { scope: { type: "chat", chat_id: chat.chatId } }
    );
  } catch (error) {
    log.warn(`could not publish the command menu: ${String(error)}`);
  }
};

export const republishChatMenus = async (
  api: Api,
  features: readonly Feature[],
  log: Logger,
  choices: readonly ChatLocaleChoice[]
): Promise<void> => {
  for (const choice of choices) {
    const locale = localeFrom(choice.locale);

    if (locale !== null) {
      await publishCommandMenu(api, features, log, { chatId: choice.chatId, locale });
    }
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
  log: Logger,
  localeIn: LocaleReader
): readonly (() => Promise<void>)[] => {
  for (const route of routesOf(features)) {
    bot.command(route.command, (ctx) => route.run(ctx));
  }

  bot.command(HELP, async (ctx) => {
    await ctx.reply(helpBody(features, localeIn(ctx.chat.id)));
  });

  bot.command(START, async (ctx) => {
    const locale = localeIn(ctx.chat.id);
    const alone = ctx.hasChatType("private");

    await ctx.reply(startBody(locale, alone), {
      reply_markup: alone ? addToGroupMarkup(copyIn(locale), ctx.me.username) : undefined,
    });
  });

  for (const feature of features) {
    feature.listen?.(listenersOn(bot));
  }

  bot.on("callback_query:data", async (ctx) => {
    const chatId = ctx.chat?.id;

    await ctx.answerCallbackQuery(
      copyIn(chatId === undefined ? DEFAULT_LOCALE : localeIn(chatId)).tapUnclaimed
    );
  });

  bot.catch((error) => {
    log.error(copyIn(DEFAULT_LOCALE).updateFailed(error.ctx.update.update_id, String(error.error)));
  });

  return features.flatMap((feature) => (feature.stop === undefined ? [] : [feature.stop]));
};
