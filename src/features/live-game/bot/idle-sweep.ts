import type { Logger } from "#shared/logger.ts";
import type { CardService } from "#live-game/bot/card-service.ts";


export const ABANDON_AFTER_SECONDS = 3 * 60 * 60;

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

export function startIdleSweep(cards: CardService, log: Logger): () => void {
  const sweep = async (): Promise<void> => {
    try {
      const abandoned = await cards.sweepIdle(ABANDON_AFTER_SECONDS);
      if (abandoned > 0) {
        log.info(`abandoned ${abandoned} idle card(s)`);
      }
    } catch (error) {
      log.error(`idle sweep failed: ${String(error)}`);
    }
  };

  const timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);

  return () => clearInterval(timer);
}
