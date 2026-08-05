import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { startHub } from "./hub/hub-server.ts";


const PACE_MS = "600";

const HUB_PORT = 8080;

const VITEST = resolve(import.meta.dirname, "..", "node_modules", "vitest", "vitest.mjs");

const CONFIG = resolve(import.meta.dirname, "vitest.e2e.config.ts");

const STOPPED = 0;

const PORT_TAKEN = 1;

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

// The port is the one thing that can be taken, and a watch run left over from last
// time is what usually takes it. An unhandled listen error prints a stack that says
// nothing about which run to close.
const hub = await startHub(HUB_PORT).catch((error: unknown) => {
  process.stdout.write(`\n  ${hubUrl} is taken: ${String(error)}\n`);
  process.stdout.write(`  an earlier watch run is probably still holding it\n\n`);
  process.exit(PORT_TAKEN);
});

// One tab, not one per world. A tab opened by the operating system cannot be
// closed again by the process that opened it, so five of them outlive the run and
// have to be dismissed by hand; the hub already shows every world as a live frame,
// and it can say for itself when the run is over.
openInBrowser(hubUrl);

process.stdout.write(`\n  every scenario, live, in one tab: ${hubUrl}\n\n`);

const run = spawn(process.execPath, [VITEST, "run", "--config", CONFIG], {
  stdio: "inherit",
  env: { ...process.env, E2E_PACE_MS: PACE_MS },
});

run.once("exit", () => {
  process.stdout.write(`\n  the chats stay readable — Ctrl+C here to let them go\n\n`);
});

// The open tab holds a keep-alive socket, and `close` waits for every connection
// to go idle — so without this, Ctrl+C hangs for as long as the browser is looking.
const stop = (): void => {
  run.kill();
  hub.closeAllConnections();
  hub.close(() => process.exit(STOPPED));
};

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
