import { vi } from "vitest";


type ColumnValuesModule = typeof import("#shared/repository/column-values.ts");

const ZERO = 0;

export class ColumnValuesStub {
  public numberOrSpy = vi.fn<ColumnValuesModule["numberOr"]>();
  public numSpy = vi.fn<ColumnValuesModule["num"]>();
  public nullableNumSpy = vi.fn<ColumnValuesModule["nullableNum"]>();
  public textSpy = vi.fn<ColumnValuesModule["text"]>();
  public nullableTextSpy = vi.fn<ColumnValuesModule["nullableText"]>();

  public readonly module: ColumnValuesModule;

  public constructor() {
    this.numberOrSpy.mockReturnValue(ZERO);
    this.numSpy.mockReturnValue(ZERO);
    this.nullableNumSpy.mockReturnValue(null);
    this.textSpy.mockReturnValue("");
    this.nullableTextSpy.mockReturnValue(null);

    this.module = {
      numberOr: (value, fallback) => this.numberOrSpy(value, fallback),
      num: (value) => this.numSpy(value),
      nullableNum: (value) => this.nullableNumSpy(value),
      text: (value) => this.textSpy(value),
      nullableText: (value) => this.nullableTextSpy(value),
    };
  }
}
