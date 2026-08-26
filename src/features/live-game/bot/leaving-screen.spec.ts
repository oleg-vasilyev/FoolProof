import { ActionKind, Outcome } from "#live-game/domain/card-states.ts";
import { Problem } from "#live-game/domain/refusals.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleReaderStub } from "#shared/locale/chat-locale.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { cardRecordOf, seatRecordsOf } from "#shared/repository/database-records.stub.ts";
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

const applyLeavingSpy = vi.fn();

vi.mock("#live-game/domain/leaving-plan.ts", () => ({
  applyLeaving: (plan: unknown, action: unknown) => applyLeavingSpy(plan, action),
}));

const decodeLeavingCallbackSpy = vi.fn();

vi.mock("#live-game/render/leaving-screen/leaving-callback-codec.ts", () => ({
  decodeLeavingCallback: (data: string) => decodeLeavingCallbackSpy(data),
}));

const renderLeavingKeyboardSpy = vi.fn();

vi.mock("#live-game/render/leaving-screen/leaving-keyboard.ts", () => ({
  renderLeavingKeyboard: (table: unknown, plan: unknown) => renderLeavingKeyboardSpy(table, plan),
}));

const renderPlayingSpy = vi.fn();

const renderLeavingCancelledSpy = vi.fn();

const renderLeavingScreenSpy = vi.fn();

vi.mock("#live-game/render/leaving-screen/leaving-message.ts", () => ({
  renderPlaying: (table: unknown, seats: unknown) => renderPlayingSpy(table, seats),
  renderLeavingCancelled: (table: unknown) => renderLeavingCancelledSpy(table),
  renderLeavingScreen: (table: unknown) => renderLeavingScreenSpy(table),
}));

const toSeatsSpy = vi.fn();

vi.mock("#live-game/bot/lineup/seat-lookup.ts", () => ({
  toSeats: (records: unknown) => toSeatsSpy(records),
}));

vi.mock("#shared/telegram/inline-keyboard.ts", () => keyboards.module);

vi.mock("#live-game/bot/card/card-service.ts", () => ({
  PICKED_BY_HAND: null,
}));

const { askLeaving, onLeavingTap } = await import("#live-game/bot/leaving-screen.ts");

const NEVER = 0;

const ONCE = 1;

const OLEG = { id: 3, chat_id: CHAT_ID, display_name: "Oleg" };

const ANYA = { id: 7, chat_id: CHAT_ID, display_name: "Anya" };

const KIM = { id: 41, chat_id: CHAT_ID, display_name: "Kim" };

const SEATS = [
  { playerId: OLEG.id, displayName: OLEG.display_name },
  { playerId: ANYA.id, displayName: ANYA.display_name },
  { playerId: KIM.id, displayName: KIM.display_name },
];

const ORDER = [OLEG.id, ANYA.id, KIM.id];

const NOBODY: readonly number[] = [];

const STAYING = [SEATS[0], SEATS[2]];

const ROTATED = [{ playerId: KIM.id, displayName: KIM.display_name }];

const SCREEN = "the screen of names";

const LEFT_TEXT = "who is playing";

const CANCELLED_TEXT = "the table is unchanged";

const KEYBOARD = [[{ text: "Oleg", callback_data: "w" }]];

const MARKUP = { inline_keyboard: [[{ text: "converted", callback_data: "converted" }]] };

const LAST_GAME = { gameId: 12, seats: seatRecordsOf(OLEG.display_name, ANYA.display_name, KIM.display_name), loserIds: [] };

const DATA = "w:3.7.f:0:p:7";

const CONFIRM_DATA = "w:3.7.f:0:k:-";

const CANCEL_DATA = "w:3.7.f:0:x:-";

const lastAnswer = (): unknown =>
  ctx.answerCallbackQuerySpy.mock.calls.at(LAST_CALL)?.[FIRST_ARGUMENT];

const LAST_CALL = -1;

const FIRST_ARGUMENT = 0;

let repo: RepositoryStub;
let locales: LocaleReaderStub;
let cards: CardServiceStub;
let ctx: ContextStub;

const context = () => ({
  repo,
  cards: cards.service,
  prompts: new PromptRegistryStub().registry,
  localeIn: locales.read,
});

