import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { startHub } from "./hub/hub-server.ts";


const PACE_MS = "600";

const HUB_PORT = 8080;

const LOOK_FOR_WORLDS_MS = 700;

const VITEST = resolve(import.meta.dirname, "..", "node_modules", "vitest", "vitest.mjs");

const CONFIG = resolve(import.meta.dirname, "vitest.e2e.config.ts");

const STOPPED = 0;

const openInBrowser = (url: string): void => {
  if (process.env.E2E_OPEN === "0") {
    return;
  }

  const opener =
    process.platform === "win32"
      ? { command: "cmd", args: ["/c", "start", "", url] }
      : { command: process.platform === "darwin" ? "open" : "xdg-open", args: [url] };

  spawn(opener.command, opener.args, { stdio: "ignore", detached: true }).unref();
};

const hubUrl = `http://127.0.0.1:${String(HUB_PORT)}`;

const hub = await startHub(HUB_PORT);

const opened = new Set<number>();

interface WorldCard {
  readonly port: number;
  readonly url: string;
  readonly banner: { readonly verdict: string } | null;
}

// A world starts listening before its bot is up and before a scenario has named
// itself, so a tab opened at that moment shows an empty chat and looks broken.
// Wait until something is actually running in it.
const openEachNewWorld = async (): Promise<void> => {
  try {
    const answer = await fetch(`${hubUrl}/worlds`);
    const worlds = (await answer.json()) as readonly WorldCard[];

    for (const world of worlds) {
      if (!opened.has(world.port) && world.banner?.verdict === "running") {
        opened.add(world.port);
        openInBrowser(`${hubUrl}${world.url}`);
      }
    }
  } catch {
    return;
  }
};

const looking = setInterval(() => void openEachNewWorld(), LOOK_FOR_WORLDS_MS);

process.stdout.write(`\n  a tab per scenario opens as each one starts\n`);
process.stdout.write(`  all of them together: ${hubUrl}\n\n`);

const run = spawn(process.execPath, [VITEST, "run", "--config", CONFIG], {
  stdio: "inherit",
  env: { ...process.env, E2E_PACE_MS: PACE_MS },
});

run.once("exit", () => {
  clearInterval(looking);
  process.stdout.write(`\n  the chats stay open — Ctrl+C here to let them go\n\n`);
});

const stop = (): void => {
  clearInterval(looking);
  hub.close(() => process.exit(STOPPED));
};

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
