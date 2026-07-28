import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cardRecordOf, playerIdOf, seatsOf } from "../../testing/factories.ts";
import { RepositoryStub } from "../../testing/repository.stub.ts";
import { LoggerStub, TelegramApiStub } from "../../testing/telegram.stub.ts";
import type { CallbackAction, CallbackPayload } from "../../integrations/telegram/callback.ts";
import { createCardService, type CardService } from "./cards.ts";


const THREE = ["Oleg", "Anya", "Roma"];

const OLEG = 0;

const ANYA = 1;

const ROMA = 2;

const GAME_ID = 1;

const CHAT_ID = -100777;

const MESSAGE_ID = 500;

const ACTOR_ID = 777;

const IDLE_SECONDS = 10_800;

const EDIT_DEBOUNCE_MS = 350;

const ONCE = 1;

const NEVER = 0;

describe("createCardService()", () => {
  let repo: RepositoryStub;
  let telegram: TelegramApiStub;
  let log: LoggerStub;
  let cards: CardService;

  const payload = (
    action: CallbackAction,
    slot: number | null,
    version = 0
  ): CallbackPayload => ({ gameId: GAME_ID, action, slot, version });

  beforeEach(() => {
    vi.useFakeTimers();
    repo = new RepositoryStub();
    telegram = new TelegramApiStub();
    log = new LoggerStub();
    cards = createCardService({ repo, api: telegram.api, log });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("open()", () => {
    it("should open a game with the seated player ids", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE));

      expect(repo.openGameSpy).toHaveBeenCalledWith(CHAT_ID, [
        playerIdOf(OLEG),
        playerIdOf(ANYA),
        playerIdOf(ROMA),
      ]);
    });

    it("should send the card as HTML", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE));

      expect(telegram.sendMessageSpy.mock.calls[0]?.[2]?.parse_mode).toBe("HTML");
    });

    it("should attach the message id so the card survives a restart", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE));

      expect(repo.attachMessageSpy).toHaveBeenCalledWith(GAME_ID, MESSAGE_ID);
    });

    it("should ask the repository which game number this is", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE));

      expect(repo.gameNumberInSeriesSpy).toHaveBeenCalledWith(CHAT_ID);
    });

    it("should send a keyboard with a row per player plus the controls", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE));
      const markup = telegram.sendMessageSpy.mock.calls[0]?.[2]?.reply_markup;

      expect(markup.inline_keyboard).toHaveLength(THREE.length + 1);
    });

    it("should give every button a caption and callback data", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE));
      const markup = telegram.sendMessageSpy.mock.calls[0]?.[2]?.reply_markup;
      const buttons = markup.inline_keyboard.flat();

      expect(
        buttons.every(
          (button: { text?: string; callback_data?: string }) =>
            typeof button.text === "string" &&
            button.text.length > 0 &&
            typeof button.callback_data === "string" &&
            button.callback_data.length > 0
        )
      ).toBe(true);
    });

    it("should put the player names on the buttons", async () => {
      await cards.open(CHAT_ID, seatsOf(...THREE));
      const markup = telegram.sendMessageSpy.mock.calls[0]?.[2]?.reply_markup;
      const captions = markup.inline_keyboard.flat().map((b: { text: string }) => b.text);

      expect(captions).toContain("Oleg");
    });

    it("should delete the row when Telegram refuses the message", async () => {
      telegram.sendMessageSpy.mockRejectedValue(new Error("bad request"));

      await expect(cards.open(CHAT_ID, seatsOf(...THREE))).rejects.toThrow("bad request");
      expect(repo.deleteGameSpy).toHaveBeenCalledWith(GAME_ID);
    });

    it("should not leave a message attached when sending failed", async () => {
      telegram.sendMessageSpy.mockRejectedValue(new Error("bad request"));

      await expect(cards.open(CHAT_ID, seatsOf(...THREE))).rejects.toThrow();
      expect(repo.attachMessageSpy).toHaveBeenCalledTimes(NEVER);
    });
  });

  describe("tap()", () => {
    it("should report a missing card as gone", async () => {
      repo.cardByIdSpy.mockReturnValue(null);

      expect(await cards.tap(payload("pick", OLEG), ACTOR_ID)).toBe("This game is already over");
    });

    it("should report a confirmed card as gone", async () => {
      repo.cardByIdSpy.mockReturnValue(
        cardRecordOf(THREE, { confirmed_at: "2026-07-29 21:00:00" })
      );

      expect(await cards.tap(payload("pick", OLEG), ACTOR_ID)).toBe("This game is already over");
    });

    it("should reject a stale version without touching the card", async () => {
      repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE, { state_version: 4 }));

      const notice = await cards.tap(payload("pick", OLEG, 1), ACTOR_ID);

      expect(notice).toBe("Card updated — look again");
      expect(repo.updateCardSpy).toHaveBeenCalledTimes(NEVER);
    });

    it("should refuse an illegal action", async () => {
      repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE));

      expect(await cards.tap(payload("confirm", null), ACTOR_ID)).toBe("Not available right now");
    });

    describe("picking a starter", () => {
      beforeEach(() => {
        repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE));
      });

      it("should announce who dealt", async () => {
        expect(await cards.tap(payload("pick", ANYA), ACTOR_ID)).toBe("Anya dealt first");
      });

      it("should bump the version by one", async () => {
        await cards.tap(payload("pick", ANYA), ACTOR_ID);

        expect(repo.updateCardSpy).toHaveBeenCalledWith(
          GAME_ID,
          "RECORDING",
          1,
          playerIdOf(ANYA)
        );
      });

      it("should not record an exit", async () => {
        await cards.tap(payload("pick", ANYA), ACTOR_ID);

        expect(repo.appendExitSpy).toHaveBeenCalledTimes(NEVER);
      });
    });

    describe("recording an exit", () => {
      beforeEach(() => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, {
            state: "RECORDING",
            starter_player_id: playerIdOf(OLEG),
            state_version: 1,
          })
        );
      });

      it("should announce the name and position", async () => {
        expect(await cards.tap(payload("pick", ROMA, 1), ACTOR_ID)).toBe("Roma — 1");
      });

      it("should store the exit with the tapping actor", async () => {
        await cards.tap(payload("pick", ROMA, 1), ACTOR_ID);

        expect(repo.appendExitSpy).toHaveBeenCalledWith(GAME_ID, playerIdOf(ROMA), 1, ACTOR_ID);
      });

      it("should not edit the message before the debounce elapses", async () => {
        await cards.tap(payload("pick", ROMA, 1), ACTOR_ID);

        expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should edit the message once the debounce elapses", async () => {
        await cards.tap(payload("pick", ROMA, 1), ACTOR_ID);
        await vi.advanceTimersByTimeAsync(EDIT_DEBOUNCE_MS);

        expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(ONCE);
      });
    });

    describe("stepping back", () => {
      it("should drop the last exit", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(
            THREE,
            { state: "RECORDING", starter_player_id: playerIdOf(OLEG), state_version: 2 },
            [ROMA]
          )
        );

        const notice = await cards.tap(payload("back", null, 2), ACTOR_ID);

        expect(notice).toBe("Undone");
        expect(repo.dropLastExitSpy).toHaveBeenCalledWith(GAME_ID);
      });

      it("should clear the starter when no exits are left", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, {
            state: "RECORDING",
            starter_player_id: playerIdOf(OLEG),
            state_version: 1,
          })
        );

        await cards.tap(payload("back", null, 1), ACTOR_ID);

        expect(repo.updateCardSpy).toHaveBeenCalledWith(GAME_ID, "PICK_STARTER", 2, null);
      });
    });

    describe("rebuilding a card from the database", () => {
      it("should read a READY card with two left as an accepted draw", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(
            THREE,
            { state: "READY", starter_player_id: playerIdOf(OLEG), state_version: 3 },
            [ROMA]
          )
        );

        await cards.tap(payload("back", null, 3), ACTOR_ID);

        expect(repo.dropLastExitSpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should step a rebuilt draw back to recording without losing the exit", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(
            THREE,
            { state: "READY", starter_player_id: playerIdOf(OLEG), state_version: 3 },
            [ROMA]
          )
        );

        await cards.tap(payload("back", null, 3), ACTOR_ID);

        expect(repo.updateCardSpy).toHaveBeenCalledWith(
          GAME_ID,
          "RECORDING",
          4,
          playerIdOf(OLEG)
        );
      });

      it("should read a READY card with one left as an automatic fool", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(
            THREE,
            { state: "READY", starter_player_id: playerIdOf(OLEG), state_version: 3 },
            [ROMA, OLEG]
          )
        );

        await cards.tap(payload("back", null, 3), ACTOR_ID);

        expect(repo.dropLastExitSpy).toHaveBeenCalledTimes(ONCE);
      });

      it("should treat a starter who is not at the table as no starter", async () => {
        const strangerId = 9999;
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(THREE, { state: "RECORDING", starter_player_id: strangerId })
        );

        expect(await cards.tap(payload("back", null), ACTOR_ID)).toBe("Not available right now");
      });

      it("should ignore an event for a player who is not at the table", async () => {
        const card = cardRecordOf(THREE, {
          state: "RECORDING",
          starter_player_id: playerIdOf(OLEG),
          state_version: 1,
        });
        repo.cardByIdSpy.mockReturnValue({
          ...card,
          exits: [{ player_id: 9999, position: 1 }],
        });

        await cards.tap(payload("pick", ROMA, 1), ACTOR_ID);

        expect(repo.appendExitSpy).toHaveBeenCalledWith(GAME_ID, playerIdOf(ROMA), 1, ACTOR_ID);
      });
    });

    describe("accepting a draw", () => {
      it("should mark the card ready", async () => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(
            THREE,
            { state: "RECORDING", starter_player_id: playerIdOf(OLEG), state_version: 2 },
            [ROMA]
          )
        );

        const notice = await cards.tap(payload("draw", null, 2), ACTOR_ID);

        expect(notice).toBe("Draw");
        expect(repo.updateCardSpy).toHaveBeenCalledWith(
          GAME_ID,
          "READY",
          3,
          playerIdOf(OLEG)
        );
      });
    });

    describe("confirming", () => {
      beforeEach(() => {
        repo.cardByIdSpy.mockReturnValue(
          cardRecordOf(
            THREE,
            { state: "READY", starter_player_id: playerIdOf(OLEG), state_version: 3 },
            [ROMA, OLEG]
          )
        );
      });

      it("should acknowledge the tap", async () => {
        expect(await cards.tap(payload("confirm", null, 3), ACTOR_ID)).toBe("Recorded");
      });

      it("should write the remaining player as the last place", async () => {
        await cards.tap(payload("confirm", null, 3), ACTOR_ID);

        expect(repo.confirmGameSpy).toHaveBeenCalledWith(
          GAME_ID,
          [{ playerId: playerIdOf(ANYA), position: 3 }],
          ACTOR_ID,
          4
        );
      });

      it("should strip the keyboard immediately, without waiting for the debounce", async () => {
        await cards.tap(payload("confirm", null, 3), ACTOR_ID);

        expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(ONCE);
        expect(telegram.lastEdit().markup).toBeUndefined();
      });

      it("should leave the standings in the message", async () => {
        await cards.tap(payload("confirm", null, 3), ACTOR_ID);

        expect(telegram.lastEdit().text).toContain("fool");
      });
    });

    describe("cancelling", () => {
      beforeEach(() => {
        repo.cardByIdSpy.mockReturnValue(cardRecordOf(THREE));
      });

      it("should acknowledge the tap", async () => {
        expect(await cards.tap(payload("cancel", null), ACTOR_ID)).toBe("Cancelled");
      });

      it("should delete the game rather than record it", async () => {
        await cards.tap(payload("cancel", null), ACTOR_ID);

        expect(repo.deleteGameSpy).toHaveBeenCalledWith(GAME_ID);
        expect(repo.confirmGameSpy).toHaveBeenCalledTimes(NEVER);
      });

      it("should replace the card with a cancelled note and no keyboard", async () => {
        await cards.tap(payload("cancel", null), ACTOR_ID);

        expect(telegram.lastEdit().text).toBe("Cancelled — nothing recorded.");
        expect(telegram.lastEdit().markup).toBeUndefined();
      });
    });
  });

  describe("sweepIdle()", () => {
    it("should report nothing when no card is idle", async () => {
      expect(await cards.sweepIdle(IDLE_SECONDS)).toBe(NEVER);
    });

    it("should delete an idle card", async () => {
      repo.idleCardsSpy.mockReturnValue([cardRecordOf(THREE).game]);

      await cards.sweepIdle(IDLE_SECONDS);

      expect(repo.deleteGameSpy).toHaveBeenCalledWith(GAME_ID);
    });

    it("should replace an abandoned card with a note and no keyboard", async () => {
      repo.idleCardsSpy.mockReturnValue([cardRecordOf(THREE).game]);

      await cards.sweepIdle(IDLE_SECONDS);

      expect(telegram.lastEdit().text).toContain("Abandoned");
      expect(telegram.lastEdit().markup).toBeUndefined();
    });

    it("should count what it swept", async () => {
      repo.idleCardsSpy.mockReturnValue([cardRecordOf(THREE).game]);

      expect(await cards.sweepIdle(IDLE_SECONDS)).toBe(ONCE);
    });
  });

  describe("failure handling", () => {
    it("should warn rather than throw when an edit fails", async () => {
      telegram.editMessageTextSpy.mockRejectedValue(new Error("message not found"));
      repo.idleCardsSpy.mockReturnValue([cardRecordOf(THREE).game]);

      await expect(cards.sweepIdle(IDLE_SECONDS)).resolves.toBe(ONCE);
      expect(log.warnSpy).toHaveBeenCalledTimes(ONCE);
    });
  });

  describe("shutdown()", () => {
    it("should flush a pending edit so the last tap is not lost", async () => {
      repo.cardByIdSpy.mockReturnValue(
        cardRecordOf(THREE, {
          state: "RECORDING",
          starter_player_id: playerIdOf(OLEG),
          state_version: 1,
        })
      );

      await cards.tap(payload("pick", ROMA, 1), ACTOR_ID);
      await cards.shutdown();

      expect(telegram.editMessageTextSpy).toHaveBeenCalledTimes(ONCE);
    });
  });
});
