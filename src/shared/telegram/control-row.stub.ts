import { vi } from "vitest";


type ControlRowModule = typeof import("#shared/telegram/control-row.ts");

export class ControlRowStub {
  public controlRowSpy = vi.fn<ControlRowModule["controlRow"]>();

  public readonly module: ControlRowModule;

  public constructor() {
    this.controlRowSpy.mockReturnValue([]);

    this.module = { controlRow: (controls) => this.controlRowSpy(controls) };
  }
}
