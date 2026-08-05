import { ActionKind, Outcome, Phase } from "#live-game/domain/card-states.ts";
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
import { toMarkup } from "#live-game/bot/inline-markup.ts";
import type { LocaleReader } from "#shared/locale/chat-locale.ts";
import { copyIn, type Copy } from "#live-game/copy.ts";


const EDIT_DEBOUNCE_MS = 350;

const FIRST_VERSION = 0;

const NO_SLOT = -1;

const NO_MESSAGE = 0;

const ALREADY_SHOWN = "message is not modified";

export interface CardServiceDeps {
  readonly repo: CardRepository;
  readonly api: Api;
  readonly log: Logger;
  readonly localeIn: LocaleReader;
}

export const PICKED_BY_HAND = null;

export interface CardService {
  open(copy: Copy, chatId: number, seats: readonly Seat[], starterSlot: number | null): Promise<void>;
  tap(copy: Copy, payload: CallbackPayload, actorTgId: number): Promise<string>;
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

interface EditingContext {
  readonly repo: CardRepository;
  readonly api: Api;
  readonly edits: Debouncer<EditRequest>;
  readonly sendEdit: (request: EditRequest) => Promise<void>;
  readonly localeIn: LocaleReader;
}

interface Tap {
  readonly copy: Copy;
  readonly card: CardRecord;
  readonly before: CardState;
  readonly actorTgId: number;
  readonly version: number;
  readonly gameNumber: number;
}

const TapTarget = {
  Tappable: "tappable",
  Gone: "gone",
  Outrun: "outrun",
} as const;

type CardLookup =
  | { readonly kind: typeof TapTarget.Tappable; readonly card: CardRecord }
  | { readonly kind: typeof TapTarget.Gone }
  | { readonly kind: typeof TapTarget.Outrun; readonly card: CardRecord };

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
    drawAccepted: card.game.state === Phase.Ready && seats.length - exits.length > 1,
  };
};

const toAction = (payload: CallbackPayload): Action =>
  payload.action === ActionKind.Pick
    ? { kind: ActionKind.Pick, slot: payload.slot ?? NO_SLOT }
    : { kind: payload.action };

const findTappableCard = (repo: CardRepository, payload: CallbackPayload): CardLookup => {
  const card = repo.cardById(payload.gameId);

  if (card === null || card.game.confirmed_at !== null) {
    return { kind: TapTarget.Gone };
  }

  if (card.game.state_version !== payload.version) {
    return { kind: TapTarget.Outrun, card };
  }

  return { kind: TapTarget.Tappable, card };
};

const spokenIn = (context: EditingContext, chatId: number): Copy =>
  copyIn(context.localeIn(chatId));

