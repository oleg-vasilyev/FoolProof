import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { cardRecordOf } from "#shared/repository/database-records.stub.ts";
import { copy } from "#live-game/copy.en.ts";
import { CardServiceStub } from "#live-game/bot/card/card-service.stub.ts";
import { CHAT_ID, ContextStub } from "#live-game/bot/grammy-context.stub.ts";
import { InlineKeyboardStub } from "#shared/telegram/inline-keyboard.stub.ts";
import { PromptRegistryStub } from "#live-game/bot/prompt-registry.stub.ts";


const keyboards = new InlineKeyboardStub();

const rotateToLowestIdSpy = vi.fn();

vi.mock("#live-game/domain/lineup-parsing.ts", () => ({
  rotateToLowestId: (seats: unknown) => rotateToLowestIdSpy(seats),
}));

const applySeatingSpy = vi.fn();

vi.mock("#live-game/domain/seating-plan.ts", () => ({
  applySeating: (plan: unknown, action: unknown) => applySeatingSpy(plan, action),
}));

const decodeSeatingCallbackSpy = vi.fn();

vi.mock("#live-game/render/seating-screen/seating-callback-codec.ts", () => ({
  decodeSeatingCallback: (data: string) => decodeSeatingCallbackSpy(data),
}));

const renderSeatingKeyboardSpy = vi.fn();

vi.mock("#live-game/render/seating-screen/seating-keyboard.ts", () => ({
  renderSeatingKeyboard: (table: unknown, plan: unknown) => renderSeatingKeyboardSpy(table, plan),
}));

const renderSeatedSpy = vi.fn();

const renderSeatingCancelledSpy = vi.fn();

const renderSeatingScreenSpy = vi.fn();

vi.mock("#live-game/render/seating-screen/seating-message.ts", () => ({
  renderSeated: (table: unknown, seats: unknown) => renderSeatedSpy(table, seats),
  renderSeatingCancelled: (table: unknown) => renderSeatingCancelledSpy(table),
  renderSeatingScreen: (table: unknown) => renderSeatingScreenSpy(table),
}));

vi.mock("#shared/telegram/inline-keyboard.ts", () => keyboards.module);

vi.mock("#live-game/bot/card/card-service.ts", () => ({
  PICKED_BY_HAND: null,
}));

const { askSeating, onSeatingTap } = await import("#live-game/bot/seating-screen.ts");

const NEVER = 0;

const ONCE = 1;

const NONE_PLACED = 0;

const ONE_PLACED = 1;

const DISTINCTIVE_SEAT = 4;

const OLEG = { id: 3, chat_id: CHAT_ID, display_name: "Oleg" };

const ANYA = { id: 7, chat_id: CHAT_ID, display_name: "Anya" };

const KIM = { id: 41, chat_id: CHAT_ID, display_name: "Kim" };

const SEATS = [
  { playerId: OLEG.id, displayName: OLEG.display_name },
  { playerId: ANYA.id, displayName: ANYA.display_name },
  { playerId: KIM.id, displayName: KIM.display_name },
];

const ORDER = [OLEG.id, ANYA.id, KIM.id];

const PLAN = { roster: SEATS, placed: NONE_PLACED };

const NEXT_PLAN = { roster: SEATS, placed: ONE_PLACED };

const ROTATED = [{ playerId: KIM.id, displayName: KIM.display_name }];

const SCREEN = "the seating screen";

const SEATED_TEXT = "the finished ring";

const CANCELLED_TEXT = "nothing started";

const KEYBOARD = [[{ text: "Oleg", callback_data: "d" }]];

const MARKUP = { inline_keyboard: [[{ text: "converted", callback_data: "converted" }]] };

const DATA = "s:3.7.f:0:p:7";

let repo: RepositoryStub;
let locales: LocaleReaderStub;

let cards: CardServiceStub;

let ctx: ContextStub;

const context = () => ({ repo, cards: cards.service, prompts: new PromptRegistryStub().registry, localeIn: locales.read });

