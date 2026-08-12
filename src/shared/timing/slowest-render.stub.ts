import { vi } from "vitest";


type SlowestRenderModule = typeof import("#shared/timing/slowest-render.ts");


export class SlowestRenderStub {
  public startTimingSpy = vi.fn<SlowestRenderModule["startTiming"]>();
  public finishedSpy = vi.fn<() => void>();
  public slowestRenderMsSpy = vi.fn<SlowestRenderModule["slowestRenderMs"]>();

  public readonly module: SlowestRenderModule;

  public constructor() {
    this.startTimingSpy.mockReturnValue(() => {
      this.finishedSpy();
    });
    this.slowestRenderMsSpy.mockReturnValue(null);

    this.module = {
      startTiming: () => this.startTimingSpy(),
      slowestRenderMs: () => this.slowestRenderMsSpy(),
    };
  }
}
