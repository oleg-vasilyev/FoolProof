import { vi } from "vitest";


type ColumnValuesModule = typeof import("#shared/repository/column-values.ts");

const ZERO = 0;

export class ColumnValuesStub {
  public numberOrSpy = vi.fn<ColumnValuesModule["numberOr"]>();
  public requireNumSpy = vi.fn<ColumnValuesModule["requireNum"]>();
  public nullableNumSpy = vi.fn<ColumnValuesModule["nullableNum"]>();
  public requireTextSpy = vi.fn<ColumnValuesModule["requireText"]>();
  public nullableTextSpy = vi.fn<ColumnValuesModule["nullableText"]>();

  public readonly module: ColumnValuesModule;

  public constructor() {
    this.numberOrSpy.mockReturnValue(ZERO);
    this.requireNumSpy.mockReturnValue(ZERO);
    this.nullableNumSpy.mockReturnValue(null);
    this.requireTextSpy.mockReturnValue("");
    this.nullableTextSpy.mockReturnValue(null);

    this.module = {
      numberOr: (value, fallback) => this.numberOrSpy(value, fallback),
      requireNum: (value) => this.requireNumSpy(value),
      nullableNum: (value) => this.nullableNumSpy(value),
      requireText: (value) => this.requireTextSpy(value),
      nullableText: (value) => this.nullableTextSpy(value),
    };
  }
}
