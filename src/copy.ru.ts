import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#app/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandHelp: "Что умеет бот",

  helpLead: "FoolProof ведёт счёт в дурака.",
  helpSelf: "/help — это сообщение",

  tapUnclaimed: "Эта кнопка — из старой версии бота",

  updateFailed: (updateId: number, reason: string) =>
    `обновление ${updateId} не удалось: ${reason}`,
};
