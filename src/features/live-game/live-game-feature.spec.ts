import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { ListenersStub } from "#shared/telegram/feature-contract.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { Locale } from "#shared/locale/locales.ts";
import { copy } from "#live-game/copy.en.ts";
import { copy as russian } from "#live-game/copy.ru.ts";


const CARD_SERVICE = { marker: "the-card-service" };

const PROMPT_REGISTRY = { marker: "the-prompt-registry" };

const createCardServiceSpy = vi.fn((_deps: unknown) => CARD_SERVICE);

const createPromptRegistrySpy = vi.fn((_api: unknown, _log: unknown) => PROMPT_REGISTRY);

const stopSweepSpy = vi.fn();

const startIdleSweepSpy = vi.fn((_cards: unknown, _log: unknown) => stopSweepSpy);

const shutdownSpy = vi.fn(async (): Promise<void> => undefined);

const redrawLiveSpy = vi.fn(async (): Promise<number> => 0);

const onGameSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onNextSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onNextWithSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onNextWithoutSpy = vi.fn(
  async (_context: unknown, _ctx: unknown): Promise<void> => undefined
);

const onNamesReplySpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onTapSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

vi.mock("#live-game/bot/card/card-service.ts", () => ({
  createCardService: (deps: unknown) => {
    createCardServiceSpy(deps);

    return { ...CARD_SERVICE, shutdown: shutdownSpy, redrawLive: redrawLiveSpy };
  },
}));

vi.mock("#live-game/bot/prompt-registry.ts", () => ({
  createPromptRegistry: (api: unknown, log: unknown) => createPromptRegistrySpy(api, log),
}));

vi.mock("#live-game/bot/card/idle-sweep.ts", () => ({
  startIdleSweep: (cards: unknown, log: unknown) => startIdleSweepSpy(cards, log),
}));

vi.mock("#live-game/bot/lineup/lineup-from-names.ts", () => ({
  onGame: (context: unknown, ctx: unknown) => onGameSpy(context, ctx),
}));

vi.mock("#live-game/bot/lineup/lineup-from-last-game.ts", () => ({
  onNext: (context: unknown, ctx: unknown) => onNextSpy(context, ctx),
  onNextWith: (context: unknown, ctx: unknown) => onNextWithSpy(context, ctx),
  onNextWithout: (context: unknown, ctx: unknown) => onNextWithoutSpy(context, ctx),
}));

vi.mock("#live-game/bot/lineup/names-reply.ts", () => ({
  onNamesReply: (context: unknown, ctx: unknown) => onNamesReplySpy(context, ctx),
}));

vi.mock("#live-game/bot/card/tap-handler.ts", () => ({
  onTap: (context: unknown, ctx: unknown) => onTapSpy(context, ctx),
}));

const CARD_TAPS = /^the-card-taps$/;

vi.mock("#live-game/render/callback-data-codec.ts", () => ({ CARD_TAPS }));

const onSeatingTapSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onLeavingTapSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

vi.mock("#live-game/bot/leaving-screen.ts", () => ({
  onLeavingTap: (context: unknown, ctx: unknown) => onLeavingTapSpy(context, ctx),
}));

vi.mock("#live-game/bot/seating-screen.ts", () => ({
  onSeatingTap: (context: unknown, ctx: unknown) => onSeatingTapSpy(context, ctx),
}));

const SEATING_TAPS = /^the-seating-taps$/;

const LEAVING_TAPS = /^the-leaving-taps$/;

vi.mock("#live-game/render/seating-screen/seating-callback-codec.ts", () => ({ SEATING_TAPS }));

vi.mock("#live-game/render/leaving-screen/leaving-callback-codec.ts", () => ({ LEAVING_TAPS }));

const SEATING_LISTENER = 1;

const LEAVING_LISTENER = 2;

const EVERY_SCREEN = 3;

const { createLiveGameFeature } = await import("#live-game/live-game-feature.ts");

const ONCE = 1;

const NEVER = 0;

const API = { marker: "the-api" };

