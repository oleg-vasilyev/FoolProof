import { startBotApiServer } from "./fake-telegram/bot-api-server.ts";
import { createChatWorld } from "./fake-telegram/chat-world.ts";


const PLAY_PORT = 8081;

const DEV_DB = "data/foolproof.dev.db";

const DB_FLAG = "--db=";

const OPERATOR_TG_ID = "777";

const STOPPED = 0;

const url = `http://127.0.0.1:${String(PLAY_PORT)}`;

const chosenDb =
  process.argv.find((argument) => argument.startsWith(DB_FLAG))?.slice(DB_FLAG.length) ?? DEV_DB;

const world = createChatWorld({
  apiRoot: url,
  dbPath: chosenDb,
  logLevel: "debug",
  operatorTgId: OPERATOR_TG_ID,
  echo: true,
});

await startBotApiServer(world, PLAY_PORT);
world.start();

process.stdout.write(`\n  the chat is at ${url}\n`);
process.stdout.write(`  playing against ${chosenDb} — Ctrl+C to stop\n\n`);

const stop = (): void => {
  void world.stop().then(() => process.exit(STOPPED));
};

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
