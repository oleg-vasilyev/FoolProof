import { readFileSync } from "node:fs";
import { resolve } from "node:path";


export const QUIET_MS = 600;

const CARD_SERVICE = ["src", "features", "live-game", "bot", "card-service.ts"];

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
