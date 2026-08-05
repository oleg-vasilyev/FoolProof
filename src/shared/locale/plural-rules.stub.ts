import { vi } from "vitest";


type PluralRulesModule = typeof import("#shared/locale/plural-rules.ts");

export class PluralRulesStub {
  public wordForSpy = vi.fn<PluralRulesModule["wordFor"]>();
  public countedSpy = vi.fn<PluralRulesModule["counted"]>();

  public readonly module: PluralRulesModule;

  public constructor() {
    this.wordForSpy.mockImplementation((locale, count) => `wordFor(${locale}:${String(count)})`);
    this.countedSpy.mockImplementation((locale, count) => `counted(${locale}:${String(count)})`);

    this.module = {
      wordFor: (locale, count, forms) => this.wordForSpy(locale, count, forms),
      counted: (locale, count, forms) => this.countedSpy(locale, count, forms),
    };
  }
}
