import { FailureKind, SettledKind } from "#shared/telegram/call-outcomes.ts";
import { recordCallTrouble } from "#shared/telegram/api-call-tally.ts";
import { setTimeout as delay } from "node:timers/promises";
import type { Transformer } from "grammy";
import type { ApiResponse } from "grammy/types";
import type { Logger } from "#shared/logging/logger.ts";


const ATTEMPTS = 4;

const FIRST_ATTEMPT = 1;

const NEXT_ATTEMPT = 1;

const FIRST_DELAY_MS = 300;

const DELAY_GROWTH = 3;

const LONGEST_WAIT_MS = 5000;

const MS_PER_SECOND = 1000;

const NO_DELAY = 0;

const FLOOD_LIMIT = 429;

const SERVER_ERROR = 500;

export interface RetryPlan {
  readonly retry: boolean;
  readonly delayMs: number;
}

export type Failure =
  | { readonly kind: typeof FailureKind.Unreachable }
  | {
      readonly kind: typeof FailureKind.Refused;
      readonly code: number;
      readonly retryAfterSeconds: number | null;
    };

const GIVE_UP: RetryPlan = { retry: false, delayMs: NO_DELAY };

const backoffFor = (attempt: number): number =>
  FIRST_DELAY_MS * DELAY_GROWTH ** (attempt - FIRST_ATTEMPT);

const planForRefusal = (
  code: number,
  retryAfterSeconds: number | null,
  attempt: number
): RetryPlan => {
  if (retryAfterSeconds !== null) {
    const waitMs = retryAfterSeconds * MS_PER_SECOND;

    return waitMs > LONGEST_WAIT_MS ? GIVE_UP : { retry: true, delayMs: waitMs };
  }

  if (code === FLOOD_LIMIT || code >= SERVER_ERROR) {
    return { retry: true, delayMs: backoffFor(attempt) };
  }

  return GIVE_UP;
};

export const planFor = (failure: Failure, attempt: number): RetryPlan => {
  if (attempt >= ATTEMPTS) {
    return GIVE_UP;
  }

  switch (failure.kind) {
    case FailureKind.Unreachable:
      return { retry: true, delayMs: backoffFor(attempt) };

    case FailureKind.Refused:
      return planForRefusal(failure.code, failure.retryAfterSeconds, attempt);
  }
};

export interface OutageLog {
  unreachable(method: string, reason: string): void;
  reachable(): void;
}

export const createOutageLog = (log: Logger): OutageLog => {
  const seen = { down: false };

  return {
    unreachable: (method, reason) => {
      if (!seen.down) {
        seen.down = true;
        log.warn(`telegram is unreachable during ${method} (${reason}) — retrying until it answers`);
      }
    },
    reachable: () => {
      if (seen.down) {
        seen.down = false;
        log.info("telegram is answering again");
      }
    },
  };
};

interface RetryContext {
  readonly log: Logger;
  readonly outage: OutageLog;
}

type Stoppable = { readonly aborted: boolean } | undefined;

type Settled<T> =
  | { readonly kind: typeof SettledKind.Response; readonly response: ApiResponse<T> }
  | { readonly kind: typeof SettledKind.Error; readonly error: unknown }
  | { readonly kind: typeof SettledKind.Retry; readonly delayMs: number };

const afterResponse = <T>(
  context: RetryContext,
  method: string,
  response: ApiResponse<T>,
  attempt: number
): Settled<T> => {
  if (response.ok) {
    context.outage.reachable();

    return { kind: SettledKind.Response, response };
  }

  if (response.error_code === FLOOD_LIMIT) {
    recordCallTrouble("rateLimit");
  }

  const plan = planFor(
    {
      kind: FailureKind.Refused,
      code: response.error_code,
      retryAfterSeconds: response.parameters?.retry_after ?? null,
    },
    attempt
  );

  if (!plan.retry) {
    recordCallTrouble("refusal");

    return { kind: SettledKind.Response, response };
  }

  recordCallTrouble("retried");
  context.log.debug(`${method} was refused with ${response.error_code}, retrying in ${plan.delayMs}ms`);

  return { kind: SettledKind.Retry, delayMs: plan.delayMs };
};

const afterThrow = <T>(
  context: RetryContext,
  method: string,
  error: unknown,
  attempt: number,
  stopping: boolean
): Settled<T> => {
  if (stopping) {
    return { kind: SettledKind.Error, error };
  }

  context.outage.unreachable(method, String(error));

  const plan = planFor({ kind: FailureKind.Unreachable }, attempt);

  if (!plan.retry) {
    return { kind: SettledKind.Error, error };
  }

  recordCallTrouble("retried");

  return { kind: SettledKind.Retry, delayMs: plan.delayMs };
};

const callWithRetries = async <T>(
  context: RetryContext,
  method: string,
  call: () => Promise<ApiResponse<T>>,
  signal: Stoppable,
  attempt: number
): Promise<ApiResponse<T>> => {
  const settled: Settled<T> = await call().then(
    (response) => afterResponse(context, method, response, attempt),
    (error: unknown) => afterThrow<T>(context, method, error, attempt, signal?.aborted === true)
  );

  switch (settled.kind) {
    case SettledKind.Response:
      return settled.response;

    case SettledKind.Error:
      throw settled.error;

    case SettledKind.Retry:
      await delay(settled.delayMs);

      return callWithRetries(context, method, call, signal, attempt + NEXT_ATTEMPT);
  }
};

export function createApiRetry(log: Logger): Transformer {
  const context: RetryContext = { log, outage: createOutageLog(log) };

  return (prev, method, payload, signal) =>
    callWithRetries(context, method, () => prev(method, payload, signal), signal, FIRST_ATTEMPT);
}
