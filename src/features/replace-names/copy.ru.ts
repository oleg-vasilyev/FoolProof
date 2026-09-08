import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#replace-names/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandReplace: "Исправить имя в последнем вечере",
  helpReplace:
    "/replace — кто-то весь вечер записан под чужим именем; назови, как записано, а потом кто играл на самом деле: /replace Рома, Романи",

  header: "<b>Замена имени</b>",
  askNames:
    "Два имени: какое записано, а потом кто играл на самом деле. Например: /replace Рома, Романи",
  askNamesPrompt: "Какое имя записано и кто играл на самом деле? Пришли оба имени.",
  askNamesPlaceholder: "Рома, Романи",
  sameName: "Это одно и то же имя — заменять нечего.",
  nameTooLong: (longest: number, names: readonly string[]) =>
    `Слишком длинно для имени: ${names.join(", ")}. Не длиннее ${longest} символов.`,
  noEvening: "Здесь ещё не записано ни одного вечера — исправлять нечего.",
  notThisEvening: (name: string, date: string) => `${name} в партиях за ${date} не встречается.`,
  alsoPlayed: (leaving: string, arriving: string, date: string) =>
    `${arriving} тоже есть в партиях за ${date} — значит, ${leaving} — это кто-то другой. Ничего не заменено.`,
  gameRunning: "Партия ещё идёт. Сначала подтверди её, потом /replace.",

  plan: (leaving: string, arriving: string) => `${leaving} → <b>${arriving}</b>`,
  willRewrite: (games: string, date: string) => `Будет переписано: ${games} за ${date}.`,
  rewritten: (games: string, date: string) => `Переписано: ${games} за ${date}.`,
  newName: (name: string) => `${name} — новое имя, его здесь ещё не было. Проверь написание, прежде чем подтверждать.`,

  cancelledBody: "Отменено — ничего не заменено.",

  gameForms: { one: "партия", few: "партии", many: "партий" },

  months: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
  eveningDate: (day: string, month: string) => `${day} ${month}`,

  buttonConfirm: "🟢 Заменить",
  buttonCancel: "🔴 Отмена",

  replacedNotice: "Заменено",
  cancelledNotice: "Отменено",
  screenStale: "Экран устарел — отправь /replace заново",
};
