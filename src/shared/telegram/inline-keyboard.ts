export interface InlineButton {
  readonly text: string;
  readonly callback_data: string;
}

export type InlineKeyboardRows = readonly (readonly InlineButton[])[];

export const toMarkup = (rows: InlineKeyboardRows) => ({
  inline_keyboard: rows.map((row) => row.map((button) => ({ ...button }))),
});
