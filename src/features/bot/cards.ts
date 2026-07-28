import type { Api } from "grammy";
import { createDebouncer } from "../../shared/debounce.ts";
import type { Logger } from "../../shared/logger.ts";
import type { CardRecord, Repository } from "../../shared/repository/types.ts";
import type { CallbackPayload } from "../../integrations/telegram/callback.ts";
import {
  apply,
  nameAt,
  phaseOf,
  remainingSlots,
  seatAt,
  starterPlayerId,
  type Action,
  type CardState,
  type Seat,
} from "../game/state.ts";
import { renderCard } from "../render/card.ts";
import { renderKeyboard, type InlineKeyboardRows } from "../render/keyboard.ts";
import { strings } from "../render/strings.ts";


const EDIT_DEBOUNCE_MS = 350;

export interface CardServiceDeps {
  readonly repo: Repository;
  readonly api: Api;
  readonly log: Logger;
}

export interface CardService {
  open(chatId: number, seats: readonly Seat[]): Promise<void>;
  tap(payload: CallbackPayload, actorTgId: number): Promise<string>;
  sweepIdle(idleSeconds: number): Promise<number>;
  shutdown(): Promise<void>;
}

interface EditRequest {
  readonly chatId: number;
  readonly messageId: number;
  readonly text: string;
  readonly keyboard: InlineKeyboardRows | null;
}

const toMarkup = (rows: InlineKeyboardRows) => ({
  inline_keyboard: rows.map((row) => row.map((button) => ({ ...button }))),
});

const toCardState = (card: CardRecord): CardState => {
  const seats = card.seats.map((seat) => ({
    playerId: seat.player_id,
    displayName: seat.display_name,
  }));

  const slotOf = new Map(card.seats.map((seat, slot) => [seat.player_id, slot]));

  const exits = card.exits.flatMap((exit) => {
    const slot = slotOf.get(exit.player_id);

    return slot === undefined ? [] : [slot];
  });

  const starterSlot =
    card.game.starter_player_id === null
      ? null
      : (slotOf.get(card.game.starter_player_id) ?? null);

  return {
    seats,
    starterSlot,
    exits,
    drawAccepted: card.game.state === "READY" && seats.length - exits.length > 1,
  };
};

const toAction = (payload: CallbackPayload): Action =>
  payload.action === "pick" ? { kind: "pick", slot: payload.slot ?? -1 } : { kind: payload.action };

const noticeFor = (before: CardState, after: CardState): string => {
  if (before.starterSlot === null && after.starterSlot !== null) {
    return strings.tapStarter(nameAt(after, after.starterSlot));
  }

  if (after.exits.length > before.exits.length) {
    const slot = after.exits[after.exits.length - 1] ?? 0;

    return strings.tapRecorded(nameAt(after, slot), after.exits.length);
  }

  if (!before.drawAccepted && after.drawAccepted) {
    return strings.tapDraw;
  }

  return strings.tapBack;
};

export function createCardService(deps: CardServiceDeps): CardService {
  const { repo, api, log } = deps;

  const sendEdit = async (request: EditRequest): Promise<void> => {
    try {
      await api.editMessageText(request.chatId, request.messageId, request.text, {
        reply_markup: request.keyboard === null ? undefined : toMarkup(request.keyboard),
      });
    } catch (error) {
      log.warn(`could not edit message ${request.messageId}: ${String(error)}`);
    }
  };

  const edits = createDebouncer<EditRequest>(EDIT_DEBOUNCE_MS, sendEdit);

  const persist = (
    gameId: number,
    before: CardState,
    after: CardState,
    actorTgId: number,
    version: number
  ): void => {
    if (after.exits.length > before.exits.length) {
      const slot = after.exits[after.exits.length - 1];
      const playerId = slot === undefined ? undefined : seatAt(after, slot)?.playerId;

      if (playerId !== undefined) {
        repo.appendExit(gameId, playerId, after.exits.length, actorTgId);
      }
    } else if (after.exits.length < before.exits.length) {
      repo.dropLastExit(gameId);
    }

    repo.updateCard(gameId, phaseOf(after), version, starterPlayerId(after));
  };

  return {
    async open(chatId, seats) {
      const gameId = repo.openGame(
        chatId,
        seats.map((seat) => seat.playerId)
      );

      const state: CardState = { seats, starterSlot: null, exits: [], drawAccepted: false };

      try {
        const message = await api.sendMessage(
          chatId,
          renderCard(state, repo.gameNumberInSeries(chatId)),
          { reply_markup: toMarkup(renderKeyboard(state, gameId, 0)) }
        );

        repo.attachMessage(gameId, message.message_id);
      } catch (error) {
        repo.deleteGame(gameId);
        throw error;
      }
    },

    async tap(payload, actorTgId) {
      const card = repo.cardById(payload.gameId);
      if (card === null || card.game.confirmed_at !== null) {
        return strings.cardGone;
      }

      if (card.game.state_version !== payload.version) {
        return strings.cardStale;
      }

      const before = toCardState(card);
      const transition = apply(before, toAction(payload));

      if (transition.outcome === "rejected") {
        return strings.tapNotAllowed;
      }

      const key = String(card.game.id);
      const version = card.game.state_version + 1;
      const gameNumber = repo.gameNumberInSeries(card.game.chat_id);

      if (transition.outcome === "cancelled") {
        edits.cancel(key);
        repo.deleteGame(card.game.id);
        await sendEdit({
          chatId: card.game.chat_id,
          messageId: card.game.message_id,
          text: strings.cancelledBody,
          keyboard: null,
        });

        return strings.cancelledNotice;
      }

      if (transition.outcome === "confirmed") {
        const lastPosition = before.exits.length + 1;
        const finalists = remainingSlots(before).flatMap((slot) => {
          const playerId = seatAt(before, slot)?.playerId;

          return playerId === undefined ? [] : [{ playerId, position: lastPosition }];
        });

        repo.confirmGame(card.game.id, finalists, actorTgId, version);
        edits.cancel(key);
        await sendEdit({
          chatId: card.game.chat_id,
          messageId: card.game.message_id,
          text: renderCard(before, gameNumber),
          keyboard: null,
        });

        return strings.confirmedNotice;
      }

      persist(card.game.id, before, transition.state, actorTgId, version);
      edits.schedule(key, {
        chatId: card.game.chat_id,
        messageId: card.game.message_id,
        text: renderCard(transition.state, gameNumber),
        keyboard: renderKeyboard(transition.state, card.game.id, version),
      });

      return noticeFor(before, transition.state);
    },

    async sweepIdle(idleSeconds) {
      const stale = repo.idleCards(idleSeconds);

      for (const game of stale) {
        edits.cancel(String(game.id));
        repo.deleteGame(game.id);
        await sendEdit({
          chatId: game.chat_id,
          messageId: game.message_id,
          text: strings.abandonedBody,
          keyboard: null,
        });
      }

      return stale.length;
    },

    async shutdown() {
      await edits.flushAll();
    },
  };
}
