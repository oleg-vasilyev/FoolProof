type Timer = ReturnType<typeof setTimeout>;

interface Pending<T> {
  readonly value: T;
  readonly timer: Timer;
}

export interface Debouncer<T> {
  schedule(key: string, value: T): void;
  cancel(key: string): void;
  flush(key: string): Promise<void>;
  flushAll(): Promise<void>;
}

export function createDebouncer<T>(
  delayMs: number,
  run: (value: T) => Promise<void>
): Debouncer<T> {
  const pending = new Map<string, Pending<T>>();

  const flush = async (key: string): Promise<void> => {
    const entry = pending.get(key);
    if (entry === undefined) {
      return;
    }

    clearTimeout(entry.timer);
    pending.delete(key);
    await run(entry.value);
  };

  const cancel = (key: string): void => {
    const entry = pending.get(key);
    if (entry !== undefined) {
      clearTimeout(entry.timer);
      pending.delete(key);
    }
  };

  return {
    schedule(key, value) {
      cancel(key);
      pending.set(key, { value, timer: setTimeout(() => void flush(key), delayMs) });
    },
    cancel,
    flush,
    async flushAll() {
      await Promise.all([...pending.keys()].map(flush));
    },
  };
}
