const HUB_PORT = "E2E_HUB_PORT";

const ANNOUNCE_TIMEOUT_MS = 1000;

// A world dies with its worker, and the hub only ever polled — so the last thing a
// scenario does, its verdict, had to survive long enough to be swept up. It did
// that by sleeping, which cost every scenario in every run whether or not anybody
// was watching. Now the world says the last word itself, and only when a hub asked
// to be told.
export const announceTo = async (port: number, state: unknown): Promise<void> => {
  const hub = process.env[HUB_PORT];

  if (hub === undefined) {
    return;
  }

  try {
    await fetch(`http://127.0.0.1:${hub}/announce/${String(port)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
      signal: AbortSignal.timeout(ANNOUNCE_TIMEOUT_MS),
    });
  } catch {
    return;
  }
};
