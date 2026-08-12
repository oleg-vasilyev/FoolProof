import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#app/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandHelp: "Что умеет бот",

  botLead: "FoolProof ведёт счёт в дурака.",
  helpSelf: "/help — это сообщение",

  startInvite: "Добавьте меня в чат, где играет ваша компания, и отправьте /game с именами.",
  startHelp: "/help — что делает каждая команда",
  buttonAddToGroup: "➕ Добавить меня в группу",

  tapUnclaimed: "Эта кнопка — из старой версии бота",

  updateFailed: (updateId: number, reason: string) =>
    `обновление ${updateId} не удалось: ${reason}`,
};
