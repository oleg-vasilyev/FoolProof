import { vi } from "vitest";


type ShutdownModule = typeof import("#shared/lifecycle/shutdown.ts");

type Stop = () => Promise<void>;

export class ShutdownStub {
  public createShutdownSpy = vi.fn<ShutdownModule["createShutdown"]>();

  public shutdownSpy = vi.fn(async (): Promise<void> => undefined);

  public readonly module: ShutdownModule;

  public constructor() {
    this.createShutdownSpy.mockReturnValue(this.shutdownSpy);

    this.module = { createShutdown: (stops) => this.createShutdownSpy(stops) };
  }

  public stopsGiven(): readonly Stop[] {
    return this.createShutdownSpy.mock.calls[0]?.[0] ?? [];
  }
}
