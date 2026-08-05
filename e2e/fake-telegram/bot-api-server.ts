import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { parseMultipart, type UploadedFile } from "./multipart-body.ts";
import { chatPage } from "./chat-page.ts";
import type { Person } from "./fake-telegram.ts";
import type { ChatWorld, Verdict } from "./chat-world.ts";


const OK = 200;

const NOT_FOUND = 404;

const NOTHING = 0;

const JSON_TYPE = "application/json";

const API_PATH = /^\/bot[^/]+\/([A-Za-z]+)$/;

const PHOTO_PATH = /^\/photo\/([0-9]+)$/;

const CONTROL_PATH = /^\/control\/([a-z]+)$/;

interface Body {
  readonly payload: Record<string, unknown>;
  readonly file: UploadedFile | null;
}

const readBody = async (request: IncomingMessage): Promise<Body> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  const body = Buffer.concat(chunks);
  const contentType = request.headers["content-type"] ?? "";

  if (body.length === NOTHING) {
    return { payload: {}, file: null };
  }

  if (contentType.startsWith("multipart/form-data")) {
    const { fields, file } = parseMultipart(body, contentType);

    return { payload: fields, file };
  }

  return { payload: JSON.parse(body.toString("utf8")) as Record<string, unknown>, file: null };
};

const sendJson = (response: ServerResponse, value: unknown): void => {
  response.writeHead(OK, { "content-type": JSON_TYPE });
  response.end(JSON.stringify(value));
};

const sendNotFound = (response: ServerResponse): void => {
  response.writeHead(NOT_FOUND);
  response.end();
};

const personFrom = (payload: Record<string, unknown>): Person | undefined =>
  payload.from === undefined
    ? undefined
    : (payload.from as Person);

const handleApi = async (
  world: ChatWorld,
  method: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const { payload, file } = await readBody(request);

  sendJson(response, await world.telegram.call(method, payload, file));
};

const handleSay = async (
  world: ChatWorld,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const { payload } = await readBody(request);

  world.telegram.say(String(payload.text ?? ""), {
    replyTo: payload.replyTo === undefined ? undefined : Number(payload.replyTo),
    from: personFrom(payload),
  });

  sendJson(response, { ok: true });
};

const handleTap = async (
  world: ChatWorld,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const { payload } = await readBody(request);

  world.telegram.tap(Number(payload.messageId), String(payload.data), personFrom(payload));

  sendJson(response, { ok: true });
};

const handlePhoto = (
  world: ChatWorld,
  photo: number,
  response: ServerResponse
): void => {
  const bytes = world.telegram.photoBytes(photo);

  if (bytes === undefined) {
    sendNotFound(response);

    return;
  }

  response.writeHead(OK, { "content-type": "image/png", "cache-control": "no-store" });
  response.end(bytes);
};

const handleControl = async (
  world: ChatWorld,
  action: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const { payload } = await readBody(request);

  switch (action) {
    case "reset":
      await world.reset(String(payload.scenario ?? ""));
      break;

    case "restart":
      await world.restartBot();
      break;

    case "kill":
      await world.killBot();
      break;

    case "step":
      world.step(String(payload.step ?? ""));
      break;

    case "verdict":
      world.verdict(
        payload.verdict as Verdict,
        payload.detail === undefined ? null : String(payload.detail)
      );
      break;

    default:
      sendNotFound(response);

      return;
  }

  sendJson(response, { ok: true, output: world.botOutput(), alive: world.botAlive() });
};

const route = async (
  world: ChatWorld,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> => {
  const path = (request.url ?? "").split("?")[0] ?? "";
  const apiMethod = API_PATH.exec(path)?.[1];
  const photo = PHOTO_PATH.exec(path)?.[1];

  if (apiMethod !== undefined) {
    return handleApi(world, apiMethod, request, response);
  }

  if (photo !== undefined) {
    return handlePhoto(world, Number(photo), response);
  }

  const control = CONTROL_PATH.exec(path)?.[1];

  if (control !== undefined) {
    return handleControl(world, control, request, response);
  }

  switch (path) {
    case "/":
      response.writeHead(OK, { "content-type": "text/html; charset=utf-8" });
      response.end(chatPage());

      return;

    case "/chat/state":
      sendJson(response, {
        ...world.telegram.snapshot(),
        banner: world.banner,
        verdicts: world.verdicts,
        pendingUpdates: world.telegram.pendingUpdates(),
        msSinceLastEffect: world.telegram.msSinceLastEffect(),
        polling: world.telegram.polling(),
      });

      return;

    case "/chat/say":
      return handleSay(world, request, response);

    case "/chat/tap":
      return handleTap(world, request, response);

    default:
      sendNotFound(response);
  }
};

export const startBotApiServer = async (
  world: ChatWorld,
  port: number
): Promise<Server> => {
  const server = createServer((request, response) => {
    void route(world, request, response).catch(() => sendNotFound(response));
  });

  await new Promise<void>((listening, failed) => {
    server.once("error", (problem: NodeJS.ErrnoException) => {
      failed(
        problem.code === "EADDRINUSE"
          ? new Error(`port ${String(port)} is taken — another e2e run is still going`)
          : problem
      );
    });

    server.listen(port, "127.0.0.1", listening);
  });

  return server;
};
