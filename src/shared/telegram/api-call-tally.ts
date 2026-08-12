const NONE = 0;

const ONE = 1;

export type CallTrouble = "retried" | "rateLimit" | "refusal";

export interface CallTally {
  readonly retried: number;
  readonly rateLimit: number;
  readonly refusal: number;
}

const seen = { retried: NONE, rateLimit: NONE, refusal: NONE };

export const recordCallTrouble = (trouble: CallTrouble): void => {
  seen[trouble] = seen[trouble] + ONE;
};

export const callTally = (): CallTally => ({ ...seen });
