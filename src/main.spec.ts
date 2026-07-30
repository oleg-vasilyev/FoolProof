import { beforeAll, describe, expect, it, vi } from "vitest";


const ONCE = 1;

const TOKEN_FROM_ENV = "424242:token-from-env";

const order: string[] = [];

const botApi = { marker: "the-api" };

const startSpy = vi.fn(async (): Promise<void> => {
  order.push("start");
});

const stopSpy = vi.fn(async (): Promise<void> => undefined);

const botSpy = vi.fn();

const cardStopSpy = vi.fn(async (): Promise<void> => {
  order.push("card-stopped");
});

const CARD_FEATURE = { commands: [{ command: "game" }], stop: cardStopSpy };

const SESSION_FEATURE = { commands: [{ command: "stats" }] };

const createLiveGameFeatureSpy = vi.fn((_deps: unknown) => CARD_FEATURE);

const createScoresheetFeatureSpy = vi.fn((_deps: unknown) => SESSION_FEATURE);

const installFeaturesSpy = vi.fn((_bot: unknown, _features: unknown, _log: unknown) => {
  order.push("install");

  return [cardStopSpy];
});

const publishCommandMenuSpy = vi.fn(async (_api: unknown, _features: unknown): Promise<void> => {
  order.push("menu");
});

const signalHandlers = new Map<string, () => void>();

const logInfoSpy = vi.fn();

const createLoggerSpy = vi.fn((_scope: string) => ({
  debug: vi.fn(),
  info: logInfoSpy,
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("grammy", () => ({
  Bot: class {
    public readonly api = botApi;
    public start = startSpy;
    public stop = stopSpy;

    public constructor(token: string) {
      botSpy(token);
    }
  },
}));

vi.mock("#shared/logging/logger.ts", () => ({
  createLogger: (scope: string) => createLoggerSpy(scope),
}));

vi.mock("#app/feature-installer.ts", () => ({
  installFeatures: (bot: unknown, features: unknown, log: unknown) =>
    installFeaturesSpy(bot, features, log),
  publishCommandMenu: (api: unknown, features: unknown) => publishCommandMenuSpy(api, features),
}));

vi.mock("#live-game/bot/live-game-feature.ts", () => ({
  createLiveGameFeature: (deps: unknown) => createLiveGameFeatureSpy(deps),
}));

vi.mock("#scoresheet/bot/scoresheet-feature.ts", () => ({
  createScoresheetFeature: (deps: unknown) => createScoresheetFeatureSpy(deps),
}));

vi.mock("#shared/lifecycle/shutdown.ts", () => ({
  createShutdown: (stops: readonly (() => Promise<void>)[]) => async () => {
    for (const stop of stops) {
      await stop();
    }
  },
}));

vi.mock("#shared/config/env.ts", () => ({
  loadEnv: () => ({ BOT_TOKEN: TOKEN_FROM_ENV }),
  requireEnv: (env: Record<string, string>, key: string) => env[key],
}));

vi.mock("#shared/repository/repository-instance.ts", () => ({ repository: { marker: "the-repository" } }));

describe("main.ts", () => {
  beforeAll(async () => {
    vi.spyOn(process, "once").mockImplementation(((event: string, handler: () => void) => {
      signalHandlers.set(event, handler);

      return process;
    }) as typeof process.once);

    await import("#app/main.ts");
  });

  it("should build the bot with the token from the environment", () => {
    expect(botSpy).toHaveBeenCalledWith(TOKEN_FROM_ENV);
  });

  it("should hand the card feature the real repository", () => {
    expect(createLiveGameFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ repo: { marker: "the-repository" } })
    );
  });

  it("should hand the card feature the bot's own api, so its edits go somewhere", () => {
    expect(createLiveGameFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ api: botApi })
    );
  });

  it("should hand the scoresheet feature the real repository", () => {
    expect(createScoresheetFeatureSpy).toHaveBeenCalledWith({ repo: { marker: "the-repository" } });
  });

  it("should install both features", () => {
    expect(installFeaturesSpy.mock.calls[0]?.[1]).toEqual([CARD_FEATURE, SESSION_FEATURE]);
  });

  it("should install the features before publishing the menu", () => {
    expect(order.indexOf("install")).toBeLessThan(order.indexOf("menu"));
  });

  it("should publish the menu before accepting updates", () => {
    expect(order.indexOf("menu")).toBeLessThan(order.indexOf("start"));
  });

  it("should publish a menu built from the installed features", () => {
    expect(publishCommandMenuSpy).toHaveBeenCalledWith(botApi, [CARD_FEATURE, SESSION_FEATURE]);
  });

  it("should drop updates that piled up while it was down", () => {
    expect(startSpy).toHaveBeenCalledWith({ drop_pending_updates: true });
  });

  it("should name the log scope after the delivery mode", () => {
    expect(createLoggerSpy).toHaveBeenCalledWith("polling");
  });

  it("should announce that it is listening", () => {
    expect(logInfoSpy).toHaveBeenCalledWith("listening for updates by long polling");
  });

  it("should register a handler for SIGINT", () => {
    expect(signalHandlers.has("SIGINT")).toBe(true);
  });

  it("should register a handler for SIGTERM", () => {
    expect(signalHandlers.has("SIGTERM")).toBe(true);
  });

  it("should stop the features on SIGINT", async () => {
    cardStopSpy.mockClear();

    await signalHandlers.get("SIGINT")?.();

    expect(cardStopSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should stop polling on SIGTERM", async () => {
    stopSpy.mockClear();

    await signalHandlers.get("SIGTERM")?.();

    expect(stopSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should stop the features before dropping the connection", async () => {
    order.length = 0;

    await signalHandlers.get("SIGINT")?.();

    expect(order).toEqual(["card-stopped"]);
  });
});
