import { createServer } from "node:http";
import { webhookCallback } from "grammy";
import { createBot } from "./features/bot/index.ts";
import { startReaper } from "./features/bot/reaper.ts";
import { loadEnv, requireEnv } from "./shared/env.ts";
import { createLogger } from "./shared/logger.ts";
import { repository } from "./shared/repository/index.ts";


const DEFAULT_PORT = 8080;

const log = createLogger("webhook");
const env = loadEnv();

const { bot, cards } = createBot(requireEnv(env, "BOT_TOKEN"), { repo: repository, log });

const url = requireEnv(env, "WEBHOOK_URL");
const secretToken = requireEnv(env, "WEBHOOK_SECRET");
const port = Number(env.WEBHOOK_PORT ?? DEFAULT_PORT);

await bot.init();
await bot.api.setWebhook(url, { secret_token: secretToken, drop_pending_updates: true });

const server = createServer(webhookCallback(bot, "http", { secretToken }));

const stopReaper = startReaper(cards, log);

const shutdown = async (): Promise<void> => {
  stopReaper();
  server.close();
  await cards.shutdown();
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

server.listen(port, () => log.info(`listening for webhook updates on port ${port}`));
