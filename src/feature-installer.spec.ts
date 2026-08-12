import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { ChatLocaleStub, LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { DEFAULT_LOCALE, Locale } from "#shared/locale/locales.ts";
import { copy } from "#app/copy.en.ts";
import { copy as russian } from "#app/copy.ru.ts";
import { copyIn } from "#app/copy.ts";


const chatLocale = new ChatLocaleStub();

vi.mock("#shared/locale/chat-locale.ts", () => chatLocale.module);

const { installFeatures, publishCommandMenu, republishChatMenus, resumeFeatures } = await import(
  "#app/feature-installer.ts"
);


const ONCE = 1;

const NEVER = 0;

const UPDATE_ID = 4242;

const CHAT_ID = -100777;

const BOT_USERNAME = "FoolProofMegaBot";

const IN_PRIVATE = true;

const IN_GROUP = false;

class BotMock {
  public registrations: string[] = [];
  public commandSpy = vi.fn();
  public callbackQuerySpy = vi.fn();
  public onSpy = vi.fn();
  public catchSpy = vi.fn();
  public setMyCommandsSpy = vi.fn();

  public readonly api = { setMyCommands: this.setMyCommandsSpy };

  public command(name: string, run: unknown): void {
    this.registrations.push(`command:${name}`);
    this.commandSpy(name, run);
  }

  public callbackQuery(owns: RegExp, run: unknown): void {
    this.registrations.push(`taps:${owns.source}`);
    this.callbackQuerySpy(owns, run);
  }

  public on(filter: string, run: unknown): void {
    this.registrations.push(`on:${filter}`);
    this.onSpy(filter, run);
  }

  public catch(handler: unknown): void {
    this.catchSpy(handler);
  }
}

const logStub = new LoggerStub();

const OWN_TAPS = /^own:/;

const listensToTaps = (name: string): Feature =>
  featureOf({
    name,
    listen: (listeners) => {
      listeners.onTap(OWN_TAPS, async () => undefined);
    },
  });

const listensToText = (name: string): Feature =>
  featureOf({
    name,
    listen: (listeners) => {
      listeners.onText(async () => undefined);
    },
  });

describe("installFeatures()", () => {
  let bot: BotMock;
  let locales: LocaleReaderStub;

  const replySpy = vi.fn();

  const chatTypeSpy = vi.fn();

  const install = (features: readonly Feature[]) =>
    installFeatures(bot as never, features, logStub, locales.read);

  const helpIn = async (features: readonly Feature[], chatId = CHAT_ID): Promise<string> => {
    install(features);
    const registered = bot.commandSpy.mock.calls.find((call) => call[0] === "help")?.[1];
    await (registered as (ctx: unknown) => Promise<void>)({
      reply: replySpy,
      chat: { id: chatId },
    });

    return String(replySpy.mock.calls[0]?.[0]);
  };

  const helpText = (features: readonly Feature[]): Promise<string> => helpIn(features);

  beforeEach(() => {
    vi.clearAllMocks();

    bot = new BotMock();
    locales = new LocaleReaderStub();
    replySpy.mockResolvedValue(undefined);
  });

  describe("registration order", () => {
    it("should register every command before any listener", () => {
      install([
        featureOf({
          name: "game",
          listen: (listeners) => {
            listeners.onText(async () => undefined);
            listeners.onTap(OWN_TAPS, async () => undefined);
          },
        }),
        featureOf({ name: "stats" }),
      ]);
      const firstListener = bot.registrations.findIndex(
        (entry) => entry.startsWith("on:") || entry.startsWith("taps:")
      );
      const lastCommand = bot.registrations.findLastIndex((entry) => entry.startsWith("command:"));

      expect(lastCommand).toBeLessThan(firstListener);
    });

    it("should not let a text listener swallow a later feature's command", () => {
      install([listensToText("game"), featureOf({ name: "stats" })]);

      expect(bot.registrations.indexOf("command:stats")).toBeLessThan(
        bot.registrations.indexOf("on:message:text")
      );
    });

    it("should register help as a command, not as a listener", () => {
      install([featureOf({ name: "game" })]);

      expect(bot.registrations).toContain("command:help");
    });

    it("should keep help ahead of the listeners too", () => {
      install([listensToText("game")]);

      expect(bot.registrations.indexOf("command:help")).toBeLessThan(
        bot.registrations.indexOf("on:message:text")
      );
    });

    it("should keep the features in the order it was given them", () => {
      install([featureOf({ name: "game" }), featureOf({ name: "stats" })]);

      expect(bot.registrations.indexOf("command:game")).toBeLessThan(
        bot.registrations.indexOf("command:stats")
      );
    });
  });

  describe("what a feature may register", () => {
    it("should wire a text listener to message:text", () => {
      install([listensToText("game")]);

      expect(bot.onSpy).toHaveBeenCalledWith("message:text", expect.any(Function));
    });

    it("should wire a tap listener to the pattern the feature says it owns", () => {
      install([listensToTaps("game")]);

      expect(bot.callbackQuerySpy).toHaveBeenCalledWith(OWN_TAPS, expect.any(Function));
    });

    it("should register no text listener for a feature that only has commands", () => {
      install([featureOf({ name: "stats" })]);

      expect(bot.onSpy).not.toHaveBeenCalledWith("message:text", expect.anything());
    });

    it("should claim no taps for a feature that only has commands", () => {
      install([featureOf({ name: "stats" })]);

      expect(bot.callbackQuerySpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should run the route's own handler when its command fires", async () => {
      const route = featureOf({ name: "game" });
      install([route]);
      const registered = bot.commandSpy.mock.calls.find((call) => call[0] === "game")?.[1];

      await (registered as (ctx: unknown) => Promise<void>)("the-context");

      expect(route.commands[0]?.run).toHaveBeenCalledWith("the-context");
    });
  });

  describe("a tap no feature claimed", () => {
    const answerSpy = vi.fn();

    const unclaimedListener = (): ((ctx: unknown) => Promise<void>) =>
      bot.onSpy.mock.calls.find((call) => call[0] === "callback_query:data")?.[1] as (
        ctx: unknown
      ) => Promise<void>;

    it("should be answered rather than left spinning", async () => {
      install([listensToTaps("game")]);

      await unclaimedListener()({
        chat: { id: CHAT_ID },
        answerCallbackQuery: answerSpy,
      });

      expect(answerSpy).toHaveBeenCalledWith(copy.tapUnclaimed);
    });

    it("should be answered in the language of the chat it came from", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);
      install([listensToTaps("game")]);

      await unclaimedListener()({
        chat: { id: CHAT_ID },
        answerCallbackQuery: answerSpy,
      });

      expect(answerSpy).toHaveBeenCalledWith(russian.tapUnclaimed);
    });

    it("should fall back to the default language when there is no chat behind it", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);
      install([listensToTaps("game")]);

      await unclaimedListener()({ chat: undefined, answerCallbackQuery: answerSpy });

      expect(answerSpy).toHaveBeenCalledWith(copyIn(DEFAULT_LOCALE).tapUnclaimed);
    });

    it("should not ask which language a chat it cannot name speaks", async () => {
      install([listensToTaps("game")]);

      await unclaimedListener()({ chat: undefined, answerCallbackQuery: answerSpy });

      expect(locales.readSpy).not.toHaveBeenCalled();
    });

    it("should be answered only after every feature had its chance", () => {
      install([listensToTaps("game")]);

      expect(bot.registrations.indexOf(`taps:${OWN_TAPS.source}`)).toBeLessThan(
        bot.registrations.indexOf("on:callback_query:data")
      );
    });
  });

  describe("help", () => {
    it("should open with the lead line", async () => {
      expect(await helpText([featureOf({ name: "game" })])).toContain(copy.botLead);
    });

    it("should list the help line of every command", async () => {
      const text = await helpText([featureOf({ name: "game" }), featureOf({ name: "stats" })]);

      expect(text).toContain(`/game — does it in ${DEFAULT_LOCALE}`);
      expect(text).toContain(`/stats — does it in ${DEFAULT_LOCALE}`);
    });

    it("should mention itself", async () => {
      expect(await helpText([featureOf({ name: "game" })])).toContain(copy.helpSelf);
    });

    it("should ask which language the chat asking for help speaks", async () => {
      await helpText([featureOf({ name: "game" })]);

      expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should write the help in that language", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);

      expect(await helpText([featureOf({ name: "game" })])).toContain(russian.botLead);
    });

    it("should take the command lines in that language too", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);

      expect(await helpText([featureOf({ name: "game" })])).toContain(
        `/game — does it in ${Locale.Ru}`
      );
    });

    it("should append a feature's notes after the command list", async () => {
      const text = await helpText([featureOf({ name: "game", notes: () => ["a note"] })]);

      expect(text.indexOf("a note")).toBeGreaterThan(text.indexOf(`/game — does it in ${DEFAULT_LOCALE}`));
    });

    it("should add nothing for a feature that has no notes", async () => {
      const text = await helpText([featureOf({ name: "game" })]);

      expect(text.split("\n").at(-1)).toBe("");
    });

    it("should say nothing about a feature that is not installed", async () => {
      expect(await helpText([featureOf({ name: "game" })])).not.toContain("/stats");
    });

    it("should send one line per entry rather than a run-on paragraph", async () => {
      const lines = (await helpText([featureOf({ name: "game" })])).split("\n");

      expect(lines.length).toBeGreaterThan(2);
    });

    it("should lay the whole message out in a fixed shape", async () => {
      const text = await helpText([featureOf({ name: "game", notes: () => ["a note"] })]);

      expect(text.split("\n")).toEqual([
        copy.botLead,
        "",
        `/game — does it in ${DEFAULT_LOCALE}`,
        copy.helpSelf,
        "",
        "a note",
      ]);
    });

    it("should separate the lead from the command list with a blank line", async () => {
      const lines = (await helpText([featureOf({ name: "game" })])).split("\n");

      expect(lines[1]).toBe("");
    });
  });

  describe("start", () => {
    const startIn = async (alone: boolean, chatId = CHAT_ID) => {
      chatTypeSpy.mockReturnValue(alone);
      install([featureOf({ name: "game" })]);
      const registered = bot.commandSpy.mock.calls.find((call) => call[0] === "start")?.[1];

      await (registered as (ctx: unknown) => Promise<void>)({
        reply: replySpy,
        chat: { id: chatId },
        hasChatType: chatTypeSpy,
        me: { username: BOT_USERNAME },
      });

      const [text, options] = replySpy.mock.calls[0] ?? [];
      const markup = (
        options as { reply_markup?: { inline_keyboard: { text: string; url: string }[][] } }
      )?.reply_markup;

      return { text: String(text), buttons: markup?.inline_keyboard };
    };

    it("should register start as a command, not as a listener", () => {
      install([featureOf({ name: "game" })]);

      expect(bot.registrations).toContain("command:start");
    });

    it("should answer the button Telegram shows a newcomer at all", async () => {
      const { text } = await startIn(IN_PRIVATE);

      expect(text).toContain(copy.botLead);
    });

    it("should name the first thing a newcomer has to do", async () => {
      const { text } = await startIn(IN_PRIVATE);

      expect(text).toContain(copy.startInvite);
    });

    it("should point at the command that explains the rest", async () => {
      const { text } = await startIn(IN_PRIVATE);

      expect(text).toContain(copy.startHelp);
    });

    it("should ask which language the chat it greets speaks", async () => {
      await startIn(IN_PRIVATE);

      expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should greet in that language", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);
      const { text } = await startIn(IN_PRIVATE);

      expect(text).toContain(russian.startInvite);
    });

    it("should ask Telegram whether it is alone with the newcomer", async () => {
      await startIn(IN_PRIVATE);

      expect(chatTypeSpy).toHaveBeenCalledWith("private");
    });

    it("should offer a button that puts it in a group", async () => {
      const { buttons } = await startIn(IN_PRIVATE);

      expect(buttons?.[0]?.[0]?.url).toBe(`https://t.me/${BOT_USERNAME}?startgroup=true`);
    });

    it("should caption that button from the copy table", async () => {
      const { buttons } = await startIn(IN_PRIVATE);

      expect(buttons?.[0]?.[0]?.text).toBe(copy.buttonAddToGroup);
    });

    it("should caption it in the language the chat speaks", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);
      const { buttons } = await startIn(IN_PRIVATE);

      expect(buttons?.[0]?.[0]?.text).toBe(russian.buttonAddToGroup);
    });

    it("should not ask a group to add it to a group", async () => {
      const { text } = await startIn(IN_GROUP);

      expect(text).not.toContain(copy.startInvite);
    });

    it("should send a group no button either", async () => {
      const { buttons } = await startIn(IN_GROUP);

      expect(buttons).toBeUndefined();
    });

    it("should still tell a group what the bot is and where to read more", async () => {
      const { text } = await startIn(IN_GROUP);

      expect(text.split("\n")).toEqual([copy.botLead, "", copy.startHelp]);
    });

    it("should lay a newcomer's greeting out in a fixed shape", async () => {
      const { text } = await startIn(IN_PRIVATE);

      expect(text.split("\n")).toEqual([copy.botLead, "", copy.startInvite, copy.startHelp]);
    });
  });

  describe("a hidden command", () => {
    const hiddenFeature = featureOf({
      name: "status",
      commands: [
        {
          command: "status",
          menuDescription: () => "how the bot is doing",
          help: () => "/status — how the bot is doing",
          hidden: true,
          run: vi.fn(async () => undefined),
        },
      ],
    });

    it("should still be registered, or it could not be used at all", () => {
      install([hiddenFeature]);

      expect(bot.commandSpy).toHaveBeenCalledWith("status", expect.anything());
    });

    it("should stay out of /help", async () => {
      expect(await helpText([hiddenFeature])).not.toContain("/status");
    });

    it("should not hide the commands that are not hidden", async () => {
      const text = await helpText([featureOf({ name: "game" }), hiddenFeature]);

      expect(text).toContain("/game");
    });
  });

  describe("failures", () => {
    it("should install an error handler", () => {
      install([featureOf({ name: "game" })]);

      expect(bot.catchSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should log which update failed and why", () => {
      install([featureOf({ name: "game" })]);
      const handler = bot.catchSpy.mock.calls[0]?.[0] as (error: unknown) => void;

      handler({ ctx: { update: { update_id: UPDATE_ID } }, error: "boom" });

      expect(logStub.errorSpy).toHaveBeenCalledWith(copy.updateFailed(UPDATE_ID, "boom"));
    });
  });

  describe("shutdown", () => {
    it("should hand back the stop of every feature that has one", () => {
      const stop = vi.fn(async () => undefined);

      const stops = install([featureOf({ name: "game", stop }), featureOf({ name: "stats" })]);

      expect(stops).toEqual([stop]);
    });

    it("should hand back nothing when no feature needs stopping", () => {
      expect(install([featureOf({ name: "stats" })])).toEqual([]);
    });
  });
});

