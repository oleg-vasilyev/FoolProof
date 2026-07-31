export interface TelegramUpdate {
  readonly update_id: number;
  readonly [field: string]: unknown;
}

export interface UpdateQueue {
  push(update: Omit<TelegramUpdate, "update_id">): void;
  take(timeoutMs: number): Promise<readonly TelegramUpdate[]>;
  pending(): number;
}

const NOTHING = 0;

const FIRST_UPDATE_ID = 1;

export const createUpdateQueue = (): UpdateQueue => {
  let nextId = FIRST_UPDATE_ID;
  let waiting: TelegramUpdate[] = [];
  let wake: (() => void) | null = null;

  const drain = (): readonly TelegramUpdate[] => {
    const batch = waiting;
    waiting = [];

    return batch;
  };

  return {
    push: (update) => {
      waiting.push({ ...update, update_id: nextId++ });
      wake?.();
    },

    take: async (timeoutMs) => {
      if (waiting.length > NOTHING) {
        return drain();
      }

      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          wake = null;
          resolve();
        }, timeoutMs);

        wake = () => {
          clearTimeout(timer);
          wake = null;
          resolve();
        };
      });

      return drain();
    },

    pending: () => waiting.length,
  };
};
