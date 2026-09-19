import { vi } from "vitest";


type ControlRowModule = typeof import("#shared/telegram/control-row.ts");

export class ControlRowStub {
  public controlRowSpy = vi.fn<ControlRowModule["controlRow"]>();

  public withControlRowSpy = vi.fn<ControlRowModule["withControlRow"]>();

  public readonly module: ControlRowModule;

  public constructor() {
    this.controlRowSpy.mockReturnValue([]);
    this.withControlRowSpy.mockImplementation((rows, controls) => [...rows, controls]);

    this.module = {
      controlRow: (controls) => this.controlRowSpy(controls),
      withControlRow: (rows, controls) => this.withControlRowSpy(rows, controls),
    };
  }
}
