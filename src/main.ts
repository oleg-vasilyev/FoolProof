import { Bot } from "grammy";
import { createLiveGameFeature } from "#live-game/live-game-feature.ts";
import { createMergeNamesFeature } from "#merge-names/merge-names-feature.ts";
import { createScoresheetFeature } from "#scoresheet/scoresheet-feature.ts";
import { createDiagnosticsFeature } from "#diagnostics/diagnostics-feature.ts";
import { createLanguageFeature } from "#language/language-feature.ts";
import {
  installFeatures,
  publishCommandMenu,
  republishChatMenus,
  resumeFeatures,
} from "#app/feature-installer.ts";
import { loadEnv, optionalEnv, requireEnv } from "#shared/config/env.ts";
import { installCrashExit } from "#shared/lifecycle/crash-exit.ts";
import { createShutdown } from "#shared/lifecycle/shutdown.ts";
import { createLocaleReader } from "#shared/locale/chat-locale.ts";
import type { Locale } from "#shared/locale/locales.ts";
import { createLogger } from "#shared/logging/logger.ts";
import { repository } from "#shared/repository/repository-instance.ts";
import { createApiRetry } from "#shared/telegram/api-retry.ts";
import { botClientOptions } from "#shared/telegram/bot-client-options.ts";


const DEFAULT_LOG_LEVEL = "info";

const FIRST_START = 1;

const log = createLogger("polling");
const env = loadEnv();

const bot = new Bot(requireEnv(env, "BOT_TOKEN"), botClientOptions(env, log));

bot.api.config.use(createApiRetry(log));

installCrashExit(log);

const localeIn = createLocaleReader(repository);

const publishMenu = (chatId: number, locale: Locale): Promise<void> =>
  publishCommandMenu(bot.api, features, log, { chatId, locale });

const features = [
  createLiveGameFeature({ repo: repository, api: bot.api, log, localeIn }),
  createMergeNamesFeature({ repo: repository, localeIn }),
  createScoresheetFeature({ repo: repository, localeIn }),
  createDiagnosticsFeature({
    repo: repository,
    localeIn,
    log,
    logLevel: optionalEnv(env, "LOG_LEVEL") ?? DEFAULT_LOG_LEVEL,
    startAttempt: Number(optionalEnv(env, "BOT_START_ATTEMPT") ?? FIRST_START),
    previousExit: optionalEnv(env, "BOT_PREVIOUS_EXIT"),
    operatorTgId: optionalEnv(env, "OPERATOR_TG_ID"),
  }),
  createLanguageFeature({ repo: repository, localeIn, publishMenu }),
];

const stops = installFeatures(bot, features, log, localeIn);

const shutdown = createShutdown([...stops, () => bot.stop()]);

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

await publishCommandMenu(bot.api, features, log);
await republishChatMenus(bot.api, features, log, repository.rememberedChatLocales());
await resumeFeatures(features, log);

log.info("listening for updates by long polling");
await bot.start({ drop_pending_updates: true });
