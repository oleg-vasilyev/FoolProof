export const FIRST_WORLD_PORT = 8090;

export const MOST_WORLDS = 9;

const LONE_WORKER = "0";

export const worldPorts = (): readonly number[] =>
  Array.from({ length: MOST_WORLDS }, (_, at) => FIRST_WORLD_PORT + at);

// The worker id is passed in rather than read here, so that "there is no id" is a
// case a spec can reach. A default parameter reading process.env cannot be: the
// runner always sets the variable, so the fallback would be dead code that only
// looks tested.

// The id is used as an offset, and this version of Vitest counts workers from zero
// — which the guard below found out, because the first version of it assumed one.
// Vitest promises nothing about the range either way, and ids above the worker
// count have been seen; the hub watches a fixed window of ports, so a world outside
// it is invisible rather than broken, which is the worst way for this to go wrong.
export const portForWorker = (worker: string | undefined): number => {
  const at = Number(worker ?? LONE_WORKER);

  if (!Number.isInteger(at) || at < 0 || at >= MOST_WORLDS) {
    throw new Error(
      `worker ${String(worker)} falls outside the ${String(MOST_WORLDS)} ports the hub watches — ` +
        `raise MOST_WORLDS in world-ports.ts or lower maxWorkers in the e2e config`
    );
  }

  return FIRST_WORLD_PORT + at;
};

export const databaseForWorker = (worker: string | undefined): string =>
  `data/foolproof.e2e-${worker ?? LONE_WORKER}.db`;
