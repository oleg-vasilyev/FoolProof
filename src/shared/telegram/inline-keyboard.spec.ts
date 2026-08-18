import { describe, expect, it } from "vitest";
import { toMarkup } from "#shared/telegram/inline-keyboard.ts";


const ROWS = [
  [{ text: "a-caption", callback_data: "a-payload" }],
  [
    { text: "another-caption", callback_data: "another-payload" },
    { text: "a-third-caption", callback_data: "a-third-payload" },
  ],
];

describe("toMarkup()", () => {
  it("should wrap the rows the way the Bot API expects them", () => {
    expect(toMarkup(ROWS)).toEqual({ inline_keyboard: ROWS });
  });

  it("should hand over a fresh button rather than the readonly one it was given", () => {
    const button = toMarkup(ROWS).inline_keyboard[0]?.[0];

    expect(button).not.toBe(ROWS[0]?.[0]);
    expect(button).toEqual(ROWS[0]?.[0]);
  });

  it("should hand over a fresh row as well as a fresh button", () => {
    const row = toMarkup(ROWS).inline_keyboard[0];

    expect(row).not.toBe(ROWS[0]);
    expect(row).toEqual(ROWS[0]);
  });
});
