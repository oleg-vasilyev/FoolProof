import { beforeEach, describe, expect, it, vi } from "vitest";
import { cardRecordOf, playerIdOf } from "#shared/repository/database-records.stub.ts";
import { RepositoryStub } from "#shared/repository/repository-contract.stub.ts";
import { DebounceStub } from "#shared/timing/debounce.stub.ts";
import { LoggerStub } from "#shared/logging/logger.stub.ts";
import { seatsOf } from "#live-game/domain/card-state.stub.ts";
import type { CallbackAction, CallbackPayload } from "#live-game/render/callback-data-codec.ts";
import { copy } from "#live-game/copy.en.ts";
import { TelegramApiStub } from "#live-game/bot/grammy-api.stub.ts";


const debounce = new DebounceStub();

const applySpy = vi.fn();

const nameAtSpy = vi.fn();

const phaseOfSpy = vi.fn();

const remainingSlotsSpy = vi.fn();

const seatAtSpy = vi.fn();

const starterPlayerIdSpy = vi.fn();

const renderCardSpy = vi.fn();

const renderResultSpy = vi.fn();

const renderKeyboardSpy = vi.fn();

vi.mock("#shared/timing/debounce.ts", () => debounce.module);

vi.mock("#live-game/domain/card-state.ts", () => ({
  apply: (state: unknown, action: unknown) => applySpy(state, action),
  nameAt: (state: unknown, slot: number) => nameAtSpy(state, slot),
  phaseOf: (state: unknown) => phaseOfSpy(state),
  remainingSlots: (state: unknown) => remainingSlotsSpy(state),
  seatAt: (state: unknown, slot: number) => seatAtSpy(state, slot),
  starterPlayerId: (state: unknown) => starterPlayerIdSpy(state),
}));

vi.mock("#live-game/render/card-message.ts", () => ({
  renderCard: (state: unknown, gameNumber: number) => renderCardSpy(state, gameNumber),
  renderResult: (state: unknown, gameNumber: number) => renderResultSpy(state, gameNumber),
}));

vi.mock("#live-game/render/inline-keyboard.ts", () => ({
  renderKeyboard: (state: unknown, gameId: number, version: number) =>
    renderKeyboardSpy(state, gameId, version),
}));

const toMarkupSpy = vi.fn();

const MARKUP = { inline_keyboard: "converted" };

vi.mock("#live-game/bot/inline-markup.ts", () => ({
  toMarkup: (rows: unknown) => toMarkupSpy(rows),
}));

const { createCardService } = await import("#live-game/bot/card-service.ts");

const THREE = ["Oleg", "Anya", "Roma"];

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const GAME_ID = 1;

const CHAT_ID = -100777;

const MESSAGE_ID = 500;

const ACTOR_ID = 777;

const IDLE_SECONDS = 10_800;

const GAME_NUMBER = 3;

const FIRST_VERSION = 0;

const NEXT_VERSION = 1;

const SHORTEST_DEBOUNCE_MS = 300;

const LONGEST_DEBOUNCE_MS = 500;

const ONCE = 1;

const NEVER = 0;

const CARD_TEXT = "the rendered card";

const RESULT_TEXT = "the rendered standings";

const KEYBOARD = [[{ text: "Oleg", callback_data: "1:p:0:0" }]];

const STORED_VERSION = 5;

const EDIT_REFUSED = "Bad Request: message to edit not found";

const ALREADY_SHOWN = "Bad Request: message is not modified";

const payload = (action: CallbackAction, slot: number | null, version = FIRST_VERSION):
  CallbackPayload => ({ gameId: GAME_ID, action, slot, version });

const stateAfter = (over: Record<string, unknown> = {}) => ({
  seats: seatsOf(...THREE),
  starterSlot: OLEG,
  exits: [],
  drawAccepted: false,
  ...over,
});

