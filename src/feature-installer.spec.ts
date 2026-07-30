import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFeatures, publishCommandMenu } from "#app/feature-installer.ts";
import type { Feature } from "#shared/telegram/feature-contract.ts";
import { featureOf } from "#shared/telegram/feature-contract.stub.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { copy } from "#app/copy.en.ts";


const ONCE = 1;

const NEVER = 0;

const UPDATE_ID = 4242;

class BotMock {
  public registrations: string[] = [];
  public commandSpy = vi.fn();
  public onSpy = vi.fn();
  public catchSpy = vi.fn();
  public setMyCommandsSpy = vi.fn();

  public readonly api = { setMyCommands: this.setMyCommandsSpy };

  public command(name: string, run: unknown): void {
    this.registrations.push(`command:${name}`);
    this.commandSpy(name, run);
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

const listensToText = (name: string): Feature =>
  featureOf({
    name,
    listen: (listeners) => {
      listeners.onText(async () => undefined);
    },
  });

describe("installFeatures()", () => {
  let bot: BotMock;

  const install = (features: readonly Feature[]) =>
    installFeatures(bot as never, features, logStub);

  beforeEach(() => {
    vi.clearAllMocks();

    bot = new BotMock();
  });

  describe("registration order", () => {
    it("should register every command before any listener", () => {
      install([
        featureOf({
          name: "game",
          listen: (listeners) => {
            listeners.onText(async () => undefined);
            listeners.onTap(async () => undefined);
          },
        }),
        featureOf({ name: "stats" }),
      ]);
      const firstListener = bot.registrations.findIndex((entry) => entry.startsWith("on:"));
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

    it("should wire a tap listener to callback_query:data", () => {
      install([
        featureOf({
          name: "game",
          listen: (listeners) => {
            listeners.onTap(async () => undefined);
          },
        }),
      ]);

      expect(bot.onSpy).toHaveBeenCalledWith("callback_query:data", expect.any(Function));
    });

    it("should register nothing extra for a feature that only has commands", () => {
      install([featureOf({ name: "stats" })]);

      expect(bot.onSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should run the route's own handler when its command fires", async () => {
      const route = featureOf({ name: "game" });
      install([route]);
      const registered = bot.commandSpy.mock.calls.find((call) => call[0] === "game")?.[1];

      await (registered as (ctx: unknown) => Promise<void>)("the-context");

      expect(route.commands[0]?.run).toHaveBeenCalledWith("the-context");
    });
  });

  describe("help", () => {
    const replySpy = vi.fn();

    const helpText = async (features: readonly Feature[]): Promise<string> => {
      install(features);
      const registered = bot.commandSpy.mock.calls.find((call) => call[0] === "help")?.[1];
      await (registered as (ctx: unknown) => Promise<void>)({ reply: replySpy });

      return String(replySpy.mock.calls[0]?.[0]);
    };

    beforeEach(() => {
      replySpy.mockClear();
      replySpy.mockResolvedValue(undefined);
    });

    it("should open with the lead line", async () => {
      expect(await helpText([featureOf({ name: "game" })])).toContain(copy.helpLead);
    });

    it("should list the help line of every command", async () => {
      const text = await helpText([featureOf({ name: "game" }), featureOf({ name: "stats" })]);

      expect(text).toContain("/game — does it");
      expect(text).toContain("/stats — does it");
    });

    it("should mention itself", async () => {
      expect(await helpText([featureOf({ name: "game" })])).toContain(copy.helpSelf);
    });

    it("should append a feature's notes after the command list", async () => {
      const text = await helpText([featureOf({ name: "game", notes: ["a note"] })]);

      expect(text.indexOf("a note")).toBeGreaterThan(text.indexOf("/game — does it"));
    });

    it("should say nothing about a feature that is not installed", async () => {
      expect(await helpText([featureOf({ name: "game" })])).not.toContain("/stats");
    });

    it("should send one line per entry rather than a run-on paragraph", async () => {
      const lines = (await helpText([featureOf({ name: "game" })])).split("\n");

      expect(lines.length).toBeGreaterThan(2);
    });

    it("should lay the whole message out in a fixed shape", async () => {
      const text = await helpText([featureOf({ name: "game", notes: ["a note"] })]);

      expect(text.split("\n")).toEqual([
        copy.helpLead,
        "",
        "/game — does it",
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

describe("publishCommandMenu()", () => {
  let bot: BotMock;

  beforeEach(() => {
    vi.clearAllMocks();

    bot = new BotMock();
    bot.setMyCommandsSpy.mockResolvedValue(true);
  });

  it("should publish one entry per command plus help", async () => {
    await publishCommandMenu(bot.api as never, [
      featureOf({ name: "game" }),
      featureOf({ name: "stats" }),
    ]);

    expect(bot.setMyCommandsSpy).toHaveBeenCalledWith([
      { command: "game", description: "does game" },
      { command: "stats", description: "does stats" },
      { command: "help", description: copy.commandHelp },
    ]);
  });

  it("should leave an uninstalled feature out of the menu", async () => {
    await publishCommandMenu(bot.api as never, [featureOf({ name: "game" })]);
    const published = bot.setMyCommandsSpy.mock.calls[0]?.[0] as readonly { command: string }[];

    expect(published.map((entry) => entry.command)).toEqual(["game", "help"]);
  });
});
