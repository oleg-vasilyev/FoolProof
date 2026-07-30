export const createShutdown =
  (stops: readonly (() => Promise<void>)[]) =>
  async (): Promise<void> => {
    for (const stop of stops) {
      await stop();
    }
  };
