import { vi } from "vitest";


type HtmlEscapeModule = typeof import("#shared/text/html-escape.ts");

export class HtmlEscapeStub {
  public escapeHtmlSpy = vi.fn<HtmlEscapeModule["escapeHtml"]>();

  public readonly module: HtmlEscapeModule;

  public constructor() {
    this.escapeHtmlSpy.mockImplementation((value) => value);

    this.module = { escapeHtml: (value) => this.escapeHtmlSpy(value) };
  }
}
