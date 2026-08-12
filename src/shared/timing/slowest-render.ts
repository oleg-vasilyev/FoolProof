const NOTHING = 0;

const slowest = { ms: NOTHING };

export const startTiming = (): (() => void) => {
  const began = performance.now();

  return () => {
    slowest.ms = Math.max(slowest.ms, performance.now() - began);
  };
};

export const slowestRenderMs = (): number | null => (slowest.ms === NOTHING ? null : slowest.ms);