describe("resumeFeatures()", () => {
  let log: LoggerStub;

  beforeEach(() => {
    vi.clearAllMocks();

    log = new LoggerStub();
  });

  it("should let a feature pick up where the last run stopped", async () => {
    const resume = vi.fn(async () => undefined);

    await resumeFeatures([featureOf({ name: "game", resume })], log);

    expect(resume).toHaveBeenCalledTimes(ONCE);
  });

  it("should skip a feature that has nothing to recover", async () => {
    await expect(resumeFeatures([featureOf({ name: "stats" })], log)).resolves.toBeUndefined();
  });

  it("should not treat having nothing to recover as a failure", async () => {
    await resumeFeatures([featureOf({ name: "stats" })], log);

    expect(log.warnSpy).not.toHaveBeenCalled();
  });

  it("should resume the features in the order they were named", async () => {
    const order: string[] = [];
    const first = featureOf({ name: "game", resume: async () => void order.push("game") });
    const second = featureOf({ name: "stats", resume: async () => void order.push("stats") });

    await resumeFeatures([first, second], log);

    expect(order).toEqual(["game", "stats"]);
  });

  it("should carry on when a feature fails to recover, since starting matters more", async () => {
    const resume = vi.fn(async () => undefined);
    const broken = featureOf({ name: "game", resume: async () => Promise.reject(new Error("no")) });

    await resumeFeatures([broken, featureOf({ name: "stats", resume })], log);

    expect(resume).toHaveBeenCalledTimes(ONCE);
  });

  it("should report the feature that could not recover", async () => {
    const broken = featureOf({ name: "game", resume: async () => Promise.reject(new Error("no")) });

    await resumeFeatures([broken], log);

    expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should carry the cause into that report, since nothing else will show it", async () => {
    const cause = "the message was deleted";
    const broken = featureOf({ name: "game", resume: async () => Promise.reject(new Error(cause)) });

    await resumeFeatures([broken], log);

    expect(log.warnSpy.mock.calls[0]?.[0]).toContain(cause);
  });
});

