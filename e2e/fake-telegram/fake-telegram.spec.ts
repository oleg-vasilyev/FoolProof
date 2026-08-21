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
});
