import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { InlineKeyboardStub } from "#shared/telegram/inline-keyboard.stub.ts";
import { DEFAULT_LOCALE, Locale } from "#shared/locale/locales.ts";
import { copy } from "#scoresheet/copy.en.ts";
import { BOT_USERNAME, CHAT_ID, ContextStub } from "#scoresheet/bot/grammy-context.stub.ts";
import { InputFileStub } from "#scoresheet/bot/grammy-input-file.stub.ts";


const THE_HANDLE = `@${BOT_USERNAME}`;


const inputFile = new InputFileStub();

const keyboard = new InlineKeyboardStub();

const careerCardSpy = vi.fn();

const renderPersonalCardSpy = vi.fn();

const renderRosterKeyboardSpy = vi.fn();

const decodePersonalCallbackSpy = vi.fn();

const rasterizeSpy = vi.fn();

const columnLookupOfSpy = vi.fn();

const copyInSpy = vi.fn();

vi.mock("#shared/telegram/inline-keyboard.ts", () => keyboard.module);

vi.mock("#scoresheet/copy.ts", () => ({
  copyIn: (locale: unknown) => copyInSpy(locale),
}));

vi.mock("#scoresheet/domain/career/career-card.ts", () => ({
  careerCard: (history: unknown, playerId: unknown) => careerCardSpy(history, playerId),
}));

vi.mock("#scoresheet/render/personal/colour-column.ts", () => ({
  columnLookupOf: (evening: unknown, roster: unknown) => (playerId: number) =>
    columnLookupOfSpy(evening, roster, playerId),
}));

vi.mock("#scoresheet/render/personal/personal-svg.ts", () => ({
  renderPersonalCard: (table: unknown, card: unknown, column: unknown, handle: unknown) =>
    renderPersonalCardSpy(table, card, column, handle),
}));

vi.mock("#scoresheet/render/personal/roster-keyboard.ts", () => ({
  renderRosterKeyboard: (roster: unknown) => renderRosterKeyboardSpy(roster),
}));

vi.mock("#scoresheet/render/personal/personal-callback-codec.ts", () => ({
  decodePersonalCallback: (data: unknown) => decodePersonalCallbackSpy(data),
}));

vi.mock("#shared/drawing/rasterize.ts", () => ({
  rasterize: (svg: string) => rasterizeSpy(svg),
}));

vi.mock("grammy", () => inputFile.module);

const { onPersonal, onPersonalTap } = await import("#scoresheet/bot/personal-handler.ts");

const ONCE = 1;

const NEVER = 0;

const OLEG = 7;

const ANYA = 9;

const CARD_SVG = "<svg>card</svg>";

const DRAWN_BYTES = "card-png";

const ROSTER_ROWS = [[{ text: "row", callback_data: "pc:7" }]];

const MARKUP = { inline_keyboard: [[{ text: "markup", callback_data: "pc:7" }]] };

const HISTORY = {
  players: [
    { playerId: OLEG, displayName: "Oleg" },
    { playerId: ANYA, displayName: "Anya" },
  ],
  games: [],
};

const CARD = { playerId: OLEG, displayName: "Oleg" };

const EVENING = {
  startedOn: "2026-08-21",
  players: [{ playerId: ANYA, displayName: "Anya" }, { playerId: OLEG, displayName: "Oleg" }],
  games: [],
};

const A_COLUMN = 5;

const HANDED_THE_LOOKUP = 2;

const lookupGiven = (): ((playerId: number) => number) =>
  renderPersonalCardSpy.mock.calls[0]?.[HANDED_THE_LOOKUP] as (playerId: number) => number;

const TAP_DATA = "pc:7";

