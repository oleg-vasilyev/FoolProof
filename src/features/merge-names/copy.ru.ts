import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#merge-names/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  commandMerge: "Свести два имени одного игрока",
  helpMerge:
    "/merge — один игрок записан под двумя именами; нажми имя, которое остаётся, а потом те, что сливаются в него",

  header: "<b>Сводим имена</b>",
  askKeeper: "Сначала нажми имя, которое остаётся. Число рядом — сыгранные партии.",
  keeperChosen: (keeper: string) =>
    `<b>${keeper}</b> остаётся. Теперь нажми те имена, что сливаются в него.`,
  plan: (absorbed: string, keeper: string) => `${absorbed} → <b>${keeper}</b>`,
  willHave: (keeper: string, games: string) => `${keeper} — будет ${games}.`,
  nowHas: (keeper: string, games: string) => `${keeper} — теперь ${games}.`,

  gameForms: { one: "партия", few: "партии", many: "партий" },

  nothingToMerge: "Здесь пока только одно имя — сводить нечего.",
  gameRunning: "Партия ещё идёт. Сначала подтверди её, потом /merge.",
  playedTogether: (names: string) =>
    `${names} сидели в одной партии, значит это разные люди. Ничего не слито.`,

  cancelledBody: "Отменено — ничего не слито.",

  markKeeper: "⭐",
  markAbsorbed: "➕",

  buttonConfirm: "✅ Слить",
  buttonBack: "↩️ Назад",
  buttonCancel: "❌ Отмена",

  candidate: (name: string, games: number) => `${name} · ${games}`,

  tapKeeper: (name: string) => `${name} остаётся`,
  tapAbsorbed: (name: string) => `${name} сливается`,
  tapDropped: (name: string) => `${name} — не трогаем`,
  tapBack: "Шаг назад",
  tapNotAllowed: "Сейчас так нельзя",
  tapTooMany: "Больше имён за одно сведение не унести",
  screenStale: "Экран устарел — отправь /merge заново",

  mergedNotice: "Слито",
  cancelledNotice: "Отменено",
};
