import { escapeHtml } from "#shared/text/html-escape.ts";
import type { Seat } from "#live-game/domain/card-state.ts";
import type { Copy } from "#live-game/copy.ts";


const BETWEEN_LINES = "\n";

export const renderSeatingScreen = (copy: Copy): string =>
  [copy.seatingHeader, copy.seatingAsk].join(BETWEEN_LINES);

export const renderSeated = (copy: Copy, seats: readonly Seat[]): string =>
  [
    copy.seatingHeader,
    copy.seatedBody(seats.map((seat) => escapeHtml(seat.displayName)).join(copy.betweenSeats)),
  ].join(BETWEEN_LINES);

export const renderSeatingCancelled = (copy: Copy): string =>
  [copy.seatingHeader, copy.seatingCancelledBody].join(BETWEEN_LINES);
