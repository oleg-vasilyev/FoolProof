import type { Api } from "grammy";
import { createDebouncer, type Debouncer } from "#shared/timing/debounce.ts";
import type { Logger } from "#shared/logging/logger.ts";
import type { CardRecord, Finalist, CardRepository } from "#shared/repository/repository-contract.ts";
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
} from "#live-game/domain/card-state.ts";
import type { CallbackPayload } from "#live-game/render/callback-data-codec.ts";
import { renderCard, renderResult } from "#live-game/render/card-message.ts";
import { renderKeyboard, type InlineKeyboardRows } from "#live-game/render/inline-keyboard.ts";
import { copy } from "#live-game/copy.en.ts";


const EDIT_DEBOUNCE_MS = 350;

const FIRST_VERSION = 0;

const NO_SLOT = -1;

const NO_MESSAGE = 0;

const ALREADY_SHOWN = "message is not modified";

export interface CardServiceDeps {
  readonly repo: CardRepository;
  readonly api: Api;
  readonly log: Logger;
}

export interface CardService {
  open(chatId: number, seats: readonly Seat[]): Promise<void>;
  tap(payload: CallbackPayload, actorTgId: number): Promise<string>;
  redrawLive(): Promise<number>;
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
  readonly repo: CardRepository;
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
  | { readonly kind: "tappable"; readonly card: CardRecord }
  | { readonly kind: "gone" }
  | { readonly kind: "outrun"; readonly card: CardRecord };

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
  payload.action === "pick"
    ? { kind: "pick", slot: payload.slot ?? NO_SLOT }
    : { kind: payload.action };

const findTappableCard = (repo: CardRepository, payload: CallbackPayload): CardLookup => {
  const card = repo.cardById(payload.gameId);

  if (card === null || card.game.confirmed_at !== null) {
    return { kind: "gone" };
  }

  if (card.game.state_version !== payload.version) {
    return { kind: "outrun", card };
  }

  return { kind: "tappable", card };
};

const noticeFor = (before: CardState, after: CardState): string => {
  if (before.starterSlot === null && after.starterSlot !== null) {
    return copy.tapStarter(nameAt(after, after.starterSlot));
  }

  if (after.exits.length > before.exits.length) {
    const slot = after.exits[after.exits.length - 1] ?? 0;

    return copy.tapRecorded(nameAt(after, slot), after.exits.length);
  }

  if (!before.drawAccepted && after.drawAccepted) {
    return copy.tapDraw;
  }

  return copy.tapBack;
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

const redrawOf = (context: CardContext, card: CardRecord): EditRequest => {
  const state = toCardState(card);

  return editOf(
    card,
    renderCard(state, context.repo.gameNumberInSeries(card.game.chat_id)),
    renderKeyboard(state, card.game.id, card.game.state_version)
  );
};

const createEditSender =
  (api: Api, log: Logger) =>
  async (request: EditRequest): Promise<void> => {
    try {
      await api.editMessageText(request.chatId, request.messageId, request.text, {
        parse_mode: "HTML",
        reply_markup: request.keyboard === null ? undefined : toMarkup(request.keyboard),
      });
    } catch (error) {
      const reason = String(error);
      const line = `could not edit message ${request.messageId}: ${reason}`;

      if (reason.includes(ALREADY_SHOWN)) {
        log.debug(line);
      } else {
        log.warn(line);
      }
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
    repo.discardGame(gameId);
    throw error;
  }
};

const cancelCard = async (context: CardContext, tap: Tap): Promise<string> => {
  context.edits.cancel(String(tap.card.game.id));
  context.repo.discardGame(tap.card.game.id);
  await context.sendEdit(editOf(tap.card, copy.cancelledBody, null));

  return copy.cancelledNotice;
};

const confirmCard = async (context: CardContext, tap: Tap): Promise<string> => {
  context.repo.confirmGame(tap.card.game.id, finalistsOf(tap.before), tap.actorTgId, tap.version);
  context.edits.cancel(String(tap.card.game.id));
  await context.sendEdit(editOf(tap.card, renderResult(tap.before, tap.gameNumber), null));

  return copy.confirmedNotice;
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

const repairOutrunCard = (context: CardContext, card: CardRecord): string => {
  context.edits.schedule(String(card.game.id), redrawOf(context, card));

  return copy.cardStale;
};

const redrawLiveCards = async (context: CardContext): Promise<number> => {
  const cards = context.repo.liveCards();
  const unsent = cards.filter((card) => card.game.message_id === NO_MESSAGE);
  const posted = cards.filter((card) => card.game.message_id !== NO_MESSAGE);

  for (const card of unsent) {
    context.repo.discardGame(card.game.id);
  }

  for (const card of posted) {
    await context.sendEdit(redrawOf(context, card));
  }

  return posted.length;
};

const tapKnownCard = async (
  context: CardContext,
  card: CardRecord,
  payload: CallbackPayload,
  actorTgId: number
): Promise<string> => {
  const before = toCardState(card);
  const transition = apply(before, toAction(payload));

  const tap: Tap = {
    card,
    before,
    actorTgId,
    version: card.game.state_version + 1,
    gameNumber: context.repo.gameNumberInSeries(card.game.chat_id),
  };

  switch (transition.outcome) {
    case "rejected":
      return copy.tapNotAllowed;

    case "cancelled":
      return cancelCard(context, tap);

    case "confirmed":
      return confirmCard(context, tap);

    case "updated":
      return advanceCard(context, tap, transition.state);
  }
};

const tapCard = async (
  context: CardContext,
  payload: CallbackPayload,
  actorTgId: number
): Promise<string> => {
  const lookup = findTappableCard(context.repo, payload);

  switch (lookup.kind) {
    case "gone":
      return copy.cardGone;

    case "outrun":
      return repairOutrunCard(context, lookup.card);

    case "tappable":
      return tapKnownCard(context, lookup.card, payload, actorTgId);
  }
};

const sweepIdleCards = async (context: CardContext, idleSeconds: number): Promise<number> => {
  const stale = context.repo.idleCards(idleSeconds);

  for (const game of stale) {
    context.edits.cancel(String(game.id));
    context.repo.discardGame(game.id);
    await context.sendEdit({
      chatId: game.chat_id,
      messageId: game.message_id,
      text: copy.abandonedBody,
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
    redrawLive: () => redrawLiveCards(context),
    sweepIdle: (idleSeconds) => sweepIdleCards(context, idleSeconds),
    shutdown: () => edits.flushAll(),
  };
}
