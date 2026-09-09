import { createFakeTelegram, type FakeTelegram } from "./fake-telegram.ts";
import { startBot, type BotOptions, type BotProcess } from "../bot-process.ts";
import { resetDatabase } from "../scratch-database.ts";
import type { KeepBotOutput } from "../bot-log.ts";


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
  readonly verdicts: readonly Verdict[];
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

export const createChatWorld = (
  botOptions: BotOptions,
  keepBotOutput: KeepBotOutput | null = null
): ChatWorld => {
  const telegram = createFakeTelegram();
  let bot: BotProcess | null = null;
  let banner: Banner = IDLE;

  // The banner says how the scenario running now is going. This says how every
  // scenario this world has played went, which is what the hub lists.
  let verdicts: readonly Verdict[] = [];

  // Everything every bot of the scenario running now has said, so a restart
  // mid-scenario loses nothing and the log written is the whole scenario's.
  let scenarioOutput = "";

  const stopBot = async (): Promise<void> => {
    if (bot !== null && banner.verdict !== IDLE.verdict) {
      scenarioOutput += bot.output();
      keepBotOutput?.(banner.scenario, scenarioOutput);
    }

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

    get verdicts() {
      return verdicts;
    },

    start: () => {
      bot = startBot(botOptions);
    },

    reset: async (scenario) => {
      await stopBot();
      resetDatabase(botOptions.dbPath);

      telegram.beginScenario(scenario);
      scenarioOutput = "";
      banner = { scenario, step: "starting the bot", verdict: "running", detail: null };
      verdicts = [...verdicts, "running"];
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
      verdicts = [...verdicts.slice(0, -1), verdict];
    },

    // The verdict is the last thing anybody wants to read off a world, so stopping
    // keeps it. Resetting to IDLE here lost the result of whichever scenario the
    // hub happened to sweep between one file's stop and the next file's reset.
    stop: stopBot,
  };
};