describe("personal-handler", () => {
  let repo: RepositoryStub;
  let locales: LocaleReaderStub;
  let ctx: ContextStub;

  const contextOf = () => ({ repo, localeIn: locales.read });

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    locales = new LocaleReaderStub();
    ctx = new ContextStub();

    copyInSpy.mockReturnValue(copy);
    keyboard.toMarkupSpy.mockReturnValue(MARKUP);
    renderRosterKeyboardSpy.mockReturnValue(ROSTER_ROWS);
    decodePersonalCallbackSpy.mockReturnValue(OLEG);
    careerCardSpy.mockReturnValue(CARD);
    renderPersonalCardSpy.mockReturnValue(CARD_SVG);
    rasterizeSpy.mockResolvedValue(DRAWN_BYTES);
    repo.careerHistorySpy.mockReturnValue(HISTORY);
    repo.seriesChronologySpy.mockReturnValue(EVENING);
    columnLookupOfSpy.mockReturnValue(A_COLUMN);
  });

  describe("onPersonal()", () => {
    it("should speak the language the chat chose", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);

      await onPersonal(contextOf(), ctx.command("/personal"));

      expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
      expect(copyInSpy).toHaveBeenCalledWith(Locale.Ru);
    });

    it("should ask the career of the chat it was sent in", async () => {
      await onPersonal(contextOf(), ctx.command("/personal"));

      expect(repo.careerHistorySpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should say nobody has played when the chat has no history", async () => {
      repo.careerHistorySpy.mockReturnValue(null);

      await onPersonal(contextOf(), ctx.command("/personal"));

      expect(ctx.lastReply().text).toBe(copy.personalNobody);
    });

    it("should offer no keyboard when the chat has no history", async () => {
      repo.careerHistorySpy.mockReturnValue(null);

      await onPersonal(contextOf(), ctx.command("/personal"));

      expect(renderRosterKeyboardSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should build the keyboard from the players the career knows", async () => {
      await onPersonal(contextOf(), ctx.command("/personal"));

      expect(renderRosterKeyboardSpy).toHaveBeenCalledWith(HISTORY.players);
    });

    it("should hand the rendered rows to the markup converter", async () => {
      await onPersonal(contextOf(), ctx.command("/personal"));

      expect(keyboard.toMarkupSpy).toHaveBeenCalledWith(ROSTER_ROWS);
    });

    it("should attach the converted markup to the question it asks", async () => {
      await onPersonal(contextOf(), ctx.command("/personal"));

      expect(ctx.lastReply()).toEqual({
        text: copy.personalPick,
        options: { reply_markup: MARKUP },
      });
    });
  });

  describe("onPersonalTap()", () => {
    it("should decode the data the button carried", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(decodePersonalCallbackSpy).toHaveBeenCalledWith(TAP_DATA);
    });

    it("should build the card for the player that was tapped", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(careerCardSpy).toHaveBeenCalledWith(HISTORY, OLEG);
    });

    it("should refuse a tap whose data it cannot read", async () => {
      decodePersonalCallbackSpy.mockReturnValue(null);

      await onPersonalTap(contextOf(), ctx.tap("nonsense"));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.personalStale);
    });

    it("should draw nothing for a tap whose data it cannot read", async () => {
      decodePersonalCallbackSpy.mockReturnValue(null);

      await onPersonalTap(contextOf(), ctx.tap("nonsense"));

      expect(rasterizeSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse a tap that arrived without a chat", async () => {
      await onPersonalTap(contextOf(), ctx.tapWithoutChat(TAP_DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.personalStale);
    });

    it("should ask the repository nothing about a tap that arrived without a chat", async () => {
      await onPersonalTap(contextOf(), ctx.tapWithoutChat(TAP_DATA));

      expect(repo.careerHistorySpy).toHaveBeenCalledTimes(NEVER);
      expect(repo.seriesChronologySpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should answer a tap in the language its own chat chose", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);

      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(locales.readSpy).toHaveBeenCalledWith(CHAT_ID);
      expect(copyInSpy).toHaveBeenCalledWith(Locale.Ru);
    });

    it("should fall back to the default language when there is no chat to ask about", async () => {
      locales.readSpy.mockReturnValue(Locale.Ru);

      await onPersonalTap(contextOf(), ctx.tapWithoutChat(TAP_DATA));

      expect(copyInSpy).toHaveBeenCalledWith(DEFAULT_LOCALE);
      expect(locales.readSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse a tap the career cannot build a card for", async () => {
      careerCardSpy.mockReturnValue(null);

      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.personalStale);
    });

    it("should refuse a tap when the chat's history has gone", async () => {
      repo.careerHistorySpy.mockReturnValue(null);

      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.personalStale);
    });

    it("should close the screen so no keyboard is left behind", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(ctx.editMessageTextSpy).toHaveBeenCalledWith(copy.personalPicked(CARD.displayName));
    });

    it("should answer the tap before spending time on the drawing", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(ctx.answerCallbackQuerySpy.mock.invocationCallOrder[NEVER]).toBeLessThan(
        rasterizeSpy.mock.invocationCallOrder[NEVER] ?? NEVER
      );
    });

    it("should ask for the evening the other posters of this chat are drawn from", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(repo.seriesChronologySpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should hand over a lookup reading this evening and the chat's whole roster", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));
      lookupGiven()(OLEG);

      expect(columnLookupOfSpy).toHaveBeenCalledWith(EVENING, HISTORY.players, OLEG);
    });

    it("should answer for any player at the table, not only the card's subject", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));
      lookupGiven()(ANYA);

      expect(columnLookupOfSpy).toHaveBeenCalledWith(EVENING, HISTORY.players, ANYA);
    });

    it("should read the evening once however many players the card asks about", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));
      lookupGiven()(OLEG);
      lookupGiven()(ANYA);

      expect(repo.seriesChronologySpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should draw the card with that lookup rather than one fixed column", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(renderPersonalCardSpy).toHaveBeenCalledWith(
        copy,
        CARD,
        expect.any(Function),
        THE_HANDLE
      );
    });

    it("should rasterize what the renderer drew", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(rasterizeSpy).toHaveBeenCalledWith(CARD_SVG);
    });

    it("should send the rasterized bytes under a named file", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(inputFile.builtSpy).toHaveBeenCalledWith(DRAWN_BYTES, "player-card.png");
    });

    it("should send exactly one photo back", async () => {
      await onPersonalTap(contextOf(), ctx.tap(TAP_DATA));

      expect(ctx.replyWithPhotoSpy).toHaveBeenCalledTimes(ONCE);
    });
  });
});
