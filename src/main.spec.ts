import { beforeAll, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";
import { LoggingStub } from "#shared/logging/logger.stub.ts";
import { RepositoryInstanceStub } from "#shared/repository/repository-instance.stub.ts";
import { ShutdownStub } from "#shared/lifecycle/shutdown.stub.ts";
import { CrashExitStub } from "#shared/lifecycle/crash-exit.stub.ts";
import { ApiRetryStub } from "#shared/telegram/api-retry.stub.ts";


const ONCE = 1;

const FIRST = 0;

const LAST = -1;

const TWO = 2;

const TOKEN_FROM_ENV = "424242:token-from-env";

const LOG_LEVEL_FROM_ENV = "debug";

const START_ATTEMPT = 3;

const PREVIOUS_EXIT = "exit code 1";

const OPERATOR_TG_ID = "777";

const env = new EnvStub({
  BOT_TOKEN: TOKEN_FROM_ENV,
  LOG_LEVEL: LOG_LEVEL_FROM_ENV,
  BOT_START_ATTEMPT: String(START_ATTEMPT),
  BOT_PREVIOUS_EXIT: PREVIOUS_EXIT,
  OPERATOR_TG_ID,
});

const shutdown = new ShutdownStub();

const logging = new LoggingStub();

const repository = new RepositoryInstanceStub();

const crashExit = new CrashExitStub();

const apiRetry = new ApiRetryStub();

const order: string[] = [];

const useSpy = vi.fn();

const botApi = { marker: "the-api", config: { use: useSpy } };

const startSpy = vi.fn(async (): Promise<void> => {
  order.push("start");
});

const stopSpy = vi.fn(async (): Promise<void> => undefined);

const botSpy = vi.fn();

const cardStopSpy = vi.fn(async (): Promise<void> => undefined);

const CARD_FEATURE = { commands: [{ command: "game" }], stop: cardStopSpy };

const SESSION_FEATURE = { commands: [{ command: "stats" }] };

const DIAGNOSTICS_FEATURE = { commands: [{ command: "status", hidden: true }] };

const createDiagnosticsFeatureSpy = vi.fn((_deps: unknown) => DIAGNOSTICS_FEATURE);

const createLiveGameFeatureSpy = vi.fn((_deps: unknown) => CARD_FEATURE);

const createScoresheetFeatureSpy = vi.fn((_deps: unknown) => SESSION_FEATURE);

const installFeaturesSpy = vi.fn((_bot: unknown, _features: unknown, _log: unknown) => {
  order.push("install");

  return [cardStopSpy];
});

const publishCommandMenuSpy = vi.fn(
  async (_api: unknown, _features: unknown, _log: unknown): Promise<void> => {
    order.push("menu");
  }
);

const resumeFeaturesSpy = vi.fn(async (_features: unknown, _log: unknown): Promise<void> => {
  order.push("resume");
});

const signalHandlers = new Map<string, () => void>();

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

vi.mock("#shared/logging/logger.ts", () => logging.module);

vi.mock("#app/feature-installer.ts", () => ({
  installFeatures: (bot: unknown, features: unknown, log: unknown) =>
    installFeaturesSpy(bot, features, log),
  publishCommandMenu: (api: unknown, features: unknown, log: unknown) =>
    publishCommandMenuSpy(api, features, log),
  resumeFeatures: (features: unknown, log: unknown) => resumeFeaturesSpy(features, log),
}));

vi.mock("#shared/lifecycle/crash-exit.ts", () => crashExit.module);

vi.mock("#shared/telegram/api-retry.ts", () => apiRetry.module);

vi.mock("#live-game/live-game-feature.ts", () => ({
  createLiveGameFeature: (deps: unknown) => createLiveGameFeatureSpy(deps),
}));

vi.mock("#scoresheet/scoresheet-feature.ts", () => ({
  createScoresheetFeature: (deps: unknown) => createScoresheetFeatureSpy(deps),
}));

vi.mock("#diagnostics/diagnostics-feature.ts", () => ({
  createDiagnosticsFeature: (deps: unknown) => createDiagnosticsFeatureSpy(deps),
}));

vi.mock("#shared/lifecycle/shutdown.ts", () => shutdown.module);

vi.mock("#shared/config/env.ts", () => env.module);

vi.mock("#shared/repository/repository-instance.ts", () => repository.module);

describe("main.ts", () => {
  beforeAll(async () => {
    env.requireEnvSpy.mockReturnValue(TOKEN_FROM_ENV);
    vi.spyOn(process, "once").mockImplementation(((event: string, handler: () => void) => {
      signalHandlers.set(event, handler);

      return process;
    }) as typeof process.once);

    await import("#app/main.ts");
  });

  it("should build the bot with the token from the environment", () => {
    expect(botSpy).toHaveBeenCalledWith(TOKEN_FROM_ENV);
  });

  it("should ask for BOT_TOKEN out of the loaded environment, not read it itself", () => {
    expect(env.requireEnvSpy).toHaveBeenCalledWith(env.loaded, "BOT_TOKEN");
  });

  it("should hand the card feature the real repository", () => {
    expect(createLiveGameFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ repo: repository.stub })
    );
  });

  it("should hand the card feature the bot's own api, so its edits go somewhere", () => {
    expect(createLiveGameFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ api: botApi })
    );
  });

  it("should hand the scoresheet feature the real repository", () => {
    expect(createScoresheetFeatureSpy).toHaveBeenCalledWith({ repo: repository.stub });
  });

  it("should install every feature", () => {
    expect(installFeaturesSpy.mock.calls[0]?.[1]).toEqual([
      CARD_FEATURE,
      SESSION_FEATURE,
      DIAGNOSTICS_FEATURE,
    ]);
  });

  it("should hand diagnostics the real repository, so /status reads the live database", () => {
    expect(createDiagnosticsFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ repo: repository.stub })
    );
  });

  it("should tell diagnostics which log level is in force", () => {
    expect(createDiagnosticsFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ logLevel: LOG_LEVEL_FROM_ENV })
    );
  });

  it("should tell diagnostics which start this is, so a restart is visible", () => {
    expect(createDiagnosticsFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ startAttempt: START_ATTEMPT })
    );
  });

  it("should pass on how the previous start ended", () => {
    expect(createDiagnosticsFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ previousExit: PREVIOUS_EXIT })
    );
  });

  it("should pass on who may ask for the status", () => {
    expect(createDiagnosticsFeatureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ operatorTgId: OPERATOR_TG_ID })
    );
  });

  it("should install the features before publishing the menu", () => {
    expect(order.indexOf("install")).toBeLessThan(order.indexOf("menu"));
  });

  it("should publish the menu before accepting updates", () => {
    expect(order.indexOf("menu")).toBeLessThan(order.indexOf("start"));
  });

  it("should publish a menu built from the installed features", () => {
    expect(publishCommandMenuSpy).toHaveBeenCalledWith(
      botApi,
      [CARD_FEATURE, SESSION_FEATURE, DIAGNOSTICS_FEATURE],
      logging.logger
    );
  });

  it("should teach the api to retry, so one lost packet does not lose a tap", () => {
    expect(useSpy).toHaveBeenCalledWith(apiRetry.transformer);
  });

  it("should give the retries the same logger, so an outage is visible", () => {
    expect(apiRetry.logGiven()).toBe(logging.logger);
  });

  it("should install the retries before any feature can call the api", () => {
    expect(useSpy.mock.invocationCallOrder[FIRST] ?? 0).toBeLessThan(
      installFeaturesSpy.mock.invocationCallOrder[FIRST] ?? 0
    );
  });

  it("should arrange for a crash to be logged rather than silent", () => {
    expect(crashExit.logGiven()).toBe(logging.logger);
  });

  it("should let the features pick up what the last run left behind", () => {
    expect(resumeFeaturesSpy).toHaveBeenCalledWith(
      [CARD_FEATURE, SESSION_FEATURE, DIAGNOSTICS_FEATURE],
      logging.logger
    );
  });

  it("should resume before accepting updates, so a stale card is fixed first", () => {
    expect(order.indexOf("resume")).toBeLessThan(order.indexOf("start"));
  });

  it("should drop updates that piled up while it was down", () => {
    expect(startSpy).toHaveBeenCalledWith({ drop_pending_updates: true });
  });

  it("should name the log scope after the delivery mode", () => {
    expect(logging.scopeGiven()).toBe("polling");
  });

  it("should announce that it is listening", () => {
    expect(logging.logger.infoSpy).toHaveBeenCalledWith("listening for updates by long polling");
  });

  it("should register a handler for SIGINT", () => {
    expect(signalHandlers.has("SIGINT")).toBe(true);
  });

  it("should register a handler for SIGTERM", () => {
    expect(signalHandlers.has("SIGTERM")).toBe(true);
  });

  it("should compose the feature stops with one more for the connection", () => {
    expect(shutdown.stopsGiven()).toHaveLength(TWO);
  });

  it("should put the feature stops first, so nothing edits after the socket closes", () => {
    expect(shutdown.stopsGiven()[FIRST]).toBe(cardStopSpy);
  });

  it("should make the last stop the one that drops the connection", async () => {
    stopSpy.mockClear();

    await shutdown.stopsGiven().at(LAST)?.();

    expect(stopSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should run the composed shutdown on SIGINT", async () => {
    shutdown.shutdownSpy.mockClear();

    await signalHandlers.get("SIGINT")?.();

    expect(shutdown.shutdownSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should run the same shutdown on SIGTERM", async () => {
    shutdown.shutdownSpy.mockClear();

    await signalHandlers.get("SIGTERM")?.();

    expect(shutdown.shutdownSpy).toHaveBeenCalledTimes(ONCE);
  });
});
