import type { InlineKeyboardRows } from "#shared/telegram/inline-keyboard.ts";
import type { PlayerColumn } from "#shared/repository/repository-contract.ts";
import { encodePersonalCallback } from "#scoresheet/render/personal/personal-callback-codec.ts";


export const renderRosterKeyboard = (roster: readonly PlayerColumn[]): InlineKeyboardRows =>
  roster.map((player) => [
    {
      text: player.displayName,
      callback_data: encodePersonalCallback(player.playerId),
    },
  ]);
