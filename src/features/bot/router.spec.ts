import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "../../shared/logger.stub.ts";
import { RepositoryStub } from "../../shared/repository/repository.stub.ts";
import { strings } from "../render/strings.ts";
import { CardServiceStub } from "./cards.stub.ts";


const BOT_API = { marker: "the-bot-api" };

const PROMPT_REGISTRY = { marker: "the-prompt-registry" };

const registrations: string[] = [];

const botConstructorSpy = vi.fn();

const commandSpy = vi.fn((name: string, _handler: unknown) => {
  registrations.push(`command:${name}`);
});

const onSpy = vi.fn((filter: string, _handler: unknown) => {
  registrations.push(`on:${filter}`);
});

const catchSpy = vi.fn();

const createCardServiceSpy = vi.fn();

const createPromptRegistrySpy = vi.fn((_api: unknown, _log: unknown) => PROMPT_REGISTRY);

const handlerSpies = {
  onGame: vi.fn(),
  onNext: vi.fn(),
  onStats: vi.fn(),
  onHelp: vi.fn(),
  onNamesReply: vi.fn(),
  onTap: vi.fn(),
};

class BotMock {
  public api = BOT_API;
  public command = commandSpy;
  public on = onSpy;
  public catch = catchSpy;

  public constructor(token: string, config: unknown) {
    botConstructorSpy(token, config);
  }
}

vi.mock("grammy", () => ({
  Bot: BotMock,
}));

vi.mock("./cards.ts", () => ({
  createCardService: (deps: unknown) => createCardServiceSpy(deps),
}));

vi.mock("./prompts.ts", () => ({
  createPromptRegistry: (api: unknown, log: unknown) => createPromptRegistrySpy(api, log),
}));

vi.mock("./handlers.ts", () => ({
  onGame: (context: unknown, ctx: unknown) => handlerSpies.onGame(context, ctx),
  onNext: (context: unknown, ctx: unknown) => handlerSpies.onNext(context, ctx),
  onStats: (context: unknown, ctx: unknown) => handlerSpies.onStats(context, ctx),
  onHelp: (ctx: unknown) => handlerSpies.onHelp(ctx),
  onNamesReply: (context: unknown, ctx: unknown) => handlerSpies.onNamesReply(context, ctx),
  onTap: (context: unknown, ctx: unknown) => handlerSpies.onTap(context, ctx),
}));

const { createBot, publishCommandMenu } = await import("./router.ts");

const FAKE_TOKEN = "424242:AAHfake-token-for-tests";

const BOT_INFO = { id: 424242, username: "foolproof_bot" };

const ONCE = 1;

const A_CONTEXT = { marker: "an-update-context" };

describe("createBot()", () => {
  let repo: RepositoryStub;
  let log: LoggerStub;
  let cards: CardServiceStub;

  const build = () => createBot(FAKE_TOKEN, { repo, log, botInfo: BOT_INFO as never });

  const handlerFor = (route: string): ((ctx: unknown) => unknown) => {
    const registered = route.startsWith("command:")
      ? commandSpy.mock.calls.find((call) => call[0] === route.slice("command:".length))
      : onSpy.mock.calls.find((call) => call[0] === route.slice("on:".length));

    return registered?.[1] as (ctx: unknown) => unknown;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    registrations.length = 0;

    repo = new RepositoryStub();
    log = new LoggerStub();
    cards = new CardServiceStub();

    createCardServiceSpy.mockReturnValue(cards.service);
    createPromptRegistrySpy.mockReturnValue(PROMPT_REGISTRY);
  });

  describe("wiring", () => {
    it("should build the bot with the token it was given", () => {
      build();

      expect(botConstructorSpy.mock.calls[0]?.[0]).toBe(FAKE_TOKEN);
    });

    it("should pass botInfo through so no getMe call is needed", () => {
      build();

      expect(botConstructorSpy.mock.calls[0]?.[1]).toEqual({ botInfo: BOT_INFO });
    });

    it("should let the bot fetch its own identity when botInfo is absent", () => {
      createBot(FAKE_TOKEN, { repo, log });

      expect(botConstructorSpy.mock.calls[0]?.[1]).toEqual({});
    });

    it("should hand the card service the bot's own api", () => {
      build();

      expect(createCardServiceSpy).toHaveBeenCalledWith({ repo, api: BOT_API, log });
    });

    it("should give the prompt registry the same api and logger", () => {
      build();

      expect(createPromptRegistrySpy).toHaveBeenCalledWith(BOT_API, log);
    });

    it("should return the bot and the card service together", () => {
      const bundle = build();

      expect(bundle.cards).toBe(cards.service);
      expect(bundle.bot).toBeInstanceOf(BotMock);
    });
  });

  describe("route order", () => {
    it("should register every command before any text filter", () => {
      build();

      expect(registrations).toEqual([
        "command:game",
        "command:next",
        "command:stats",
        "command:help",
        "on:message:text",
        "on:callback_query:data",
      ]);
    });

    it("should put the text filter after the last command, not before the first", () => {
      build();

      const textFilter = registrations.indexOf("on:message:text");
      const lastCommand = registrations.lastIndexOf("command:help");

      expect(textFilter).toBeGreaterThan(lastCommand);
    });
  });

  describe("delegation", () => {
    it.each([
      ["command:game", "onGame"],
      ["command:next", "onNext"],
      ["command:stats", "onStats"],
      ["on:message:text", "onNamesReply"],
      ["on:callback_query:data", "onTap"],
    ])("should route %s to %s with the shared context", async (route, handler) => {
      build();

      await handlerFor(route)(A_CONTEXT);

      expect(handlerSpies[handler as keyof typeof handlerSpies]).toHaveBeenCalledWith(
        { repo, cards: cards.service, prompts: PROMPT_REGISTRY },
        A_CONTEXT
      );
    });

    it("should route help without a context, since it needs none", async () => {
      build();

      await handlerFor("command:help")(A_CONTEXT);

      expect(handlerSpies.onHelp).toHaveBeenCalledWith(A_CONTEXT);
    });
  });

  describe("error handling", () => {
    const failingUpdate = { update: { update_id: 99 } };

    const reportError = (cause: string) => {
      const handler = catchSpy.mock.calls[0]?.[0] as (error: unknown) => void;
      handler({ ctx: failingUpdate, error: new Error(cause) });
    };

    it("should install an error handler", () => {
      build();

      expect(catchSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should log a failing update rather than staying silent", () => {
      build();

      reportError("database is locked");

      expect(log.errorSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should name the update and the cause", () => {
      build();

      reportError("database is locked");

      expect(log.errorSpy.mock.calls[0]?.[0]).toContain("99");
      expect(log.errorSpy.mock.calls[0]?.[0]).toContain("database is locked");
    });
  });
});

describe("publishCommandMenu()", () => {
  it("should register every implemented command", async () => {
    const setMyCommands = vi.fn().mockResolvedValue(true);

    await publishCommandMenu({ setMyCommands } as never);

    expect(setMyCommands.mock.calls[0]?.[0]).toEqual([
      { command: "game", description: strings.commandGame },
      { command: "next", description: strings.commandNext },
      { command: "stats", description: strings.commandStats },
      { command: "help", description: strings.commandHelp },
    ]);
  });
});