const noticeFor = (copy: Copy, before: CardState, after: CardState): string => {
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

const redrawOf = (context: EditingContext, card: CardRecord): EditRequest => {
  const state = toCardState(card);
  const copy = spokenIn(context, card.game.chat_id);

  return editOf(
    card,
    renderCard(copy, state, context.repo.gameNumberInSeries(card.game.chat_id)),
    renderKeyboard(copy, state, card.game.id, card.game.state_version)
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
  context: EditingContext,
  copy: Copy,
  chatId: number,
  seats: readonly Seat[],
  starterSlot: number | null
): Promise<void> => {
  const { repo, api } = context;
  const gameId = repo.openGame(
    chatId,
    seats.map((seat) => seat.playerId)
  );

  const state: CardState = { seats, starterSlot, exits: [], drawAccepted: false };

  if (starterSlot !== null) {
    repo.updateCard(gameId, phaseOf(state), FIRST_VERSION, starterPlayerId(state));
  }

  try {
    const message = await api.sendMessage(
      chatId,
      renderCard(copy, state, repo.gameNumberInSeries(chatId)),
      {
        parse_mode: "HTML",
        reply_markup: toMarkup(renderKeyboard(copy, state, gameId, FIRST_VERSION)),
      }
    );

    repo.attachMessage(gameId, message.message_id);
  } catch (error) {
    repo.discardGame(gameId);
    throw error;
  }
};

const cancelCard = async (context: EditingContext, tap: Tap): Promise<string> => {
  context.edits.cancel(String(tap.card.game.id));
  context.repo.discardGame(tap.card.game.id);
  await context.sendEdit(editOf(tap.card, tap.copy.cancelledBody, null));

  return tap.copy.cancelledNotice;
};

const confirmCard = async (context: EditingContext, tap: Tap): Promise<string> => {
  context.repo.confirmGame(tap.card.game.id, finalistsOf(tap.before), tap.actorTgId, tap.version);
  context.edits.cancel(String(tap.card.game.id));
  await context.sendEdit(editOf(tap.card, renderResult(tap.copy, tap.before, tap.gameNumber), null));

  return tap.copy.confirmedNotice;
};

const persist = (context: EditingContext, tap: Tap, after: CardState): void => {
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

const advanceCard = (context: EditingContext, tap: Tap, after: CardState): string => {
  persist(context, tap, after);

  context.edits.schedule(
    String(tap.card.game.id),
    editOf(
      tap.card,
      renderCard(tap.copy, after, tap.gameNumber),
      renderKeyboard(tap.copy, after, tap.card.game.id, tap.version)
    )
  );

  return noticeFor(tap.copy, tap.before, after);
};

const repairOutrunCard = (context: EditingContext, copy: Copy, card: CardRecord): string => {
  context.edits.schedule(String(card.game.id), redrawOf(context, card));

  return copy.cardStale;
};

const redrawLiveCards = async (context: EditingContext): Promise<number> => {
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
  context: EditingContext,
  copy: Copy,
  card: CardRecord,
  payload: CallbackPayload,
  actorTgId: number
): Promise<string> => {
  const before = toCardState(card);
  const transition = apply(before, toAction(payload));

  const tap: Tap = {
    copy,
    card,
    before,
    actorTgId,
    version: card.game.state_version + 1,
    gameNumber: context.repo.gameNumberInSeries(card.game.chat_id),
  };

  switch (transition.outcome) {
    case Outcome.Rejected:
      return copy.tapNotAllowed;

    case Outcome.Cancelled:
      return cancelCard(context, tap);

    case Outcome.Confirmed:
      return confirmCard(context, tap);

    case Outcome.Updated:
      return advanceCard(context, tap, transition.state);
  }
};

const tapCard = async (
  context: EditingContext,
  copy: Copy,
  payload: CallbackPayload,
  actorTgId: number
): Promise<string> => {
  const lookup = findTappableCard(context.repo, payload);

  switch (lookup.kind) {
    case TapTarget.Gone:
      return copy.cardGone;

    case TapTarget.Outrun:
      return repairOutrunCard(context, copy, lookup.card);

    case TapTarget.Tappable:
      return tapKnownCard(context, copy, lookup.card, payload, actorTgId);
  }
};

const sweepIdleCards = async (context: EditingContext, idleSeconds: number): Promise<number> => {
  const stale = context.repo.idleCards(idleSeconds);

  for (const game of stale) {
    context.edits.cancel(String(game.id));
    context.repo.discardGame(game.id);
    await context.sendEdit({
      chatId: game.chat_id,
      messageId: game.message_id,
      text: spokenIn(context, game.chat_id).abandonedBody,
      keyboard: null,
    });
  }

  return stale.length;
};

export function createCardService(deps: CardServiceDeps): CardService {
  const sendEdit = createEditSender(deps.api, deps.log);
  const edits = createDebouncer<EditRequest>(EDIT_DEBOUNCE_MS, sendEdit);
  const context: EditingContext = {
    repo: deps.repo,
    api: deps.api,
    edits,
    sendEdit,
    localeIn: deps.localeIn,
  };

  return {
    open: (copy, chatId, seats, starterSlot) => openCard(context, copy, chatId, seats, starterSlot),
    tap: (copy, payload, actorTgId) => tapCard(context, copy, payload, actorTgId),
    redrawLive: () => redrawLiveCards(context),
    sweepIdle: (idleSeconds) => sweepIdleCards(context, idleSeconds),
    shutdown: () => edits.flushAll(),
  };
}
