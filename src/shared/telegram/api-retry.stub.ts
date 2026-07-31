import { vi } from "vitest";
import type { Transformer } from "grammy";
import type { OutageLog } from "#shared/telegram/api-retry.ts";


type ApiRetryModule = typeof import("#shared/telegram/api-retry.ts");


export class OutageLogStub implements OutageLog {
  public unreachableSpy = vi.fn((_method: string, _reason: string) => undefined);
  public reachableSpy = vi.fn(() => undefined);

  public unreachable(method: string, reason: string): void {
    this.unreachableSpy(method, reason);
  }

  public reachable(): void {
    this.reachableSpy();
  }
}

export class ApiRetryStub {
  public createApiRetrySpy = vi.fn<ApiRetryModule["createApiRetry"]>();
  public createOutageLogSpy = vi.fn<ApiRetryModule["createOutageLog"]>();
  public planForSpy = vi.fn<ApiRetryModule["planFor"]>();

  public readonly transformer: Transformer = (prev, method, payload, signal) =>
    prev(method, payload, signal);

  public readonly outage = new OutageLogStub();

  public readonly module: ApiRetryModule;

  public constructor() {
    this.createApiRetrySpy.mockReturnValue(this.transformer);
    this.createOutageLogSpy.mockReturnValue(this.outage);
    this.planForSpy.mockReturnValue({ retry: false, delayMs: 0 });

    this.module = {
      createApiRetry: (log) => this.createApiRetrySpy(log),
      createOutageLog: (log) => this.createOutageLogSpy(log),
      planFor: (failure, attempt) => this.planForSpy(failure, attempt),
    };
  }

  public logGiven(): unknown {
    return this.createApiRetrySpy.mock.calls[0]?.[0];
  }
}
