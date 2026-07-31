import { createFakeTelegram, type FakeTelegram } from "./fake-telegram.ts";
import { startBot, type BotOptions, type BotProcess } from "../bot-process.ts";
import { resetDatabase } from "../scratch-database.ts";


export type Verdict = "waiting" | "running" | "passed" | "failed";

export interface Banner {
  readonly scenario: string;
  readonly step: string;
  readonly verdict: Verdict;
  readonly detail: string | null;
}

export interface ChatWorld {
  readonly telegram: FakeTelegram;
  readonly banner: Banner;
  start(): void;
  reset(scenario: string): Promise<void>;
  restartBot(): Promise<void>;
  killBot(): Promise<void>;
  botOutput(): string;
  botAlive(): boolean;
  step(step: string): void;
  verdict(verdict: Verdict, detail: string | null): void;
  stop(): Promise<void>;
}

const IDLE: Banner = { scenario: "nothing running", step: "", verdict: "waiting", detail: null };

export const createChatWorld = (botOptions: BotOptions): ChatWorld => {
  const telegram = createFakeTelegram();
  let bot: BotProcess | null = null;
  let banner: Banner = IDLE;

  const stopBot = async (): Promise<void> => {
    await bot?.stop();
    bot = null;
  };

  return {
    get telegram() {
      return telegram;
    },

    get banner() {
      return banner;
    },

    start: () => {
      bot = startBot(botOptions);
    },

    reset: async (scenario) => {
      await stopBot();
      resetDatabase(botOptions.dbPath);

      telegram.beginScenario(scenario);
      banner = { scenario, step: "starting the bot", verdict: "running", detail: null };
      bot = startBot(botOptions);
    },

    restartBot: async () => {
      await stopBot();
      telegram.forgetPolling();
      bot = startBot(botOptions);
    },

    killBot: stopBot,

    botOutput: () => bot?.output() ?? "",

    botAlive: () => bot?.alive() ?? false,

    step: (step) => {
      banner = { ...banner, step };
    },

    verdict: (verdict, detail) => {
      banner = { ...banner, verdict, detail };
    },

    stop: async () => {
      await stopBot();
      banner = IDLE;
    },
  };
};