describe("createCardService()", () => {
  let repo: RepositoryStub;
  let telegram: TelegramApiStub;
  let log: LoggerStub;
  let cards: ReturnType<typeof createCardService>;
  let runScheduledEdit: (request: unknown) => Promise<void>;

  const build = () => {
    cards = createCardService({ repo, api: telegram.api, log });
    runScheduledEdit = debounce.runGiven() as (request: unknown) => Promise<void>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    repo = new RepositoryStub();
    telegram = new TelegramApiStub();
    log = new LoggerStub();

    renderCardSpy.mockReturnValue(CARD_TEXT);
    renderResultSpy.mockReturnValue(RESULT_TEXT);
    renderKeyboardSpy.mockReturnValue(KEYBOARD);
    toMarkupSpy.mockReturnValue(MARKUP);
    nameAtSpy.mockReturnValue("Oleg");
    phaseOfSpy.mockReturnValue("RECORDING");
    remainingSlotsSpy.mockReturnValue([]);
    seatAtSpy.mockReturnValue({ playerId: playerIdOf(ROMA), displayName: "Roma" });
    starterPlayerIdSpy.mockReturnValue(playerIdOf(OLEG));
    repo.openGameSpy.mockReturnValue(GAME_ID);
    repo.gameNumberInSeriesSpy.mockReturnValue(GAME_NUMBER);

    build();
  });

  describe("the debounced editor", () => {
    it("should debounce edits inside the range the Bot API tolerates", () => {
      expect(debounce.delayGiven()).toBeGreaterThanOrEqual(SHORTEST_DEBOUNCE_MS);
      expect(debounce.delayGiven()).toBeLessThanOrEqual(LONGEST_DEBOUNCE_MS);
    });

    it("should send a scheduled edit as HTML", async () => {
      await runScheduledEdit({
        chatId: CHAT_ID,
        messageId: MESSAGE_ID,
        text: CARD_TEXT,
        keyboard: KEYBOARD,
      });

      expect(telegram.editMessageTextSpy).toHaveBeenCalledWith(
        CHAT_ID,
        MESSAGE_ID,
        CARD_TEXT,
        expect.objectContaining({ parse_mode: "HTML" })
      );
    });

    it("should drop the keyboard entirely when the edit carries none", async () => {
      await runScheduledEdit({
        chatId: CHAT_ID,
        messageId: MESSAGE_ID,
        text: CARD_TEXT,
        keyboard: null,
      });

      expect(telegram.lastEdit().markup).toBeUndefined();
    });

    it("should warn rather than throw when Telegram refuses the edit", async () => {
      telegram.editMessageTextSpy.mockRejectedValue(new Error(EDIT_REFUSED));

      await expect(
        runScheduledEdit({ chatId: CHAT_ID, messageId: MESSAGE_ID, text: "x", keyboard: null })
      ).resolves.toBeUndefined();
      expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should not warn about an edit that changed nothing, which a repair often is", async () => {
      telegram.editMessageTextSpy.mockRejectedValue(new Error(ALREADY_SHOWN));

      await runScheduledEdit({ chatId: CHAT_ID, messageId: MESSAGE_ID, text: "x", keyboard: null });

      expect(log.warnSpy).not.toHaveBeenCalled();
    });

    it("should still record an edit that changed nothing, at debug level", async () => {
      telegram.editMessageTextSpy.mockRejectedValue(new Error(ALREADY_SHOWN));

      await runScheduledEdit({ chatId: CHAT_ID, messageId: MESSAGE_ID, text: "x", keyboard: null });

      expect(log.debugSpy).toHaveBeenCalledTimes(ONCE);
    });
  });

  describe("open()", () => {
    it("should open a game with the seated player ids", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE), null);

      expect(repo.openGameSpy).toHaveBeenCalledWith(CHAT_ID, [
        playerIdOf(OLEG),
        playerIdOf(ANYA),
        playerIdOf(ROMA),
      ]);
    });

    it("should send the card the renderer produced", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE), null);

      expect(telegram.lastSend().text).toBe(CARD_TEXT);
    });

    it("should render a fresh card with no starter and no exits", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE), null);

      expect(renderCardSpy).toHaveBeenCalledWith(
        expect.objectContaining({ starterSlot: null, exits: [], drawAccepted: false }),
        GAME_NUMBER
      );
    });

    it("should build the keyboard at the first version", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE), null);

      expect(renderKeyboardSpy).toHaveBeenCalledWith(expect.anything(), GAME_ID, FIRST_VERSION);
    });

    it("should remember which message the card became", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE), null);

      expect(repo.attachMessageSpy).toHaveBeenCalledWith(GAME_ID, expect.any(Number));
    });

    it("should delete the row when Telegram refuses the message", async () => {
      telegram.sendMessageSpy.mockRejectedValue(new Error("chat not found"));

      await expect(cards.open(CHAT_ID, seatsOf(...THREE), null)).rejects.toThrow("chat not found");
      expect(repo.discardGameSpy).toHaveBeenCalledWith(GAME_ID);
    });

    it("should not leave a card attached to a message that was never sent", async () => {
      telegram.sendMessageSpy.mockRejectedValue(new Error("chat not found"));

      await expect(cards.open(CHAT_ID, seatsOf(...THREE), null)).rejects.toThrow();
      expect(repo.attachMessageSpy).toHaveBeenCalledTimes(NEVER);
    });

    describe("opening with a starter already picked", () => {
      it("should not store a phase or starter when no slot was given", async () => {
        await cards.open(CHAT_ID, seatsOf(...THREE), null);

        expect(repo.updateCardSpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should store the phase and starter the reducer derived for the given slot", async () => {
        phaseOfSpy.mockReturnValue("READY");
        starterPlayerIdSpy.mockReturnValue(playerIdOf(ANYA));

        await cards.open(CHAT_ID, seatsOf(...THREE), OLEG);

        expect(repo.updateCardSpy).toHaveBeenCalledWith(GAME_ID, "READY", FIRST_VERSION, playerIdOf(ANYA));
      });

      it("should render the card already past the pick-the-starter step", async () => {
        await cards.open(CHAT_ID, seatsOf(...THREE), OLEG);

        expect(renderCardSpy).toHaveBeenCalledWith(
          expect.objectContaining({ starterSlot: OLEG }),
          GAME_NUMBER
        );
      });

      it("should build the keyboard for a card already past the pick-the-starter step", async () => {
        await cards.open(CHAT_ID, seatsOf(...THREE), OLEG);

        expect(renderKeyboardSpy).toHaveBeenCalledWith(
          expect.objectContaining({ starterSlot: OLEG }),
          GAME_ID,
          FIRST_VERSION
        );
      });

      it("should still discard the game when Telegram refuses the message", async () => {
        telegram.sendMessageSpy.mockRejectedValue(new Error("chat not found"));

        await expect(cards.open(CHAT_ID, seatsOf(...THREE), OLEG)).rejects.toThrow("chat not found");
        expect(repo.discardGameSpy).toHaveBeenCalledWith(GAME_ID);
      });
    });
  });

  describe("tap()", () => {
    const liveCard = () =>
      cardRecordOf(THREE, {
        id: GAME_ID,
        message_id: MESSAGE_ID,
        starter_player_id: playerIdOf(OLEG),
      });

    beforeEach(() => {
      repo.cardByIdSpy.mockReturnValue(liveCard());
      applySpy.mockReturnValue({ outcome: "updated", state: stateAfter() });
    });

    describe("when the card cannot be tapped", () => {
      it("should say the card is gone when there is no row", async () => {
        repo.cardByIdSpy.mockReturnValue(null);

        expect(await cards.tap(payload("pick", OLEG), ACTOR_ID)).toBe(copy.cardGone);
      });

      it("should say the card is gone once it was confirmed", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { id: GAME_ID, confirmed_at: "2026-07-29 12:00:00" })
        );

        expect(await cards.tap(payload("pick", OLEG), ACTOR_ID)).toBe(copy.cardGone);
      });

      it("should say the card is stale when the version moved on", async () => {
        repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE, { id: GAME_ID, state_version: 5 }));

        expect(await cards.tap(payload("pick", OLEG), ACTOR_ID)).toBe(copy.cardStale);
      });

      it("should not touch the reducer for a stale tap", async () => {
        repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE, { id: GAME_ID, state_version: 5 }));

        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(applySpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should redraw a stale card, since its buttons may be the ones that are wrong", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { id: GAME_ID, message_id: MESSAGE_ID, state_version: STORED_VERSION })
        );

        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(debounce.debouncer.scheduleSpy).toHaveBeenCalledWith(
          String(GAME_ID),
          expect.objectContaining({ messageId: MESSAGE_ID, text: CARD_TEXT })
        );
      });

      it("should put the stored version on the repaired buttons, not the tapped one", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { id: GAME_ID, message_id: MESSAGE_ID, state_version: STORED_VERSION })
        );

        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(renderKeyboardSpy).toHaveBeenCalledWith(expect.anything(), GAME_ID, STORED_VERSION);
      });

      it("should refuse a tap the reducer rejected", async () => {
        applySpy.mockReturnValue({ outcome: "rejected" });

        expect(await cards.tap(payload("pick", OLEG), ACTOR_ID)).toBe(copy.tapNotAllowed);
      });

      it("should change nothing when the reducer rejected the tap", async () => {
        applySpy.mockReturnValue({ outcome: "rejected" });

        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(repo.updateCardSpy).toHaveBeenCalledTimes(NEVER);
      });
    });

    describe("the action it hands the reducer", () => {
      it("should carry the slot for a pick", async () => {
        await cards.tap(payload("pick", ROMA), ACTOR_ID);

        expect(applySpy).toHaveBeenCalledWith(expect.anything(), { kind: "pick", slot: ROMA });
      });

      it("should send a pick without a slot somewhere no seat can be", async () => {
        await cards.tap(payload("pick", null), ACTOR_ID);

        expect(applySpy.mock.calls[0]?.[1]).toEqual({ kind: "pick", slot: -1 });
      });

      it.each(["draw", "back", "confirm", "cancel"])(
        "should send %s as a bare action",
        async (action) => {
          await cards.tap(payload(action as CallbackAction, null), ACTOR_ID);

          expect(applySpy).toHaveBeenCalledWith(expect.anything(), { kind: action });
        }
      );

      it("should rebuild the state from the stored seats and exits", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { id: GAME_ID, starter_player_id: playerIdOf(OLEG) }, [ROMA])
        );

        await cards.tap(payload("back", null), ACTOR_ID);

        expect(applySpy.mock.calls[0]?.[0]).toMatchObject({ starterSlot: OLEG, exits: [ROMA] });
      });

      it("should treat a READY card with two left as an accepted draw", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { id: GAME_ID, state: "READY" }, [OLEG])
        );

        await cards.tap(payload("back", null), ACTOR_ID);

        expect(applySpy.mock.calls[0]?.[0]).toMatchObject({ drawAccepted: true });
      });

      it("should treat a READY card with one left as an automatic fool", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { id: GAME_ID, state: "READY" }, [OLEG, ANYA])
        );

        await cards.tap(payload("back", null), ACTOR_ID);

        expect(applySpy.mock.calls[0]?.[0]).toMatchObject({ drawAccepted: false });
      });
    });

    describe("cancelled", () => {
      beforeEach(() => {
        applySpy.mockReturnValue({ outcome: "cancelled" });
      });

      it("should delete the row, since a cancelled game is never stored", async () => {
        await cards.tap(payload("cancel", null), ACTOR_ID);

        expect(repo.discardGameSpy).toHaveBeenCalledWith(GAME_ID);
      });

      it("should drop any edit still pending for that card", async () => {
        await cards.tap(payload("cancel", null), ACTOR_ID);

        expect(debounce.debouncer.cancelSpy).toHaveBeenCalledWith(String(GAME_ID));
      });

      it("should replace the card with the cancelled notice and no keyboard", async () => {
        await cards.tap(payload("cancel", null), ACTOR_ID);

        expect(telegram.lastEdit().text).toBe(copy.cancelledBody);
        expect(telegram.lastEdit().markup).toBeUndefined();
      });

      it("should tell the tapper it was cancelled", async () => {
        expect(await cards.tap(payload("cancel", null), ACTOR_ID)).toBe(copy.cancelledNotice);
      });
    });

    describe("confirmed", () => {
      beforeEach(() => {
        applySpy.mockReturnValue({ outcome: "confirmed" });
        remainingSlotsSpy.mockReturnValue([ROMA]);
      });

      it("should freeze the game with the finalists and the next version", async () => {
        await cards.tap(payload("confirm", null), ACTOR_ID);

        expect(repo.confirmGameSpy).toHaveBeenCalledWith(
          GAME_ID,
          [{ playerId: playerIdOf(ROMA), position: ONCE }],
          ACTOR_ID,
          NEXT_VERSION
        );
      });

      it("should give every remaining player the same last position", async () => {
        remainingSlotsSpy.mockReturnValue([ANYA, ROMA]);
        seatAtSpy
          .mockReturnValueOnce({ playerId: playerIdOf(ANYA), displayName: "Anya" })
          .mockReturnValueOnce({ playerId: playerIdOf(ROMA), displayName: "Roma" });

        await cards.tap(payload("confirm", null), ACTOR_ID);

        expect(repo.confirmGameSpy.mock.calls[0]?.[1]).toEqual([
          { playerId: playerIdOf(ANYA), position: ONCE },
          { playerId: playerIdOf(ROMA), position: ONCE },
        ]);
      });

      it("should skip a remaining slot that has no seat", async () => {
        seatAtSpy.mockReturnValue(undefined);

        await cards.tap(payload("confirm", null), ACTOR_ID);

        expect(repo.confirmGameSpy.mock.calls[0]?.[1]).toEqual([]);
      });

      it("should show the standings, which the live card never did", async () => {
        await cards.tap(payload("confirm", null), ACTOR_ID);

        expect(telegram.lastEdit().text).toBe(RESULT_TEXT);
      });

      it("should take the keyboard away for good", async () => {
        await cards.tap(payload("confirm", null), ACTOR_ID);

        expect(telegram.lastEdit().markup).toBeUndefined();
      });

      it("should tell the tapper it was confirmed", async () => {
        expect(await cards.tap(payload("confirm", null), ACTOR_ID)).toBe(copy.confirmedNotice);
      });
    });

    describe("updated", () => {
      it("should record a new exit against the player who left", async () => {
        applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ exits: [ROMA] }) });

        await cards.tap(payload("pick", ROMA), ACTOR_ID);

        expect(repo.appendExitSpy).toHaveBeenCalledWith(
          GAME_ID,
          playerIdOf(ROMA),
          ONCE,
          ACTOR_ID
        );
      });

      it("should not record an exit whose slot has no seat", async () => {
        applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ exits: [ROMA] }) });
        seatAtSpy.mockReturnValue(undefined);

        await cards.tap(payload("pick", ROMA), ACTOR_ID);

        expect(repo.appendExitSpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should drop the last exit when the reducer took one back", async () => {
        repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE, { id: GAME_ID }, [ROMA]));
        applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ exits: [] }) });

        await cards.tap(payload("back", null), ACTOR_ID);

        expect(repo.dropLastExitSpy).toHaveBeenCalledWith(GAME_ID);
      });

      it("should store the phase and starter the reducer derived", async () => {
        phaseOfSpy.mockReturnValue("READY");
        starterPlayerIdSpy.mockReturnValue(playerIdOf(ANYA));

        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(repo.updateCardSpy).toHaveBeenCalledWith(
          GAME_ID,
          "READY",
          NEXT_VERSION,
          playerIdOf(ANYA)
        );
      });

      it("should schedule the edit rather than send it at once", async () => {
        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(debounce.debouncer.scheduleSpy).toHaveBeenCalledTimes(ONCE);
        expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should schedule the edit under the card's own key", async () => {
        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(debounce.debouncer.scheduleSpy.mock.calls[0]?.[0]).toBe(String(GAME_ID));
      });

      it("should redraw the keyboard at the version the tap produced", async () => {
        await cards.tap(payload("pick", OLEG), ACTOR_ID);

        expect(renderKeyboardSpy).toHaveBeenCalledWith(
          expect.anything(),
          GAME_ID,
          NEXT_VERSION
        );
      });
    });

    describe("what the tapper is told", () => {
      it("should name the starter when one was just picked", async () => {
        repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE, { id: GAME_ID }));
        applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ starterSlot: OLEG }) });
        nameAtSpy.mockReturnValue("Oleg");

        expect(await cards.tap(payload("pick", OLEG), ACTOR_ID)).toBe(copy.tapStarter("Oleg"));
      });

      it("should name the player and their place when an exit was recorded", async () => {
        applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ exits: [ROMA] }) });
        nameAtSpy.mockReturnValue("Roma");

        expect(await cards.tap(payload("pick", ROMA), ACTOR_ID)).toBe(
          copy.tapRecorded("Roma", ONCE)
        );
      });

      it("should announce a draw when the reducer accepted one", async () => {
        applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ drawAccepted: true }) });

        expect(await cards.tap(payload("draw", null), ACTOR_ID)).toBe(copy.tapDraw);
      });

      it("should fall back to the Back notice when nothing else changed", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { id: GAME_ID, starter_player_id: playerIdOf(OLEG) }, [ROMA])
        );
        applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ exits: [] }) });

        expect(await cards.tap(payload("back", null), ACTOR_ID)).toBe(copy.tapBack);
      });
    });
  });

  describe("redrawLive()", () => {
    const liveCards = (over: Record<string, unknown> = {}) => [
      cardRecordOf(THREE, {
        id: GAME_ID,
        chat_id: CHAT_ID,
        message_id: MESSAGE_ID,
        state_version: STORED_VERSION,
        ...over,
      }),
    ];

    it("should report that there was nothing to pick up", async () => {
      repo.liveCardsSpy.mockReturnValue([]);

      expect(await cards.redrawLive()).toBe(NEVER);
    });

    it("should report how many cards it put back on screen", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards());

      expect(await cards.redrawLive()).toBe(ONCE);
    });

    it("should redraw the card from what the database holds", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards());

      await cards.redrawLive();

      expect(telegram.lastEdit().text).toBe(CARD_TEXT);
    });

    it("should give the card working buttons, carrying the stored version", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards());

      await cards.redrawLive();

      expect(renderKeyboardSpy).toHaveBeenCalledWith(expect.anything(), GAME_ID, STORED_VERSION);
    });

    it("should send the redraw itself rather than wait for the debouncer", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards());

      await cards.redrawLive();

      expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(ONCE);
    });

    it("should delete a card whose message never made it to the chat", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards({ message_id: 0 }));

      await cards.redrawLive();

      expect(repo.discardGameSpy).toHaveBeenCalledWith(GAME_ID);
    });

    it("should not try to edit a message that was never sent", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards({ message_id: 0 }));

      await cards.redrawLive();

      expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should not count a card it deleted as one it redrew", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards({ message_id: 0 }));

      expect(await cards.redrawLive()).toBe(NEVER);
    });

    it("should keep a card that was posted", async () => {
      repo.liveCardsSpy.mockReturnValue(liveCards());

      await cards.redrawLive();

      expect(repo.discardGameSpy).not.toHaveBeenCalled();
    });
  });

  describe("sweepIdle()", () => {
    const idle = [{ id: GAME_ID, chat_id: CHAT_ID, message_id: MESSAGE_ID }];

    it("should ask the repository which cards went quiet", async () => {
      repo.idleCardsSpy.mockReturnValue([]);

      await cards.sweepIdle(IDLE_SECONDS);

      expect(repo.idleCardsSpy).toHaveBeenCalledWith(IDLE_SECONDS);
    });

    it("should report how many it abandoned", async () => {
      repo.idleCardsSpy.mockReturnValue(idle);

      expect(await cards.sweepIdle(IDLE_SECONDS)).toBe(ONCE);
    });

    it("should delete the row, since an abandoned game is never stored", async () => {
      repo.idleCardsSpy.mockReturnValue(idle);

      await cards.sweepIdle(IDLE_SECONDS);

      expect(repo.discardGameSpy).toHaveBeenCalledWith(GAME_ID);
    });

    it("should drop any edit still pending for it", async () => {
      repo.idleCardsSpy.mockReturnValue(idle);

      await cards.sweepIdle(IDLE_SECONDS);

      expect(debounce.debouncer.cancelSpy).toHaveBeenCalledWith(String(GAME_ID));
    });

    it("should replace the card with the abandoned notice and no keyboard", async () => {
      repo.idleCardsSpy.mockReturnValue(idle);

      await cards.sweepIdle(IDLE_SECONDS);

      expect(telegram.lastEdit().text).toBe(copy.abandonedBody);
      expect(telegram.lastEdit().markup).toBeUndefined();
    });

    it("should do nothing when every card is fresh", async () => {
      repo.idleCardsSpy.mockReturnValue([]);

      await cards.sweepIdle(IDLE_SECONDS);

      expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("shutdown()", () => {
    it("should flush every pending edit so nothing is lost on exit", async () => {
      await cards.shutdown();

      expect(debounce.debouncer.flushAllSpy).toHaveBeenCalledTimes(ONCE);
    });
  });

  describe("rebuilding the state from stored rows", () => {
    const cardWith = (over: Record<string, unknown>, exits: readonly number[] = []) => {
      const record = cardRecordOf(THREE, { id: GAME_ID, ...over }, exits);

      repo.cardByIdSpy.mockReturnValue(record);

      return record;
    };

    const stateHandedToReducer = () => applySpy.mock.calls[0]?.[0];

    beforeEach(() => {
      applySpy.mockReturnValue({ outcome: "rejected" });
    });

    it("should leave the starter unset when no player dealt yet", async () => {
      cardWith({ starter_player_id: null });

      await cards.tap(payload("back", null), ACTOR_ID);

      expect(stateHandedToReducer()).toMatchObject({ starterSlot: null });
    });

    it("should leave the starter unset when the stored id sits at no seat", async () => {
      cardWith({ starter_player_id: playerIdOf(THREE.length) });

      await cards.tap(payload("back", null), ACTOR_ID);

      expect(stateHandedToReducer()).toMatchObject({ starterSlot: null });
    });

    it("should ignore an exit belonging to nobody at this table", async () => {
      const record = cardWith({ starter_player_id: playerIdOf(OLEG) }, [ROMA]);
      repo.cardByIdSpy.mockReturnValue({
        ...record,
        exits: [{ player_id: playerIdOf(THREE.length), position: ONCE }],
      });

      await cards.tap(payload("back", null), ACTOR_ID);

      expect(stateHandedToReducer()).toMatchObject({ exits: [] });
    });
  });

  describe("what reaches Telegram", () => {
    it("should send the keyboard as inline buttons, not as the rows it was given", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE), null);

      expect(toMarkupSpy).toHaveBeenCalledWith(KEYBOARD);
      expect(telegram.lastSend().markup).toBe(MARKUP);
    });

    it("should send a new card as HTML", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE), null);

      expect(telegram.sendMessageSpy.mock.calls[0]?.[2]?.parse_mode).toBe("HTML");
    });

    it("should carry the keyboard through a scheduled edit", async () => {
      await runScheduledEdit({
        chatId: CHAT_ID,
        messageId: MESSAGE_ID,
        text: CARD_TEXT,
        keyboard: KEYBOARD,
      });

      expect(toMarkupSpy).toHaveBeenCalledWith(KEYBOARD);
      expect(telegram.lastEdit().markup).toBe(MARKUP);
    });

    it("should name the message and the cause when an edit is refused", async () => {
      telegram.editMessageTextSpy.mockRejectedValue(new Error(EDIT_REFUSED));

      await runScheduledEdit({
        chatId: CHAT_ID,
        messageId: MESSAGE_ID,
        text: CARD_TEXT,
        keyboard: null,
      });

      expect(log.warnSpy.mock.calls[0]?.[0]).toContain(String(MESSAGE_ID));
      expect(log.warnSpy.mock.calls[0]?.[0]).toContain(EDIT_REFUSED);
    });
  });

  describe("the notice a tap earns", () => {
    it("should name the player of the LAST exit, not the first", async () => {
      repo.cardByIdSpy.mockReturnValue(
        cardRecordOf(THREE, { id: GAME_ID, starter_player_id: playerIdOf(OLEG) }, [ANYA])
      );
      applySpy.mockReturnValue({ outcome: "updated", state: stateAfter({ exits: [ANYA, ROMA] }) });

      await cards.tap(payload("pick", ROMA), ACTOR_ID);

      expect(nameAtSpy).toHaveBeenCalledWith(expect.anything(), ROMA);
    });

    it("should not claim a starter was picked when there still is none", async () => {
      repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE, { id: GAME_ID, starter_player_id: null }));
      applySpy.mockReturnValue({
        outcome: "updated",
        state: stateAfter({ starterSlot: null, exits: [] }),
      });

      expect(await cards.tap(payload("back", null), ACTOR_ID)).toBe(copy.tapBack);
    });
  });
});
