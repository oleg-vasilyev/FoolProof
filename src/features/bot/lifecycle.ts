import type { CardService } from "./cards.ts";


export interface RunningBot {
  readonly stopReaper: () => void;
  readonly cards: CardService;
  readonly stopPolling: () => Promise<void>;
}

export const createShutdown = (running: RunningBot) => async (): Promise<void> => {
  running.stopReaper();
  await running.cards.shutdown();
  await running.stopPolling();
};