describe("publishCommandMenu()", () => {
  let bot: BotMock;
  let log: LoggerStub;

  beforeEach(() => {
    vi.clearAllMocks();

    bot = new BotMock();
    log = new LoggerStub();
    bot.setMyCommandsSpy.mockResolvedValue(true);
  });

  it("should publish one entry per command plus help", async () => {
    await publishCommandMenu(
      bot.api as never,
      [featureOf({ name: "game" }), featureOf({ name: "stats" })],
      log
    );

    expect(bot.setMyCommandsSpy).toHaveBeenCalledWith(
      [
        { command: "game", description: `does game in ${DEFAULT_LOCALE}` },
        { command: "stats", description: `does stats in ${DEFAULT_LOCALE}` },
        { command: "help", description: copy.commandHelp },
      ],
      undefined
    );
  });

  it("should publish a chat's own menu in the language that chat chose", async () => {
    const CHAT_ID = -100777;

    await publishCommandMenu(bot.api as never, [featureOf({ name: "game" })], log, {
      chatId: CHAT_ID,
      locale: Locale.Ru,
    });

    expect(bot.setMyCommandsSpy).toHaveBeenCalledWith(
      [
        { command: "game", description: `does game in ${Locale.Ru}` },
        { command: "help", description: russian.commandHelp },
      ],
      { scope: { type: "chat", chat_id: CHAT_ID } }
    );
  });

  it("should leave an uninstalled feature out of the menu", async () => {
    await publishCommandMenu(bot.api as never, [featureOf({ name: "game" })], log);
    const published = bot.setMyCommandsSpy.mock.calls[0]?.[0] as readonly { command: string }[];

    expect(published.map((entry) => entry.command)).toEqual(["game", "help"]);
  });

  it("should not stop the bot starting when Telegram is unreachable", async () => {
    bot.setMyCommandsSpy.mockRejectedValue(new Error("fetch failed"));

    await expect(
      publishCommandMenu(bot.api as never, [featureOf({ name: "game" })], log)
    ).resolves.toBeUndefined();
  });

  it("should report a menu it could not publish", async () => {
    const cause = "fetch failed";
    bot.setMyCommandsSpy.mockRejectedValue(new Error(cause));

    await publishCommandMenu(bot.api as never, [featureOf({ name: "game" })], log);

    expect(log.warnSpy.mock.calls[0]?.[0]).toContain(cause);
  });
});

