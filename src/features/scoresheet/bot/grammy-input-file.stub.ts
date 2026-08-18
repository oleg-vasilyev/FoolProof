import { vi } from "vitest";


export class InputFileStub {
  public builtSpy = vi.fn();

  public readonly module: { InputFile: new (source: unknown, filename: string) => object };

  public constructor() {
    const built = this.builtSpy;

    this.module = {
      InputFile: class {
        public constructor(source: unknown, filename: string) {
          built(source, filename);
        }
      },
    };
  }
}
