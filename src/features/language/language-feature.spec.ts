import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { ListenersStub } from "#shared/telegram/feature-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { Locale } from "#shared/locale/locales.ts";
import { copy } from "#language/copy.en.ts";
import { copy as russian } from "#language/copy.ru.ts";


const ONCE = 1;

const onLanguageSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const onTapSpy = vi.fn(async (_context: unknown, _ctx: unknown): Promise<void> => undefined);

const LANGUAGE_TAPS = /^the-language-taps$/;

vi.mock("#language/bot/language-handler.ts", () => ({
  onLanguage: (context: unknown, ctx: unknown) => onLanguageSpy(context, ctx),
  onTap: (context: unknown, ctx: unknown) => onTapSpy(context, ctx),
}));

vi.mock("#language/render/language-callback-codec.ts", () => ({ LANGUAGE_TAPS }));

const { createLanguageFeature } = await import("#language/language-feature.ts");

describe("createLanguageFeature()", () => {
  let repo: RepositoryStub;
  let listeners: ListenersStub;
  let locales: LocaleReaderStub;
  let publishMenu: Mock<(chatId: number, locale: Locale) => Promise<void>>;

  const build = () =>
    createLanguageFeature({ repo, localeIn: locales.read, publishMenu });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    listeners = new ListenersStub();
    locales = new LocaleReaderStub();
    publishMenu = vi.fn(async () => undefined);
  });

  describe("what it offers", () => {
    it("should offer /language and nothing else", () => {
      expect(build().commands.map((route) => route.command)).toEqual(["language"]);
    });

    it("should describe itself for the menu and for help", () => {
      const route = build().commands[0];

      expect(route?.menuDescription(Locale.En)).toBe(copy.commandLanguage);
      expect(route?.help(Locale.En)).toBe(copy.helpLanguage);
    });

    it("should describe itself in whichever language it is asked for", () => {
      const route = build().commands[0];

      expect(route?.menuDescription(Locale.Ru)).toBe(russian.commandLanguage);
      expect(route?.help(Locale.Ru)).toBe(russian.helpLanguage);
    });

    it("should stay in the published menu, since it is how a chat is switched", () => {
      expect(build().commands[0]?.hidden).toBeUndefined();
    });

    it("should have nothing to stop", () => {
      expect(build().stop).toBeUndefined();
    });

    it("should have nothing to resume", () => {
      expect(build().resume).toBeUndefined();
    });
  });

  describe("what it wires", () => {
    it("should send the command to its handler", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onLanguageSpy).toHaveBeenCalledWith(expect.anything(), "the-context");
    });

    it("should hand the handler the repository it was given", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onLanguageSpy.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ repo }));
    });

    it("should hand the handler the locale reader it was given", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onLanguageSpy.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ localeIn: locales.read })
      );
    });

    it("should hand the handler the way to republish a menu", async () => {
      await build().commands[0]?.run("the-context" as never);

      expect(onLanguageSpy.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ publishMenu }));
    });

    it("should listen for its own taps and nothing else", () => {
      build().listen?.(listeners);

      expect(listeners.onTapSpy).toHaveBeenCalledTimes(ONCE);
      expect(listeners.tapPattern()).toBe(LANGUAGE_TAPS);
    });

    it("should send a tap to its own handler", async () => {
      build().listen?.(listeners);

      await listeners.tapListener()?.("the-tap" as never);

      expect(onTapSpy).toHaveBeenCalledWith(expect.anything(), "the-tap");
    });

    it("should listen for no text, since the screen is all buttons", () => {
      build().listen?.(listeners);

      expect(listeners.onTextSpy).not.toHaveBeenCalled();
    });
  });
});
