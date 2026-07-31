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
    response.writeHead(cache.stateOf(port) === undefined ? NOT_FOUND : OK, {
      "content-type": HTML_TYPE,
    });
    response.end(chatPage());

    return;
  }

  const body = await readBody(request);
  const answer = await askWorld(port, path, request.method ?? "GET", body);
  const photo = PHOTO_PATH.exec(path)?.[1];

  if (answer !== null) {
    const bytes = Buffer.from(await answer.arrayBuffer());

    response.writeHead(OK, { "content-type": photo === undefined ? JSON_TYPE : PNG_TYPE });
    response.end(bytes);

    return;
  }

  const remembered =
    photo === undefined ? cache.stateOf(port) : cache.photoOf(port, Number(photo));

  if (remembered === undefined) {
    response.writeHead(GONE);
    response.end();

    return;
  }

  response.writeHead(OK, { "content-type": photo === undefined ? JSON_TYPE : PNG_TYPE });
  response.end(remembered);
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
      response.writeHead(OK, { "content-type": HTML_TYPE });
      response.end(hubPage());

      return;

    case "/worlds": {
      response.writeHead(OK, { "content-type": JSON_TYPE });
      response.end(JSON.stringify(await worldCards(cache)));

      return;
    }

    default:
      response.writeHead(NOT_FOUND);
      response.end();
  }
};

export const startHub = async (port: number): Promise<Server> => {
  const cache = createWorldCache();
  const watching = watchWorlds(cache);

  const server = createServer((request, response) => {
    void route(cache, request, response).catch(() => {
      response.writeHead(NOT_FOUND);
      response.end();
    });
  });

  server.once("close", () => clearInterval(watching));

  await new Promise<void>((listening) => server.listen(port, "127.0.0.1", listening));

  return server;
};
