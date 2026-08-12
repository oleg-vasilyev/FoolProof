import { beforeAll, describe, expect, it, vi } from "vitest";
import { EnvStub } from "#shared/config/env.stub.ts";
import { LoggingStub } from "#shared/logging/logger.stub.ts";
import { RepositoryInstanceStub } from "#shared/repository/repository-instance.stub.ts";
import { ShutdownStub } from "#shared/lifecycle/shutdown.stub.ts";
import { CrashExitStub } from "#shared/lifecycle/crash-exit.stub.ts";
import { ApiRetryStub } from "#shared/telegram/api-retry.stub.ts";
import { BotClientOptionsStub } from "#shared/telegram/bot-client-options.stub.ts";
import { LiveGameFeatureStub } from "#live-game/live-game-feature.stub.ts";
import { MergeNamesFeatureStub } from "#merge-names/merge-names-feature.stub.ts";
import { ScoresheetFeatureStub } from "#scoresheet/scoresheet-feature.stub.ts";
import { DiagnosticsFeatureStub } from "#diagnostics/diagnostics-feature.stub.ts";
import { LanguageFeatureStub } from "#language/language-feature.stub.ts";
import { ChatLocaleStub } from "#shared/locale/chat-locale.stub.ts";
import { Locale } from "#shared/locale/locales.ts";


const ONCE = 1;

const FIRST = 0;

const LAST = -1;

const TWO = 2;

const TOKEN_FROM_ENV = "424242:token-from-env";

const LOG_LEVEL_FROM_ENV = "debug";

const START_ATTEMPT = 3;

const PREVIOUS_EXIT = "exit code 1";

const OPERATOR_TG_ID = "777";

const OPTIONAL_KEYS = 4;

const CHOSEN_CHAT_ID = -100888;

const CHAT_MENUS = [{ chatId: CHOSEN_CHAT_ID, locale: "ru" }];

const env = new EnvStub({ BOT_TOKEN: TOKEN_FROM_ENV });

env.optionalEnvSpy
  .mockReturnValueOnce(LOG_LEVEL_FROM_ENV)
  .mockReturnValueOnce(String(START_ATTEMPT))
  .mockReturnValueOnce(PREVIOUS_EXIT)
  .mockReturnValueOnce(OPERATOR_TG_ID);

const shutdown = new ShutdownStub();

const logging = new LoggingStub();

const repository = new RepositoryInstanceStub();

const crashExit = new CrashExitStub();

const apiRetry = new ApiRetryStub();

const clientOptions = new BotClientOptionsStub();

const CLIENT_OPTIONS = { client: { apiRoot: "http://127.0.0.1:8081" } };

const order: string[] = [];

const useSpy = vi.fn();

const botApi = { marker: "the-api", config: { use: useSpy } };

const startSpy = vi.fn(async (): Promise<void> => {
  order.push("start");
});

const stopSpy = vi.fn(async (): Promise<void> => undefined);

const botSpy = vi.fn();

const liveGame = new LiveGameFeatureStub();

const mergeNames = new MergeNamesFeatureStub();

const scoresheet = new ScoresheetFeatureStub();

const diagnostics = new DiagnosticsFeatureStub();

const language = new LanguageFeatureStub();

const chatLocale = new ChatLocaleStub();

const INSTALLED = [
  liveGame.feature,
  mergeNames.feature,
  scoresheet.feature,
  diagnostics.feature,
  language.feature,
];

const installFeaturesSpy = vi.fn((_bot: unknown, _features: unknown, _log: unknown, _localeIn: unknown) => {
  order.push("install");

  return [liveGame.stopSpy];
});

const publishCommandMenuSpy = vi.fn(
  async (_api: unknown, _features: unknown, _log: unknown, _chat: unknown): Promise<void> => {
    order.push("menu");
  }
);

const republishChatMenusSpy = vi.fn(
  async (_api: unknown, _features: unknown, _log: unknown, _choices: unknown): Promise<void> => {
    order.push("chat-menus");
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

    public constructor(token: string, options: unknown) {
      botSpy(token, options);
    }
  },
}));

vi.mock("#shared/logging/logger.ts", () => logging.module);

vi.mock("#app/feature-installer.ts", (): typeof import("#app/feature-installer.ts") => ({
  installFeatures: (bot, features, log, localeIn) =>
    installFeaturesSpy(bot, features, log, localeIn),
  publishCommandMenu: (api, features, log, chat) => publishCommandMenuSpy(api, features, log, chat),
  republishChatMenus: (api, features, log, choices) =>
    republishChatMenusSpy(api, features, log, choices),
  resumeFeatures: (features, log) => resumeFeaturesSpy(features, log),
}));

vi.mock("#shared/lifecycle/crash-exit.ts", () => crashExit.module);

vi.mock("#shared/telegram/api-retry.ts", () => apiRetry.module);

vi.mock("#shared/telegram/bot-client-options.ts", () => clientOptions.module);

vi.mock("#live-game/live-game-feature.ts", () => liveGame.module);

vi.mock("#merge-names/merge-names-feature.ts", () => mergeNames.module);

vi.mock("#scoresheet/scoresheet-feature.ts", () => scoresheet.module);

vi.mock("#diagnostics/diagnostics-feature.ts", () => diagnostics.module);

vi.mock("#language/language-feature.ts", () => language.module);

vi.mock("#shared/locale/chat-locale.ts", () => chatLocale.module);

