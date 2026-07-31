import { Bot } from "grammy";
import { createLiveGameFeature } from "#live-game/live-game-feature.ts";
import { createScoresheetFeature } from "#scoresheet/scoresheet-feature.ts";
import { createDiagnosticsFeature } from "#diagnostics/diagnostics-feature.ts";
import { installFeatures, publishCommandMenu, resumeFeatures } from "#app/feature-installer.ts";
import { loadEnv, requireEnv } from "#shared/config/env.ts";
import { installCrashExit } from "#shared/lifecycle/crash-exit.ts";
import { createShutdown } from "#shared/lifecycle/shutdown.ts";
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

const features = [
  createLiveGameFeature({ repo: repository, api: bot.api, log }),
  createScoresheetFeature({ repo: repository }),
  createDiagnosticsFeature({
    repo: repository,
    log,
    logLevel: env.LOG_LEVEL ?? DEFAULT_LOG_LEVEL,
    startAttempt: Number(env.BOT_START_ATTEMPT ?? FIRST_START),
    previousExit: env.BOT_PREVIOUS_EXIT ?? null,
    operatorTgId: env.OPERATOR_TG_ID ?? null,
  }),
];

const stops = installFeatures(bot, features, log);

const shutdown = createShutdown([...stops, () => bot.stop()]);

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

await publishCommandMenu(bot.api, features, log);
await resumeFeatures(features, log);

log.info("listening for updates by long polling");
await bot.start({ drop_pending_updates: true });
