import { describe, expect, it } from "vitest";
import { toMarkup } from "#live-game/bot/inline-markup.ts";


const ROWS = [
  [{ text: "Oleg", callback_data: "1:p:0:0" }],
  [
    { text: "↩️ Back", callback_data: "1:b:-:0" },
    { text: "❌ Cancel", callback_data: "1:x:-:0" },
  ],
];

describe("toMarkup()", () => {
  it("should wrap the rows the way the Bot API expects them", () => {
    expect(toMarkup(ROWS)).toEqual({ inline_keyboard: ROWS });
  });

  it("should copy every button, since grammY is handed a mutable keyboard", () => {
    const markup = toMarkup(ROWS);

    expect(markup.inline_keyboard[0]?.[0]).not.toBe(ROWS[0]?.[0]);
  });

  it("should copy every row as well as every button", () => {
    const markup = toMarkup(ROWS);

    expect(markup.inline_keyboard[0]).not.toBe(ROWS[0]);
  });
});
