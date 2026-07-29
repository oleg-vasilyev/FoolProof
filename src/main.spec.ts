import { beforeAll, describe, expect, it, vi } from "vitest";


const ONCE = 1;

const TOKEN_FROM_ENV = "424242:token-from-env";

const order: string[] = [];

const botApi = { setMyCommands: vi.fn() };

const startSpy = vi.fn(async (): Promise<void> => {
  order.push("start");
});

const stopSpy = vi.fn(async (): Promise<void> => undefined);

const cardsShutdownSpy = vi.fn(async (): Promise<void> => undefined);

const createBotSpy = vi.fn((_token: string, _deps: { repo: unknown; log: unknown }) => ({
  bot: { api: botApi, start: startSpy, stop: stopSpy },
  cards: { shutdown: cardsShutdownSpy },
}));

const publishCommandMenuSpy = vi.fn(async (_api: unknown): Promise<void> => {
  order.push("menu");
});

const stopReaperSpy = vi.fn();

const startReaperSpy = vi.fn((_cards: unknown, _log: unknown) => stopReaperSpy);

const signalHandlers = new Map<string, () => void>();

vi.mock("./features/bot/index.ts", () => ({
  createBot: (token: string, deps: { repo: unknown; log: unknown }) =>
    createBotSpy(token, deps),
  publishCommandMenu: (api: unknown) => publishCommandMenuSpy(api),
}));

vi.mock("./features/bot/reaper.ts", () => ({
  startReaper: (cards: unknown, log: unknown) => startReaperSpy(cards, log),
}));

vi.mock("./shared/env.ts", () => ({
  loadEnv: () => ({ BOT_TOKEN: TOKEN_FROM_ENV }),
  requireEnv: (env: Record<string, string>, key: string) => env[key],
}));

vi.mock("./shared/repository/index.ts", () => ({ repository: { marker: "the-repository" } }));

describe("main.ts", () => {
  beforeAll(async () => {
    vi.spyOn(process, "once").mockImplementation(((event: string, handler: () => void) => {
      signalHandlers.set(event, handler);

      return process;
    }) as typeof process.once);

    await import("./main.ts");
  });

  it("should build the bot with the token from the environment", () => {
    expect(createBotSpy.mock.calls[0]?.[0]).toBe(TOKEN_FROM_ENV);
  });

  it("should hand the bot the real repository", () => {
    expect(createBotSpy.mock.calls[0]?.[1]).toMatchObject({
      repo: { marker: "the-repository" },
    });
  });

  it("should start the idle sweep", () => {
    expect(startReaperSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should publish the command menu", () => {
    expect(publishCommandMenuSpy).toHaveBeenCalledWith(botApi);
  });

  it("should publish the menu before accepting updates", () => {
    expect(order).toEqual(["menu", "start"]);
  });

  it("should drop updates that piled up while it was down", () => {
    expect(startSpy).toHaveBeenCalledWith({ drop_pending_updates: true });
  });

  it("should shut down cleanly on SIGINT", async () => {
    await signalHandlers.get("SIGINT")?.();

    expect(cardsShutdownSpy).toHaveBeenCalled();
  });

  it("should shut down cleanly on SIGTERM", async () => {
    await signalHandlers.get("SIGTERM")?.();

    expect(stopSpy).toHaveBeenCalled();
  });

  it("should stop the sweep as part of shutting down", async () => {
    await signalHandlers.get("SIGINT")?.();

    expect(stopReaperSpy).toHaveBeenCalled();
  });
});
