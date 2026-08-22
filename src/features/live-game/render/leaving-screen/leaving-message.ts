import { escapeHtml } from "#shared/text/html-escape.ts";
import type { Seat } from "#live-game/domain/card-state.ts";
import type { Copy } from "#live-game/copy.ts";


const BETWEEN_LINES = "\n";

export const renderLeavingScreen = (copy: Copy): string =>
  [copy.leavingHeader, copy.leavingAsk].join(BETWEEN_LINES);

export const renderPlaying = (copy: Copy, seats: readonly Seat[]): string =>
  [
    copy.leavingHeader,
    copy.playingBody(seats.map((seat) => escapeHtml(seat.displayName)).join(copy.betweenSeats)),
  ].join(BETWEEN_LINES);

export const renderLeavingCancelled = (copy: Copy): string =>
  [copy.leavingHeader, copy.leavingCancelledBody].join(BETWEEN_LINES);
