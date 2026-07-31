const CLEAN_EXIT = 0;

const FIRST_FAILURE = 1;

const FIRST_DELAY_MS = 1000;

const DELAY_GROWTH = 2;

const LONGEST_DELAY_MS = 60_000;

const STABLE_AFTER_MS = 60_000;

const GIVE_UP_AFTER = 5;

const NO_DELAY = 0;

export interface Death {
  readonly code: number | null;
  readonly signal: string | null;
  readonly upMs: number;
}

export interface RestartHistory {
  readonly failures: number;
  readonly everRan: boolean;
}

export type RestartPlan =
  | { readonly restart: true; readonly delayMs: number; readonly history: RestartHistory }
  | {
      readonly restart: false;
      readonly reason: "stopped" | "cannot-start";
      readonly delayMs: number;
      readonly history: RestartHistory;
    };

export const NO_RUNS: RestartHistory = { failures: 0, everRan: false };

const delayFor = (failures: number): number =>
  Math.min(LONGEST_DELAY_MS, FIRST_DELAY_MS * DELAY_GROWTH ** (failures - FIRST_FAILURE));

export const describeDeath = (death: Death): string =>
  death.signal === null ? `exit code ${String(death.code)}` : `signal ${death.signal}`;

export const planRestart = (
  death: Death,
  history: RestartHistory,
  stopping: boolean
): RestartPlan => {
  if (stopping || death.code === CLEAN_EXIT) {
    return { restart: false, reason: "stopped", delayMs: NO_DELAY, history };
  }

  const ranLongEnough = death.upMs >= STABLE_AFTER_MS;

  const next: RestartHistory = {
    failures: ranLongEnough ? FIRST_FAILURE : history.failures + FIRST_FAILURE,
    everRan: history.everRan || ranLongEnough,
  };

  if (!next.everRan && next.failures > GIVE_UP_AFTER) {
    return { restart: false, reason: "cannot-start", delayMs: NO_DELAY, history: next };
  }

  return { restart: true, delayMs: delayFor(next.failures), history: next };
};
