import { Bot } from "grammy";
import { createCardFeature } from "./features/card/bot/feature.ts";
import { createSessionFeature } from "./features/session/bot/feature.ts";
import { installFeatures, publishCommandMenu } from "./router.ts";
import { loadEnv, requireEnv } from "./shared/env.ts";
import { createShutdown } from "./shared/lifecycle.ts";
import { createLogger } from "./shared/logger.ts";
import { repository } from "./shared/repository/index.ts";


const log = createLogger("polling");
const env = loadEnv();

const bot = new Bot(requireEnv(env, "BOT_TOKEN"));

const features = [
  createCardFeature({ repo: repository, api: bot.api, log }),
  createSessionFeature({ repo: repository }),
];

const stops = installFeatures(bot, features, log);

const shutdown = createShutdown([...stops, () => bot.stop()]);

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

await publishCommandMenu(bot.api, features);

log.info("listening for updates by long polling");
await bot.start({ drop_pending_updates: true });
