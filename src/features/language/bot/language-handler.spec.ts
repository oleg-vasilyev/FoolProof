import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { DEFAULT_LOCALE, Locale } from "#shared/locale/locales.ts";
import { copy } from "#language/copy.en.ts";
import { CHAT_ID, ContextStub } from "#language/bot/grammy-context.stub.ts";


const decodeLanguageCallbackSpy = vi.fn();

const renderLanguageKeyboardSpy = vi.fn();

const renderLanguageScreenSpy = vi.fn();

const renderLanguageChosenSpy = vi.fn();

vi.mock("#language/render/language-callback-codec.ts", () => ({
  decodeLanguageCallback: (data: unknown) => decodeLanguageCallbackSpy(data),
}));

vi.mock("#language/render/language-keyboard.ts", () => ({
  renderLanguageKeyboard: (table: unknown, spoken: unknown) =>
    renderLanguageKeyboardSpy(table, spoken),
}));

vi.mock("#language/render/language-message.ts", () => ({
  renderLanguageScreen: (table: unknown) => renderLanguageScreenSpy(table),
  renderLanguageChosen: (table: unknown, chosen: unknown) =>
    renderLanguageChosenSpy(table, chosen),
}));

const { onLanguage, onTap } = await import("#language/bot/language-handler.ts");

const SCREEN = "the-screen";

const CHOSEN = "the-chosen-message";

const KEYBOARD = [[{ text: "English", callback_data: "l:en" }]];

const TAP_DATA = "l:ru";

const ONCE = 1;

const NEVER = 0;

describe("language-handler", () => {
  let repo: RepositoryStub;
  let ctx: ContextStub;
  let locales: LocaleReaderStub;
  let publishMenu: Mock<(chatId: number, locale: Locale) => Promise<void>>;

  const context = () => ({ repo, localeIn: locales.read, publishMenu });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    ctx = new ContextStub();
    locales = new LocaleReaderStub(Locale.En);
    publishMenu = vi.fn(async () => undefined);

    decodeLanguageCallbackSpy.mockReturnValue(Locale.Ru);
    renderLanguageScreenSpy.mockReturnValue(SCREEN);
    renderLanguageChosenSpy.mockReturnValue(CHOSEN);
    renderLanguageKeyboardSpy.mockReturnValue(KEYBOARD);
  });

  describe("onLanguage()", () => {
    it("should send the screen", async () => {
      await onLanguage(context(), ctx.command());

      expect(ctx.lastReply().text).toBe(SCREEN);
    });

    it("should ask which language this chat already speaks", async () => {
      await onLanguage(context(), ctx.command());

      expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should mark that language on the keyboard", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);

      await onLanguage(context(), ctx.command());

      expect(renderLanguageKeyboardSpy).toHaveBeenCalledWith(expect.anything(), Locale.Ru);
    });

    it("should hang the keyboard on the message", async () => {
      await onLanguage(context(), ctx.command());

      expect(ctx.lastReply().options).toMatchObject({
        reply_markup: { inline_keyboard: KEYBOARD },
      });
    });

    it("should send the screen as HTML, since the heading is bold", async () => {
      await onLanguage(context(), ctx.command());

      expect(ctx.lastReply().options).toMatchObject({ parse_mode: "HTML" });
    });

    it("should change nothing until a language is tapped", async () => {
      await onLanguage(context(), ctx.command());

      expect(repo.rememberChatLocaleSpy).not.toHaveBeenCalled();
    });
  });

  describe("onTap()", () => {
    it("should remember the language for this chat", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(repo.rememberChatLocaleSpy).toHaveBeenCalledWith(CHAT_ID, Locale.Ru);
    });

    it("should decode whatever data the button carried", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(decodeLanguageCallbackSpy).toHaveBeenCalledWith(TAP_DATA);
    });

    it("should replace the screen with the confirmation", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(ctx.lastEdit().text).toBe(CHOSEN);
    });

    it("should write that confirmation in the language just chosen", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(renderLanguageChosenSpy).toHaveBeenCalledWith(
        expect.objectContaining({ locale: Locale.Ru }),
        Locale.Ru
      );
    });

    it("should leave no keyboard behind, since the choice is made", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(ctx.lastEdit().options).toEqual({ parse_mode: "HTML" });
    });

    it("should answer the tap, so the button stops spinning", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should republish the command menu for this chat in the new language", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(publishMenu).toHaveBeenCalledWith(CHAT_ID, Locale.Ru);
    });

    it("should republish only after the choice is stored", async () => {
      await onTap(context(), ctx.callbackTap(TAP_DATA));

      expect(repo.rememberChatLocaleSpy.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
        publishMenu.mock.invocationCallOrder[0] ?? 0
      );
    });

    it("should refuse data it cannot read", async () => {
      decodeLanguageCallbackSpy.mockReturnValue(null);

      await onTap(context(), ctx.callbackTap("nonsense"));

      expect(repo.rememberChatLocaleSpy).not.toHaveBeenCalled();
    });

    it("should say the screen is stale rather than fall silent", async () => {
      decodeLanguageCallbackSpy.mockReturnValue(null);

      await onTap(context(), ctx.callbackTap("nonsense"));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
    });

    it("should answer a tap with no chat behind it in the default language", async () => {
      await onTap(context(), ctx.tapWithoutChat(TAP_DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.screenStale);
      expect(DEFAULT_LOCALE).toBe(copy.locale);
    });

    it("should store nothing for a tap with no chat behind it", async () => {
      await onTap(context(), ctx.tapWithoutChat(TAP_DATA));

      expect(repo.rememberChatLocaleSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should not republish a menu it did not change", async () => {
      decodeLanguageCallbackSpy.mockReturnValue(null);

      await onTap(context(), ctx.callbackTap("nonsense"));

      expect(publishMenu).not.toHaveBeenCalled();
    });
  });
});
