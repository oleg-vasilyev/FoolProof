import { describe, expect, it } from "vitest";
import { escapeHtml } from "#shared/text/html-escape.ts";


describe("escapeHtml()", () => {
  it("should leave an ordinary name untouched", () => {
    expect(escapeHtml("Олег")).toBe("Олег");
  });

  it("should escape an ampersand", () => {
    expect(escapeHtml("Аня & Оля")).toBe("Аня &amp; Оля");
  });

  it("should escape angle brackets so markup cannot be injected", () => {
    expect(escapeHtml("<b>hax</b>")).toBe("&lt;b&gt;hax&lt;/b&gt;");
  });

  it("should escape the ampersand before the brackets, never double-encoding", () => {
    expect(escapeHtml("<&>")).toBe("&lt;&amp;&gt;");
  });

  it("should escape every occurrence, not just the first", () => {
    expect(escapeHtml("a&b&c")).toBe("a&amp;b&amp;c");
  });

  it("should handle an empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});