describe("leaving-screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    locales = new LocaleReaderStub();
    cards = new CardServiceStub();
    ctx = new ContextStub();

    repo.lastGameSpy.mockReturnValue(LAST_GAME);
    repo.liveCardInChatSpy.mockReturnValue(null);

    toSeatsSpy.mockReturnValue(SEATS);
    rotateToLowestIdSpy.mockReturnValue(ROTATED);
    renderLeavingScreenSpy.mockReturnValue(SCREEN);
    renderPlayingSpy.mockReturnValue(LEFT_TEXT);
    renderLeavingCancelledSpy.mockReturnValue(CANCELLED_TEXT);
    renderLeavingKeyboardSpy.mockReturnValue(KEYBOARD);
    keyboards.toMarkupSpy.mockReturnValue(MARKUP);
    decodeLeavingCallbackSpy.mockReturnValue({
      order: ORDER,
      leaving: NOBODY,
      action: { kind: ActionKind.Pick, playerId: ANYA.id },
    });
    applyLeavingSpy.mockReturnValue({ outcome: Outcome.Rejected, problem: Problem.UnknownNames });
  });

  describe("askLeaving()", () => {
    it("should open the screen with nobody marked yet", async () => {
      await askLeaving(copy, ctx.command("/next_without"), SEATS);

      expect(renderLeavingKeyboardSpy).toHaveBeenCalledWith(copy, {
        roster: SEATS,
        leaving: NOBODY,
      });
    });

    it("should send the screen's own text under that keyboard", async () => {
      await askLeaving(copy, ctx.command("/next_without"), SEATS);

      expect(ctx.lastReply().text).toBe(SCREEN);
      expect(ctx.lastReply().options?.reply_markup).toBe(MARKUP);
    });
  });

  describe("onLeavingTap()", () => {
    it("should refuse data it cannot read", async () => {
      decodeLeavingCallbackSpy.mockReturnValue(null);

      await onLeavingTap(context(), ctx.callbackTap("nonsense"));

      expect(lastAnswer()).toBe(copy.leavingStale);
      expect(applyLeavingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse a tap that carries no chat", async () => {
      await onLeavingTap(context(), ctx.chatlessTap(DATA));

      expect(lastAnswer()).toBe(copy.leavingStale);
      expect(applyLeavingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse when the chat has no last game left to change", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(lastAnswer()).toBe(copy.leavingStale);
      expect(applyLeavingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should leave a stale screen standing for any tap that is not Back", async () => {
      repo.lastGameSpy.mockReturnValue(null);

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.editMessageTextSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse when another game was played while the screen stood", async () => {
      toSeatsSpy.mockReturnValue([SEATS[0], SEATS[1]]);

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(lastAnswer()).toBe(copy.leavingStale);
      expect(applyLeavingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse when the same-sized table is no longer the same people", async () => {
      toSeatsSpy.mockReturnValue([
        SEATS[0],
        { playerId: 99, displayName: "Somebody else" },
        SEATS[2],
      ]);

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(lastAnswer()).toBe(copy.leavingStale);
      expect(applyLeavingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should judge the tap against the last game's own seats, not the ones it carried", async () => {
      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(applyLeavingSpy).toHaveBeenCalledWith(
        { roster: SEATS, leaving: NOBODY },
        { kind: ActionKind.Pick, playerId: ANYA.id }
      );
    });

    it("should read the seats out of the last game through the mapper", async () => {
      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(repo.lastGameSpy).toHaveBeenCalledWith(CHAT_ID);
      expect(toSeatsSpy).toHaveBeenCalledWith(LAST_GAME.seats);
    });

    it("should redraw the screen when somebody was marked", async () => {
      const plan = { roster: SEATS, leaving: [ANYA.id] };

      applyLeavingSpy.mockReturnValue({
        outcome: Outcome.Updated,
        plan,
        toggled: SEATS[1],
        sittingOut: true,
      });

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.lastEdit().text).toBe(SCREEN);
      expect(renderLeavingKeyboardSpy).toHaveBeenCalledWith(copy, plan);
    });

    it("should say who is sitting out when a name is marked", async () => {
      applyLeavingSpy.mockReturnValue({
        outcome: Outcome.Updated,
        plan: { roster: SEATS, leaving: [ANYA.id] },
        toggled: SEATS[1],
        sittingOut: true,
      });

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(lastAnswer()).toBe(copy.tapSittingOut(ANYA.display_name));
    });

    it("should say who is playing again when a name is unmarked", async () => {
      applyLeavingSpy.mockReturnValue({
        outcome: Outcome.Updated,
        plan: { roster: SEATS, leaving: NOBODY },
        toggled: SEATS[1],
        sittingOut: false,
      });

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(lastAnswer()).toBe(copy.tapPlayingAgain(ANYA.display_name));
    });

    it("should open the next card with whoever is left", async () => {
      applyLeavingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: STAYING });

      await onLeavingTap(context(), ctx.callbackTap(CONFIRM_DATA));

      expect(rotateToLowestIdSpy).toHaveBeenCalledWith(STAYING);
      expect(cards.openSpy).toHaveBeenCalledWith(copy, CHAT_ID, ROTATED, null);
    });

    it("should replace the screen with the table it settled on", async () => {
      applyLeavingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: STAYING });

      await onLeavingTap(context(), ctx.callbackTap(CONFIRM_DATA));

      expect(renderPlayingSpy).toHaveBeenCalledWith(copy, STAYING);
      expect(ctx.lastEdit().text).toBe(LEFT_TEXT);
      expect(lastAnswer()).toBe(copy.leftNotice);
    });

    it("should refuse to open a card when one went live while the screen stood", async () => {
      applyLeavingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: STAYING });
      repo.liveCardInChatSpy.mockReturnValue(cardRecordOf([OLEG.display_name, ANYA.display_name]));

      await onLeavingTap(context(), ctx.callbackTap(CONFIRM_DATA));

      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
      expect(lastAnswer()).toEqual({ text: copy.gameAlreadyRunning, show_alert: true });
    });

    it("should close the screen when it is cancelled", async () => {
      applyLeavingSpy.mockReturnValue({ outcome: Outcome.Cancelled });

      await onLeavingTap(context(), ctx.callbackTap(CANCEL_DATA));

      expect(ctx.lastEdit().text).toBe(CANCELLED_TEXT);
      expect(lastAnswer()).toBe(copy.cancelledNotice);
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should still close a screen the table has moved past, since closing changes nothing", async () => {
      decodeLeavingCallbackSpy.mockReturnValue({
        order: ORDER,
        leaving: NOBODY,
        action: { kind: ActionKind.Cancel },
      });
      repo.lastGameSpy.mockReturnValue(null);

      await onLeavingTap(context(), ctx.callbackTap(CANCEL_DATA));

      expect(ctx.lastEdit().text).toBe(CANCELLED_TEXT);
      expect(lastAnswer()).toBe(copy.cancelledNotice);
      expect(applyLeavingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should close a stale screen on Back, which is the only button a marked one has", async () => {
      decodeLeavingCallbackSpy.mockReturnValue({
        order: ORDER,
        leaving: [ANYA.id],
        action: { kind: ActionKind.Back },
      });
      repo.lastGameSpy.mockReturnValue(null);

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.lastEdit().text).toBe(CANCELLED_TEXT);
      expect(lastAnswer()).toBe(copy.leavingStale);
      expect(applyLeavingSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should redraw the screen with the mark taken back, and say so", async () => {
      const plan = { roster: SEATS, leaving: [] };

      applyLeavingSpy.mockReturnValue({ outcome: Outcome.SteppedBack, plan });

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(ctx.lastEdit().text).toBe(SCREEN);
      expect(renderLeavingKeyboardSpy).toHaveBeenCalledWith(copy, plan);
      expect(lastAnswer()).toBe(copy.tapBack);
    });

    it("should answer a step back with nothing to undo as a tap that cannot be made", async () => {
      applyLeavingSpy.mockReturnValue({
        outcome: Outcome.Rejected,
        problem: Problem.NothingYet,
      });

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(lastAnswer()).toBe(copy.tapNotAllowed);
    });

    it("should name the table as too small when that is what was refused", async () => {
      applyLeavingSpy.mockReturnValue({ outcome: Outcome.Rejected, problem: Problem.TooFew });

      await onLeavingTap(context(), ctx.callbackTap(CONFIRM_DATA));

      expect(lastAnswer()).toBe(copy.lineupTooFew);
      expect(cards.openSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should fall back to the stale notice for any other refusal", async () => {
      applyLeavingSpy.mockReturnValue({
        outcome: Outcome.Rejected,
        problem: Problem.UnknownNames,
      });

      await onLeavingTap(context(), ctx.callbackTap(DATA));

      expect(lastAnswer()).toBe(copy.leavingStale);
    });

    it("should answer the tap exactly once, whatever it decided", async () => {
      applyLeavingSpy.mockReturnValue({ outcome: Outcome.Seated, seats: STAYING });

      await onLeavingTap(context(), ctx.callbackTap(CONFIRM_DATA));

      expect(ctx.answerCallbackQuerySpy.mock.calls.length).toBe(ONCE);
    });
  });
});
