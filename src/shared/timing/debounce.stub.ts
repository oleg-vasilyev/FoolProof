import { vi } from "vitest";
import type { Debouncer } from "#shared/timing/debounce.ts";


type DebounceModule = typeof import("#shared/timing/debounce.ts");

type Run = (value: never) => Promise<void>;

export class DebouncerStub implements Debouncer<unknown> {
  public scheduleSpy = vi.fn((_key: string, _value: unknown) => undefined);
  public cancelSpy = vi.fn((_key: string) => undefined);
  public flushSpy = vi.fn(async (_key: string): Promise<void> => undefined);
  public flushAllSpy = vi.fn(async (): Promise<void> => undefined);

  public schedule(key: string, value: unknown): void {
    this.scheduleSpy(key, value);
  }

  public cancel(key: string): void {
    this.cancelSpy(key);
  }

  public async flush(key: string): Promise<void> {
    await this.flushSpy(key);
  }

  public async flushAll(): Promise<void> {
    await this.flushAllSpy();
  }
}

export class DebounceStub {
  public createDebouncerSpy = vi.fn((_delayMs: number, _run: Run) => this.debouncer);

  public readonly debouncer = new DebouncerStub();

  public readonly module: DebounceModule;

  public constructor() {
    this.module = {
      createDebouncer: <T>(delayMs: number, run: (value: T) => Promise<void>): Debouncer<T> =>
        this.createDebouncerSpy(delayMs, run as Run) as Debouncer<T>,
    };
  }

  public delayGiven(): number | undefined {
    return this.createDebouncerSpy.mock.calls[0]?.[0];
  }

  public runGiven(): Run | undefined {
    return this.createDebouncerSpy.mock.calls[0]?.[1];
  }
}
