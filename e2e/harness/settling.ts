import { readFileSync } from "node:fs";
import { resolve } from "node:path";


// A scenario believes the bot has finished once nothing has happened for this long,
// so the window has to be longer than the slowest single thing the bot does between
// two effects — which is rasterizing one poster. Measured on the development machine:
// the chronology takes ~540ms and the awards ~510ms, and `/stats` sends both, so the
// gap between the update draining and the first photo is a whole render. At 600ms
// this had roughly 60ms of headroom, and the chronology redesign spent it: the poster
// grew taller and gained an outline per cell, the render crossed the window, and five
// of seventeen scenarios started asserting against photos that had not arrived yet.
// Raising it is the honest fix — the bot is not slow, the window was.
export const QUIET_MS = 1200;

const CARD_SERVICE = ["src", "features", "live-game", "bot", "card", "card-service.ts"];

const DEBOUNCE = /EDIT_DEBOUNCE_MS\s*=\s*(\d+)/;

const projectRoot = resolve(import.meta.dirname, "..", "..");

// Every verb in a scenario waits for QUIET_MS of silence and then believes the bot
// has finished. That belief is only true while the card service's debounce is
// shorter — raise the debounce past it and every scenario starts asserting against
// a card that has not been redrawn yet, silently and everywhere at once.
//
// `e2e/` may not import from `src/`, and this does not: it reads the file as text,
// which is enough to turn a silent coupling into a loud one.
export const debounceFitsQuiet = (): void => {
  const source = readFileSync(resolve(projectRoot, ...CARD_SERVICE), "utf8");
  const found = DEBOUNCE.exec(source)?.[1];

  if (found === undefined) {
    throw new Error(
      `could not find EDIT_DEBOUNCE_MS in ${CARD_SERVICE.join("/")} — ` +
        `if it moved, settling.ts has to follow it or the harness is guessing`
    );
  }

  if (Number(found) >= QUIET_MS) {
    throw new Error(
      `the card service debounces edits by ${found}ms and a scenario only waits ` +
        `${String(QUIET_MS)}ms for quiet — every scenario would assert against a card ` +
        `the bot has not redrawn yet`
    );
  }
};