describe("createLiveGameFeature()", () => {
  let repo: RepositoryStub;
  let log: LoggerStub;
  let locales: LocaleReaderStub;

  const build = () =>
    createLiveGameFeature({ repo, api: API as never, log, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    log = new LoggerStub();
    locales = new LocaleReaderStub();
    stopSweepSpy.mockImplementation(() => undefined);
    shutdownSpy.mockImplementation(async () => undefined);
  });

  describe("what it builds", () => {
    it("should give the card service the repository, the api and the log", () => {
      build();

      expect(createCardServiceSpy).toHaveBeenCalledWith({
        repo,
        api: API,
        log,
        localeIn: locales.read,
      });
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
    it("should offer game, next, next_with and next_without, in that order", () => {
      expect(build().commands.map((route) => route.command)).toEqual([
        "game",
        "next",
        "next_with",
        "next_without",
      ]);
    });

    it("should take its menu descriptions from its own copy", () => {
      expect(build().commands.map((route) => route.menuDescription(Locale.En))).toEqual([
        copy.commandGame,
        copy.commandNext,
        copy.commandNextWith,
        copy.commandNextWithout,
      ]);
    });

    it("should take its help lines from its own copy", () => {
      expect(build().commands.map((route) => route.help(Locale.En))).toEqual([
        copy.helpGame,
        copy.helpNext,
        copy.helpNextWith,
        copy.helpNextWithout,
      ]);
    });

    it("should describe every command in whichever language it is asked for", () => {
      expect(build().commands.map((route) => route.menuDescription(Locale.Ru))).toEqual([
        russian.commandGame,
        russian.commandNext,
        russian.commandNextWith,
        russian.commandNextWithout,
      ]);
    });

    it("should contribute its notes to the help text", () => {
      expect(build().notes?.(Locale.En)).toEqual(copy.helpCard);
    });

    it("should contribute those notes in the language it was asked for", () => {
      expect(build().notes?.(Locale.Ru)).toEqual(russian.helpCard);
    });

    it("should route game to its own handler", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onGameSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should route next to its own handler", async () => {
      await build().commands[1]?.run("the-context" as never);

      expect(onNextSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should route next_with to its own handler", async () => {
      await build().commands[2]?.run("the-context" as never);

      expect(onNextWithSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should route next_without to its own handler", async () => {
      await build().commands[3]?.run("the-context" as never);

      expect(onNextWithoutSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should hand its handlers a context carrying the repository", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onGameSpy.mock.calls[0]?.[0]).toMatchObject({ repo });
    });
  });

  describe("what it listens to", () => {
    let listeners: ListenersStub;

    beforeEach(() => {
      listeners = new ListenersStub();
    });

    it("should register a text listener and a tap listener for each screen", () => {
      build().listen?.(listeners);

      expect(listeners.onTextSpy).toHaveBeenCalledTimes(ONCE);
      expect(listeners.onTapSpy).toHaveBeenCalledTimes(EVERY_SCREEN);
    });

    it("should claim only the taps the card codec encodes", () => {
      build().listen?.(listeners);

      expect(listeners.tapPattern()).toBe(CARD_TAPS);
    });

    it("should claim the seating taps under their own pattern", () => {
      build().listen?.(listeners);

      expect(listeners.tapPattern(SEATING_LISTENER)).toBe(SEATING_TAPS);
    });

    it("should send a text message to the names handler", async () => {
      build().listen?.(listeners);
      await listeners.textListener()?.("the-message" as never);

      expect(onNamesReplySpy).toHaveBeenCalledWith(expect.anything(), "the-message");
    });

    it("should send a tap to the tap handler", async () => {
      build().listen?.(listeners);
      await listeners.tapListener()?.("the-tap" as never);

      expect(onTapSpy).toHaveBeenCalledWith(expect.anything(), "the-tap");
    });

    it("should claim the leaving taps under their own pattern", () => {
      build().listen?.(listeners);

      expect(listeners.tapPattern(LEAVING_LISTENER)).toBe(LEAVING_TAPS);
    });

    it("should send a leaving tap to the screen of names, not to the card", async () => {
      build().listen?.(listeners);
      await listeners.tapListener(LEAVING_LISTENER)?.("the-leaving-tap" as never);

      expect(onLeavingTapSpy).toHaveBeenCalledWith(expect.anything(), "the-leaving-tap");
      expect(onTapSpy).not.toHaveBeenCalled();
    });

    it("should send a seating tap to the seating screen, not to the card", async () => {
      build().listen?.(listeners);
      await listeners.tapListener(SEATING_LISTENER)?.("the-seating-tap" as never);

      expect(onSeatingTapSpy).toHaveBeenCalledWith(expect.anything(), "the-seating-tap");
      expect(onTapSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("how it picks up after a restart", () => {
    const REDRAWN = 2;

    it("should put every live card back on screen", async () => {
      await build().resume?.();

      expect(redrawLiveSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should say how many cards it recovered", async () => {
      redrawLiveSpy.mockResolvedValue(REDRAWN);

      await build().resume?.();

      expect(log.infoSpy.mock.calls[0]?.[0]).toContain(String(REDRAWN));
    });

    it("should stay quiet on a start with nothing live, which is the usual one", async () => {
      redrawLiveSpy.mockResolvedValue(0);

      await build().resume?.();

      expect(log.infoSpy).not.toHaveBeenCalled();
    });

    it("should not redraw anything merely by being built", () => {
      build();

      expect(redrawLiveSpy).toHaveBeenCalledTimes(NEVER);
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