describe("seating-screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    locales = new LocaleReaderStub();
    cards = new CardServiceStub();
    ctx = new ContextStub();

    repo.playersInChatSpy.mockReturnValue([OLEG, ANYA, KIM]);
    repo.liveCardInChatSpy.mockReturnValue(null);

    rotateToLowestIdSpy.mockReturnValue(ROTATED);
    renderSeatingScreenSpy.mockReturnValue(SCREEN);
    renderSeatedSpy.mockReturnValue(SEATED_TEXT);
    renderSeatingCancelledSpy.mockReturnValue(CANCELLED_TEXT);
    renderSeatingKeyboardSpy.mockReturnValue(KEYBOARD);
    keyboards.toMarkupSpy.mockReturnValue(MARKUP);
    decodeSeatingCallbackSpy.mockReturnValue({
      order: ORDER,
      placed: NONE_PLACED,
      action: { kind: ActionKind.Pick, playerId: ANYA.id },
    });
    applySeatingSpy.mockReturnValue({ outcome: Outcome.Rejected });
  });

  describe("askSeating()", () => {
    it("should post the screen with nobody seated yet", async () => {
      await askSeating(copy, ctx.command("/next_with Kim"), SEATS);

      expect(renderSeatingKeyboardSpy).toHaveBeenCalledWith(copy, { roster: SEATS, placed: NONE_PLACED });
      expect(ctx.lastReply().text).toBe(SCREEN);
    });

    it("should send the keyboard as markup, parsed as HTML", async () => {
      await askSeating(copy, ctx.command("/next_with Kim"), SEATS);

      expect(keyboards.toMarkupSpy).toHaveBeenCalledWith(KEYBOARD);
      expect(ctx.lastReply().options).toEqual({ parse_mode: "HTML", reply_markup: MARKUP });
    });

    it("should answer a reply the same way it answers a command", async () => {
      await askSeating(copy, ctx.textMessage("Kim"), SEATS);

      expect(ctx.lastReply().text).toBe(SCREEN);
    });
  });

  describe("onSeatingTap()", () => {
    it("should refuse data it cannot read", async () => {
      decodeSeatingCallbackSpy.mockReturnValue(null);

      await onSeatingTap(context(), ctx.callbackTap("nonsense"));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.seatingStale);
      expect(applySeatingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse a tap that arrived with no chat to seat anyone in", async () => {
      await onSeatingTap(context(), ctx.chatlessTap(DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.seatingStale);
      expect(applySeatingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse a screen naming a player the chat no longer has", async () => {
      repo.playersInChatSpy.mockReturnValue([OLEG, ANYA]);

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.seatingStale);
      expect(applySeatingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should rebuild the plan from the ids the screen carried", async () => {
      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(decodeSeatingCallbackSpy).toHaveBeenCalledWith(DATA);
      expect(applySeatingSpy).toHaveBeenCalledWith(PLAN, { kind: ActionKind.Pick, playerId: ANYA.id });
    });

    it("should redraw the screen and name the seat just taken", async () => {
      applySeatingSpy.mockReturnValue({
        outcome: Outcome.Updated,
        plan: NEXT_PLAN,
        seated: SEATS[1],
        seat: DISTINCTIVE_SEAT,
      });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.lastEdit().text).toBe(SCREEN);
      expect(renderSeatingKeyboardSpy).toHaveBeenCalledWith(copy, NEXT_PLAN);
      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(
        copy.tapSeated(ANYA.display_name, DISTINCTIVE_SEAT)
      );
    });

    it("should redraw the screen after a step back", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.SteppedBack, plan: NEXT_PLAN });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.lastEdit().text).toBe(SCREEN);
      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapBack);
    });

    it("should open the card once the ring is settled, with the deal picked by hand", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: SEATS });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(rotateToLowestIdSpy).toHaveBeenCalledWith(SEATS);
      expect(cards.openSpy).toHaveBeenCalledWith(copy, CHAT_ID, ROTATED, null);
    });

    it("should leave the settled ring in the chat before the card arrives", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: SEATS });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(renderSeatedSpy).toHaveBeenCalledWith(copy, SEATS);
      expect(ctx.lastEdit().text).toBe(SEATED_TEXT);
      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.seatedNotice);
    });

    it("should refuse to open a second card when a game started while the screen waited", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: SEATS });
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf([OLEG.display_name, ANYA.display_name]));

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith({
        text: copy.gameAlreadyRunning,
        show_alert: true,
      });
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should close the screen when it is cancelled, without opening a card", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.Cancelled });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.lastEdit().text).toBe(CANCELLED_TEXT);
      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.cancelledNotice);
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should take a mistyped joiner away with the cancelled screen", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.Cancelled });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(repo.forgetUnplayedPlayersSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should keep a joiner the seating did not cancel", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: SEATS });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(repo.forgetUnplayedPlayersSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should say nothing changed when the plan refuses the tap", async () => {
      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledWith(copy.tapNotAllowed);
      expect(ctx.editMessageTextSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should answer every tap exactly once, so the client stops spinning", async () => {
      applySeatingSpy.mockReturnValue({ outcome: Outcome.Cancelled });

      await onSeatingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.answerCallbackQuerySpy).toHaveBeenCalledTimes(ONCE);
    });
  });
});