describe("republishChatMenus()", () => {
  let bot: BotMock;
  let log: LoggerStub;

  const RU_CHAT = -100111;

  const EN_CHAT = -100222;

  const TWICE = 2;

  beforeEach(() => {
    vi.clearAllMocks();

    bot = new BotMock();
    log = new LoggerStub();
    bot.setMyCommandsSpy.mockResolvedValue(true);
    chatLocale.localeFromSpy.mockReturnValue(Locale.En);
  });

  it("should hand the stored locale to the resolver rather than compare it itself", async () => {
    await republishChatMenus(bot.api as never, [featureOf({ name: "game" })], log, [
      { chatId: RU_CHAT, locale: "ru" },
    ]);

    expect(chatLocale.localeFromSpy).toHaveBeenCalledWith("ru");
  });

  it("should publish a chosen chat's menu scoped to it, in the language the resolver found", async () => {
    chatLocale.localeFromSpy.mockReturnValue(Locale.Ru);

    await republishChatMenus(bot.api as never, [featureOf({ name: "game" })], log, [
      { chatId: RU_CHAT, locale: "ru" },
    ]);

    expect(bot.setMyCommandsSpy).toHaveBeenCalledWith(
      [
        { command: "game", description: `does game in ${Locale.Ru}` },
        { command: "help", description: russian.commandHelp },
      ],
      { scope: { type: "chat", chat_id: RU_CHAT } }
    );
  });

  it("should publish every chat on the list", async () => {
    await republishChatMenus(bot.api as never, [featureOf({ name: "game" })], log, [
      { chatId: RU_CHAT, locale: "ru" },
      { chatId: EN_CHAT, locale: "en" },
    ]);

    expect(bot.setMyCommandsSpy).toHaveBeenCalledTimes(TWICE);
  });

  it("should skip a chat whose stored locale the resolver refuses", async () => {
    chatLocale.localeFromSpy.mockReturnValue(null);

    await republishChatMenus(bot.api as never, [featureOf({ name: "game" })], log, [
      { chatId: RU_CHAT, locale: "de" },
    ]);

    expect(bot.setMyCommandsSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should skip it quietly, not by tripping over the unknown locale", async () => {
    chatLocale.localeFromSpy.mockReturnValue(null);

    await republishChatMenus(bot.api as never, [featureOf({ name: "game" })], log, [
      { chatId: RU_CHAT, locale: "de" },
    ]);

    expect(log.warnSpy).toHaveBeenCalledTimes(NEVER);
  });

  it("should keep publishing after one chat refuses, since the rest still deserve theirs", async () => {
    bot.setMyCommandsSpy.mockRejectedValueOnce(new Error("chat not found"));

    await republishChatMenus(bot.api as never, [featureOf({ name: "game" })], log, [
      { chatId: RU_CHAT, locale: "ru" },
      { chatId: EN_CHAT, locale: "en" },
    ]);

    expect(bot.setMyCommandsSpy).toHaveBeenCalledTimes(TWICE);
    expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
  });

  it("should publish nothing when no chat ever chose", async () => {
    await republishChatMenus(bot.api as never, [featureOf({ name: "game" })], log, []);

    expect(bot.setMyCommandsSpy).toHaveBeenCalledTimes(NEVER);
  });
});