vi.mock("#shared/lifecycle/shutdown.ts", () => shutdown.module);

vi.mock("#shared/config/env.ts", () => env.module);

vi.mock("#shared/repository/repository-instance.ts", () => repository.module);

describe("main.ts", () => {
  beforeAll(async () => {
    env.requireEnvSpy.mockReturnValue(TOKEN_FROM_ENV);
    clientOptions.botClientOptionsSpy.mockReturnValue(CLIENT_OPTIONS);
    repository.stub.rememberedChatLocalesSpy.mockReturnValue(CHAT_MENUS);
    vi.spyOn(process, "once").mockImplementation(((event: string, handler: () => void) => {
      signalHandlers.set(event, handler);

      return process;
    }) as typeof process.once);

    await import("#app/main.ts");
  });

  it("should build the bot with the token from the environment", () => {
    expect(botSpy).toHaveBeenCalledWith(TOKEN_FROM_ENV, expect.anything());
  });

  it("should ask for BOT_TOKEN out of the loaded environment, not read it itself", () => {
    expect(env.requireEnvSpy).toHaveBeenCalledWith(env.loaded, "BOT_TOKEN");
  });

  it("should build the bot with the client options it was handed", () => {
    expect(botSpy).toHaveBeenCalledWith(expect.anything(), CLIENT_OPTIONS);
  });

  it("should read the client options out of the loaded environment", () => {
    expect(clientOptions.envGiven()).toBe(env.loaded);
  });

  it("should let the client options warn through the same logger", () => {
    expect(clientOptions.logGiven()).toBe(logging.logger);
  });

  it("should hand the card feature the real repository", () => {
    expect(liveGame.depsGiven()?.repo).toBe(repository.stub);
  });

  it("should hand the card feature the bot's own api, so its edits go somewhere", () => {
    expect(liveGame.depsGiven()?.api).toBe(botApi);
  });

  it("should hand the scoresheet feature the real repository", () => {
    expect(scoresheet.depsGiven()?.repo).toBe(repository.stub);
  });

  it("should hand the merge feature the real repository", () => {
    expect(mergeNames.depsGiven()?.repo).toBe(repository.stub);
  });

  it("should install every feature", () => {
    expect(installFeaturesSpy.mock.calls[0]?.[1]).toEqual(INSTALLED);
  });

  it("should hand diagnostics the real repository, so /status reads the live database", () => {
    expect(diagnostics.depsGiven()?.repo).toBe(repository.stub);
  });

  it("should tell diagnostics which log level is in force", () => {
    expect(diagnostics.depsGiven()?.logLevel).toBe(LOG_LEVEL_FROM_ENV);
  });

  it("should tell diagnostics which start this is, so a restart is visible", () => {
    expect(diagnostics.depsGiven()?.startAttempt).toBe(START_ATTEMPT);
  });

  it("should pass on how the previous start ended", () => {
    expect(diagnostics.depsGiven()?.previousExit).toBe(PREVIOUS_EXIT);
  });

  it("should pass on who may ask for the status", () => {
    expect(diagnostics.depsGiven()?.operatorTgId).toBe(OPERATOR_TG_ID);
  });

  it("should read every optional key through the reader that treats empty as missing", () => {
    expect(env.optionalEnvSpy.mock.calls.map((call) => call[1])).toEqual([
      "LOG_LEVEL",
      "BOT_START_ATTEMPT",
      "BOT_PREVIOUS_EXIT",
      "OPERATOR_TG_ID",
    ]);
  });

  it("should read every one of them out of the environment it loaded, not another one", () => {
    expect(env.optionalEnvSpy.mock.calls.map((call) => call[FIRST])).toEqual(
      Array<unknown>(OPTIONAL_KEYS).fill(env.loaded)
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
      INSTALLED,
      logging.logger,
      undefined
    );
  });

  it("should republish the menu of every chat that chose a language", () => {
    expect(republishChatMenusSpy).toHaveBeenCalledWith(
      botApi,
      INSTALLED,
      logging.logger,
      CHAT_MENUS
    );
  });

  it("should republish the chat menus after the global menu", () => {
    expect(order.indexOf("menu")).toBeLessThan(order.indexOf("chat-menus"));
  });

  it("should republish the chat menus before accepting updates", () => {
    expect(order.indexOf("chat-menus")).toBeLessThan(order.indexOf("start"));
  });

  it("should give the language screen a way to republish the menu for one chat", async () => {
    const CHAT_ID = -100777;

    await language.depsGiven()?.publishMenu(CHAT_ID, Locale.Ru);

    expect(publishCommandMenuSpy).toHaveBeenCalledWith(botApi, INSTALLED, logging.logger, {
      chatId: CHAT_ID,
      locale: Locale.Ru,
    });
  });

  it("should build the locale reader from the repository the features share", () => {
    expect(chatLocale.createLocaleReaderSpy).toHaveBeenCalledWith(repository.stub);
  });

  it("should hand every feature the same locale reader", () => {
    expect(language.depsGiven()?.localeIn).toBe(chatLocale.reader.read);
    expect(diagnostics.depsGiven()?.localeIn).toBe(chatLocale.reader.read);
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
    expect(resumeFeaturesSpy).toHaveBeenCalledWith(INSTALLED, logging.logger);
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
    expect(shutdown.stopsGiven()[FIRST]).toBe(liveGame.stopSpy);
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
