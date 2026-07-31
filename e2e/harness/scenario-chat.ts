import type { Server } from "node:http";
import { startBotApiServer } from "../fake-telegram/bot-api-server.ts";
import { createChatWorld } from "../fake-telegram/chat-world.ts";
import type { Banner, Verdict } from "../fake-telegram/chat-world.ts";
import type { ChatMessage } from "../fake-telegram/chat-log.ts";
import type { Person, PublishedCommand, Prompt } from "../fake-telegram/fake-telegram.ts";


const FIRST_WORLD_PORT = 8090;

const LONE_WORKER = "1";

const QUIET_MS = 600;

const POLL_MS = 25;

const SETTLE_TIMEOUT_MS = 20000;

const READY_TIMEOUT_MS = 25000;

const NOTHING = 0;

const NO_PACE = 0;

// The hub keeps the last state it managed to read, so the final verdict has to be
// readable for one of its rounds before the world goes away with its worker.
const HANDOVER_MS = 700;

const OPERATOR_TG_ID = "777";

const LOG_LEVEL = "warn";

interface WorldState {
  readonly messages: readonly ChatMessage[];
  readonly answers: readonly string[];
  readonly commands: readonly PublishedCommand[];
  readonly prompt: Prompt | null;
  readonly banner: Banner;
  readonly pendingUpdates: number;
  readonly msSinceLastEffect: number;
  readonly polling: boolean;
}

export interface SaidBy {
  readonly from?: Person;
}

export interface Chat {
  open(scenario: string): Promise<void>;
  close(): Promise<void>;
  url(): string;
  say(text: string, options?: SaidBy): Promise<void>;
  replyToPrompt(text: string, options?: SaidBy): Promise<void>;
  tap(caption: string, options?: SaidBy): Promise<void>;
  tapRaw(messageId: number, data: string, options?: SaidBy): Promise<void>;
  restartBot(): Promise<void>;
  settle(): Promise<void>;
  step(step: string): void;
  verdict(verdict: Verdict, detail: string | null): void;
  botOutput(): string;
  captions(): readonly string[];
  dataFor(caption: string): string | undefined;
  cardText(): string;
  cardId(): number;
  editAttemptsOf(messageId: number): number;
  messages(): readonly ChatMessage[];
  lastText(): string;
  lastAnswer(): string;
  commands(): readonly string[];
  promptId(): number | null;
  photoBytes(): Buffer | undefined;
}

const workerPort = (): number =>
  FIRST_WORLD_PORT + Number(process.env.VITEST_WORKER_ID ?? LONE_WORKER);

const workerDatabase = (): string =>
  `data/foolproof.e2e-${process.env.VITEST_WORKER_ID ?? LONE_WORKER}.db`;

const paceMs = (): number => Number(process.env.E2E_PACE_MS ?? String(NO_PACE));

const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

const captionsOf = (card: ChatMessage | undefined): readonly string[] =>
  (card?.buttons ?? []).flatMap((row) => row.map((button) => button.text));

const port = workerPort();

const origin = `http://127.0.0.1:${String(port)}`;

// One world per worker, not one per file: the chat then reads as one long
// conversation the way Telegram does, and the port is never reopened — which is
// what used to make a run flake when two files landed on the same worker.
const world = createChatWorld({
  apiRoot: origin,
  dbPath: workerDatabase(),
  logLevel: LOG_LEVEL,
  operatorTgId: OPERATOR_TG_ID,
  echo: false,
});

let server: Server | null = null;

export const createChat = (): Chat => {
  const refresh = (): WorldState => ({
    ...world.telegram.snapshot(),
    banner: world.banner,
    pendingUpdates: world.telegram.pendingUpdates(),
    msSinceLastEffect: world.telegram.msSinceLastEffect(),
    polling: world.telegram.polling(),
  });

  const settle = async (): Promise<void> => {
    const start = Date.now();
    let drainedAt: number | null = null;

    while (Date.now() - start < SETTLE_TIMEOUT_MS) {
      const state = refresh();

      if (state.pendingUpdates > NOTHING) {
        drainedAt = null;
        await sleep(POLL_MS);
        continue;
      }

      drainedAt ??= Date.now();

      const lastEffectAt = Date.now() - state.msSinceLastEffect;

      if (Date.now() - Math.max(drainedAt, lastEffectAt) >= QUIET_MS) {
        await sleep(paceMs());

        return;
      }

      await sleep(POLL_MS);
    }

    throw new Error("the chat never went quiet — the bot is still working or has stalled");
  };

  const waitUntilPolling = async (): Promise<void> => {
    const start = Date.now();

    while (Date.now() - start < READY_TIMEOUT_MS) {
      if (refresh().polling) {
        return;
      }

      await sleep(POLL_MS);
    }

    throw new Error(`the bot never asked for updates\n${world.botOutput()}`);
  };

  const card = (): ChatMessage | undefined => world.telegram.card();

  return {
    url: () => origin,

    open: async (scenario) => {
      server ??= await startBotApiServer(world, port);

      await world.reset(scenario);
      await waitUntilPolling();
      await settle();
    },

    close: async () => {
      await sleep(HANDOVER_MS);
      await world.stop();
    },

    say: async (text, options) => {
      world.step(`said "${text}"`);
      world.telegram.say(text, { from: options?.from });
      await settle();
    },

    replyToPrompt: async (text, options) => {
      const standing = world.telegram.snapshot().prompt;

      if (standing === null) {
        throw new Error(`nothing is asking for a reply, so "${text}" has nothing to answer`);
      }

      world.step(`replied "${text}"`);
      world.telegram.say(text, { replyTo: standing.messageId, from: options?.from });
      await settle();
    },

    tap: async (caption, options) => {
      const tapped = card();
      const data = world.telegram.dataFor(caption);

      if (tapped === undefined || data === undefined) {
        throw new Error(
          `no button says "${caption}" — the card offers ${JSON.stringify(captionsOf(tapped))}`
        );
      }

      world.step(`tapped "${caption}"`);
      world.telegram.tap(tapped.messageId, data, options?.from);
      await settle();
    },

    tapRaw: async (messageId, data, options) => {
      world.step("tapped a button the card no longer offers");
      world.telegram.tap(messageId, data, options?.from);
      await settle();
    },

    restartBot: async () => {
      world.step("the bot died and came back");
      await world.restartBot();
      await waitUntilPolling();
      await settle();
    },

    settle,

    step: (step) => {
      world.step(step);
    },

    verdict: (verdict, detail) => {
      world.verdict(verdict, detail);
    },

    botOutput: () => world.botOutput(),

    captions: () => captionsOf(card()),

    dataFor: (caption) => world.telegram.dataFor(caption),

    cardText: () => card()?.text ?? "",

    cardId: () => card()?.messageId ?? NOTHING,

    editAttemptsOf: (messageId) =>
      world.telegram
        .thisScenario()
        .find((message) => message.messageId === messageId)?.editAttempts ?? NOTHING,

    messages: () => world.telegram.thisScenario(),

    lastText: () => world.telegram.thisScenario().at(-1)?.text ?? "",

    lastAnswer: () => refresh().answers.at(-1) ?? "",

    commands: () => refresh().commands.map((command) => command.command),

    promptId: () => refresh().prompt?.messageId ?? null,

    photoBytes: () => {
      const photo = world.telegram
        .thisScenario()
        .filter((message) => message.photo !== null)
        .at(-1)?.photo;

      return photo === null || photo === undefined
        ? undefined
        : world.telegram.photoBytes(photo);
    },
  };
};
