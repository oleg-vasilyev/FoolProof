import type { InlineKeyboardRows } from "#live-game/render/inline-keyboard.ts";


export const toMarkup = (rows: InlineKeyboardRows) => ({
  inline_keyboard: rows.map((row) => row.map((button) => ({ ...button }))),
});
