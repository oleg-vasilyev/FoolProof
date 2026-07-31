import { resolve } from "node:path";
import { rootDir } from "#shared/config/env.ts";
import { superviseChild } from "#shared/lifecycle/child-supervisor.ts";
import { createLogger } from "#shared/logging/logger.ts";


const BOT_ENTRY = "src/main.ts";

await superviseChild({
  entry: resolve(rootDir, BOT_ENTRY),
  log: createLogger("supervisor"),
});
