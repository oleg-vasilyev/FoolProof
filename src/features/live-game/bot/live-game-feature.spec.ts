import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "#shared/logger.stub.ts";
import { RepositoryStub } from "#shared/repository/repository.stub.ts";
import { copy } from "#live-game/copy.en.ts";


const CARD_SERVICE = { marker: "the-card-service" };

const PROMPT_REGISTRY = { marker: "the-prompt-registry" };

const createCardServiceSpy = vi.fn((_deps: unknown) => CARD_SERVICE);

const createPromptRegistrySpy = vi.fn((_api: unknown, _log: unknown) => PROMPT_REGISTRY);

const stopSweepSpy = vi.fn();

const startIdleSweepSpy = vi.fn((_cards: unknown, _log: unknown) => stopSweepSpy);

const shutdownSpy = vi.fn(async (): Promise<void> => undefined);

const onGameSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onNextSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onNamesReplySpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onTapSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

vi.mock("#live-game/bot/card-service.ts", () => ({
  createCardService: (deps: unknown) => {
    createCardServiceSpy(deps);

    return { ...CARD_SERVICE, shutdown: shutdownSpy };
  },
}));

vi.mock("#live-game/bot/prompt-registry.ts", () => ({
  createPromptRegistry: (api: unknown, log: unknown) => createPromptRegistrySpy(api, log),
}));

vi.mock("#live-game/bot/idle-sweep.ts", () => ({
  startIdleSweep: (cards: unknown, log: unknown) => startIdleSweepSpy(cards, log),
}));

vi.mock("#live-game/bot/update-handlers.ts", () => ({
  onGame: (context: unknown, ctx: unknown) => onGameSpy(context, ctx),
  onNext: (context: unknown, ctx: unknown) => onNextSpy(context, ctx),
  onNamesReply: (context: unknown, ctx: unknown) => onNamesReplySpy(context, ctx),
  onTap: (context: unknown, ctx: unknown) => onTapSpy(context, ctx),
}));

const { createLiveGameFeature } = await import("#live-game/bot/live-game-feature.ts");

const ONCE = 1;

const NEVER = 0;

const API = { marker: "the-api" };

describe("createLiveGameFeature()", () => {
  let repo: RepositoryStub;
  let log: LoggerStub;

  const build = () => createLiveGameFeature({ repo, api: API as never, log });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    log = new LoggerStub();
    stopSweepSpy.mockImplementation(() => undefined);
    shutdownSpy.mockImplementation(async () => undefined);
  });

  describe("what it builds", () => {
    it("should give the card service the repository, the api and the log", () => {
      build();

      expect(createCardServiceSpy).toHaveBeenCalledWith({ repo, api: API, log });
    });

    it("should give the prompt registry the api and the log", () => {
      build();

      expect(createPromptRegistrySpy).toHaveBeenCalledWith(API, log);
    });

    it("should start the idle sweep over its own card service", () => {
      build();

      expect(startIdleSweepSpy.mock.calls[0]?.[0]).toMatchObject(CARD_SERVICE);
    });

    it("should start the sweep as it is built, not on first use", () => {
      build();

      expect(startIdleSweepSpy).toHaveBeenCalledTimes(ONCE);
    });
  });

  describe("the commands it declares", () => {
    it("should offer game and next, in that order", () => {
      expect(build().commands.map((route) => route.command)).toEqual(["game", "next"]);
    });

    it("should take its menu descriptions from its own copy", () => {
      expect(build().commands.map((route) => route.menuDescription)).toEqual([
        copy.commandGame,
        copy.commandNext,
      ]);
    });

    it("should take its help lines from its own copy", () => {
      expect(build().commands.map((route) => route.help)).toEqual([
        copy.helpGame,
        copy.helpNext,
      ]);
    });

    it("should contribute its notes to the help text", () => {
      expect(build().notes).toEqual(copy.helpCard);
    });

    it("should route game to its own handler", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onGameSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should route next to its own handler", async () => {
      await build().commands[1]?.run("the-context" as never);

      expect(onNextSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should hand its handlers a context carrying the repository", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onGameSpy.mock.calls[0]?.[0]).toMatchObject({ repo });
    });
  });

  describe("what it listens to", () => {
    it("should register a text listener and a tap listener", () => {
      const onText = vi.fn();
      const onTap = vi.fn();

      build().listen?.({ onText, onTap });

      expect(onText).toHaveBeenCalledTimes(ONCE);
      expect(onTap).toHaveBeenCalledTimes(ONCE);
    });

    it("should send a text message to the names handler", async () => {
      const onText = vi.fn();

      build().listen?.({ onText, onTap: vi.fn() });
      await (onText.mock.calls[0]?.[0] as (ctx: unknown) => Promise<void>)("the-message");

      expect(onNamesReplySpy).toHaveBeenCalledWith(expect.anything(), "the-message");
    });

    it("should send a tap to the tap handler", async () => {
      const onTap = vi.fn();

      build().listen?.({ onText: vi.fn(), onTap });
      await (onTap.mock.calls[0]?.[0] as (ctx: unknown) => Promise<void>)("the-tap");

      expect(onTapSpy).toHaveBeenCalledWith(expect.anything(), "the-tap");
    });
  });

  describe("how it stops", () => {
    it("should stop the idle sweep", async () => {
      await build().stop?.();

      expect(stopSweepSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should flush pending edits so the last tap is not lost", async () => {
      await build().stop?.();

      expect(shutdownSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should stop the sweep before flushing, so it cannot queue more work", async () => {
      const order: string[] = [];
      stopSweepSpy.mockImplementation(() => order.push("sweep"));
      shutdownSpy.mockImplementation(async () => {
        order.push("flush");
      });

      await build().stop?.();

      expect(order).toEqual(["sweep", "flush"]);
    });

    it("should not stop anything merely by being built", () => {
      build();

      expect(stopSweepSpy).toHaveBeenCalledTimes(NEVER);
      expect(shutdownSpy).toHaveBeenCalledTimes(NEVER);
    });
  });
});
