import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { hubPage } from "./hub-page.ts";
import { forgetScratchDatabases } from "../scratch-database.ts";


const HUB_PORT = 8080;

const FIRST_WORLD_PORT = 8090;

const MOST_WORLDS = 9;

const OK = 200;

const NOT_FOUND = 404;

const PROBE_TIMEOUT_MS = 400;

interface WorldCard {
  readonly port: number;
  readonly url: string;
  readonly banner: unknown;
}

const probe = async (port: number): Promise<WorldCard | null> => {
  try {
    const answer = await fetch(`http://127.0.0.1:${String(port)}/chat/state`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const state = (await answer.json()) as { banner: unknown };

    return { port, url: `http://127.0.0.1:${String(port)}`, banner: state.banner };
  } catch {
    return null;
  }
};

const liveWorlds = async (): Promise<readonly WorldCard[]> => {
  const ports = Array.from({ length: MOST_WORLDS }, (_, index) => FIRST_WORLD_PORT + index);
  const probed = await Promise.all(ports.map(probe));

  return probed.filter((world): world is WorldCard => world !== null);
};

const openInBrowser = (url: string): void => {
  const opener =
    process.platform === "win32"
      ? { command: "cmd", args: ["/c", "start", "", url] }
      : { command: process.platform === "darwin" ? "open" : "xdg-open", args: [url] };

  spawn(opener.command, opener.args, { stdio: "ignore", detached: true }).unref();
};

const startHub = async (): Promise<Server> => {
  const server = createServer((request, response) => {
    if ((request.url ?? "") === "/worlds") {
      void liveWorlds().then((worlds) => {
        response.writeHead(OK, { "content-type": "application/json" });
        response.end(JSON.stringify(worlds));
      });

      return;
    }

    if ((request.url ?? "") === "/") {
      response.writeHead(OK, { "content-type": "text/html; charset=utf-8" });
      response.end(hubPage());

      return;
    }

    response.writeHead(NOT_FOUND);
    response.end();
  });

  await new Promise<void>((listening) => server.listen(HUB_PORT, "127.0.0.1", listening));

  return server;
};

export const setup = async (): Promise<() => Promise<void>> => {
  const url = `http://127.0.0.1:${String(HUB_PORT)}`;
  const server = await startHub();

  process.stdout.write(`\n  watch every scenario at ${url}\n\n`);

  if (process.env.E2E_OPEN === "1") {
    openInBrowser(url);
  }

  return async () => {
    await new Promise<void>((closed) => server.close(() => closed()));
    forgetScratchDatabases();
  };
};
