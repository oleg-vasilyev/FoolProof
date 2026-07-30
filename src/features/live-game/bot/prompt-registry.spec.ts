import { beforeEach, describe, expect, it } from "vitest";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { TelegramApiStub } from "#live-game/bot/grammy-api.stub.ts";
import { createPromptRegistry, type PromptRegistry } from "#live-game/bot/prompt-registry.ts";


const CHAT = -100777;

const OTHER_CHAT = -100888;

const PROMPT_MESSAGE_ID = 11;

const LATER_PROMPT_MESSAGE_ID = 12;

const ONCE = 1;

const NEVER = 0;

describe("createPromptRegistry()", () => {
  let api: TelegramApiStub;
  let log: LoggerStub;
  let prompts: PromptRegistry;

  beforeEach(() => {
    api = new TelegramApiStub();
    log = new LoggerStub();
    prompts = createPromptRegistry(api.api, log);
  });

  describe("dropUnanswered()", () => {
    it("should delete a prompt nobody replied to", async () => {
      prompts.remember(CHAT, PROMPT_MESSAGE_ID);

      await prompts.dropUnanswered(CHAT);

      expect(api.deleteMessageSpy).toHaveBeenCalledWith(CHAT, PROMPT_MESSAGE_ID);
    });

    it("should do nothing when no prompt is standing", async () => {
      await prompts.dropUnanswered(CHAT);

      expect(api.deleteMessageSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should leave an answered prompt alone", async () => {
      prompts.remember(CHAT, PROMPT_MESSAGE_ID);
      prompts.forget(CHAT);

      await prompts.dropUnanswered(CHAT);

      expect(api.deleteMessageSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should delete a prompt only once", async () => {
      prompts.remember(CHAT, PROMPT_MESSAGE_ID);

      await prompts.dropUnanswered(CHAT);
      await prompts.dropUnanswered(CHAT);

      expect(api.deleteMessageSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should keep only the latest prompt of a chat", async () => {
      prompts.remember(CHAT, PROMPT_MESSAGE_ID);
      prompts.remember(CHAT, LATER_PROMPT_MESSAGE_ID);

      await prompts.dropUnanswered(CHAT);

      expect(api.deleteMessageSpy).toHaveBeenCalledWith(CHAT, LATER_PROMPT_MESSAGE_ID);
    });

    it("should not touch a prompt standing in another chat", async () => {
      prompts.remember(OTHER_CHAT, PROMPT_MESSAGE_ID);

      await prompts.dropUnanswered(CHAT);

      expect(api.deleteMessageSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should survive Telegram refusing the delete", async () => {
      api.deleteMessageSpy.mockRejectedValue(new Error("message to delete not found"));
      prompts.remember(CHAT, PROMPT_MESSAGE_ID);

      await expect(prompts.dropUnanswered(CHAT)).resolves.toBeUndefined();
    });

    it("should log a refused delete rather than staying silent", async () => {
      api.deleteMessageSpy.mockRejectedValue(new Error("message to delete not found"));
      prompts.remember(CHAT, PROMPT_MESSAGE_ID);

      await prompts.dropUnanswered(CHAT);

      expect(log.debugSpy.mock.calls[0]?.[0]).toContain(String(PROMPT_MESSAGE_ID));
    });

    it("should forget a prompt whose delete was refused", async () => {
      api.deleteMessageSpy.mockRejectedValue(new Error("message to delete not found"));
      prompts.remember(CHAT, PROMPT_MESSAGE_ID);

      await prompts.dropUnanswered(CHAT);
      await prompts.dropUnanswered(CHAT);

      expect(api.deleteMessageSpy).toHaveBeenCalledTimes(ONCE);
    });
  });
});
