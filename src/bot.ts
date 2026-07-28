import { createBot } from "./features/bot/index.ts";
import { startReaper } from "./features/bot/reaper.ts";
import { loadEnv, requireEnv } from "./shared/env.ts";
import { createLogger } from "./shared/logger.ts";
import { repository } from "./shared/repository/index.ts";


const log = createLogger("polling");
const env = loadEnv();

const { bot, cards } = createBot(requireEnv(env, "BOT_TOKEN"), { repo: repository, log });

const stopReaper = startReaper(cards, log);

const shutdown = async (): Promise<void> => {
  stopReaper();
  await cards.shutdown();
  await bot.stop();
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

log.info("listening for updates by long polling");
await bot.start({ drop_pending_updates: true });
