import { Locale } from "#shared/locale/locales.ts";
import type { Copy } from "#live-game/copy.en.ts";


export const copy: Copy = {
  locale: Locale.Ru,

  lineupMissing: "Кто играет? Например: /game Олег, Аня, Рома",
  lineupPrompt: "Кто играет? Пришли имена в порядке посадки.",
  lineupPlaceholder: "Олег, Аня, Рома",
  lineupTooFew: "Для партии нужны хотя бы двое.",
  lineupTooMany: (most: number) => `За столом помещается не больше ${most} игроков.`,
  nameTooLong: (longest: number, names: readonly string[]) =>
    `Слишком длинно для кнопки: ${names.join(", ")}. Длина имени — до ${longest} символов.`,
  lineupDuplicates: (names: readonly string[]) =>
    `Эти имена повторяются: ${names.join(", ")}. Дай каждому своё.`,
  gameAlreadyRunning: "Партия уже идёт.",
  noLineupToRepeat: "Здесь ещё не было составов. Начни с /game и имён.",
  joinersPrompt: "Кто присоединяется? Пришли имена.",
  joinersPlaceholder: "Женя, Саша",
  joinersMissing: "Кто присоединяется? Например: /next_with Женя, Саша",
  alreadyAtTable: (names: readonly string[]) =>
    `Уже за столом: ${names.join(", ")}. Называй только тех, кто присоединяется.`,
  notAtTable: (names: readonly string[]) =>
    `Не за столом: ${names.join(", ")}. Называй только тех, кто играл.`,

  seatingHeader: "<b>Рассаживаемся</b>",
  seatingAsk: "Нажимай на всех по очереди — в том порядке, как сидят за столом.",
  seatedBody: (ring: string) => `Посадка: ${ring}`,
  betweenSeats: " → ",
  seatingCancelledBody: "Отменено — партия не начата.",
  seatingStale: "Эта посадка устарела — начни заново",

  leavingHeader: "<b>Кто эту партию пропускает?</b>",
  leavingAsk: "Отметь, кто не играет, и жми «Играем».",
  playingBody: (ring: string) => `Играют: ${ring}`,
  leavingCancelledBody: "Отменено — состав прежний.",
  leavingStale: "Этот состав уже сменился — набери /next_without заново",

  commandGame: "Открыть партию — /game Олег, Аня, Рома",
  commandNext: "Ещё партия, тот же состав",
  commandNextWith: "Ещё партия, плюс игроки — /next_with Женя",
  commandNextWithout: "Ещё партия, минус тех, кто пропускает",

  helpGame: "/game Олег, Аня, Рома — открыть партию; порядок имён — это порядок посадки за столом",
  helpNext:
    "/next — ещё партия тем же составом; первым ходит сосед дурака, потому что ходят на дурака",
  helpNextWith:
    "/next_with Женя, Саша — тот же состав плюс эти; дальше жмёшь всех по порядку посадки, а первый ход выбираешь сам",
  helpNextWithout: "/next_without — отметь, кто пропускает, или назови: /next_without Олег",
  helpCard: [
    "Нажми имя, чтобы отметить, кто ходил первым, а дальше жми игроков в порядке выхода.",
    "Последний оставшийся — дурак, его отметят за тебя. «Ничья» появляется, когда осталось двое.",
    "«Назад» отменяет по шагу, и ничего не записано, пока не нажмёшь «Записать».",
  ],

  header: (gameNumber: number) => `<b>Партия ${gameNumber}</b>`,
  askStarter: "Кто ходил первым?",
  wentFirst: (name: string) => `Ходит первым: <b>${name}</b>`,

  resultPlace: (position: number, name: string) => `${position} · ${name}`,
  resultFool: (position: number, name: string) => `${position} · <b>${name}</b> — дурак`,
  resultDraw: (position: number, name: string) => `${position} · <b>${name}</b> — ничья`,

  markExit: "✅",
  markFool: "💀",
  markDraw: "🤝",
  markSeat: "🪑",
  markLeaving: "🚪",

  buttonDraw: "🤝 Ничья",
  buttonConfirm: "✅ Записать",
  buttonBack: "↩️ Назад",
  buttonCancel: "❌ Отмена",
  buttonPlay: "✅ Играем",

  tapSeated: (name: string, seat: number) => `${name} — место ${seat}`,
  tapRecorded: (name: string, position: number) => `${name} — ${position}`,
  tapStarter: (name: string) => `${name} ходит первым`,
  tapDraw: "Ничья",
  tapSittingOut: (name: string) => `${name} пропускает`,
  tapPlayingAgain: (name: string) => `${name} всё-таки играет`,
  tapBack: "Шаг назад",
  tapNotAllowed: "Сейчас так нельзя",
  cardStale: "Карточка обновилась — посмотри ещё раз",
  cardGone: "Эта партия уже закончена",

  seatedNotice: "Расселись",
  leftNotice: "Состав готов",
  confirmedNotice: "Записано",
  cancelledNotice: "Отменено",
  cancelledBody: "Отменено — ничего не записано.",
  abandonedBody: "Заброшено после трёх часов тишины — ничего не записано.",
};
