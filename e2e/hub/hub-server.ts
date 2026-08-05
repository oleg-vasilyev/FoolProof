import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { chatPage } from "../fake-telegram/chat-page.ts";
import { hubPage } from "./hub-page.ts";
import { createWorldCache, type WorldCache } from "./world-cache.ts";


const OK = 200;

const NOT_FOUND = 404;

const GONE = 410;

const FIRST_WORLD_PORT = 8090;

const MOST_WORLDS = 9;

const PROBE_TIMEOUT_MS = 3000;

const WATCH_INTERVAL_MS = 400;

const JSON_TYPE = "application/json";

const HTML_TYPE = "text/html; charset=utf-8";

const PNG_TYPE = "image/png";

const WORLD_PATH = /^\/world\/([0-9]+)(\/.*)?$/;

const PHOTO_PATH = /^\/photo\/([0-9]+)$/;

interface WorldCard {
  readonly port: number;
  readonly url: string;
  readonly banner: unknown;
  readonly live: boolean;
}

const urlOf = (port: number, path: string): string =>
  `http://127.0.0.1:${String(port)}${path}`;

// Every answer here is a live reading, and one of them is `410 Gone` for a world
// the sweep has not reached yet. A 410 is heuristically cacheable, so a browser
// that asked one moment too early kept its copy and stopped asking — which looked
// exactly like a world that never started, for as long as the tab stayed open.
const send = (
  response: ServerResponse,
  status: number,
  type: string | null,
  body?: string | Buffer
): void => {
  response.writeHead(status, {
    "cache-control": "no-store",
    ...(type === null ? {} : { "content-type": type }),
  });
  response.end(body);
};

const askWorld = async (
  port: number,
  path: string,
  method: string,
  body: Buffer | undefined
): Promise<Response | null> => {
  try {
    return await fetch(urlOf(port, path), {
      method,
      body: body === undefined || body.length === 0 ? undefined : new Uint8Array(body),
      headers: { "content-type": JSON_TYPE },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
  } catch {
    return null;
  }
};

const readBody = async (request: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
};

const watchWorlds = (cache: WorldCache): NodeJS.Timeout => {
  const photosIn = (state: string): readonly number[] => {
    const parsed = JSON.parse(state) as { messages: readonly { photo: number | null }[] };

    return parsed.messages.flatMap((message) => (message.photo === null ? [] : [message.photo]));
  };

  const sweep = async (): Promise<void> => {
    const ports = Array.from({ length: MOST_WORLDS }, (_, index) => FIRST_WORLD_PORT + index);

    await Promise.all(
      ports.map(async (port) => {
        const answer = await askWorld(port, "/chat/state", "GET", undefined);

        if (answer === null) {
          return;
        }

        const state = await answer.text();
        cache.rememberState(port, state);

        for (const photo of photosIn(state)) {
          if (cache.photoOf(port, photo) === undefined) {
            const picture = await askWorld(port, `/photo/${String(photo)}`, "GET", undefined);

            if (picture !== null) {
              cache.rememberPhoto(port, photo, Buffer.from(await picture.arrayBuffer()));
            }
          }
        }
      })
    );
  };

  return setInterval(() => void sweep(), WATCH_INTERVAL_MS);
};

const worldCards = async (cache: WorldCache): Promise<readonly WorldCard[]> =>
  Promise.all(
    cache.ports().map(async (port) => {
      const answer = await askWorld(port, "/chat/state", "GET", undefined);
      const state = answer === null ? cache.stateOf(port) : await answer.text();
      const banner = (JSON.parse(state ?? "{}") as { banner?: unknown }).banner ?? null;

      return { port, url: `/world/${String(port)}/`, banner, live: answer !== null };
    })
  );

const serveWorld = async (
  cache: WorldCache,
  port: number,
  path: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  if (path === "/") {
    const status = cache.stateOf(port) === undefined ? NOT_FOUND : OK;

    send(response, status, HTML_TYPE, chatPage(`/world/${String(port)}/`));

    return;
  }

  const body = await readBody(request);
  const answer = await askWorld(port, path, request.method ?? "GET", body);
  const photo = PHOTO_PATH.exec(path)?.[1];
  const type = photo === undefined ? JSON_TYPE : PNG_TYPE;

  if (answer !== null) {
    send(response, OK, type, Buffer.from(await answer.arrayBuffer()));

    return;
  }

  const remembered =
    photo === undefined ? cache.stateOf(port) : cache.photoOf(port, Number(photo));

  if (remembered === undefined) {
    send(response, GONE, null);

    return;
  }

  send(response, OK, type, remembered);
};

const route = async (
  cache: WorldCache,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const path = (request.url ?? "").split("?")[0] ?? "";
  const world = WORLD_PATH.exec(path);

  if (world !== null) {
    return serveWorld(cache, Number(world[1]), world[2] ?? "/", request, response);
  }

  switch (path) {
    case "/":
      send(response, OK, HTML_TYPE, hubPage());

      return;

    case "/worlds":
      send(response, OK, JSON_TYPE, JSON.stringify(await worldCards(cache)));

      return;

    default:
      send(response, NOT_FOUND, null);
  }
};

export const startHub = async (port: number): Promise<Server> => {
  const cache = createWorldCache();
  const watching = watchWorlds(cache);

  const server = createServer((request, response) => {
    void route(cache, request, response).catch(() => send(response, NOT_FOUND, null));
  });

  server.once("close", () => clearInterval(watching));

  await new Promise<void>((listening, failed) => {
    server.once("error", failed);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", failed);
      listening();
    });
  });

  return server;
};
