import type { Api } from "grammy";
import { createDebouncer, type Debouncer } from "../../shared/debounce.ts";
import type { Logger } from "../../shared/logger.ts";
import type { CardRecord, Finalist, Repository } from "../../shared/repository/types.ts";
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
import { renderCard, renderResult } from "../render/card.ts";
import { renderKeyboard, type InlineKeyboardRows } from "../render/keyboard.ts";
import { strings } from "../render/strings.ts";


const EDIT_DEBOUNCE_MS = 350;

const FIRST_VERSION = 0;

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

interface CardContext {
  readonly repo: Repository;
  readonly api: Api;
  readonly edits: Debouncer<EditRequest>;
  readonly sendEdit: (request: EditRequest) => Promise<void>;
}

interface Tap {
  readonly card: CardRecord;
  readonly before: CardState;
  readonly actorTgId: number;
  readonly version: number;
  readonly gameNumber: number;
}

type CardLookup =
  | { readonly ok: true; readonly card: CardRecord }
  | { readonly ok: false; readonly notice: string };

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

const findTappableCard = (repo: Repository, payload: CallbackPayload): CardLookup => {
  const card = repo.cardById(payload.gameId);

  if (card === null || card.game.confirmed_at !== null) {
    return { ok: false, notice: strings.cardGone };
  }

  if (card.game.state_version !== payload.version) {
    return { ok: false, notice: strings.cardStale };
  }

  return { ok: true, card };
};

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

const finalistsOf = (before: CardState): readonly Finalist[] => {
  const lastPosition = before.exits.length + 1;

  return remainingSlots(before).flatMap((slot) => {
    const playerId = seatAt(before, slot)?.playerId;

    return playerId === undefined ? [] : [{ playerId, position: lastPosition }];
  });
};

const editOf = (card: CardRecord, text: string, keyboard: InlineKeyboardRows | null): EditRequest => ({
  chatId: card.game.chat_id,
  messageId: card.game.message_id,
  text,
  keyboard,
});

const createEditSender =
  (api: Api, log: Logger) =>
  async (request: EditRequest): Promise<void> => {
    try {
      await api.editMessageText(request.chatId, request.messageId, request.text, {
        parse_mode: "HTML",
        reply_markup: request.keyboard === null ? undefined : toMarkup(request.keyboard),
      });
    } catch (error) {
      log.warn(`could not edit message ${request.messageId}: ${String(error)}`);
    }
  };

const openCard = async (
  context: CardContext,
  chatId: number,
  seats: readonly Seat[]
): Promise<void> => {
  const { repo, api } = context;
  const gameId = repo.openGame(
    chatId,
    seats.map((seat) => seat.playerId)
  );

  const state: CardState = { seats, starterSlot: null, exits: [], drawAccepted: false };

  try {
    const message = await api.sendMessage(chatId, renderCard(state, repo.gameNumberInSeries(chatId)), {
      parse_mode: "HTML",
      reply_markup: toMarkup(renderKeyboard(state, gameId, FIRST_VERSION)),
    });

    repo.attachMessage(gameId, message.message_id);
  } catch (error) {
    repo.deleteGame(gameId);
    throw error;
  }
};

const cancelCard = async (context: CardContext, tap: Tap): Promise<string> => {
  context.edits.cancel(String(tap.card.game.id));
  context.repo.deleteGame(tap.card.game.id);
  await context.sendEdit(editOf(tap.card, strings.cancelledBody, null));

  return strings.cancelledNotice;
};

const confirmCard = async (context: CardContext, tap: Tap): Promise<string> => {
  context.repo.confirmGame(tap.card.game.id, finalistsOf(tap.before), tap.actorTgId, tap.version);
  context.edits.cancel(String(tap.card.game.id));
  await context.sendEdit(editOf(tap.card, renderResult(tap.before, tap.gameNumber), null));

  return strings.confirmedNotice;
};

const persist = (context: CardContext, tap: Tap, after: CardState): void => {
  const { repo } = context;
  const gameId = tap.card.game.id;

  if (after.exits.length > tap.before.exits.length) {
    const slot = after.exits[after.exits.length - 1];
    const playerId = slot === undefined ? undefined : seatAt(after, slot)?.playerId;

    if (playerId !== undefined) {
      repo.appendExit(gameId, playerId, after.exits.length, tap.actorTgId);
    }
  } else if (after.exits.length < tap.before.exits.length) {
    repo.dropLastExit(gameId);
  }

  repo.updateCard(gameId, phaseOf(after), tap.version, starterPlayerId(after));
};

const advanceCard = (context: CardContext, tap: Tap, after: CardState): string => {
  persist(context, tap, after);

  context.edits.schedule(
    String(tap.card.game.id),
    editOf(
      tap.card,
      renderCard(after, tap.gameNumber),
      renderKeyboard(after, tap.card.game.id, tap.version)
    )
  );

  return noticeFor(tap.before, after);
};

const tapCard = async (
  context: CardContext,
  payload: CallbackPayload,
  actorTgId: number
): Promise<string> => {
  const lookup = findTappableCard(context.repo, payload);
  if (!lookup.ok) {
    return lookup.notice;
  }

  const before = toCardState(lookup.card);
  const transition = apply(before, toAction(payload));

  const tap: Tap = {
    card: lookup.card,
    before,
    actorTgId,
    version: lookup.card.game.state_version + 1,
    gameNumber: context.repo.gameNumberInSeries(lookup.card.game.chat_id),
  };

  switch (transition.outcome) {
    case "rejected":
      return strings.tapNotAllowed;

    case "cancelled":
      return cancelCard(context, tap);

    case "confirmed":
      return confirmCard(context, tap);

    case "updated":
      return advanceCard(context, tap, transition.state);
  }
};

const sweepIdleCards = async (context: CardContext, idleSeconds: number): Promise<number> => {
  const stale = context.repo.idleCards(idleSeconds);

  for (const game of stale) {
    context.edits.cancel(String(game.id));
    context.repo.deleteGame(game.id);
    await context.sendEdit({
      chatId: game.chat_id,
      messageId: game.message_id,
      text: strings.abandonedBody,
      keyboard: null,
    });
  }

  return stale.length;
};

export function createCardService(deps: CardServiceDeps): CardService {
  const sendEdit = createEditSender(deps.api, deps.log);
  const edits = createDebouncer<EditRequest>(EDIT_DEBOUNCE_MS, sendEdit);
  const context: CardContext = { repo: deps.repo, api: deps.api, edits, sendEdit };

  return {
    open: (chatId, seats) => openCard(context, chatId, seats),
    tap: (payload, actorTgId) => tapCard(context, payload, actorTgId),
    sweepIdle: (idleSeconds) => sweepIdleCards(context, idleSeconds),
    shutdown: () => edits.flushAll(),
  };
}
