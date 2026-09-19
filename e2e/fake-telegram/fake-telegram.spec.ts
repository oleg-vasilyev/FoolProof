import { describe, expect, it } from "vitest";
import { createFakeTelegram } from "./fake-telegram.ts";


const LONGEST_CAPTION = 1024;

const captionOf = (length: number): string => "x".repeat(length);

describe("createFakeTelegram()", () => {
  describe("sendPhoto", () => {
    it("should accept a caption at exactly the Bot API's limit", async () => {
      const telegram = createFakeTelegram();

      const result = await telegram.call(
        "sendPhoto",
        { caption: captionOf(LONGEST_CAPTION) },
        null
      );

      expect(result.ok).toBe(true);
    });

    it("should refuse a caption one character past the Bot API's limit", async () => {
      const telegram = createFakeTelegram();

      const result = await telegram.call(
        "sendPhoto",
        { caption: captionOf(LONGEST_CAPTION + 1) },
        null
      );

      expect(result).toEqual({
        ok: false,
        error_code: 400,
        description: "Bad Request: MEDIA_CAPTION_TOO_LONG",
      });
    });
  });

  describe("sendMessage", () => {
    it("should accept a keyboard whose every row carries a button", async () => {
      const telegram = createFakeTelegram();

      const result = await telegram.call(
        "sendMessage",
        {
          text: "the card",
          reply_markup: { inline_keyboard: [[{ text: "Oleg", callback_data: "1" }]] },
        },
        null
      );

      expect(result.ok).toBe(true);
    });

    it("should refuse a keyboard that ends in a row with nothing on it", async () => {
      const telegram = createFakeTelegram();

      const result = await telegram.call(
        "sendMessage",
        {
          text: "the card",
          reply_markup: { inline_keyboard: [[{ text: "Oleg", callback_data: "1" }], []] },
        },
        null
      );

      expect(result).toEqual({
        ok: false,
        error_code: 400,
        description: "Bad Request: inline keyboard row has no button on it",
      });
    });
  });
});
