import { Bot } from "grammy";
import { createLiveGameFeature } from "#live-game/bot/live-game-feature.ts";
import { createScoresheetFeature } from "#scoresheet/bot/scoresheet-feature.ts";
import { installFeatures, publishCommandMenu } from "#app/feature-installer.ts";
import { loadEnv, requireEnv } from "#shared/env.ts";
import { createShutdown } from "#shared/shutdown.ts";
import { createLogger } from "#shared/logger.ts";
import { repository } from "#shared/repository/repository-instance.ts";


const log = createLogger("polling");
const env = loadEnv();

const bot = new Bot(requireEnv(env, "BOT_TOKEN"));

const features = [
  createLiveGameFeature({ repo: repository, api: bot.api, log }),
  createScoresheetFeature({ repo: repository }),
];

const stops = installFeatures(bot, features, log);

const shutdown = createShutdown([...stops, () => bot.stop()]);

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

await publishCommandMenu(bot.api, features);

log.info("listening for updates by long polling");
await bot.start({ drop_pending_updates: true });
