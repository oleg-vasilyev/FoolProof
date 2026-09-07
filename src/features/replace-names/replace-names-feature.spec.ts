import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { ListenersStub } from "#shared/telegram/feature-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { Locale } from "#shared/locale/locales.ts";
import { copy } from "#replace-names/copy.en.ts";
import { copy as russian } from "#replace-names/copy.ru.ts";


const ONCE = 1;

const onReplaceSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onTapSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const REPLACE_TAPS = /^the-replace-taps$/;

vi.mock("#replace-names/bot/replace-handler.ts", () => ({
  onReplace: (context: unknown, ctx: unknown) => onReplaceSpy(context, ctx),
  onTap: (context: unknown, ctx: unknown) => onTapSpy(context, ctx),
}));

vi.mock("#replace-names/render/replace-callback-codec.ts", () => ({ REPLACE_TAPS }));

const { createReplaceNamesFeature } = await import("#replace-names/replace-names-feature.ts");

describe("createReplaceNamesFeature()", () => {
  let repo: RepositoryStub;
  let listeners: ListenersStub;
  let locales: LocaleReaderStub;

  const build = () => createReplaceNamesFeature({ repo, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    listeners = new ListenersStub();
    locales = new LocaleReaderStub();
  });

  describe("what it offers", () => {
    it("should offer /replace and nothing else", () => {
      expect(build().commands.map((route) => route.command)).toEqual(["replace"]);
    });

    it("should describe itself for the menu and for help", () => {
      const route = build().commands[0];

      expect(route?.menuDescription(Locale.En)).toBe(copy.commandReplace);
      expect(route?.help(Locale.En)).toBe(copy.helpReplace);
    });

    it("should describe itself in whichever language it is asked for", () => {
      const route = build().commands[0];

      expect(route?.menuDescription(Locale.Ru)).toBe(russian.commandReplace);
      expect(route?.help(Locale.Ru)).toBe(russian.helpReplace);
    });

    it("should stay in the published menu, since a wrong name is found by the people playing", () => {
      expect(build().commands[0]?.hidden).toBeUndefined();
    });

    it("should send the command to its handler", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onReplaceSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should hand the handler the repository it was given", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onReplaceSpy.mock.calls[0]?.[0]).toMatchObject({ repo });
    });
  });

  describe("what it listens to", () => {
    it("should register a tap listener and nothing else", () => {
      build().listen?.(listeners);

      expect(listeners.onTapSpy).toHaveBeenCalledTimes(ONCE);
      expect(listeners.onTextSpy).not.toHaveBeenCalled();
    });

    it("should claim only the taps its own codec encodes", () => {
      build().listen?.(listeners);

      expect(listeners.tapPattern()).toBe(REPLACE_TAPS);
    });

    it("should send a tap to its tap handler", async () => {
      build().listen?.(listeners);
      await listeners.tapListener()?.("the-tap" as never);

      expect(onTapSpy).toHaveBeenCalledWith(expect.anything(), "the-tap");
    });
  });

  describe("what it does not need", () => {
    it("should have nothing to resume, because a screen is rebuilt from its buttons", () => {
      expect(build().resume).toBeUndefined();
    });

    it("should have nothing to stop, because it owns no timer", () => {
      expect(build().stop).toBeUndefined();
    });
  });
});
