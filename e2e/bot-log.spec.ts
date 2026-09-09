import { describe, expect, it } from "vitest";
import { BOT_LOGS, botLogPathOf } from "./bot-log.ts";


describe("botLogPathOf()", () => {
  it("should name the log after the scenario, lower-cased, with everything but letters and digits as one dash", () => {
    expect(botLogPathOf("a long evening, with the table changing under it")).toBe(
      `${BOT_LOGS}/a-long-evening-with-the-table-changing-under-it.log`
    );
  });

  it("should drop a dash the shape would leave at either end", () => {
    expect(botLogPathOf("  /stats — the picture!  ")).toBe(`${BOT_LOGS}/stats-the-picture.log`);
  });

  it("should live under the e2e reports folder, which tidy-reports already owns", () => {
    expect(BOT_LOGS).toBe("reports/e2e/bot");
  });
});
